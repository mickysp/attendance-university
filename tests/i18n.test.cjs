const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const catalog = require("../src/lib/i18n/en.json");

function load(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  new Function("require", "module", "exports", code)(
    (name) => dependencies[name] ?? require(name), module, module.exports,
  );
  return module.exports;
}

const translation = load("src/lib/i18n/translate.ts", { "./en.json": catalog });
const { translateText } = translation;
const en = (text, params) => translateText(text, "en", params);

test("translates UI copy and preserves Thai and unknown text", () => {
  assert.equal(en("ชั้นเรียน"), "Classes");
  assert.equal(en("มาสาย"), "Late");
  assert.equal(translateText("ชั้นเรียน", "th"), "ชั้นเรียน");
  assert.equal(en("สมชาย ใจดี"), "สมชาย ใจดี");
  assert.equal(en(undefined), "");
});

test("interpolates counts without translating user-entered names or interpreting replacement characters", () => {
  assert.equal(en("{0} รายการที่ยังไม่ได้อ่าน", { 0: 5 }), "5 unread notifications");
  const name = "ชั้นเรียน $& <script>";
  assert.equal(en("แก้ไขอาจารย์ {0}", { 0: name }), `Edit teacher ${name}`);
  assert.equal(en(`เพิ่มอาจารย์ “${name}”`), `Added teacher “${name}”`);
  assert.equal(en("สร้างชั้นเรียน “ภาษาไทย”"), "Created class “ภาษาไทย”");
  assert.equal(en("ชื่ออาจารย์ซ้ำ: สมชาย"), "Duplicate teacher name: สมชาย");
});

test("catalog keeps placeholders consistent and contains no untranslated Thai in English values", () => {
  for (const [key, value] of Object.entries(catalog)) {
    assert.ok(value.trim(), key);
    assert.equal(/[\u0e00-\u0e7f]/.test(value), false, key);
    const slots = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    assert.deepEqual(slots(value), slots(key), key);
  }
});

test("English attendance cards keep canonical Thai status values for filtering", () => {
  let selected;
  const Card = load("src/components/attendance/Card.tsx", {
    "@/lib/language": { useLanguage: () => ({ tr: en }) },
  }).default;
  const props = {
    students: [{ status: "มาเรียน" }, { status: "มาสาย" }],
    selectedStatus: null,
    onSelectStatus: (value) => { selected = value; },
  };
  const html = renderToStaticMarkup(React.createElement(Card, props));
  assert.match(html, /Total students/);
  assert.match(html, /Present/);
  assert.match(html, /Late/);
  const buttons = Card(props).props.children;
  buttons[2].props.onClick();
  assert.equal(selected, "มาสาย");
  assert.equal(props.students[0].status, "มาเรียน");
});

test("English teacher form renders translated fields and multi-teacher action", () => {
  const Form = load("src/components/teachers/Form.tsx", {
    "@/lib/language": { useLanguage: () => ({ tr: en }) },
    "@/services/api/teachers": { teachersApi: {} },
    "next/navigation": { useRouter: () => ({}) },
    "@/context/AlertContext": { useAlert: () => ({ showAlert() {} }) },
    "@/context/swal": { useConfirm: () => ({ showConfirm() {} }) },
  }).default;
  const html = renderToStaticMarkup(React.createElement(Form));
  assert.match(html, /Teacher details/);
  assert.match(html, /Add another teacher/);
  assert.match(html, /Save details/);
  assert.equal(/[\u0e00-\u0e7f]/.test(html), false);
});

test("language persists and updates subscribers, with a Thai server snapshot", () => {
  const previousWindow = global.window;
  const events = new EventTarget();
  const values = new Map();
  let notifyCount = 0;
  const unsubscribe = [];
  global.window = Object.assign(events, {
    localStorage: { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) },
  });
  try {
    const language = load("src/lib/language.ts", {
      "./i18n/translate": translation,
      react: {
        useCallback: (fn) => fn,
        useSyncExternalStore: (subscribe, snapshot, serverSnapshot) => {
          assert.equal(serverSnapshot(), "th");
          unsubscribe.push(subscribe(() => notifyCount++));
          return snapshot();
        },
      },
    });
    language.useLanguage().setLanguage("en");
    assert.equal(values.get("classora-language"), "en");
    assert.equal(notifyCount, 1);
    assert.equal(language.useLanguage().tr("ตั้งค่า"), "Settings");
    assert.equal(language.getLocale(), "en-GB");
    language.useLanguage().setLanguage("th");
    assert.equal(language.useLanguage().tr("ตั้งค่า"), "ตั้งค่า");
    assert.equal(language.getLocale(), "th-TH");
  } finally {
    unsubscribe.forEach((fn) => fn());
    global.window = previousWindow;
  }
});
