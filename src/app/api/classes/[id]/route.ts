import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { getTeacherNames } from "@/lib/teacher-names";
import { ObjectId } from "mongodb";

import type { ClassDocument, ClassResponse, Teacher } from "@/types/classes";

export async function GET(
  req: Request,
  context: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  try {
    const { id: paramsId } = await context.params;

    const url = new URL(req.url);

    const queryId = url.searchParams.get("id");

    const id = paramsId || queryId;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "id ไม่ถูกต้อง",
          id,
        },
        {
          status: 400,
        },
      );
    }

    const client = await clientPromise;

    const db = client.db("attendance");

    const classes = db.collection<ClassDocument>("classes");

    const studentClasses = db.collection<{
      _id?: ObjectId;
      studentId: ObjectId | string;
      classId: ObjectId | string;
      offeringId: ObjectId | string;
      createdAt?: Date;
      updatedAt?: Date;
    }>("student_classes");

    const classObjectId = new ObjectId(id);

    const data = await classes.findOne({
      _id: classObjectId,
    });

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูลรายวิชา",
        },
        {
          status: 404,
        },
      );
    }

    const studentCount = await studentClasses.countDocuments({
      classId: classObjectId,
    });

    const isOpened = studentCount > 0;

    const teacherNames = await getTeacherNames(db,
      Array.isArray(data.teachers) ? data.teachers.map((teacher) => String(teacher?._id)) : [],
    );

    const teachers: Teacher[] = Array.isArray(data.teachers)
      ? data.teachers
          .filter(
            (teacher) =>
              teacher &&
              typeof teacher === "object" &&
              typeof teacher._id !== "undefined",
          )
          .map((teacher) => ({
            _id: String(teacher._id),
            name: teacherNames.get(String(teacher._id).toLowerCase())
              ?? (typeof teacher.name === "string" ? teacher.name : ""),
          }))
      : [];

    const responseData: ClassResponse = {
      _id: data._id.toString(),
      className: typeof data.className === "string" ? data.className : "",
      classCodes: Array.isArray(data.classCodes) ? data.classCodes : [],
      teachers,
      description:
        typeof data.description === "string" ? data.description : undefined,
      studentCount,
      isOpened,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };

    return NextResponse.json(
      {
        success: true,
        data: responseData,
      },
      {
        status: 200,
      },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "เกิดข้อผิดพลาดในการดึงข้อมูลรายวิชา",
      },
      {
        status: 500,
      },
    );
  }
}
