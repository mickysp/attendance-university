import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

type FormConfig = {
  classId: string;
  type: "config";
  config: {
    name: boolean;
    studentId: boolean;
    email: boolean;
    section: boolean;
    photo: boolean;
    location: boolean;
  };
  updatedAt: Date;
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { classId, config } = body;

    if (!classId) {
      return NextResponse.json(
        { success: false, message: "missing classId" },
        { status: 400 },
      );
    }

    if (!config) {
      return NextResponse.json(
        { success: false, message: "missing config" },
        { status: 400 },
      );
    }

    if (typeof config.name !== "boolean") {
      return NextResponse.json(
        { success: false, message: "invalid config" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");
    const checkIn = db.collection("checkIn");

    const newConfig: FormConfig = {
      classId,
      type: "config",
      config,
      updatedAt: new Date(),
    };

    await checkIn.updateOne(
      { classId, type: "config" },
      { $set: newConfig },
      { upsert: true },
    );

    return NextResponse.json({
      success: true,
      message: "บันทึก config สำเร็จ",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");

    if (!classId) {
      return NextResponse.json(
        { success: false, message: "missing classId" },
        { status: 400 },
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");
    const checkIn = db.collection("checkIn");

    const config = await checkIn.findOne({
      classId,
      type: "config",
    });

    return NextResponse.json({
      success: true,
      config: config?.config || null,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 },
    );
  }
}
