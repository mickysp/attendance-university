import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { verifySession } from "@/lib/session";
import { notificationStream } from "@/lib/notification-stream";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const token = (await cookies()).get("accessToken")?.value;
  const session = await verifySession(token);
  if (!session.user)
    return NextResponse.json(
      { success: false, reason: session.reason },
      { status: 401 },
    );
  const db = (await clientPromise).db("attendance");
  // Database change streams work across app instances, unlike in-memory events.
  // Only invalidation signals are sent; the normal API filters each user's feed.
  const changes = db.watch(
    [
      {
        $match: {
          $or: [
            { "ns.coll": "activity_logs", operationType: "insert" },
            {
              "ns.coll": "notification_reads",
              operationType: "insert",
              "fullDocument.userId": session.user._id,
            },
            {
              "ns.coll": { $in: ["users", "notification_states"] },
              "documentKey._id": session.user._id,
            },
          ],
        },
      },
    ],
    { maxAwaitTimeMS: 1000 },
  );
  try {
    // Open the cursor BEFORE ready triggers a snapshot fetch: no startup gap.
    await changes.tryNext();
    if (request.signal.aborted) {
      await changes.close();
      return new Response(null, { status: 204 });
    }
  } catch {
    await changes.close().catch(() => {});
    return NextResponse.json(
      {
        success: false,
        message: "เชื่อมต่อการแจ้งเตือนสดไม่ได้ กรุณาลองอีกครั้ง",
      },
      { status: 503 },
    );
  }
  return new Response(
    notificationStream({
      changes,
      signal: request.signal,
      checkSession: async () => (await verifySession(token)).reason,
    }),
    {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-store, no-transform",
        "X-Accel-Buffering": "no",
      },
    },
  );
}
