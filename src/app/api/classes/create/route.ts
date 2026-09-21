import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

import type { IncomingClass, ClassDocument } from "@/types/classes";

export async function POST(req: Request) {
  try {
    const body: IncomingClass | IncomingClass[] = await req.json();

    const classList: IncomingClass[] = Array.isArray(body) ? body : [body];

    if (classList.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูลวิชา",
        },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const classes = db.collection<ClassDocument>("classes");

    const insertData: ClassDocument[] = [];


    for (const item of classList) {
      const { className, classCodes, teachers, description } = item;

      if (!className?.trim()) {
        return NextResponse.json(
          {
            success: false,
            message: "กรุณากรอกชื่อวิชา",
          },
          { status: 400 },
        );
      }

      if (!Array.isArray(classCodes) || classCodes.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: `วิชา ${className} ต้องมีรหัสวิชาอย่างน้อย 1 รหัส`,
          },
          { status: 400 },
        );
      }

      const normalizedClassCodes = Array.from(
        new Set(
          classCodes
            .filter((code): code is string => typeof code === "string")
            .map((code) => code.trim())
            .filter(Boolean),
        ),
      );

      if (normalizedClassCodes.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: `วิชา ${className} ต้องมีรหัสวิชาอย่างน้อย 1 รหัส`,
          },
          { status: 400 },
        );
      }

      if (!Array.isArray(teachers) || teachers.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: `วิชา ${className} ต้องมีอาจารย์ผู้สอนอย่างน้อย 1 คน`,
          },
          { status: 400 },
        );
      }

      const normalizedTeachers = teachers
        .filter(
          (teacher) =>
            teacher &&
            typeof teacher === "object" &&
            typeof teacher._id === "string" &&
            teacher._id.trim() !== "",
        )
        .map((teacher) => ({
          _id: teacher._id.trim(),
          name: typeof teacher.name === "string" ? teacher.name.trim() : "",
        }));

      if (normalizedTeachers.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: `วิชา ${className} ต้องมีข้อมูลอาจารย์ผู้สอน`,
          },
          { status: 400 },
        );
      }

      const duplicateCodes = normalizedClassCodes.filter(
        (code, index, array) => array.indexOf(code) !== index,
      );

      if (duplicateCodes.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: `รหัสวิชาซ้ำ: ${duplicateCodes.join(", ")}`,
          },
          { status: 400 },
        );
      }

      const existingClass = await classes.findOne({
        classCodes: {
          $in: normalizedClassCodes,
        },
      });

      if (existingClass) {
        const duplicateCode = existingClass.classCodes.find((code) =>
          normalizedClassCodes.includes(code),
        );

        return NextResponse.json(
          {
            success: false,
            message: `รหัสวิชา ${duplicateCode ?? ""} มีอยู่แล้ว`,
          },
          { status: 400 },
        );
      }

      const newClass: ClassDocument = {
        className: className.trim(),
        classCodes: normalizedClassCodes,
        teachers: normalizedTeachers,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (typeof description === "string" && description.trim()) {
        newClass.description = description.trim();
      }

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
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการสร้างรายวิชา",
      },
      { status: 500 },
    );
  }
}
