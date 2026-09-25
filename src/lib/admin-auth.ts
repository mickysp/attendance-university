import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";

export async function currentUser() {
  const token = (await cookies()).get("accessToken")?.value;
  return (await verifySession(token)).user;
}
