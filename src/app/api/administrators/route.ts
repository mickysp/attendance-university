import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import clientPromise from "@/lib/mongodb";
import { currentUser } from "@/lib/admin-auth";
import { recordActivity } from "@/lib/activity-log";
import { USER_PREFIXES, validEmail, validPassword } from "@/lib/user-validation";

const roles = ["Teacher", "Teaching Assistant"];
const forbidden = () => NextResponse.json({ success: false, message: "ไม่มีสิทธิ์จัดการผู้ใช้" }, { status: 403 });
const invalid = (message: string) => NextResponse.json({ success: false, message }, { status: 400 });

export async function GET() {
  const actor = await currentUser();
  if (!actor || !roles.includes(actor.role)) return forbidden();
  const users = await (await clientPromise).db("attendance").collection("users")
    .find({}, { projection: { password: 0 } }).sort({ createdAt: -1 }).toArray();
  return NextResponse.json({ success: true, data: users.map((user) => ({ ...user, _id: String(user._id) })), currentUserId: String(actor._id), canManage: actor.role === "Teacher", canCreate: true });
}

export async function POST(req: Request) {
  const actor = await currentUser();
  if (!actor || !roles.includes(actor.role)) return forbidden();
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return invalid("ข้อมูลไม่ถูกต้อง");
  const prefix = typeof body.prefix === "string" ? body.prefix.trim() : "";
  const fullname = typeof body.fullname === "string" ? body.fullname.trim() : "";
  const username = typeof body.username === "string" ? body.username.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = body.password;
  if (!USER_PREFIXES.some((item) => item === prefix)) return invalid("กรุณาเลือกคำนำหน้า");
  if (!fullname || !username || !roles.includes(body.role)) return invalid("กรอกข้อมูลให้ครบและเลือกสิทธิ์ที่ถูกต้อง");
  if (actor.role === "Teaching Assistant" && body.role !== "Teaching Assistant") return forbidden();
  if (!validEmail(email)) return invalid("อีเมลไม่ถูกต้อง");
  if (typeof password !== "string" || !validPassword(password)) return invalid("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และมีตัวอักษรภาษาอังกฤษกับตัวเลข");
  const users = (await clientPromise).db("attendance").collection("users");
  await Promise.all([
    users.createIndex({ username: 1 }, { name: "username_unique_ci", unique: true, collation: { locale: "en", strength: 2 } }),
    users.createIndex({ email: 1 }, { name: "email_unique_ci", unique: true, collation: { locale: "en", strength: 2 } }),
  ]);
  if (await users.findOne({ username }, { collation: { locale: "en", strength: 2 } })) return NextResponse.json({ success: false, message: "ชื่อผู้ใช้นี้มีอยู่แล้ว" }, { status: 409 });
  if (await users.findOne({ email }, { collation: { locale: "en", strength: 2 } })) return NextResponse.json({ success: false, message: "อีเมลนี้มีอยู่แล้ว" }, { status: 409 });
  try {
    await users.insertOne({ prefix, fullname, username, email, password: await bcrypt.hash(password, 10), role: body.role, createdAt: new Date() });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === 11000) return NextResponse.json({ success: false, message: "ชื่อผู้ใช้หรืออีเมลนี้มีอยู่แล้ว" }, { status: 409 });
    throw error;
  }
  await recordActivity({ actor, category: "accounts", action: "create", message: `เพิ่มบัญชีผู้ใช้ “${fullname}”`, target: fullname });
  return NextResponse.json({ success: true, message: "เพิ่มผู้ใช้สำเร็จ" }, { status: 201 });
}

export async function PATCH(req: Request) {
  const actor = await currentUser();
  if (!actor || actor.role !== "Teacher") return forbidden();
  const body = await req.json().catch(() => null);
  if (!body || !ObjectId.isValid(body.id ?? "") || !roles.includes(body.role)) return invalid("ข้อมูลไม่ถูกต้อง");
  if (String(actor._id) === body.id) return invalid("ไม่สามารถแก้ไขสิทธิ์ของตนเอง");
  const users = (await clientPromise).db("attendance").collection("users");
  const target = await users.findOne({ _id: new ObjectId(body.id) });
  const result = await users.updateOne({ _id: new ObjectId(body.id) }, { $set: { role: body.role } });
  if (!result.matchedCount) return NextResponse.json({ success: false, message: "ไม่พบผู้ใช้" }, { status: 404 });
  const targetName = String(target?.fullname ?? target?.username ?? "ผู้ใช้");
  await recordActivity({ actor, category: "accounts", action: "update", message: `เปลี่ยนสิทธิ์ของ “${targetName}” เป็น ${body.role}`, target: targetName });
  return NextResponse.json({ success: true, message: "แก้ไขสิทธิ์สำเร็จ" });
}

export async function DELETE(req: Request) {
  const actor = await currentUser();
  if (!actor || actor.role !== "Teacher") return forbidden();
  const body = await req.json().catch(() => null);
  if (!body || !ObjectId.isValid(body.id ?? "")) return invalid("ข้อมูลไม่ถูกต้อง");
  if (String(actor._id) === body.id) return invalid("ไม่สามารถลบบัญชีของตนเอง");
  const users = (await clientPromise).db("attendance").collection("users");
  const target = await users.findOne({ _id: new ObjectId(body.id) });
  const result = await users.deleteOne({ _id: new ObjectId(body.id) });
  if (!result.deletedCount) return NextResponse.json({ success: false, message: "ไม่พบผู้ใช้" }, { status: 404 });
  await (await clientPromise).db("attendance").collection("profile_images").deleteOne({ _id: new ObjectId(body.id) });
  const targetName = String(target?.fullname ?? target?.username ?? "ผู้ใช้");
  await recordActivity({ actor, category: "accounts", action: "delete", message: `ลบบัญชีผู้ใช้ “${targetName}”`, target: targetName });
  return NextResponse.json({ success: true, message: "ลบผู้ใช้สำเร็จ" });
}
