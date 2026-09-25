import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { currentUser } from "@/lib/admin-auth";
import { recordActivity } from "@/lib/activity-log";
import type {
  CheckInConfigFields,
  CheckInConfigDocument,
  UpdateCheckInConfigBody,
} from "@/types/check-in";

const defaultConfig: CheckInConfigFields = {
  prefix: true,
  firstname: true,
  lastname: true,
  studentId: true,
  email: true,
  section: true,
  photo: true,
  note: true,
  location: true,
};

function validateConfig(config: unknown): config is CheckInConfigFields {
  if (typeof config !== "object" || config === null) {
    return false;
  }

  const c = config as Record<string, unknown>;

  const fields: (keyof CheckInConfigFields)[] = [
    "prefix",
    "firstname",
    "lastname",
    "studentId",
    "email",
    "section",
    "photo",
    "note",
    "location",
  ];

  return fields.every((field) => typeof c[field] === "boolean");
}

export async function POST(req: Request) {
  try {
    const body: UpdateCheckInConfigBody = await req.json();

    const { config, classId } = body;

    if (typeof classId !== "string" || !ObjectId.isValid(classId)) {
      return NextResponse.json(
        { success: false, message: "กรุณาเลือกรายวิชาให้ถูกต้อง" },
        { status: 400 },
      );
    }
    const normalizedClassId = new ObjectId(classId).toHexString();

    if (!validateConfig(config)) {
      return NextResponse.json(
        {
          success: false,
          message: "invalid config",
        },
        {
          status: 400,
        },
      );
    }

    const client = await clientPromise;

    const db = client.db("attendance");

    const subject = await db
      .collection("classes")
      .findOne({ _id: new ObjectId(classId) });
    if (!subject) {
      return NextResponse.json(
        { success: false, message: "ไม่พบรายวิชา" },
        { status: 404 },
      );
    }

    const checkIn = db.collection<CheckInConfigDocument>("checkIn");

    const safeConfig = {
      ...defaultConfig,

      ...config,
    };

    await checkIn.updateOne(
      {
        type: "class_config",
        classId: normalizedClassId,
      },
      {
        $set: {
          type: "class_config",
          classId: normalizedClassId,
          config: safeConfig,
          updatedAt: new Date(),
        },
      },
      {
        upsert: true,
      },
    );

    const actor = await currentUser();
    if (actor) {
      await recordActivity({
        actor,
        category: "attendance",
        action: "update",
        message: `ตั้งค่าแบบฟอร์มเช็คชื่อสำหรับ “${subject.className}”`,
        target: subject.className,
        targetId: String(subject._id),
      });
    }

    return NextResponse.json({
      success: true,

      config: safeConfig,
      classId: normalizedClassId,
      source: "class",
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Unknown error",
      },
      {
        status: 500,
      },
    );
  }
}

export async function GET(req: Request) {
  try {
    const classId = new URL(req.url).searchParams.get("classId");
    if (classId !== null && !ObjectId.isValid(classId)) {
      return NextResponse.json(
        { success: false, message: "รหัสรายวิชาไม่ถูกต้อง" },
        { status: 400 },
      );
    }
    const client = await clientPromise;

    const db = client.db("attendance");

    const checkIn = db.collection<CheckInConfigDocument>("checkIn");

    const classConfig = classId
      ? await checkIn.findOne({
          type: "class_config",
          classId: new ObjectId(classId).toHexString(),
        })
      : null;
    const result =
      classConfig ?? (await checkIn.findOne({ type: "global_config" }));

    const config = result?.config
      ? {
          ...defaultConfig,
          ...result.config,
        }
      : defaultConfig;

    return NextResponse.json({
      success: true,

      config,
      source: classConfig ? "class" : "default",
      classId,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        message: err instanceof Error ? err.message : "Unknown error",
      },
      {
        status: 500,
      },
    );
  }
}
