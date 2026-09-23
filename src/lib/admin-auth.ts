import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";

export async function currentUser() {
  const token = (await cookies()).get("accessToken")?.value;
  if (!token || !process.env.JWT_SECRET) return null;
  try {
    const { payload } = await jwtVerify(
      token,
      new TextEncoder().encode(process.env.JWT_SECRET),
    );
    if (typeof payload.userId !== "string" || !ObjectId.isValid(payload.userId))
      return null;
    const db = (await clientPromise).db("attendance");
    return await db
      .collection("users")
      .findOne({ _id: new ObjectId(payload.userId) });
  } catch {
    return null;
  }
}
