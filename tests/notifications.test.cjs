const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

function loadTs(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const result = { exports: {} };
  new Function("require", "module", "exports", code)(
    (name) => dependencies[name] ?? require(name),
    result,
    result.exports,
  );
  return result.exports;
}

const { notificationStream } = loadTs("src/lib/notification-stream.ts");

test("teacher notifications open teachers for both legacy and new activities", () => {
  const { notificationHref } = loadTs("src/lib/notification-links.ts");
  for (const [action, verb] of [["create", "เพิ่ม"], ["update", "แก้ไข"], ["delete", "ลบ"]]) {
    assert.equal(notificationHref({ category: "accounts", action, message: `${verb}อาจารย์ “สมชาย”` }), "/teachers");
    assert.equal(notificationHref({ category: "accounts", action, targetType: "teachers", message: "ข้อความใหม่" }), "/teachers");
  }
  assert.equal(notificationHref({ category: "accounts", message: "เพิ่มผู้ดูแลระบบ “อาจารย์ สมชาย”" }), "/administrators");
  assert.equal(notificationHref({ category: "accounts", targetType: "administrators", message: "เพิ่มอาจารย์ สมชาย" }), "/administrators");
  assert.equal(notificationHref({ category: "accounts", message: null }), "/administrators");
});

test("notification links resolve class details and safely handle old or deleted targets", () => {
  const { notificationHref } = loadTs("src/lib/notification-links.ts");
  const id = "123456789012345678901234";
  const classes = [{ _id: id, className: "Example" }];
  assert.equal(notificationHref({ category: "classes", action: "create", targetId: id }, classes), `/classes/form/${id}`);
  assert.equal(notificationHref({ category: "classes", action: "update", target: "Example" }, classes), `/classes/form/${id}`);
  assert.equal(notificationHref({ category: "classes", action: "delete", targetId: id }, classes), "/classes");
  assert.equal(notificationHref({ category: "classes", targetId: id }, []), "/classes");
  assert.equal(notificationHref({ category: "classes", target: "Example" }, [...classes, { _id: "223456789012345678901234", className: "Example" }]), "/classes");
  assert.equal(notificationHref({ category: "classes", targetId: "javascript:alert(1)" }, []), "/classes");
  assert.equal(notificationHref({ category: "accounts" }), "/administrators");
});

function source() {
  let resolveNext;
  return {
    closed: false,
    next() {
      return new Promise((resolve) => {
        resolveNext = resolve;
      });
    },
    emit() {
      assert.ok(resolveNext);
      resolveNext({ operationType: "insert" });
    },
    async close() {
      this.closed = true;
      resolveNext?.(null);
    },
  };
}

async function frame(reader) {
  let timeout;
  try {
    return await Promise.race([
      reader
        .read()
        .then(({ done, value }) =>
          done ? null : new TextDecoder().decode(value),
        ),
      new Promise((_, reject) => {
        timeout = setTimeout(
          () => reject(new Error("SSE frame timed out")),
          1000,
        );
      }),
    ]);
  } finally {
    clearTimeout(timeout);
  }
}

test("activity changes push frames immediately and disconnected readers release their cursor", async () => {
  const changes = source();
  const abort = new AbortController();
  const reader = notificationStream({
    changes,
    signal: abort.signal,
    checkSession: async () => null,
  }).getReader();
  try {
    assert.match(await frame(reader), /event: ready/);
    changes.emit();
    assert.match(await frame(reader), /event: notifications/);
    abort.abort();
    assert.equal(await frame(reader), null);
    assert.equal(changes.closed, true);
  } finally {
    await reader.cancel();
  }
});

test("revoked sessions receive a logout reason and no notification update", async () => {
  const changes = source();
  const reader = notificationStream({
    changes,
    signal: new AbortController().signal,
    checkSession: async () => "role_changed",
  }).getReader();
  try {
    await frame(reader);
    changes.emit();
    const result = await frame(reader);
    assert.match(result, /event: session-invalid/);
    assert.match(result, /role_changed/);
    assert.equal(await frame(reader), null);
    assert.equal(changes.closed, true);
  } finally {
    await reader.cancel();
  }
});

