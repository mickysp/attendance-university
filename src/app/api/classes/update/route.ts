import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { currentUser } from "@/lib/admin-auth";
import { recordActivity } from "@/lib/activity-log";
import { ObjectId } from "mongodb";

import type { ClassDocument, Teacher } from "@/types/classes";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getTeacherSignature = (teachers: Teacher[] = []) =>
  [...teachers]
    .map((teacher) => `${teacher._id}|${teacher.name ?? ""}`)
    .sort()
    .join(";");

type UpdateClassPayload = {
  className?: string;
  classCodes?: string[];
  teachers?: Teacher[];
  description?: string;
  updatedAt: Date;
};

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาระบุ id",
        },
        { status: 400 },
      );
    }

    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "รูปแบบ id ไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    const body: Partial<ClassDocument> = await req.json();

    const { className, classCodes, teachers, description } = body;

    const client = await clientPromise;

    const db = client.db("attendance");

    const classes = db.collection<ClassDocument>("classes");

    const objectId = new ObjectId(id);

    const existing = await classes.findOne({
      _id: objectId,
    });

    if (!existing) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูลที่ต้องการแก้ไข",
        },
        { status: 404 },
      );
    }

    const updateData: UpdateClassPayload = {
      updatedAt: new Date(),
    };

    if (className !== undefined) {
      if (typeof className !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "ชื่อวิชาไม่ถูกต้อง",
          },
          { status: 400 },
        );
      }

      const trimmedClassName = className.trim();

      if (!trimmedClassName) {
        return NextResponse.json(
          {
            success: false,
            message: "กรุณากรอกชื่อวิชา",
          },
          { status: 400 },
        );
      }

      updateData.className = trimmedClassName;
    }

    if (classCodes !== undefined) {
      if (!Array.isArray(classCodes)) {
        return NextResponse.json(
          {
            success: false,
            message: "รหัสวิชาไม่ถูกต้อง",
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
            message: "วิชาต้องมีรหัสวิชาอย่างน้อย 1 รหัส",
          },
          { status: 400 },
        );
      }

      const duplicateClass = await classes.findOne({
        _id: {
          $ne: objectId,
        },

        classCodes: {
          $in: normalizedClassCodes,
        },
      });

      if (duplicateClass) {
        const duplicateCode = duplicateClass.classCodes.find((code) =>
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

      updateData.classCodes = normalizedClassCodes;
    }

    if (teachers !== undefined) {
      if (!Array.isArray(teachers)) {
        return NextResponse.json(
          {
            success: false,
            message: "ข้อมูลอาจารย์ไม่ถูกต้อง",
          },
          { status: 400 },
        );
      }

      if (teachers.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "วิชาต้องมีอาจารย์ผู้สอนอย่างน้อย 1 คน",
          },
          { status: 400 },
        );
      }

      const normalizedTeachers: Teacher[] = teachers
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
            message: "กรุณาเลือกอาจารย์ผู้สอนอย่างน้อย 1 คน",
          },
          { status: 400 },
        );
      }

      updateData.teachers = normalizedTeachers;
    }

    if (description !== undefined) {
      if (typeof description !== "string") {
        return NextResponse.json(
          {
            success: false,
            message: "รายละเอียดไม่ถูกต้อง",
          },
          { status: 400 },
        );
      }

      updateData.description = description.trim();
    }

    const nextClassName =
      className !== undefined ? className.trim() : existing.className.trim();
    const nextClassCodes =
      classCodes !== undefined
        ? Array.from(
            new Set(
              classCodes
                .filter((code): code is string => typeof code === "string")
                .map((code) => code.trim())
                .filter(Boolean),
            ),
          )
        : existing.classCodes;
    const nextTeachers =
      teachers !== undefined
        ? teachers
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
            }))
        : existing.teachers;
    const nextDescription =
      description !== undefined
        ? description.trim()
        : (existing.description ?? "").trim();

    const duplicateExistingClass = await classes.findOne({
      _id: { $ne: objectId },
      className: {
        $regex: `^${escapeRegExp(nextClassName)}$`,
        $options: "i",
      },
    });

    if (duplicateExistingClass) {
      const sameCodes =
        duplicateExistingClass.classCodes.length === nextClassCodes.length &&
        nextClassCodes.every((code) => duplicateExistingClass.classCodes.includes(code));
      const sameTeachers =
        getTeacherSignature(duplicateExistingClass.teachers) ===
        getTeacherSignature(nextTeachers);
      const sameDescription =
        (duplicateExistingClass.description ?? "").trim() === nextDescription;

      if (sameCodes && sameTeachers && sameDescription) {
        return NextResponse.json(
          {
            success: false,
            message: "ข้อมูลวิชานี้มีอยู่ในระบบแล้ว ไม่สามารถบันทึกซ้ำได้",
          },
          { status: 400 },
        );
      }
    }

    const result = await classes.updateOne(
      {
        _id: objectId,
      },
      {
        $set: updateData,
      },
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่สามารถอัปเดตรายวิชาได้",
        },
        { status: 500 },
      );
    }
    const actor = await currentUser();
    if (actor) {
      const targetName =
        typeof updateData.className === "string"
          ? updateData.className
          : existing.className;
      await recordActivity({
        actor,
        category: "classes",
        action: "update",
        message: `แก้ไขชั้นเรียน “${targetName}”`,
        target: targetName,
        targetId: String(existing._id),
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "อัปเดตรายวิชาสำเร็จ",
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการอัปเดตรายวิชา",
      },
      { status: 500 },
    );
  }
}
