import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

type IncomingClass = {
  className?: string;
  classCode?: string;
  teacher?: string;
  description?: string;
  branches?: string[];
};

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุ id" },
        { status: 400 },
      );
    }

    const body: IncomingClass = await req.json();

    const client = await clientPromise;
    const db = client.db("attendance");
    const classes = db.collection("classes");

    const existing = await classes.findOne({ _id: new ObjectId(id) });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลที่ต้องการแก้ไข" },
        { status: 404 },
      );
    }

    const { className, classCode, description, teacher, branches } = body;

    if (className !== undefined && !className) {
      return NextResponse.json(
        { success: false, message: "กรุณากรอกชื่อวิชา" },
        { status: 400 },
      );
    }

    if (branches !== undefined && branches.length === 0) {
      return NextResponse.json(
        { success: false, message: "ต้องมีอย่างน้อย 1 สาขา" },
        { status: 400 },
      );
    }

    if (classCode) {
      const duplicate = await classes.findOne({
        classCode,
        _id: { $ne: new ObjectId(id) },
      });

      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message: `รหัสวิชา ${classCode} มีอยู่แล้ว`,
          },
          { status: 400 },
        );
      }
    }

    type UpdateClassPayload = {
      className?: string;
      classCode?: string;
      description?: string;
      teacher?: string;
      branches?: string[];
      updatedAt?: Date;
    };

    const updateData: Partial<UpdateClassPayload> = {};

    if (className !== undefined) updateData.className = className;
    if (classCode !== undefined) updateData.classCode = classCode;
    if (description !== undefined) updateData.description = description;
    if (teacher !== undefined) updateData.teacher = teacher;

    if (branches !== undefined) {
      updateData.branches = [...new Set(branches)];
    }

    updateData.updatedAt = new Date();

    await classes.updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    return NextResponse.json({
      success: true,
      message: "อัปเดตรายวิชาสำเร็จ",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 },
    );
  }
}
