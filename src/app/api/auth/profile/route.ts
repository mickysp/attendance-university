import { NextResponse } from "next/server";
import { currentUser } from "@/lib/admin-auth";
import clientPromise from "@/lib/mongodb";
import { USER_PREFIXES, validEmail } from "@/lib/user-validation";

const unauthorized = () => NextResponse.json({ success: false, message: "กรุณาเข้าสู่ระบบ" }, { status: 401 });
const invalid = (message: string) => NextResponse.json({ success: false, message }, { status: 400 });

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  return NextResponse.json({
    success: true,
    data: {
      prefix: user.prefix ?? "",
      fullname: user.fullname ?? "",
      username: user.username ?? "",
      email: user.email ?? "",
      role: user.role,
      avatarUrl: user.avatarUpdatedAt ? `/api/auth/avatar?v=${new Date(user.avatarUpdatedAt).getTime()}` : null,
    },
  });
}

export async function PATCH(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return invalid("ข้อมูลไม่ถูกต้อง");
  const prefix = typeof body.prefix === "string" ? body.prefix.trim() : "";
  const fullname = typeof body.fullname === "string" ? body.fullname.trim() : "";
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!USER_PREFIXES.some((item) => item === prefix)) return invalid("กรุณาเลือกคำนำหน้า");
  if (!fullname || !username) return invalid("กรุณากรอกชื่อและชื่อผู้ใช้");
  if (!validEmail(email)) return invalid("อีเมลไม่ถูกต้อง");
  const users = (await clientPromise).db("attendance").collection("users");
  const others = { _id: { $ne: user._id } };
  if (await users.findOne({ ...others, username }, { collation: { locale: "en", strength: 2 } })) return NextResponse.json({ success: false, message: "ชื่อผู้ใช้นี้มีอยู่แล้ว" }, { status: 409 });
  if (await users.findOne({ ...others, email }, { collation: { locale: "en", strength: 2 } })) return NextResponse.json({ success: false, message: "อีเมลนี้มีอยู่แล้ว" }, { status: 409 });
  try {
    await users.updateOne({ _id: user._id }, { $set: { prefix, fullname, username, email } });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) return NextResponse.json({ success: false, message: "ชื่อผู้ใช้หรืออีเมลนี้มีอยู่แล้ว" }, { status: 409 });
    throw error;
  }
  return NextResponse.json({ success: true, message: "บันทึกข้อมูลโปรไฟล์สำเร็จ" });
}
