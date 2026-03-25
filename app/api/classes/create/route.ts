import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

type ClassPayload = {
  className: string;
  classCode?: string;
  description?: string;
  teacher?: string;
  branches: string[];
  createdAt: Date;
};

type IncomingClass = {
  className?: string;
  classCode?: string;
  teacher?: string;
  description?: string;
  branches?: string[];
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const classList: IncomingClass[] = Array.isArray(body) ? body : [body];

    const client = await clientPromise;
    const db = client.db("attendance");
    const classes = db.collection("classes");

    const insertData: ClassPayload[] = [];

    for (const item of classList) {
      const { className, classCode, description, teacher, branches } = item;

      // 🔴 validate
      if (!className) {
        return NextResponse.json(
          { success: false, message: "มีบางรายการไม่ได้กรอกชื่อวิชา" },
          { status: 400 },
        );
      }

      if (!branches || branches.length === 0) {
        return NextResponse.json(
          { success: false, message: `วิชา ${className} ต้องมีอย่างน้อย 1 สาขา` },
          { status: 400 },
        );
      }

      // 🔴 กันซ้ำ (classCode)
      if (classCode) {
        const existing = await classes.findOne({ classCode });

        if (existing) {
          return NextResponse.json(
            {
              success: false,
              message: `รหัสวิชา ${classCode} มีอยู่แล้ว`,
            },
            { status: 400 },
          );
        }
      }

      const newClass: ClassPayload = {
        className,
        branches: [...new Set(branches)],
        createdAt: new Date(),
      };

      if (classCode) newClass.classCode = classCode;
      if (description) newClass.description = description;
      if (teacher) newClass.teacher = teacher;

      insertData.push(newClass);
    }

    const result = await classes.insertMany(insertData);

    return NextResponse.json(
      {
        success: true,
        message: `สร้างรายวิชาสำเร็จ ${result.insertedCount} รายการ`,
        data: insertData,
      },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 },
    );
  }
}