import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId, Document } from "mongodb";

type ThaiStatus =
  | "มาเรียน"
  | "มาสาย"
  | "ลา"
  | "ขาด"
  | "ยังไม่เช็คชื่อ";

const getAcademicYear = () => new Date().getFullYear() + 543;

// helper: แปลง HH:mm → Date
const toDateTime = (dateStr: string, timeStr: string) => {
  return new Date(`${dateStr}T${timeStr}:00`);
};

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
    const sessionsCol = db.collection<Document>("sessions");

    const classFilter = ObjectId.isValid(classId)
      ? new ObjectId(classId)
      : classId;

    // ✅ 1. ดึง session ทั้งหมดของวิชา
    const sessions = await sessionsCol
      .find({
        classId: classFilter,
        academicYear,
      })
      .toArray();

    // ✅ 2. ดึง attendance ของวิชานี้
    const attendanceList = await attendanceCol
      .find({
        classId: classFilter,
        academicYear,
      })
      .toArray();

    // ✅ 3. ดึง student
    const students = await studentsCol
      .find({ academicYear })
      .toArray();

    // map attendance ตาม student + session
    const attendanceMap = new Map<string, Document>();

    attendanceList.forEach((a) => {
      const key = `${a.studentId}_${a.sessionId}`;
      attendanceMap.set(key, a);
    });

    const now = new Date();

    const result = students.map((s) => {
      let totalScore = 0;
      let days = 0;
      let lastStatus: ThaiStatus = "ยังไม่เช็คชื่อ";

      sessions.forEach((session) => {
        if (session.status === "cancelled") return;

        const key = `${s.studentId}_${session._id}`;
        const record = attendanceMap.get(key);

        const closeTime = toDateTime(
          session.date,
          session.checkInClose
        );

        const lateTime = toDateTime(
          session.date,
          session.lateAfter
        );

        let status: ThaiStatus = "ยังไม่เช็คชื่อ";

        if (record) {
          const checkInTime = new Date(record.checkInTime);

          if (checkInTime <= lateTime) {
            status = "มาเรียน";
          } else if (checkInTime <= closeTime) {
            status = "มาสาย";
          } else {
            status = "ขาด";
          }

          totalScore += record.score || 0;
          days++;
        } else {
          // ❗ ยังไม่เช็คชื่อ → ต้องดูเวลา
          if (now > closeTime) {
            status = "ขาด"; // ✅ ปิดแล้ว = ขาด
            days++;
          } else {
            status = "ยังไม่เช็คชื่อ"; // ✅ ยังไม่ถึงเวลา
          }
        }

        lastStatus = status;
      });

      return {
        studentId: s.studentId,
        name: s.fullName,
        section: s.section || "-",
        major: s.major || "-",

        status: lastStatus,
        totalScore,
        days,
        averageScore: days > 0 ? totalScore / days : 0,
      };
    });

    const majorsByClass = [
      ...new Set(
        result
          .map((r) => r.major)
          .filter((m) => m && m !== "-")
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