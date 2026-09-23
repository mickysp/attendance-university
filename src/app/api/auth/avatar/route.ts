import { NextResponse } from "next/server";
import { Binary, ObjectId } from "mongodb";
import { currentUser } from "@/lib/admin-auth";
import clientPromise from "@/lib/mongodb";

const MAX_BYTES = 2 * 1024 * 1024;
type AvatarDocument = {
  _id: ObjectId;
  data: Binary;
  mimeType: string;
  updatedAt: Date;
};
const unauthorized = () =>
  NextResponse.json(
    { success: false, message: "กรุณาเข้าสู่ระบบ" },
    { status: 401 },
  );

function detectMime(bytes: Uint8Array) {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  )
    return "image/jpeg";
  if (
    bytes.length >= 8 &&
    [137, 80, 78, 71, 13, 10, 26, 10].every(
      (value, index) => bytes[index] === value,
    )
  )
    return "image/png";
  if (
    bytes.length >= 12 &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  )
    return "image/webp";
  return null;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return unauthorized();
  const image = await (
    await clientPromise
  )
    .db("attendance")
    .collection<AvatarDocument>("profile_images")
    .findOne({ _id: user._id });
  if (!image) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(image.data.value()), {
    headers: {
      "Content-Type": image.mimeType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return unauthorized();
  const form = await req.formData().catch(() => null);
  const file = form?.get("avatar");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_BYTES)
    return NextResponse.json(
      {
        success: false,
        message: "เลือกรูป JPG, PNG หรือ WebP ขนาดไม่เกิน 2 MB",
      },
      { status: 400 },
    );
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mimeType = detectMime(bytes);
  if (!mimeType || file.type !== mimeType)
    return NextResponse.json(
      { success: false, message: "ไฟล์รูปภาพไม่ถูกต้อง" },
      { status: 400 },
    );
  const db = (await clientPromise).db("attendance");
  const now = new Date();
  await db.collection<AvatarDocument>("profile_images").updateOne(
    { _id: user._id },
    {
      $set: {
        data: new Binary(Buffer.from(bytes)),
        mimeType,
        updatedAt: now,
      },
    },
    { upsert: true },
  );
  await db
    .collection("users")
    .updateOne({ _id: user._id }, { $set: { avatarUpdatedAt: now } });
  return NextResponse.json({
    success: true,
    avatarUrl: `/api/auth/avatar?v=${now.getTime()}`,
  });
}

export async function DELETE() {
  const user = await currentUser();
  if (!user) return unauthorized();
  const db = (await clientPromise).db("attendance");
  await db.collection("profile_images").deleteOne({ _id: user._id });
  await db
    .collection("users")
    .updateOne({ _id: user._id }, { $unset: { avatarUpdatedAt: "" } });
  return NextResponse.json({ success: true });
}
