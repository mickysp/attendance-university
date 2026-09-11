import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

import type {
  ClassResponse,
  MongoClassDocument,
  Teacher,
} from "@/types/classes";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("attendance");

    const classesCol = db.collection<MongoClassDocument>("classes");

    const studentClassesCol = db.collection<{
      _id?: import("mongodb").ObjectId;
      studentId: import("mongodb").ObjectId | string;
      classId: import("mongodb").ObjectId | string;
      offeringId: import("mongodb").ObjectId | string;
      createdAt?: Date;
      updatedAt?: Date;
    }>("student_classes");

    const classes = await classesCol
      .find({})
      .project<MongoClassDocument>({
        className: 1,
        classCodes: 1,
        teachers: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
      })
      .sort({
        createdAt: -1,
      })
      .toArray();

    if (classes.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: [],
        },
        {
          status: 200,
        },
      );
    }

    const classIds = classes.map((item) => item._id);

    const studentCounts = await studentClassesCol
      .aggregate<{
        _id: import("mongodb").ObjectId | string;
        count: number;
      }>([
        {
          $match: {
            classId: {
              $in: classIds,
            },
          },
        },
        {
          $group: {
            _id: "$classId",
            count: {
              $sum: 1,
            },
          },
        },
      ])
      .toArray();

    const studentCountMap = new Map<string, number>();

    studentCounts.forEach((item) => {
      studentCountMap.set(String(item._id), item.count);
    });

    const data: ClassResponse[] = classes.map((item) => {
      const teachers: Teacher[] = Array.isArray(item.teachers)
        ? item.teachers
            .filter(
              (teacher) =>
                teacher &&
                typeof teacher === "object" &&
                typeof teacher._id !== "undefined",
            )
            .map((teacher) => ({
              _id: String(teacher._id),
              name: typeof teacher.name === "string" ? teacher.name : "",
            }))
        : [];

      const studentCount = studentCountMap.get(String(item._id)) ?? 0;

      const isOpened = studentCount > 0;

      return {
        _id: item._id.toString(),
        className: typeof item.className === "string" ? item.className : "",
        classCodes: Array.isArray(item.classCodes) ? item.classCodes : [],
        teachers,
        description:
          typeof item.description === "string" ? item.description : undefined,
        studentCount,
        isOpened,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data,
      },
      {
        status: 200,
      },
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "เกิดข้อผิดพลาด";

    return NextResponse.json(
      {
        success: false,
        data: [],
        message,
      },
      {
        status: 500,
      },
    );
  }
}
