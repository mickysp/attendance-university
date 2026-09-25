const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

function setup(existing = []) {
  const inserted = [];
  const collection = {
    find: () => ({ toArray: async () => existing }),
    insertMany: async (items) => {
      inserted.push(...items);
      return { insertedCount: items.length };
    },
  };
  const dependencies = {
    "@/lib/mongodb": { default: Promise.resolve({ db: () => ({ collection: () => collection }) }) },
    "@/lib/admin-auth": { currentUser: async () => null },
    "@/lib/activity-log": { recordActivity: async () => {} },
  };
  const code = ts.transpileModule(fs.readFileSync("src/app/api/teachers/route.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(
    (name) => dependencies[name] ?? require(name), module, module.exports,
  );
  return {
    inserted,
    post: (body) => module.exports.POST(new Request("http://localhost/api/teachers", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    })),
  };
}

test("creates multiple teachers in one request and trims names", async () => {
  const { post, inserted } = setup();
  const response = await post([{ name: " Alice " }, { name: "Bob" }]);
  assert.equal(response.status, 200);
  assert.equal((await response.json()).success, true);
  assert.deepEqual(inserted.map((item) => item.name), ["Alice", "Bob"]);
});

test("rejects duplicate names within a batch before writing any teachers", async () => {
  const { post, inserted } = setup();
  assert.equal((await post([{ name: "Alice" }, { name: " alice " }])).status, 409);
  assert.equal(inserted.length, 0);
});

test("rejects normalized existing names before writing other teachers in the batch", async () => {
  const { post, inserted } = setup([{ name: "Alice Smith" }]);
  assert.equal((await post([{ name: "Bob" }, { name: "Alice-Smith" }])).status, 409);
  assert.equal(inserted.length, 0);
});

test("rejects empty or incomplete batches without partial writes", async () => {
  for (const body of [[], null, [{ name: "Bob" }, { name: " " }], [{ name: 123 }]]) {
    const { post, inserted } = setup();
    assert.equal((await post(body)).status, 400);
    assert.equal(inserted.length, 0);
  }
});

test("preserves support for creating a single teacher", async () => {
  const { post, inserted } = setup();
  assert.equal((await post({ name: "Alice" })).status, 200);
  assert.equal(inserted.length, 1);
});

test("teacher popup submits all names, rejects incomplete and duplicate rows, and preserves single edit", async () => {
  let options;
  let extraNames = [" Bob ", "Carol"];
  const swal = {
    fire: (value) => { options = value; },
    getPopup: () => ({ querySelectorAll: (selector) => selector === "[data-teacher-name]" ? extraNames.map((value) => ({ value })) : [] }),
    showValidationMessage: () => {},
  };
  const code = ts.transpileModule(fs.readFileSync("src/lib/swal.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(() => ({ default: swal }), module, module.exports);
  let saved;
  const onSave = async (value) => { saved = value; };
  module.exports.appSwal.nameForm({ title: "เพิ่มอาจารย์", onSave, onSaveMany: onSave });
  assert.equal(await options.preConfirm(" Alice "), true);
  assert.deepEqual(saved, ["Alice", "Bob", "Carol"]);
  for (const invalid of [[" "], ["alice"]]) {
    saved = undefined;
    extraNames = invalid;
    assert.equal(await options.preConfirm("Alice"), false);
    assert.equal(saved, undefined);
  }
  module.exports.appSwal.nameForm({ title: "แก้ไขอาจารย์", onSave });
  assert.equal(await options.preConfirm(" Alice "), true);
  assert.equal(saved, "Alice");
});
