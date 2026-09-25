import { jwtVerify } from "jose";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { sessionInvalidReason, type SessionReason } from "@/lib/session-policy";

export async function verifySession(token: string | undefined) {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not configured");
  const invalid = (reason: SessionReason) => ({ user: null, reason });
  if (!token) return invalid("session_expired");
  let payload;
  try {
    ({ payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET),
      { algorithms: ["HS256"] },
    ));
  } catch {
    return invalid("session_expired");
  }
  if (typeof payload.userId !== "string" || !ObjectId.isValid(payload.userId))
    return invalid("session_expired");
  // Database failures must not be reported as revoked sessions.
  const user = await (
    await clientPromise
  )
    .db("attendance")
    .collection("users")
    .findOne({ _id: new ObjectId(payload.userId) });
  const reason = sessionInvalidReason(
    payload,
    user
      ? {
          role: user.role,
          sessionVersion: user.sessionVersion,
          sessionRevokedReason: user.sessionRevokedReason,
          disabled: user.disabled,
        }
      : null,
  );
  if (reason) return invalid(reason);
  return { user: user!, reason: null };
}
