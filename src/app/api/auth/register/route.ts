import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { success: false, message: "ปิดการสมัครสมาชิกด้วยตนเอง กรุณาติดต่ออาจารย์เพื่อเพิ่มบัญชี" },
    { status: 403 },
  );
}
