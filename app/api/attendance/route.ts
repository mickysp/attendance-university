import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import nodemailer from "nodemailer";
import { ObjectId } from "mongodb";

type AttendancePayload = {
  classId: string;
  className?: string;
  name?: string;
  studentId?: string;
  section?: string;
  email?: string;
  photo?: string;
  location?: {
    lat: number;
    lng: number;
  };
  createdAt: Date;
  date: string;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { classId, name, studentId, section, email, location, photo } = body;

    if (!classId) {
      return NextResponse.json(
        { success: false, message: "missing classId" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");

    const attendanceCol = db.collection("attendance");
    const classCol = db.collection("classes");

    let classData = null;

    if (ObjectId.isValid(classId)) {
      classData = await classCol.findOne({
        _id: new ObjectId(classId),
      });
    }

    if (!classData) {
      classData = await classCol.findOne({
        _id: classId,
      });
    }

    console.log("classId:", classId);
    console.log("classData:", classData);

    const className =
      classData?.name ||
      classData?.className ||
      classData?.title ||
      "ไม่พบชื่อวิชา";

    if (studentId) {
      const exist = await attendanceCol.findOne({
        classId,
        studentId,
      });

      if (exist) {
        return NextResponse.json(
          { success: false, message: "คุณเช็คชื่อแล้ว" },
          { status: 400 }
        );
      }
    }

    const newAttendance: AttendancePayload = {
      classId,
      className,
      name,
      studentId,
      section,
      email,
      photo,
      location,
      createdAt: new Date(),
      date: new Date().toISOString().split("T")[0],
    };

    await attendanceCol.insertOne(newAttendance);

    if (email) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const attachments = [];

      if (photo) {
        const base64Data = photo.split(";base64,").pop();

        attachments.push({
          filename: "photo.jpg",
          content: base64Data,
          encoding: "base64",
          cid: "userphoto",
        });
      }

      await transporter.sendMail({
        from: `"Attendance" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `เช็คชื่อสำเร็จ (${className})`,
        attachments,

        html: `
          <div style="font-family: 'Noto Sans Thai', sans-serif; max-width: 520px; margin:auto; border:1px solid #eee; border-radius:12px; overflow:hidden">
            
            <div style="background:#2563eb; color:white; padding:16px; text-align:center;">
              <h2 style="margin:0;">เช็คชื่อสำเร็จ</h2>
              <p style="margin:4px 0 0;">${className}</p>
            </div>

            <div style="padding:16px; color:#333; font-size:14px;">
              
              <p>คุณได้ทำการเช็คชื่อเรียบร้อยแล้ว</p>

              <div style="background:#f9fafb; padding:12px; border-radius:8px; margin-top:10px;">
                <p><b>ชื่อ:</b> ${name || "-"}</p>
                <p><b>รหัสนักศึกษา:</b> ${studentId || "-"}</p>
                <p><b>Section:</b> ${section || "-"}</p>
                <p><b>วันที่:</b> ${new Date().toLocaleString("th-TH")}</p>

                ${
                  location
                    ? `<p><b>ตำแหน่ง:</b> ${location.lat}, ${location.lng}</p>`
                    : ""
                }
              </div>

              ${
                photo
                  ? `
                  <div style="margin-top:16px; text-align:center;">
                    <p style="margin-bottom:8px;"><b>รูปภาพที่บันทึก</b></p>
                    <img src="cid:userphoto" style="width:200px; border-radius:8px;" />
                  </div>
                `
                  : ""
              }

            </div>

            <div style="background:#f3f4f6; text-align:center; padding:10px; font-size:12px; color:#666;">
              ระบบเช็คชื่ออัตโนมัติ
            </div>

          </div>
        `,
      });
    }

    return NextResponse.json({
      success: true,
      message: "เช็คชื่อสำเร็จ",
    });
  } catch (error) {
    console.error("ERROR:", error);

    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}