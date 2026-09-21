import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { test } from "node:test";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const moduleCache = new Map();

// Load the actual TypeScript services without adding a test-runner dependency.
function loadService(relativePath) {
  const filename = path.resolve(root, "src/services/api", relativePath);
  if (moduleCache.has(filename)) return moduleCache.get(filename).exports;
  const { outputText } = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  });
  const loadedModule = { exports: {} };
  moduleCache.set(filename, loadedModule);
  const localRequire = (specifier) => {
    assert.ok(specifier.startsWith("."), `Unexpected runtime dependency: ${specifier}`);
    return loadService(path.resolve(path.dirname(filename), `${specifier}.ts`));
  };
  vm.runInThisContext(`(function(require, module, exports) {${outputText}\n})`, {
    filename,
  })(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const { authApi } = loadService("auth/index.ts");
const { classesApi } = loadService("classes/index.ts");
const { teachersApi } = loadService("teachers/index.ts");
const { majorsApi } = loadService("majors/index.ts");
const { studentsApi } = loadService("students/index.ts");
const { checkInApi } = loadService("check-in/index.ts");
const { scheduleApi } = loadService("schedule/index.ts");
const { attendanceApi } = loadService("attendance/index.ts");

test("services preserve endpoint, method, JSON payload and authentication cookies", async (t) => {
  const login = { username: "tester", password: "test-password", remember: true };
  const register = { ...login, prefix: "นาย", fullname: "ทดสอบ", email: "test@example.com", role: "Teacher" };
  const otp = { identifier: "test@example.com", otp: "123456" };
  const reset = { ...otp, newPassword: "new-password" };
  const subject = { className: "วิชา A", classCodes: ["A"], teachers: [] };
  const student = { _id: "s1", studentId: "123456789-0", fullName: "นาย ทดสอบ", classes: [] };
  const upload = { classId: "c1", section: "1", major: "วิทยาการคอมพิวเตอร์", students: [student] };
  const schedule = { classId: "c1", date: "2026-09-21", startTime: "09:00", endTime: "10:00", isOpen: false };
  const attendance = { classId: "c1", name: "นาย ทดสอบ", studentId: "123456789-0", photo: "data:image/png;base64,abc", location: { lat: 13, lng: 100 } };
  const config = { config: { photo: false, location: true } };
  const cases = [
    [() => authApi.login(login), "/api/auth/login", "POST", login, "include"],
    [() => authApi.register(register), "/api/auth/register", "POST", register],
    [() => authApi.sendOtp({ identifier: otp.identifier }), "/api/auth/send-otp", "POST", { identifier: otp.identifier }],
    [() => authApi.verifyOtp(otp), "/api/auth/verify-otp", "POST", otp],
    [() => authApi.resetPassword(reset), "/api/auth/reset-password", "POST", reset],
    [() => authApi.getUser(), "/api/auth/user", "GET", undefined, "include"],
    [() => authApi.logout(), "/api/auth/logout", "POST", undefined, "include"],
    [() => classesApi.list(), "/api/classes", "GET"],
    [() => classesApi.list({ year: 2569 }), "/api/classes?year=2569", "GET"],
    [() => classesApi.get("c1"), "/api/classes/c1", "GET"],
    [() => classesApi.create([subject]), "/api/classes/create", "POST", [subject]],
    [() => classesApi.update("c1", subject), "/api/classes/update?id=c1", "PUT", subject],
    [() => classesApi.remove("c1"), "/api/classes/delete?id=c1", "DELETE"],
    [() => teachersApi.list(), "/api/teachers", "GET"],
    [() => teachersApi.get("t1"), "/api/teachers?id=t1", "GET"],
    [() => teachersApi.save({ name: "ครู" }), "/api/teachers", "POST", { name: "ครู" }],
    [() => teachersApi.save({ id: "t1", name: "ครู" }), "/api/teachers", "PATCH", { id: "t1", name: "ครู" }],
    [() => teachersApi.remove("t1"), "/api/teachers?id=t1", "DELETE"],
    [() => majorsApi.list(), "/api/majors", "GET"],
    [() => studentsApi.list(), "/api/students", "GET"],
    [() => studentsApi.list({ year: 2569 }), "/api/students?year=2569", "GET"],
    [() => studentsApi.upload(upload), "/api/students/upload", "POST", upload],
    [() => studentsApi.update(student), "/api/students/update", "PUT", student],
    [() => studentsApi.remove("s1"), "/api/students/delete?id=s1", "DELETE"],
    [() => studentsApi.withdrawCourse({ studentId: "s1", className: "A", section: "1" }), "/api/students/withdraw-course?studentId=s1&className=A&section=1", "DELETE"],
    [() => checkInApi.getConfig(), "/api/check-in", "GET"],
    [() => checkInApi.getConfig("c1"), "/api/check-in?classId=c1", "GET"],
    [() => checkInApi.updateConfig(config), "/api/check-in", "POST", config],
    [() => scheduleApi.get("c1"), "/api/schedule?classId=c1", "GET"],
    [() => scheduleApi.create(schedule), "/api/schedule", "POST", schedule],
    [() => attendanceApi.submit(attendance), "/api/attendance", "POST", attendance],
    [() => attendanceApi.summary({ classId: "c1", year: 2569 }), "/api/attendance/summary?classId=c1&year=2569", "GET"],
    [() => attendanceApi.logs({ classId: "c1", studentId: "s1" }), "/api/attendance/logs?classId=c1&studentId=s1", "GET"],
  ];
  for (const [call, expectedUrl, expectedMethod, json, credentials] of cases) {
    const routePath = new URL(expectedUrl, "http://localhost").pathname.replace("/classes/c1", "/classes/[id]");
    const routeFile = path.join(root, "src/app", routePath, "route.ts");
    const route = ts.createSourceFile(routeFile, readFileSync(routeFile, "utf8"), ts.ScriptTarget.Latest, true);
    assert.ok(route.statements.some((node) =>
      ts.isFunctionDeclaration(node) && node.name?.text === expectedMethod &&
      node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ), `${expectedMethod} ${routePath} must exist on the server`);
    const response = new Response('{"success":true}');
    const mock = t.mock.method(globalThis, "fetch", async (url, options) => {
      assert.equal(url, expectedUrl);
      assert.equal(options.method ?? "GET", expectedMethod);
      assert.equal(options.credentials, credentials);
      assert.equal(options.body, json === undefined ? undefined : JSON.stringify(json));
      assert.equal(new Headers(options.headers).get("Content-Type"), json === undefined ? null : "application/json");
      return response;
    });
    assert.equal(await call(), response);
    assert.equal(mock.mock.callCount(), 1);
    mock.mock.restore();
  }
});

test("query and path parameters cannot inject extra parameters or path segments", async (t) => {
  const special = "วิชา A&B /?+#";
  t.mock.method(globalThis, "fetch", async (input) => {
    const url = new URL(input, "http://localhost");
    if (url.pathname === "/api/students/withdraw-course") {
      assert.deepEqual([...url.searchParams], [["studentId", special], ["className", special], ["section", special]]);
    } else {
      assert.equal(url.pathname, `/api/classes/${encodeURIComponent(special)}`);
      assert.equal(url.search, "");
    }
    return new Response();
  });
  await studentsApi.withdrawCourse({ studentId: special, className: special, section: special });
  await classesApi.get(special);
});

test("file uploads keep multipart data and let the browser choose the boundary", async (t) => {
  const data = new FormData();
  data.append("classId", "c1");
  data.append("file", new Blob(["studentId,fullName\n123,Test"]), "students.csv");
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/students/upload-file");
    assert.equal(options.method, "POST");
    assert.equal(options.body, data);
    assert.equal(new Headers(options.headers).has("Content-Type"), false);
    return new Response();
  });
  await studentsApi.uploadFile(data);
});

