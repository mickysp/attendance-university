import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { currentUser } from "@/lib/admin-auth";
import { recordActivity } from "@/lib/activity-log";
import { ObjectId } from "mongodb";

import type { TeacherDocument, CreateTeacherBody } from "@/types/teachers";

const normalizeTeacherName = (value: string) => {
  return value
    .toLowerCase()
    .replace(
      /(อ\.?|อาจารย์|ดร\.?|ผศ\.?|รศ\.?|ศ\.?|นาย|นางสาว|นาง|น\.ส\.?|น\.ส|นางสาว|น.ส\.?)/g,
      "",
    )
    .replace(/[^\p{L}\p{N}]+/gu, "")
    .trim();
};

export async function GET(req: Request) {
  try {
    const client = await clientPromise;

    const db = client.db("attendance");

    const teachers = db.collection<TeacherDocument>("teachers");

    const id = new URL(req.url).searchParams.get("id");
    if (id !== null) {
      if (!/^[a-f\d]{24}$/i.test(id)) {
        return NextResponse.json(
          { success: false, message: "รหัสอาจารย์ไม่ถูกต้อง" },
          { status: 400 },
        );
      }
      const teacher = await teachers.findOne({ _id: new ObjectId(id) });
      if (!teacher) {
        return NextResponse.json(
          { success: false, message: "ไม่พบข้อมูลอาจารย์" },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, data: teacher });
    }

    const data = await teachers
      .find({})
      .sort({
        createdAt: -1,
      })
      .toArray();

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const id = typeof body?.id === "string" ? body.id : "";
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, message: "รหัสอาจารย์ไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกชื่ออาจารย์" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");
    const teachers = db.collection<TeacherDocument>("teachers");

    const allTeachers = await teachers
      .find({ _id: { $ne: new ObjectId(id) } }, { projection: { name: 1 } })
      .toArray();

    const duplicate = allTeachers.some(
      (teacher) =>
        normalizeTeacherName(String(teacher.name ?? "")) ===
        normalizeTeacherName(name),
    );

    if (duplicate) {
      return NextResponse.json(
        { success: false, message: "มีชื่อนี้ในระบบอยู่แล้ว" },
        { status: 409 },
      );
    }

    const result = await teachers.updateOne(
      { _id: new ObjectId(id) },
      { $set: { name, updatedAt: new Date() } },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, message: "ไม่พบอาจารย์ที่ต้องการแก้ไข" },
        { status: 404 },
      );
    }

    const actor = await currentUser();
    if (actor) {
      await recordActivity({
        actor,
        category: "accounts",
        action: "update",
        message: `แก้ไขอาจารย์ “${name}”`,
        target: name,
      });
    }

    return NextResponse.json(
      { success: true, message: "แก้ไขอาจารย์สำเร็จ" },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "แก้ไขอาจารย์ไม่สำเร็จ",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const teacherList: CreateTeacherBody[] = Array.isArray(body)
      ? body
      : [body];

    if (
      !teacherList.length ||
      teacherList.some(
        (item) => typeof item?.name !== "string" || !item.name.trim(),
      )
    ) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกชื่ออาจารย์ให้ครบทุกคน" },
        { status: 400 },
      );
    }

    const client = await clientPromise;

    const db = client.db("attendance");

    const teachers = db.collection<TeacherDocument>("teachers");

    const insertData: TeacherDocument[] = [];
    const seenNames = new Set<string>();
    const existingTeachers = await teachers
      .find({}, { projection: { name: 1 } })
      .toArray();
    const existingNames = new Set(
      existingTeachers.map((teacher) =>
        normalizeTeacherName(String(teacher.name ?? "")),
      ),
    );

    for (const item of teacherList) {
      const name = typeof item?.name === "string" ? item.name.trim() : "";

      const normalized = normalizeTeacherName(name);
      if (seenNames.has(normalized) || existingNames.has(normalized)) {
        return NextResponse.json(
          { success: false, message: `ชื่ออาจารย์ซ้ำ: ${name}` },
          { status: 409 },
        );
      }
      seenNames.add(normalized);

      insertData.push({
        name,
        createdAt: new Date(),
      });
    }

    const result = await teachers.insertMany(insertData);

    const actor = await currentUser();
    if (actor) {
      await Promise.all(
        insertData.map((teacher) =>
          recordActivity({
            actor,
            category: "accounts",
            action: "create",
            message: `เพิ่มอาจารย์ “${teacher.name}”`,
            target: teacher.name,
          }),
        ),
      );
    }

    return NextResponse.json({
      success: true,

      message: `เพิ่มอาจารย์ ${result.insertedCount} รายการ`,

      data: insertData,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,

        message: error instanceof Error ? error.message : "Unknown error",
      },

      {
        status: 500,
      },
    );
  }
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");

  if (!id || !/^[a-f\d]{24}$/i.test(id)) {
    return NextResponse.json(
      { success: false, message: "รหัสอาจารย์ไม่ถูกต้อง" },
      { status: 400 },
    );
  }

  try {
    const client = await clientPromise;
    const teachers = client
      .db("attendance")
      .collection<TeacherDocument>("teachers");
    const existingTeacher = await teachers.findOne(
      { _id: new ObjectId(id) },
      { projection: { name: 1 } },
    );

    if (!existingTeacher) {
      return NextResponse.json(
        { success: false, message: "ไม่พบอาจารย์ที่ต้องการลบ" },
        { status: 404 },
      );
    }

    const result = await teachers.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "ไม่พบอาจารย์ที่ต้องการลบ" },
        { status: 404 },
      );
    }

    const actor = await currentUser();
    if (actor) {
      await recordActivity({
        actor,
        category: "accounts",
        action: "delete",
        message: `ลบอาจารย์ “${existingTeacher.name}”`,
        target: existingTeacher.name,
      });
    }

    return NextResponse.json({ success: true, message: "ลบอาจารย์สำเร็จ" });
  } catch {
    return NextResponse.json(
      { success: false, message: "ลบอาจารย์ไม่สำเร็จ กรุณาลองอีกครั้ง" },
      { status: 500 },
    );
  }
}
