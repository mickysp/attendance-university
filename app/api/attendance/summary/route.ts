import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document } from "mongodb";

type ThaiStatus =
  | "มาเรียน"
  | "มาสาย"
  | "ลา"
  | "ขาด"
  | "ยังไม่เช็คชื่อ";

type AttendanceSummary = {
  studentId: string;
  name: string;
  section: string;
  major: string;
  status: ThaiStatus;
  score: number;
  checkInTime: string | null;
  totalScore: number;
  days: number;
  averageScore: number;
};

const getAcademicYear = () => new Date().getFullYear() + 543;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const classId = searchParams.get("classId");
    const yearParam = searchParams.get("year");

    if (!classId) {
      return NextResponse.json({
        success: false,
        message: "missing classId",
        data: [],
        majorsByClass: [],
      });
    }

    const academicYear = yearParam
      ? Number(yearParam)
      : getAcademicYear();

    const client = await clientPromise;
    const db = client.db("attendance");

    const attendanceCol = db.collection<Document>("attendance");
    const studentsCol = db.collection<Document>("students");

    const classFilter = ObjectId.isValid(classId)
      ? new ObjectId(classId)
      : classId;

    const attendanceSummary = await attendanceCol
      .aggregate<AttendanceSummary>([
        {
          $match: {
            classId: classFilter,
            academicYear,
          },
        },
        {
          $sort: { checkInTime: 1 },
        },
        {
          $group: {
            _id: "$studentId",
            totalScore: { $sum: { $ifNull: ["$score", 0] } },
            days: { $sum: 1 },
            lastStatus: { $last: "$status" },
            lastCheckInTime: { $last: "$checkInTime" },
            lastCheckInHour: { $last: "$checkInHour" },
          },
        },
        {
          $lookup: {
            from: "students",
            let: { studentId: "$_id" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$studentId", "$$studentId"] },
                      { $eq: ["$academicYear", academicYear] },
                    ],
                  },
                },
              },
            ],
            as: "student",
          },
        },
        {
          $unwind: "$student",
        },
        {
          $project: {
            _id: 0,
            studentId: "$_id",
            name: "$student.fullName",
            section: { $ifNull: ["$student.section", "-"] },
            major: { $ifNull: ["$student.major", "-"] },

            status: {
              $ifNull: ["$lastStatus", "ยังไม่เช็คชื่อ"],
            },

            score: { $ifNull: ["$totalScore", 0] },

            checkInTime: {
              $cond: [
                { $ifNull: ["$lastCheckInHour", false] },
                "$lastCheckInHour",
                {
                  $cond: [
                    { $ifNull: ["$lastCheckInTime", false] },
                    {
                      $dateToString: {
                        format: "%H:%M",
                        date: "$lastCheckInTime",
                      },
                    },
                    null,
                  ],
                },
              ],
            },

            totalScore: 1,
            days: 1,

            averageScore: {
              $cond: [
                { $gt: ["$days", 0] },
                { $divide: ["$totalScore", "$days"] },
                0,
              ],
            },
          },
        },
      ])
      .toArray();

    const summaryMap = new Map<string, AttendanceSummary>();
    attendanceSummary.forEach((a) => {
      summaryMap.set(a.studentId, a);
    });

    const students = await studentsCol
      .find({ academicYear })
      .toArray();

    const result: AttendanceSummary[] = students.map((s) => {
      const summary = summaryMap.get(s.studentId);

      return (
        summary ?? {
          studentId: s.studentId,
          name: s.fullName,
          section: s.section || "-",
          major: s.major || "-",

          status: "ยังไม่เช็คชื่อ",
          score: 0,
          checkInTime: null,
          totalScore: 0,
          days: 0,
          averageScore: 0,
        }
      );
    });

    const majorsByClass: string[] = [
      ...new Set(
        result
          .map((r) => r.major)
          .filter((m): m is string => Boolean(m && m !== "-")),
      ),
    ];

    return NextResponse.json({
      success: true,
      academicYear,
      data: result,
      majorsByClass,
    });
  } catch (error) {
    console.error("attendance summary error:", error);

    return NextResponse.json(
      {
        success: false,
        data: [],
        majorsByClass: [],
        message:
          error instanceof Error ? error.message : "error",
      },
      { status: 500 }
    );
  }
}