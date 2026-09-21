import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const now = new Date("2026-09-21T17:00:00Z");
class FixedDate extends Date {
  constructor(...args) { super(...(args.length ? args : [now.getTime()])); }
  static now() { return now.getTime(); }
}

function load(filename, dependencies = {}) {
  const { outputText } = ts.transpileModule(readFileSync(path.join(root, filename), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports, Date: FixedDate, console, URL,
    require: (name) => {
      assert.ok(name in dependencies, `Unexpected runtime dependency: ${name}`);
      return dependencies[name];
    },
  });
  return exports;
}

const dates = load("src/lib/schedule-date.ts");

test("today changes at Bangkok midnight even when the server runs in UTC", () => {
  assert.equal(dates.getBangkokDateKey(new Date("2026-09-21T16:59:59Z")), "2026-09-21");
  assert.equal(dates.getBangkokDateKey(now), "2026-09-22");
  assert.equal(dates.getBangkokDateKey(new Date("2026-12-31T17:00:00Z")), "2027-01-01");
  assert.equal(dates.getScheduleDateError("2026-09-21", now)?.includes("ย้อนหลัง"), true);
  assert.equal(dates.getScheduleDateError("2026-09-22", now), null);
  assert.equal(dates.getScheduleDateError("2027-01-01", now), null);
});

test("calendar dates reject malformed and impossible values without timezone shifts", () => {
  for (const invalid of ["2026-02-29", "2026-04-31", "2026-13-01", "2026-09-00", "22/09/2026", "2026-9-22", "2026-09-22T00:00:00Z", 20260922, null]) {
    assert.equal(dates.parseCalendarDate(invalid), null);
    assert.equal(dates.getScheduleDateError(invalid, now), "วันที่ไม่ถูกต้อง");
  }
  assert.equal(dates.formatCalendarDate(dates.parseCalendarDate("2028-02-29")), "2028-02-29");
});

test("past dates become today while today's and future schedules keep their dates", () => {
  const old = dates.getScheduleFormDate("2026-09-11", now);
  assert.equal(dates.formatCalendarDate(old.date), "2026-09-22");
  assert.equal(old.reset, true);
  for (const date of ["2026-09-22", "2026-10-01", "2027-01-01"]) {
    const form = dates.getScheduleFormDate(date, now);
    assert.equal(dates.formatCalendarDate(form.date), date);
    assert.equal(form.reset, false);
  }
  assert.equal(dates.formatCalendarDate(dates.getScheduleFormDate(undefined, now).date), "2026-09-22");
});

test("choose today's schedule, nearest future, or latest history without modifying saved sessions", () => {
  const old = Object.freeze({ date: "2026-09-11", startTime: "09:00", endTime: "11:00", lateAfter: 15 });
  const older = Object.freeze({ date: "2025-12-31", startTime: "10:00" });
  const today = Object.freeze({ date: "2026-09-22", startTime: "13:00" });
  const future = Object.freeze({ date: "2026-09-23", startTime: "15:00" });
  const later = Object.freeze({ date: "2027-01-01", startTime: "16:00" });
  assert.equal(dates.selectScheduleForForm([later, old, future, today], now), today);
  assert.equal(dates.selectScheduleForForm([later, old, future], now), future);
  assert.equal(dates.selectScheduleForForm([old, older, null, { date: "invalid" }], now), old);
  assert.equal(old.date, "2026-09-11");
  assert.equal(old.startTime, "09:00");
  assert.equal(dates.selectScheduleForForm([], now), undefined);
});

function makeRoute() {
  const writes = [];
  const reads = [];
  const collection = {
    updateOne: async (...args) => { writes.push(args); return { matchedCount: 0, modifiedCount: 0, upsertedId: "new" }; },
    findOne: async (query) => ({ _id: "new", ...query }),
    find: (query) => {
      reads.push(query);
      return { sort: () => ({ toArray: async () => [] }) };
    },
  };
  const routes = load("src/app/api/schedule/route.ts", {
    "@/lib/schedule-date": dates,
    "@/lib/mongodb": { default: Promise.resolve({ db: () => ({ collection: () => collection }) }) },
    mongodb: { ObjectId: { isValid: () => false } },
    "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
  });
  return { ...routes, writes, reads };
}

test("POST rejects old and invalid dates before writing; valid dates use their selected year", async () => {
  const { POST, writes } = makeRoute();
  const request = (date) => new Request("http://localhost/api/schedule", {
    method: "POST",
    body: JSON.stringify({ classId: "class-1", date, startTime: "09:00", endTime: "11:00" }),
  });
  for (const date of ["2026-09-21", "2026-02-30", "bad-date"]) {
    const response = await POST(request(date));
    assert.equal(response.status, 400);
    assert.equal((await response.json()).success, false);
    assert.equal(writes.length, 0);
  }
  assert.equal((await POST(request("2026-09-22"))).status, 200);
  assert.equal((await POST(request("2027-01-01"))).status, 200);
  assert.equal(writes[0][0].date, "2026-09-22");
  assert.equal(writes[0][0].academicYear, 2569);
  assert.equal(writes[1][0].date, "2027-01-01");
  assert.equal(writes[1][0].academicYear, 2570);
});

test("GET loads previous and future years for the form and still supports an explicit year filter", async () => {
  const { GET, reads, writes } = makeRoute();
  assert.equal((await GET(new Request("http://localhost/api/schedule?classId=class-1"))).status, 200);
  assert.equal("academicYear" in reads[0], false);
  assert.equal((await GET(new Request("http://localhost/api/schedule?classId=class-1&year=2570"))).status, 200);
  assert.equal(reads[1].academicYear, 2570);
  assert.equal(writes.length, 0);
});