test("connection expiry and database failures close cursors without false logout notices", async () => {
  for (const fails of [false, true]) {
    const changes = source();
    const reader = notificationStream({
      changes,
      signal: new AbortController().signal,
      checkSession: async () => {
        if (fails) throw new Error("offline");
        return null;
      },
      lifetimeMs: 20,
    }).getReader();
    try {
      await frame(reader);
      if (fails) changes.emit();
      assert.equal(await frame(reader), null);
      assert.equal(changes.closed, true);
    } finally {
      await reader.cancel();
    }
  }
});

test("browser reloads on push and reconnect, pauses hidden tabs, and cleans up", () => {
  const originals = {
    document: global.document,
    window: global.window,
    EventSource: global.EventSource,
  };
  const connections = [];
  let visibilityState = "visible";
  const document = new EventTarget();
  Object.defineProperty(document, "visibilityState", {
    get: () => visibilityState,
  });
  global.document = document;
  global.window = new EventTarget();
  global.EventSource = class extends EventTarget {
    constructor(url) {
      super();
      assert.equal(url, "/api/notifications/stream");
      connections.push(this);
    }
    close() {
      this.closed = true;
    }
  };
  let cleanup;
  try {
    const { subscribeNotifications } = loadTs(
      "src/services/api/notifications/subscribe.ts",
      {
        "@/lib/session-policy": loadTs("src/lib/session-policy.ts"),
      },
    );
    let updates = 0;
    cleanup = subscribeNotifications(() => updates++);
    connections[0].dispatchEvent(new Event("ready"));
    connections[0].dispatchEvent(new Event("notifications"));
    assert.equal(updates, 2);
    connections[0].onerror();
    connections[0].dispatchEvent(new Event("ready"));
    assert.equal(updates, 4);
    visibilityState = "hidden";
    document.dispatchEvent(new Event("visibilitychange"));
    assert.equal(connections[0].closed, true);
    visibilityState = "visible";
    document.dispatchEvent(new Event("visibilitychange"));
    assert.equal(connections.length, 2);
    connections[1].dispatchEvent(new Event("ready"));
    assert.equal(updates, 5);
    cleanup();
    assert.equal(connections[1].closed, true);
  } finally {
    cleanup?.();
    Object.assign(global, originals);
  }
});

test("feed includes own activities despite legacy settings, respects categories, and marks only the fetched snapshot read", async () => {
  const now = new Date();
  let readFilter;
  let update;
  const user = {
    _id: "viewer",
    notificationPreferences: { classes: false, othersOnly: true },
  };
  const db = {
    collection: (name) =>
      name === "activity_logs"
        ? {
            aggregate(pipeline) {
              readFilter = pipeline[0].$match;
              return {
                toArray: async () => [{ data: [], counts: [] }],
              };
            },
          }
        : {
            findOne: async () => ({ lastReadAt: now }),
            updateOne: async (_, value) => {
              update = value;
            },
          },
  };
  const { GET, PATCH } = loadTs("src/app/api/notifications/route.ts", {
    "@/lib/admin-auth": { currentUser: async () => user },
    "@/lib/mongodb": { default: Promise.resolve({ db: () => db }) },
    "@/lib/notification-links": loadTs("src/lib/notification-links.ts"),
  });
  const data = await (await GET(new Request("http://localhost/api/notifications"))).json();
  assert.equal(readFilter.category.$in.includes("classes"), false);
  assert.equal(readFilter.actorId, undefined);
  assert.equal(data.settings.othersOnly, undefined);
  assert.equal(readFilter.createdAt.$lte.toISOString(), data.readThrough);
  const response = await PATCH(
    new Request("http://localhost/api/notifications", {
      method: "PATCH",
      body: JSON.stringify({
        action: "mark-all-read",
        readThrough: data.readThrough,
      }),
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(update.$max.lastReadAt.toISOString(), data.readThrough);
  assert.equal(update.$set, undefined);
});
