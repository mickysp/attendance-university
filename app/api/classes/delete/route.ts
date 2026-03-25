import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "กรุณาระบุ id" },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("attendance");
    const classes = db.collection("classes");

    const existing = await classes.findOne({ _id: new ObjectId(id) });

    if (!existing) {
      return NextResponse.json(
        { success: false, message: "ไม่พบข้อมูลที่ต้องการลบ" },
        { status: 404 }
      );
    }

    await classes.deleteOne({ _id: new ObjectId(id) });

    return NextResponse.json({
      success: true,
      message: "ลบรายวิชาสำเร็จ",
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: (error as Error).message },
      { status: 500 }
    );
  }
}