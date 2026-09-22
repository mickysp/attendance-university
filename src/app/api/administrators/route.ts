import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { currentUser } from "@/lib/admin-auth";

const roles = ["Teacher", "Teaching Assistant"];
const forbidden = () => NextResponse.json({ success: false, message: "ไม่มีสิทธิ์จัดการผู้ใช้" }, { status: 403 });
const invalid = (message: string) => NextResponse.json({ success: false, message }, { status: 400 });

export async function GET() {
  const actor = await currentUser();
  if (!actor || actor.role !== "Teacher") return forbidden();
  const users = await (await clientPromise).db("attendance").collection("users")
    .find({}, { projection: { password: 0 } }).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({ success: true, data: users.map((user) => ({ ...user, _id: String(user._id) })), currentUserId: String(actor._id) });
}

export async function POST(req: Request) {
  const actor = await currentUser();
  if (!actor || actor.role !== "Teacher") return forbidden();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return invalid("ข้อมูลไม่ถูกต้อง");
  const prefix = typeof body.prefix === "string" ? body.prefix.trim() : "";
  const fullname = typeof body.fullname === "string" ? body.fullname.trim() : "";
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = body.password;
  if (!prefix || !fullname || !username || !email || typeof password !== "string" || password.length < 8 || !roles.includes(body.role)) return invalid("กรอกข้อมูลให้ครบ รหัสผ่านอย่างน้อย 8 ตัวอักษร และเลือกสิทธิ์ที่ถูกต้อง");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return invalid("อีเมลไม่ถูกต้อง");
  const users = (await clientPromise).db("attendance").collection("users");
  if (await users.findOne({ $or: [{ username }, { email }] })) return NextResponse.json({ success: false, message: "ชื่อผู้ใช้หรืออีเมลนี้มีอยู่แล้ว" }, { status: 409 });
  await users.insertOne({ prefix, fullname, username, email, password: await bcrypt.hash(password, 10), role: body.role, createdAt: new Date() });
  return NextResponse.json({ success: true, message: "เพิ่มผู้ใช้สำเร็จ" }, { status: 201 });
}

export async function PATCH(req: Request) {
  const actor = await currentUser();
  if (!actor || actor.role !== "Teacher") return forbidden();
  const body = await req.json().catch(() => null);
  if (!body || !ObjectId.isValid(body.id ?? "") || !roles.includes(body.role)) return invalid("ข้อมูลไม่ถูกต้อง");
  if (String(actor._id) === body.id) return invalid("ไม่สามารถแก้ไขสิทธิ์ของตนเอง");
  const result = await (await clientPromise).db("attendance").collection("users").updateOne({ _id: new ObjectId(body.id) }, { $set: { role: body.role } });
  if (!result.matchedCount) return NextResponse.json({ success: false, message: "ไม่พบผู้ใช้" }, { status: 404 });
  return NextResponse.json({ success: true, message: "แก้ไขสิทธิ์สำเร็จ" });
}

export async function DELETE(req: Request) {
  const actor = await currentUser();
  if (!actor || actor.role !== "Teacher") return forbidden();
  const body = await req.json().catch(() => null);
  if (!body || !ObjectId.isValid(body.id ?? "")) return invalid("ข้อมูลไม่ถูกต้อง");
  if (String(actor._id) === body.id) return invalid("ไม่สามารถลบบัญชีของตนเอง");
  const result = await (await clientPromise).db("attendance").collection("users").deleteOne({ _id: new ObjectId(body.id) });
  if (!result.deletedCount) return NextResponse.json({ success: false, message: "ไม่พบผู้ใช้" }, { status: 404 });
  return NextResponse.json({ success: true, message: "ลบผู้ใช้สำเร็จ" });
}
