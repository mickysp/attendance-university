import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/session";
import { sessionMessages } from "@/lib/session-policy";

export async function GET() {
  try {
    const { user, reason } = await verifySession(
      (await cookies()).get("accessToken")?.value,
    );
    if (!user)
      return NextResponse.json(
        { success: false, reason, message: sessionMessages[reason!] },
        { status: 401, headers: { "Cache-Control": "no-store" } },
      );
    return NextResponse.json(
      {
        success: true,
        user: {
          fullname: user.fullname,
          role: user.role,
          avatarUrl: user.avatarUpdatedAt
            ? "/api/auth/avatar?v=" + new Date(user.avatarUpdatedAt).getTime()
            : null,
        },
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "ไม่สามารถตรวจสอบเซสชันได้ กรุณาลองอีกครั้ง" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
