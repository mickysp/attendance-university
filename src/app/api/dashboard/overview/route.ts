import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { currentUser } from "@/lib/admin-auth";

type ThaiStatus = "มาเรียน" | "มาสาย" | "ลา";

type AttendanceDoc = {
  classId: unknown;
  studentId: string;
  name?: string;
  className?: string;
  status: ThaiStatus;
  score?: number;
  date: string;
  checkInHour?: string;
  createdAt?: Date;
  academicYear: number;
};

export async function GET(req: Request) {
  try {
    const user = await currentUser();
    if (!user)
      return NextResponse.json(
        { success: false, message: "กรุณาเข้าสู่ระบบ" },
        { status: 401 },
      );
    const { searchParams } = new URL(req.url);

    const currentAcademicYear =
      Number(
        new Intl.DateTimeFormat("en-US", {
          year: "numeric",
          timeZone: "Asia/Bangkok",
        }).format(new Date()),
      ) + 543;
    const requestedYear = Number(searchParams.get("year"));
    const academicYear =
      Number.isFinite(requestedYear) && requestedYear > 0
        ? requestedYear
        : currentAcademicYear;

    const client = await clientPromise;
    const db = client.db("attendance");

    const attendanceCol = db.collection<AttendanceDoc>("attendance");
    const classesCol = db.collection("classes");
    const studentClassesCol = db.collection("student_classes");

    const [attendanceYears, totalClasses, enrolledStudentIds] =
      await Promise.all([
        attendanceCol.distinct("academicYear"),
        classesCol.countDocuments(),
        studentClassesCol.distinct("studentId", { academicYear }),
      ]);
    const years = [
      ...new Set([
        currentAcademicYear,
        ...attendanceYears.filter(
          (year): year is number => typeof year === "number",
        ),
      ]),
    ].sort((a, b) => b - a);

    const records = await attendanceCol
      .find({
        academicYear,
      })
      .sort({ date: -1, createdAt: -1 })
      .toArray();

    let present = 0;
    let late = 0;
    let leave = 0;

    records.forEach((r) => {
      if (r.status === "มาเรียน") present++;
      if (r.status === "มาสาย") late++;
      if (r.status === "ลา") leave++;
    });

    const total = records.length;

    const studentMap = new Map<
      string,
      { name?: string; total: number; present: number; score: number }
    >();

    records.forEach((r) => {
      if (!studentMap.has(r.studentId)) {
        studentMap.set(r.studentId, {
          name: r.name,
          total: 0,
          present: 0,
          score: 0,
        });
      }

      const s = studentMap.get(r.studentId)!;

      s.total++;
      if (r.status === "มาเรียน") s.present++;
      s.score += r.score ?? 0;
    });

    const students = Array.from(studentMap.entries()).map(([studentId, s]) => {
      const percent = (s.present / s.total) * 100;

      return {
        studentId,
        name: s.name,
        total: s.total,
        present: s.present,
        percent,
        score: s.score,
      };
    });

    const riskStudents = students.filter((s) => s.percent < 60);

    const avgScore =
      students.reduce((sum, s) => sum + s.score, 0) / (students.length || 1);

    const avgPercent =
      students.reduce((sum, s) => sum + s.percent, 0) / (students.length || 1);

    const recentActivity = records.slice(0, 6).map((record) => ({
      studentId: record.studentId,
      name: record.name || "ไม่ระบุชื่อ",
      className: record.className || "ไม่ระบุวิชา",
      status: record.status,
      date: record.date,
      time: record.checkInHour || "-",
    }));

    return NextResponse.json({
      success: true,
      academicYear,
      years,
      totalClasses,
      totalStudents: enrolledStudentIds.length,
      totalRecords: total,

      summary: {
        present,
        late,
        leave,
      },

      average: {
        score: avgScore,
        percent: avgPercent,
      },

      riskStudents,

      students,
      recentActivity,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      },
      { status: 500 },
    );
  }
}