test("cache options, abort signals, HTTP errors and network failures reach callers", async (t) => {
  const controller = new AbortController();
  const response = new Response('{"success":false,"message":"Unauthorized"}', { status: 401 });
  const mock = t.mock.method(globalThis, "fetch", async (_url, options) => {
    assert.equal(options.cache, "no-store");
    assert.equal(options.signal, controller.signal);
    return response;
  });
  const result = await teachersApi.get("t1", { cache: "no-store", signal: controller.signal });
  assert.equal(result.ok, false);
  assert.equal(result.status, 401);
  assert.equal((await result.json()).message, "Unauthorized");
  const failure = new TypeError("Failed to fetch");
  mock.mock.mockImplementation(async () => { throw failure; });
  await assert.rejects(authApi.login({ username: "a", password: "b", remember: false }), (error) => error === failure);
  controller.abort();
  mock.mock.mockImplementation(async (_url, options) => { options.signal.throwIfAborted(); });
  await assert.rejects(teachersApi.get("t1", { signal: controller.signal }), { name: "AbortError" });
});

test("frontend files use services instead of direct HTTP calls or API URL literals", () => {
  function visitDirectory(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        if (filename !== path.join(root, "src/app/api") && filename !== path.join(root, "src/services/api")) visitDirectory(filename);
      } else if (/\.[jt]sx?$/.test(filename)) {
        const source = ts.createSourceFile(filename, readFileSync(filename, "utf8"), ts.ScriptTarget.Latest, true);
        function visit(node) {
          if (ts.isCallExpression(node)) {
            assert.ok(!/^(fetch|(?:window|globalThis)\.fetch|axios(?:\..+)?)$/.test(node.expression.getText(source)), filename);
          }
          if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node) || ts.isTemplateHead(node)) {
            assert.ok(!node.text.startsWith("/api/"), filename);
          }
          ts.forEachChild(node, visit);
        }
        visit(source);
      }
    }
  }
  visitDirectory(path.join(root, "src"));
});
