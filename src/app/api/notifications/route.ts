import { NextResponse } from "next/server";
import { currentUser } from "@/lib/admin-auth";
import clientPromise from "@/lib/mongodb";
import type {
  NotificationCategory,
  NotificationPreferences,
} from "@/types/notifications";

const categories: NotificationCategory[] = [
  "accounts",
  "classes",
  "students",
  "attendance",
];

const defaults: NotificationPreferences = {
  accounts: true,
  classes: true,
  students: true,
  attendance: true,
  othersOnly: true,
};

function normalizeSettings(value: unknown): NotificationPreferences {
  if (!value || typeof value !== "object") return defaults;
  const source = value as Record<string, unknown>;
  return {
    accounts: source.accounts !== false,
    classes: source.classes !== false,
    students: source.students !== false,
    attendance: source.attendance !== false,
    othersOnly: source.othersOnly !== false,
  };
}

export async function GET() {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: "กรุณาเข้าสู่ระบบ" },
      { status: 401 },
    );
  }

  const db = (await clientPromise).db("attendance");
  const settings = normalizeSettings(user.notificationPreferences);
  const enabled = categories.filter((category) => settings[category]);
  const state = await db.collection("notification_states").findOne({
    _id: user._id,
  });
  const lastReadAt = state?.lastReadAt instanceof Date ? state.lastReadAt : null;
  const filter = {
    category: { $in: enabled },
    ...(settings.othersOnly ? { actorId: { $ne: user._id } } : {}),
  };
  const logs = await db
    .collection("activity_logs")
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(30)
    .toArray();

  const unreadCount = await db.collection("activity_logs").countDocuments({
    ...filter,
    ...(lastReadAt ? { createdAt: { $gt: lastReadAt } } : {}),
  });

  const data = logs.map((log) => ({
    id: String(log._id),
    actorId: String(log.actorId),
    actorName: String(log.actorName ?? "ผู้ดูแลระบบ"),
    category: log.category,
    action: log.action,
    message: String(log.message ?? "มีการเปลี่ยนแปลงข้อมูล"),
    ...(log.target ? { target: String(log.target) } : {}),
    createdAt:
      log.createdAt instanceof Date
        ? log.createdAt.toISOString()
        : new Date(log.createdAt).toISOString(),
    unread: !lastReadAt || new Date(log.createdAt) > lastReadAt,
  }));

  return NextResponse.json({
    success: true,
    data,
    unreadCount,
    settings,
  });
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: "กรุณาเข้าสู่ระบบ" },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => null);
  const db = (await clientPromise).db("attendance");

  if (body?.action === "mark-all-read") {
    await db.collection("notification_states").updateOne(
      { _id: user._id },
      { $set: { lastReadAt: new Date() } },
      { upsert: true },
    );
    return NextResponse.json({ success: true });
  }

  if (body?.action === "update-settings") {
    const settings = normalizeSettings(body.settings);
    await db
      .collection("users")
      .updateOne(
        { _id: user._id },
        { $set: { notificationPreferences: settings } },
      );
    return NextResponse.json({ success: true, settings });
  }

  return NextResponse.json(
    { success: false, message: "คำขอไม่ถูกต้อง" },
    { status: 400 },
  );
}
