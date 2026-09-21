import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { test } from "node:test";
import * as jsxRuntime from "react/jsx-runtime";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadComponent(filename, dependencies, globals = {}) {
  const { outputText } = ts.transpileModule(readFileSync(path.join(root, filename), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
    fileName: filename,
  });
  const exports = {};
  vm.runInNewContext(outputText, {
    exports,
    require: (name) => {
      if (name === "react/jsx-runtime") return jsxRuntime;
      assert.ok(name in dependencies, `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    ...globals,
  });
  return exports.default;
}

function findElements(node, predicate) {
  if (Array.isArray(node)) return node.flatMap((child) => findElements(child, predicate));
  if (!node || typeof node !== "object") return [];
  return [
    ...(predicate(node) ? [node] : []),
    ...findElements(node.props?.children, predicate),
  ];
}

test("focus, visibility and timed refresh keep the class table mounted and retain data on failure", async () => {
  const states = [];
  const effects = [];
  const listeners = {};
  let cursor = 0;
  let mounted = false;
  let interval;
  let resolveRequest;
  const Table = () => null;
  const classes = [{ _id: "class-1", className: "Selected class", classCodes: ["C1"] }];
  const Page = loadComponent("src/app/(main)/classes/page.tsx", {
    react: {
      useState: (initial) => {
        const index = cursor++;
        if (!mounted) states[index] = initial;
        return [states[index], (value) => { states[index] = typeof value === "function" ? value(states[index]) : value; }];
      },
      useCallback: (callback) => callback,
      useEffect: (effect) => { if (!mounted) effects.push(effect); },
    },
    "next/navigation": { useRouter: () => ({ push: () => {} }) },
    "@/components/classes/Table": { default: Table },
    "@/components/classes/Select": { default: () => null },
    "@/services/api/classes": {
      classesApi: { list: () => new Promise((resolve) => { resolveRequest = resolve; }) },
    },
  }, {
    window: {
      addEventListener: (name, callback) => { listeners[name] = callback; },
      removeEventListener: (name) => { delete listeners[name]; },
      setInterval: (callback) => { interval = callback; return 1; },
      clearInterval: () => { interval = undefined; },
    },
    document: {
      visibilityState: "visible",
      addEventListener: (name, callback) => { listeners[name] = callback; },
      removeEventListener: (name) => { delete listeners[name]; },
    },
  });
  const render = () => { cursor = 0; return Page(); };
  const tables = () => findElements(render(), (node) => node.type === Table);
  render();
  mounted = true;
  const cleanup = effects[0]();
  assert.equal(tables().length, 0, "initial load shows loading state");
  resolveRequest({ json: async () => ({ success: true, data: classes }) });
  await new Promise(setImmediate);
  assert.equal(tables().length, 1);

  for (const refresh of [listeners.focus, listeners.visibilitychange, interval]) {
    refresh();
    assert.equal(tables().length, 1, "refresh must not remove the clicked table");
    assert.equal(tables()[0].props.data[0]._id, "class-1");
    resolveRequest({ json: async () => { throw new Error("Temporary network failure"); } });
    await new Promise(setImmediate);
    assert.equal(tables().length, 1, "failed background refresh retains the table");
    assert.equal(tables()[0].props.data[0]._id, "class-1");
  }
  cleanup();
  assert.deepEqual(listeners, {});
  assert.equal(interval, undefined);
});

test("both table layouts link to each selected class's check-in form", () => {
  const Link = () => null;
  const Table = loadComponent("src/components/classes/Table.tsx", {
    react: {
      useState: (initial) => [initial, () => {}],
      useRef: () => ({ current: null }),
      useEffect: () => {},
    },
    "next/link": { default: Link },
    "next/navigation": { useRouter: () => ({ push: () => {} }) },
    "@/services/api/classes": { classesApi: {} },
    "@/context/AlertContext": { useAlert: () => ({ showAlert: () => {} }) },
    "@/context/swal": { useConfirm: () => ({ showConfirm: () => {} }) },
    "@heroicons/react/24/outline": new Proxy({}, { get: () => () => null }),
  });
  const data = ["class-one", "class/two&three"].map((_id) => ({
    _id, className: _id, classCodes: [], teachers: [], status: "unused",
  }));
  const tree = Table({ data, onDeleteSuccess: () => {} });
  const links = findElements(tree, (node) => node.type === Link);
  assert.deepEqual(links.map((link) => link.props.href), [
    "/classes/form/class-one",
    "/classes/form/class%2Ftwo%26three",
    "/classes/form/class-one",
    "/classes/form/class%2Ftwo%26three",
  ]);
});
