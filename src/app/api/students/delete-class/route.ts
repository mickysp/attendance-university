import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import type { StudentClassDocument, StudentDocument } from "@/types/students";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId") || "";
    const year = Number(searchParams.get("year"));
    if (!ObjectId.isValid(classId) || !Number.isInteger(year) || year < 2400) {
      return NextResponse.json(
        { success: false, message: "กรุณาเลือกวิชาและปีการศึกษาที่ถูกต้อง" },
        { status: 400 },
      );
    }

    const db = (await clientPromise).db("attendance");
    const students = db.collection<StudentDocument>("students");
    const relations = db.collection<StudentClassDocument>("student_classes");
    const classObjectId = new ObjectId(classId);
    const selectedClass = await db
      .collection("classes")
      .findOne({ _id: classObjectId });
    if (!selectedClass) {
      return NextResponse.json(
        { success: false, message: "ไม่พบรายวิชา" },
        { status: 404 },
      );
    }

    const yearStudents = await students
      .find({ academicYear: year }, { projection: { _id: 1 } })
      .toArray();
    const studentIds = yearStudents.flatMap((student) =>
      student._id ? [student._id] : [],
    );
    if (!studentIds.length) {
      return NextResponse.json({
        success: true,
        deletedRelations: 0,
        deletedStudents: 0,
      });
    }

    const targetRelations = await relations
      .find(
        {
          classId: { $in: [classObjectId, classId] },
          studentId: { $in: [...studentIds, ...studentIds.map(String)] },
        },
        { projection: { _id: 1, studentId: 1 } },
      )
      .toArray();
    const relationIds = targetRelations.flatMap((relation) =>
      relation._id ? [relation._id] : [],
    );
    if (!relationIds.length) {
      return NextResponse.json({
        success: true,
        deletedRelations: 0,
        deletedStudents: 0,
      });
    }

    const deletedRelations = await relations.deleteMany({
      _id: { $in: relationIds },
    });
    const affectedIds = [
      ...new Set(targetRelations.map((relation) => String(relation.studentId))),
    ].map((id) => new ObjectId(id));
    const remaining = await relations
      .find(
        {
          studentId: { $in: [...affectedIds, ...affectedIds.map(String)] },
        },
        { projection: { studentId: 1 } },
      )
      .toArray();
    const stillEnrolled = new Set(
      remaining.map((relation) => String(relation.studentId)),
    );
    const orphanIds = affectedIds.filter(
      (id) => !stillEnrolled.has(String(id)),
    );
    const deletedStudents = orphanIds.length
      ? await students.deleteMany({
          _id: { $in: orphanIds },
          academicYear: year,
        })
      : { deletedCount: 0 };

    return NextResponse.json({
      success: true,
      deletedRelations: deletedRelations.deletedCount,
      deletedStudents: deletedStudents.deletedCount,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "ลบรายชื่อไม่สำเร็จ" },
      { status: 500 },
    );
  }
}
