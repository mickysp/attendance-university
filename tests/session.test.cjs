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

const policy = loadTs("src/lib/session-policy.ts");
const { sessionInvalidReason } = policy;

test("protected APIs reject revoked sessions while public student check-in remains available", async () => {
  const { NextRequest } = require("next/server");
  let failure = false;
  const { proxy } = loadTs("src/proxy.ts", {
    "@/lib/session-policy": policy,
    "@/lib/session": {
      verifySession: async () => {
        if (failure) throw new Error("database unavailable");
        return { user: null, reason: "role_changed" };
      },
    },
  });
  for (const [path, method] of [
    ["/api/students", "GET"],
    ["/api/classes/delete?id=example", "DELETE"],
    ["/api/check-in", "POST"],
    ["/api/auth/profile", "PATCH"],
  ]) {
    const response = await proxy(
      new NextRequest("http://localhost" + path, { method }),
    );
    assert.equal(response.status, 401);
    assert.equal((await response.json()).reason, "role_changed");
  }
  for (const [path, method] of [
    ["/api/check-in", "GET"],
    ["/api/attendance", "POST"],
    ["/api/classes/123456789012345678901234", "GET"],
    ["/api/auth/login", "POST"],
    ["/api/auth/logout", "POST"],
  ]) {
    const response = await proxy(
      new NextRequest("http://localhost" + path, { method }),
    );
    assert.equal(response.headers.get("x-middleware-next"), "1");
  }
  const redirected = await proxy(
    new NextRequest("http://localhost/administrators", {
      headers: { cookie: "accessToken=old-session" },
    }),
  );
  assert.equal(
    redirected.headers.get("location"),
    "http://localhost/login?reason=role_changed",
  );
  assert.match(redirected.headers.get("set-cookie"), /accessToken=;/);
  failure = true;
  assert.equal(
    (await proxy(new NextRequest("http://localhost/api/students"))).status,
    503,
  );
});

test("existing and new sessions remain valid after cosmetic profile updates", () => {
  assert.equal(
    sessionInvalidReason({ role: "Teacher" }, { role: "Teacher" }),
    null,
  );
  assert.equal(
    sessionInvalidReason(
      { role: "Teacher", sessionVersion: 3 },
      {
        role: "Teacher",
        sessionVersion: 3,
        fullname: "Updated name",
        avatarUpdatedAt: new Date(),
      },
    ),
    null,
  );
});

test("role change rejects all older devices, including a role changed back", () => {
  const tokens = [{ role: "Teacher" }, { role: "Teacher", sessionVersion: 0 }];
  for (const token of tokens) {
    assert.equal(
      sessionInvalidReason(token, {
        role: "Teaching Assistant",
        sessionVersion: 1,
        sessionRevokedReason: "role_changed",
      }),
      "role_changed",
    );
    assert.equal(
      sessionInvalidReason(token, {
        role: "Teacher",
        sessionVersion: 2,
        sessionRevokedReason: "role_changed",
      }),
      "role_changed",
    );
  }
});

test("password and credential changes reject old tokens but allow a new login", () => {
  for (const reason of ["password_changed", "credentials_changed"]) {
    const account = {
      role: "Teacher",
      sessionVersion: 2,
      sessionRevokedReason: reason,
    };
    assert.equal(
      sessionInvalidReason({ role: "Teacher", sessionVersion: 1 }, account),
      reason,
    );
    assert.equal(
      sessionInvalidReason({ role: "Teacher", sessionVersion: 2 }, account),
      null,
    );
  }
});

test("deleted and disabled accounts are rejected", () => {
  assert.equal(
    sessionInvalidReason({ role: "Teacher" }, null),
    "account_deleted",
  );
  assert.equal(
    sessionInvalidReason(
      { role: "Teacher" },
      { role: "Teacher", disabled: true },
    ),
    "account_disabled",
  );
  assert.equal(policy.isSessionReason("toString"), false);
});

test("server verifies signed JWTs and rejects stale sessions; DB failure is not expiry", async () => {
  const jose = await import("jose");
  const { ObjectId } = require("mongodb");
  const previousSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = require("node:crypto")
    .randomBytes(64)
    .toString("hex");
  try {
    const id = new ObjectId();
    let account = { _id: id, role: "Teacher", sessionVersion: 0 };
    let fail = false;
    const { verifySession } = loadTs("src/lib/session.ts", {
      jose,
      "@/lib/session-policy": policy,
      "@/lib/mongodb": {
        default: Promise.resolve({
          db: () => ({
            collection: () => ({
              findOne: async () => {
                if (fail) throw new Error("database unavailable");
                return account;
              },
            }),
          }),
        }),
      },
    });
    const token = await new jose.SignJWT({
      userId: id.toString(),
      role: "Teacher",
      sessionVersion: 0,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(process.env.JWT_SECRET));
    assert.equal(
      (await verifySession(token)).user._id.toString(),
      id.toString(),
    );
    account = {
      ...account,
      sessionVersion: 1,
      sessionRevokedReason: "password_changed",
    };
    assert.equal((await verifySession(token)).reason, "password_changed");
    assert.equal((await verifySession("invalid")).reason, "session_expired");
    account = null;
    assert.equal((await verifySession(token)).reason, "account_deleted");
    fail = true;
    await assert.rejects(verifySession(token), /database unavailable/);
  } finally {
    if (previousSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = previousSecret;
  }
});
