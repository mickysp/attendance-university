import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document } from "mongodb";

type ClassDoc = {
  _id: ObjectId;
  name?: string;
  className?: string;
  title?: string;
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

type SafeClassDoc = Omit<ClassDoc, "_id"> & {
  _id: string;
  hasStudents?: boolean;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const yearParam = searchParams.get("year");

    const academicYear = yearParam ? Number(yearParam) : null;

    const client = await clientPromise;
    const db = client.db("attendance");

    const classesCol = db.collection<ClassDoc>("classes");
    const scheduleCol = db.collection<ScheduleDoc>("schedule");
    const attendanceCol = db.collection<Document>("attendance");

    const data = await classesCol
      .find({})
      .project({
        name: 1,
        className: 1,
        title: 1,
        isOpen: 1,
        createdAt: 1,
      })
      .sort({ createdAt: -1 })
      .toArray();

    const safeData: SafeClassDoc[] = data.map((c) => ({
      ...c,
      _id: c._id.toString(),
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
      if (s?.allowCheckIn) allowCheckIn++;
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
      attendanceClasses.map((a) => a._id).filter((id) => id && id.length > 0),
    );

    const enrichedData: SafeClassDoc[] = safeData.map((c) => ({
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
    //console.error("API /classes error:", error);

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
