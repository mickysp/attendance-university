import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import * as XLSX from "xlsx";
import cptable from "codepage";

import type {
  StudentDocument,
  StudentClassDocument,
  StudentResultItem,
  StudentImportErrorItem,
  MajorDocument,
  IncomingStudent,
} from "@/types/students";

import type { ClassDocument } from "@/types/classes";

export const runtime = "nodejs";

XLSX.set_cptable(cptable);

const normalize = (text: unknown): string =>
  String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

const getClassName = (c: ClassDocument): string => {
  return c.className || "";
};

const getString = (value: unknown): string => {
  return typeof value === "string" || typeof value === "number"
    ? String(value).trim()
    : "";
};

const getAcademicYear = (): number => {
  return new Date().getFullYear() + 543;
};

const isValidStudentId = (id: string): boolean => {
  return /^\d{9}-\d$/.test(id);
};

const isValidName = (name: string): boolean =>
  name.trim().length >= 2 && /\p{L}/u.test(name) && !isGarbledName(name);

const isGarbledName = (name: string): boolean =>
  /[\uFFFD]/u.test(name) ||
  /(?:à¸|à¹)/u.test(name) ||
  /[\u0000-\u001F\u007F-\u009F]/u.test(name) ||
  (name.match(/(?:เธ|เน)/gu) || []).length >= 3 ||
  /[^\p{Script=Thai}\p{Script=Latin}\s.'’-]/u.test(name);

const isValidEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const normalizeHeader = (value: unknown): string =>
  getString(value)
    .normalize("NFKC")
    .toLocaleLowerCase()
    .replace(/[\p{Cf}\p{Z}\p{P}\s]/gu, "");

const headerAliases = {
  studentId: [
    "รหัสประจำตัว",
    "รหัสประจำตัวนักศึกษา",
    "รหัสนักศึกษา",
    "รหัสนศ",
    "studentid",
    "studentnumber",
  ],
  fullName: [
    "ชื่อ",
    "ชื่อสกุล",
    "ชื่อนามสกุล",
    "ชื่อและนามสกุล",
    "fullname",
    "studentname",
  ],
  email: ["kkumail", "email", "อีเมล", "อีเมล์", "emailaddress", "mail"],
};

const findColumn = (row: unknown[], aliases: string[]): number =>
  row.findIndex((cell) => {
    const header = normalizeHeader(cell);
    return aliases.some((alias) => {
      const normalizedAlias = normalizeHeader(alias);
      return (
        header === normalizedAlias ||
        (normalizedAlias.length >= 5 && header.includes(normalizedAlias))
      );
    });
  });

const normalizeStudentId = (value: unknown): string => {
  const raw = getString(value).replace(/\s/g, "");
  return /^\d{10}$/.test(raw) ? `${raw.slice(0, 9)}-${raw.slice(9)}` : raw;
};

const scoreWorkbookNames = (workbook: XLSX.WorkBook): number => {
  let score = 0;
  for (const sheetName of workbook.SheetNames) {
    const rows = XLSX.utils.sheet_to_json<unknown[]>(
      workbook.Sheets[sheetName],
      {
        header: 1,
        defval: "",
        raw: false,
      },
    );
    for (const row of rows.slice(0, 200)) {
      const idColumn = row.findIndex((cell) =>
        isValidStudentId(normalizeStudentId(cell)),
      );
      if (idColumn < 0) continue;
      const name = getString(row[idColumn + 1]);
      score += (name.match(/[\u0E00-\u0E7F]/gu) || []).length * 2;
      score -= (name.match(/[\uFFFD]/gu) || []).length * 12;
      score -= (name.match(/[\u0000-\u001F\u007F-\u009F]/gu) || []).length * 15;
      score -= (name.match(/(?:เธ|เน)/gu) || []).length * 12;
      score -=
        (name.match(/[^\p{Script=Thai}\p{Script=Latin}\s.'’-]/gu) || [])
          .length * 4;
    }
  }
  return score;
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file");

    const classId = String(formData.get("classId") ?? "");

    const section = String(formData.get("section") ?? "");

    const majorInput = String(formData.get("major") ?? "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาอัปโหลดไฟล์",
        },
        { status: 400 },
      );
    }

    if (!/\.(xlsx|xls)$/i.test(file.name)) {
      return NextResponse.json(
        { success: false, message: "รองรับเฉพาะไฟล์ .xlsx และ .xls" },
        { status: 400 },
      );
    }

    if (!classId || !ObjectId.isValid(classId)) {
      return NextResponse.json(
        {
          success: false,
          message: "classId ไม่ถูกต้อง",
        },
        { status: 400 },
      );
    }

    if (!section) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาเลือก Section",
        },
        { status: 400 },
      );
    }

    if (!majorInput) {
      return NextResponse.json(
        {
          success: false,
          message: "กรุณาระบุสาขา",
        },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const studentsCol = db.collection<StudentDocument>("students");

    const studentClassesCol =
      db.collection<StudentClassDocument>("student_classes");

    const classesCol = db.collection<ClassDocument>("classes");

    const majorsCol = db.collection<MajorDocument>("majors");

    const classObjectId = new ObjectId(classId);

    const classData = await classesCol.findOne({
      _id: classObjectId,
    });

    if (!classData) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบวิชา",
        },
        { status: 404 },
      );
    }

    const className = getClassName(classData);

    if (!className) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบชื่อวิชา",
        },
        { status: 400 },
      );
    }

    const majors = await majorsCol.find({}).toArray();

    const major = majors.find((item) =>
      normalize(item.name).includes(normalize(majorInput)),
    );

    if (!major) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบสาขา",
        },
        { status: 404 },
      );
    }

    let workbook: XLSX.WorkBook;
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const sample = buffer.subarray(0, 4096).toString("latin1").toLowerCase();
      const isTextWorkbook =
        /<html|<table|<workbook|<\?xml/.test(sample) ||
        buffer.subarray(0, 2).equals(Buffer.from([0xff, 0xfe])) ||
        buffer.subarray(0, 2).equals(Buffer.from([0xfe, 0xff])) ||
        sample.startsWith("<\0") ||
        sample.startsWith("\0<");
      const candidates: XLSX.WorkBook[] = [];
      if (isTextWorkbook) {
        for (const encoding of [
          "utf-8",
          "windows-874",
          "utf-16le",
          "utf-16be",
        ]) {
          try {
            const text = new TextDecoder(encoding).decode(buffer);
            candidates.push(XLSX.read(text, { type: "string" }));
          } catch {
            /* Try the next encoding. */
          }
        }
      } else {
        for (const codepage of [undefined, 874, 65001]) {
          try {
            candidates.push(XLSX.read(buffer, { type: "buffer", codepage }));
          } catch {
            /* Try the next codepage. */
          }
        }
      }
      if (!candidates.length) throw new Error("Unreadable workbook");
      workbook = candidates.reduce((best, candidate) =>
        scoreWorkbookNames(candidate) > scoreWorkbookNames(best)
          ? candidate
          : best,
      );
    } catch {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่สามารถอ่านไฟล์ Excel ได้ กรุณาตรวจสอบไฟล์ .xlsx หรือ .xls",
        },
        { status: 400 },
      );
    }

    if (workbook.SheetNames.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบ Sheet ในไฟล์ Excel",
        },
        { status: 400 },
      );
    }

    let sheetRows: unknown[][] = [];
    let headerIndex = -1;
    let idColumn = -1;
    let nameColumn = -1;
    let emailColumn = -1;

    for (const sheetName of workbook.SheetNames) {
      const rows = XLSX.utils.sheet_to_json<unknown[]>(
        workbook.Sheets[sheetName],
        {
          header: 1,
          defval: "",
          raw: false,
        },
      );
      for (let index = 0; index < Math.min(rows.length, 50); index++) {
        const row = rows[index];
        const foundId = findColumn(row, headerAliases.studentId);
        const foundName = findColumn(row, headerAliases.fullName);
        if (foundId < 0 || foundName < 0) continue;
        sheetRows = rows;
        headerIndex = index;
        idColumn = foundId;
        nameColumn = foundName;
        emailColumn = findColumn(row, headerAliases.email);
        break;
      }
      if (headerIndex < 0) {
        // Some exported rosters contain formatted or merged header cells.
        // Locate the first student row by its ID, then infer adjacent columns.
        for (let index = 0; index < rows.length; index++) {
          const row = rows[index];
          const foundId = row.findIndex((cell) =>
            isValidStudentId(normalizeStudentId(cell)),
          );
          if (foundId < 0) continue;
          const foundName = row.findIndex(
            (cell, column) =>
              column > foundId &&
              column <= foundId + 2 &&
              isValidName(getString(cell)) &&
              !isValidEmail(getString(cell)),
          );
          if (foundName < 0) continue;
          sheetRows = rows;
          headerIndex = index - 1;
          idColumn = foundId;
          nameColumn = foundName;
          const headerRow = rows[index - 1] ?? [];
          emailColumn = findColumn(headerRow, headerAliases.email);
          if (emailColumn < 0) {
            emailColumn = row.findIndex((cell) =>
              isValidEmail(getString(cell)),
            );
          }
          break;
        }
      }
      if (idColumn >= 0) break;
    }

    if (idColumn < 0 || nameColumn < 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "ไม่พบคอลัมน์รหัสประจำตัวและชื่อ หรือแถวข้อมูลที่มีรหัสนักศึกษารูปแบบ 123456789-0",
        },
        { status: 400 },
      );
    }

    const academicYear = getAcademicYear();

    const parsed: StudentDocument[] = [];

    const errors: StudentImportErrorItem[] = [];
    const warnings: StudentImportErrorItem[] = [];

    sheetRows.slice(headerIndex + 1).forEach((row, rowIndex) => {
      const studentId = normalizeStudentId(row[idColumn]);
      const fullName = getString(row[nameColumn]);
      const email = emailColumn >= 0 ? getString(row[emailColumn]) : "";
      if (!studentId && !fullName && !email) return;

      const student: IncomingStudent = {
        studentId,
        fullName,
        email: email || undefined,
      };

      if (!studentId || !fullName) {
        errors.push({
          student,
          message: `แถว ${headerIndex + rowIndex + 2}: รหัสประจำตัวหรือชื่อว่าง`,
        });

        return;
      }

      if (!isValidStudentId(studentId)) {
        errors.push({
          student,
          message: `แถว ${headerIndex + rowIndex + 2}: รหัสประจำตัวไม่ถูกต้อง`,
        });

        return;
      }

      if (!isValidName(fullName)) {
        errors.push({
          student,
          message: `แถว ${headerIndex + rowIndex + 2}: ชื่อไม่ถูกต้องหรืออ่านภาษาไทยไม่ได้ กรุณาตรวจสอบรูปแบบไฟล์`,
        });

        return;
      }

      const validEmail = !email || isValidEmail(email);
      if (!validEmail) {
        warnings.push({
          student,
          message: `แถว ${headerIndex + rowIndex + 2}: ข้าม kkumail หรืออีเมลที่ไม่ถูกต้อง`,
        });
      }

      parsed.push({
        studentId,
        fullName,
        email: validEmail ? email || undefined : undefined,
        section,
        major: major.name,
        academicYear,
        createdAt: new Date(),
      });
    });

    if (parsed.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "ไม่พบข้อมูลนักศึกษาที่ถูกต้อง",
          summary: {
            total: 0,
            added: 0,
            exists: 0,
            errors: errors.length,
            warnings: warnings.length,
          },
          details: [],
          errors,
        },
        { status: 400 },
      );
    }

    await Promise.all(
      parsed.map((student) =>
        studentsCol.updateOne(
          {
            studentId: student.studentId,
            academicYear,
          },
          {
            $setOnInsert: student,
          },
          {
            upsert: true,
          },
        ),
      ),
    );

    const ids = parsed.map((student) => student.studentId);

    const allStudents = await studentsCol
      .find({
        studentId: {
          $in: ids,
        },
        academicYear,
      })
      .toArray();

    const parsedById = new Map(
      parsed.map((student) => [student.studentId, student]),
    );
    await Promise.all(
      allStudents
        .filter((student) => isGarbledName(student.fullName))
        .map((student) => {
          const replacement = parsedById.get(student.studentId);
          if (!student._id || !replacement) return Promise.resolve();
          return studentsCol.updateOne(
            { _id: student._id },
            {
              $set: {
                fullName: replacement.fullName,
                ...(replacement.email ? { email: replacement.email } : {}),
              },
            },
          );
        }),
    );

    const idMap = new Map<string, ObjectId>(
      allStudents.map((student) => [student.studentId, student._id!]),
    );

    const details: StudentResultItem[] = [];

    for (const student of parsed) {
      const studentObjectId = idMap.get(student.studentId);

      if (!studentObjectId) {
        continue;
      }

      const exists = await studentClassesCol.findOne({
        studentId: studentObjectId,

        $or: [
          {
            classId: classObjectId,
            section,
          },
          {
            className,
            section,
          },
        ],
      });

      if (exists) {
        details.push({
          studentId: student.studentId,
          fullName: student.fullName,
          email: student.email,
          section: student.section,
          major: student.major,
          className,
          status: "duplicate",
          relation: "exists",
        });

        continue;
      }

      await studentClassesCol.insertOne({
        studentId: studentObjectId,
        classId: classObjectId,
        className,
        section,
        academicYear,
        createdAt: new Date(),
      });

      details.push({
        studentId: student.studentId,
        fullName: student.fullName,
        email: student.email,
        section: student.section,
        major: student.major,
        className,
        status: "created",
        relation: "added",
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "นำเข้าข้อมูลสำเร็จ",

        summary: {
          total: parsed.length,
          added: details.filter((item) => item.relation === "added").length,
          exists: details.filter((item) => item.relation === "exists").length,
          errors: errors.length,
          warnings: warnings.length,
        },

        details,

        errors,
        warnings,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      },
      { status: 500 },
    );
  }
}
