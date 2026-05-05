import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document } from "mongodb";

type MongoBranch = {
  _id: ObjectId;
  name?: string;
};

type MongoTeacher = {
  _id: ObjectId;
  name?: string;
};

type MongoClass = {
  _id: ObjectId;
  className?: string;
  classCode?: string;
  branches?: MongoBranch[];
  teacher?: MongoTeacher;
  isOpen?: boolean;
  createdAt?: Date;
};

type ScheduleDoc = {
  classId?: string;
  allowCheckIn?: boolean;
};

type AttendanceAgg = {
  _id: string;
};

type Branch = {
  _id: string;
  name: string;
};

type Teacher = {
  _id: string;
  name: string;
};

type ClassResponse = {
  _id: string;
  className: string;
  classCode: string;
  teacher?: Teacher;
  branches: Branch[];
  isOpen?: boolean;
  createdAt?: Date;
  hasStudents?: boolean;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");
    const academicYear = yearParam ? Number(yearParam) : null;

    const client = await clientPromise;
    const db = client.db("attendance");

    const classesCol = db.collection<MongoClass>("classes");
    const scheduleCol = db.collection<ScheduleDoc>("schedule");
    const attendanceCol = db.collection<Document>("attendance");

    const data = await classesCol
      .find({})
      .project({
        className: 1,
        classCode: 1,
        branches: 1,
        teacher: 1,
        isOpen: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .toArray();

    const safeData: ClassResponse[] = data.map((c) => ({
      _id: c._id.toString(),
      className: c.className ?? "",
      classCode: c.classCode ?? "",

      teacher: c.teacher
        ? {
            _id: c.teacher._id.toString(),
            name: c.teacher.name ?? "",
          }
        : undefined,

      branches: Array.isArray(c.branches)
        ? c.branches.map((b) => ({
            _id: b._id.toString(),
            name: b.name ?? "",
          }))
        : [],

      isOpen: c.isOpen,
      createdAt: c.createdAt,
    }));

    let openClasses = 0;
    let closedClasses = 0;

    safeData.forEach((c) => {
      if (c.isOpen) openClasses++;
      else closedClasses++;
    });

    const schedules = await scheduleCol.find({}).toArray();

    let allowCheckIn = 0;
    let notAllowCheckIn = 0;

    schedules.forEach((s) => {
      if (s.allowCheckIn) allowCheckIn++;
      else notAllowCheckIn++;
    });

    const attendanceClasses = await attendanceCol
      .aggregate<AttendanceAgg>([
        {
          $match: {
            ...(academicYear ? { academicYear } : {}),
            classId: { $ne: null },
          },
        },
        {
          $group: {
            _id: { $toString: "$classId" },
          },
        },
      ])
      .toArray();

    const classIdSet = new Set(
      attendanceClasses.map((a) => a._id).filter(Boolean),
    );

    const enrichedData: ClassResponse[] = safeData.map((c) => ({
      ...c,
      hasStudents: classIdSet.has(c._id),
    }));

    return NextResponse.json(
      {
        success: true,
        summary: {
          totalClasses: safeData.length,
          openClasses,
          closedClasses,
          allowCheckIn,
          notAllowCheckIn,
        },
        data: enrichedData,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("API ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : "error",
      },
      { status: 500 },
    );
  }
}