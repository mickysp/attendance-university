import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

import type { TeacherDocument, CreateTeacherBody } from "@/types/teachers";

export async function GET(req: Request) {
  try {
    const client = await clientPromise;

    const db = client.db("attendance");

    const teachers = db.collection<TeacherDocument>("teachers");

    const id = new URL(req.url).searchParams.get("id");
    if (id !== null) {
      if (!/^[a-f\d]{24}$/i.test(id)) {
        return NextResponse.json({ success: false, message: "รหัสอาจารย์ไม่ถูกต้อง" }, { status: 400 });
      }
      const teacher = await teachers.findOne({ _id: new ObjectId(id) });
      if (!teacher) {
        return NextResponse.json({ success: false, message: "ไม่พบข้อมูลอาจารย์" }, { status: 404 });
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
    console.error("GET TEACHERS ERROR:", error);

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

    const duplicate = await teachers.findOne({
      _id: { $ne: new ObjectId(id) },
      name,
    });

    if (duplicate) {
      return NextResponse.json(
        { success: false, message: "มีอาจารย์ชื่อนี้อยู่แล้ว" },
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

    return NextResponse.json(
      { success: true, message: "แก้ไขอาจารย์สำเร็จ" },
      { status: 200 },
    );
  } catch (error) {
    console.error("PATCH TEACHER ERROR:", error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : "แก้ไขอาจารย์ไม่สำเร็จ" },
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

    const client = await clientPromise;

    const db = client.db("attendance");

    const teachers = db.collection<TeacherDocument>("teachers");

    const insertData: TeacherDocument[] = [];

    for (const item of teacherList) {
      const name = typeof item?.name === "string" ? item.name.trim() : "";

      if (!name) {
        continue;
      }

      const exists = await teachers.findOne({
        name,
      });

      if (exists) {
        continue;
      }

      if (insertData.some((teacher) => teacher.name === name)) {
        continue;
      }

      insertData.push({
        name,
        createdAt: new Date(),
      });
    }

    if (insertData.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่มีข้อมูลใหม่ให้เพิ่ม",
        },
        {
          status: 400,
        },
      );
    }

    const result = await teachers.insertMany(insertData);

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
    // Classes store a snapshot of their teachers; preserve those existing records.
    const result = await client.db("attendance").collection<TeacherDocument>("teachers")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, message: "ไม่พบอาจารย์ที่ต้องการลบ" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, message: "ลบอาจารย์สำเร็จ" });
  } catch (error) {
    console.error("DELETE TEACHER ERROR:", error);
    return NextResponse.json(
      { success: false, message: "ลบอาจารย์ไม่สำเร็จ กรุณาลองอีกครั้ง" },
      { status: 500 },
    );
  }
}
