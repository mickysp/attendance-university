import { NextResponse } from "next/server";
import { currentUser } from "@/lib/admin-auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId, type Db, type Document } from "mongodb";
import { notificationHref } from "@/lib/notification-links";
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
};

function normalizeSettings(value: unknown): NotificationPreferences {
  if (!value || typeof value !== "object") return defaults;
  const source = value as Record<string, unknown>;
  return {
    accounts: source.accounts !== false,
    classes: source.classes !== false,
    students: source.students !== false,
    attendance: source.attendance !== false,
  };
}

async function linkedClasses(db: Db, logs: Document[]) {
  const classLogs = logs.filter(
    (log) => log.category === "classes" && log.action !== "delete",
  );
  const ids = classLogs.flatMap((log) =>
    typeof log.targetId === "string" && ObjectId.isValid(log.targetId)
      ? [new ObjectId(log.targetId)]
      : [],
  );
  const names = classLogs.flatMap((log) =>
    !log.targetId && typeof log.target === "string" ? [log.target] : [],
  );
  if (!ids.length && !names.length) return [];
  return db
    .collection("classes")
    .find(
      { $or: [{ _id: { $in: ids } }, { className: { $in: names } }] },
      { projection: { _id: 1, className: 1 } },
    )
    .toArray();
}

export async function GET(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json(
      { success: false, message: "กรุณาเข้าสู่ระบบ" },
      { status: 401 },
    );
  }

  const db = (await clientPromise).db("attendance");
  const params = new URL(request.url).searchParams;
  const status = params.get("status") ?? "all";
  const page = Number(params.get("page") ?? 1);
  if (
    !["all", "read", "unread"].includes(status) ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    page > 100000
  )
    return NextResponse.json(
      { success: false, message: "ตัวกรองไม่ถูกต้อง" },
      { status: 400 },
    );
  const pageSize = 30;
  const readThrough = new Date();
  const settings = normalizeSettings(user.notificationPreferences);
  const enabled = categories.filter((category) => settings[category]);
  const state = await db.collection("notification_states").findOne({
    _id: user._id,
  });
  const lastReadAt =
    state?.lastReadAt instanceof Date ? state.lastReadAt : null;
  const filter = {
    category: { $in: enabled },
    createdAt: { $lte: readThrough },
  };
  const [result] = await db
    .collection("activity_logs")
    .aggregate<{
      data: Document[];
      counts: { _id: boolean; count: number }[];
    }>([
      { $match: filter },
      {
        $set: {
          receiptId: {
            $concat: [String(user._id) + ":", { $toString: "$_id" }],
          },
        },
      },
      {
        $lookup: {
          from: "notification_reads",
          localField: "receiptId",
          foreignField: "_id",
          as: "receipts",
        },
      },
      {
        $set: {
          unread: {
            $and: [
              lastReadAt ? { $gt: ["$createdAt", lastReadAt] } : true,
              { $eq: [{ $size: "$receipts" }, 0] },
            ],
          },
        },
      },
      {
        $facet: {
          counts: [{ $group: { _id: "$unread", count: { $sum: 1 } } }],
          data: [
            ...(status === "all"
              ? []
              : [{ $match: { unread: status === "unread" } }]),
            { $sort: { createdAt: -1, _id: -1 } },
            { $skip: (page - 1) * pageSize },
            { $limit: pageSize },
            { $unset: ["receipts", "receiptId"] },
          ],
        },
      },
    ])
    .toArray();
  const logs = result?.data ?? [];
  const counts = result?.counts ?? [];
  const unreadCount = counts.find((item) => item._id === true)?.count ?? 0;
  const readCount = counts.find((item) => item._id === false)?.count ?? 0;
  const totalCount = readCount + unreadCount;
  const filteredCount =
    status === "unread"
      ? unreadCount
      : status === "read"
        ? readCount
        : totalCount;
  const classes = await linkedClasses(db, logs);

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
    unread: Boolean(log.unread),
    href: notificationHref(log, classes),
  }));

  return NextResponse.json(
    {
      success: true,
      data,
      unreadCount,
      settings,
      readThrough: readThrough.toISOString(),
      readCount,
      totalCount,
      page,
      hasMore: page * pageSize < filteredCount,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
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

  if (body?.action === "mark-read") {
    if (typeof body.id !== "string" || !ObjectId.isValid(body.id))
      return NextResponse.json(
        { success: false, message: "รายการไม่ถูกต้อง" },
        { status: 400 },
      );
    const log = await db
      .collection("activity_logs")
      .findOne({ _id: new ObjectId(body.id) });
    if (!log)
      return NextResponse.json(
        { success: false, message: "ไม่พบกิจกรรมนี้" },
        { status: 404 },
      );
    // The primary key makes repeated clicks idempotent and isolates each user.
    await db
      .collection<Document & { _id: string }>("notification_reads")
      .updateOne(
        { _id: `${user._id}:${log._id}` },
        {
          $setOnInsert: {
            userId: user._id,
            notificationId: log._id,
            readAt: new Date(),
          },
        },
        { upsert: true },
      );
    return NextResponse.json({
      success: true,
      href: notificationHref(log, await linkedClasses(db, [log])),
    });
  }

  if (body?.action === "mark-all-read") {
    const readThrough = new Date(body.readThrough ?? Date.now());
    if (
      !Number.isFinite(readThrough.getTime()) ||
      readThrough.getTime() > Date.now()
    )
      return NextResponse.json(
        { success: false, message: "เวลาอ่านไม่ถูกต้อง" },
        { status: 400 },
      );
    await db
      .collection("notification_states")
      .updateOne(
        { _id: user._id },
        { $max: { lastReadAt: readThrough } },
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
