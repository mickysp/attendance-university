// Opt-in database test; all writes use uniquely named temporary collections.
// node --env-file=.env --test --experimental-test-isolation=none tests/notification-reading.integration.cjs
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { MongoClient, ObjectId } = require("mongodb");
const { randomBytes } = require("node:crypto");
const fs = require("node:fs");
const ts = require("typescript");

function loadTs(file, dependencies = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const result = { exports: {} };
  new Function("require", "module", "exports", code)(
    (name) => dependencies[name] ?? require(name), result, result.exports,
  );
  return result.exports;
}

test("read receipts, filters, pagination and class navigation work with MongoDB", {
  skip: !process.env.MONGODB_URI,
  timeout: 30000,
}, async () => {
  const client = new MongoClient(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
  const prefix = "codex_notification_test_" + randomBytes(8).toString("hex") + "_";
  const collectionNames = ["activity_logs", "notification_reads", "notification_states", "classes"];
  const db = client.db("attendance");
  const testDb = {
    collection(name) {
      assert.ok(collectionNames.includes(name));
      const collection = db.collection(prefix + name);
      if (name !== "activity_logs") return collection;
      return {
        findOne: (...args) => collection.findOne(...args),
        aggregate(pipeline) {
          // Keep the real route pipeline, but join only the isolated receipts.
          const isolated = pipeline.map((stage) => stage.$lookup ? {
            $lookup: { ...stage.$lookup, from: prefix + stage.$lookup.from },
          } : stage);
          return collection.aggregate(isolated);
        },
      };
    },
  };
  const viewer = { _id: new ObjectId() };
  const secondViewer = { _id: new ObjectId() };
  let actor = viewer;
  const route = loadTs("src/app/api/notifications/route.ts", {
    "@/lib/admin-auth": { currentUser: async () => actor },
    "@/lib/mongodb": { default: Promise.resolve({ db: () => testDb }) },
    "@/lib/notification-links": loadTs("src/lib/notification-links.ts"),
  });
  const get = async (query = "") => {
    const response = await route.GET(new Request("http://localhost/api/notifications" + query));
    assert.equal(response.status, 200);
    return response.json();
  };
  const click = (id) => route.PATCH(new Request("http://localhost/api/notifications", {
    method: "PATCH", body: JSON.stringify({ action: "mark-read", id }),
  }));
  try {
    await client.connect();
    const classId = new ObjectId();
    await db.collection(prefix + "classes").insertOne({ _id: classId, className: "Test class" });
    const logs = Array.from({ length: 35 }, (_, i) => ({
      _id: new ObjectId(), actorId: viewer._id, actorName: "Test actor", category: "classes",
      action: "create", targetId: String(classId), target: "Test class", message: "Test activity",
      createdAt: new Date(Date.now() - 100000 + i * 1000),
    }));
    await db.collection(prefix + "activity_logs").insertMany(logs);
    let feed = await get();
    assert.equal(feed.unreadCount, 35);
    assert.equal(feed.data.length, 30);
    assert.equal(feed.hasMore, true);
    // Opening the dialog must not mark anything read.
    assert.equal((await get()).unreadCount, 35);
    const first = feed.data[0];
    const opened = await (await click(first.id)).json();
    assert.equal(opened.href, `/classes/form/${classId}`);
    await click(first.id); // Repeated clicks do not create duplicate receipts.
    assert.equal(await db.collection(prefix + "notification_reads").countDocuments({}), 1);
    feed = await get("?status=read");
    assert.equal(feed.readCount, 1);
    assert.equal(feed.unreadCount, 34);
    assert.equal(feed.data.length, 1);
    assert.equal(feed.data[0].unread, false);
    assert.equal((await get("?status=unread&page=2")).data.length, 4);
    actor = secondViewer;
    assert.equal((await get()).unreadCount, 35);
    actor = viewer;
    // Legacy bulk-read timestamps stay compatible with individual receipts.
    await db.collection(prefix + "notification_states").insertOne({ _id: viewer._id, lastReadAt: logs[4].createdAt });
    assert.equal((await get()).readCount, 6);
    await db.collection(prefix + "classes").deleteOne({ _id: classId });
    assert.equal((await (await click(first.id)).json()).href, "/classes");
    assert.equal((await click("invalid")).status, 400);
    assert.equal((await click(String(new ObjectId()))).status, 404);
  } finally {
    for (const suffix of collectionNames) {
      const name = prefix + suffix;
      assert.match(name, /^codex_notification_test_[a-f0-9]{16}_(activity_logs|notification_reads|notification_states|classes)$/);
      await db.collection(name).drop().catch((error) => { if (error.code !== 26) throw error; });
    }
    await client.close();
  }
});
