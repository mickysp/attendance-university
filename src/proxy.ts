import { NextResponse, type NextRequest } from "next/server";
import { verifySession } from "@/lib/session";
import { sessionMessages } from "@/lib/session-policy";

export async function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname.replace(/\/$/, "") || "/";
  const isApi = pathname.startsWith("/api/");
  // These endpoints are used by students without a staff login.
  const publicStudentApi =
    (req.method === "POST" && pathname === "/api/attendance") ||
    (req.method === "GET" &&
      (pathname === "/api/check-in" ||
        /^\/api\/classes\/[a-f\d]{24}$/i.test(pathname)));
  const publicAuthApi = [
    "/api/auth/login",
    "/api/auth/logout",
    "/api/auth/send-otp",
    "/api/auth/verify-otp",
    "/api/auth/reset-password",
    "/api/auth/user",
  ].includes(pathname);
  if (
    publicStudentApi ||
    publicAuthApi ||
    pathname === "/check-in" ||
    /^\/checkin\/[^/]+$/.test(pathname)
  )
    return NextResponse.next();

  const publicPage = pathname === "/login" || pathname === "/forgot-password";
  const token = req.cookies.get("accessToken")?.value;
  if (publicPage && !token) return NextResponse.next();
  try {
    const { user, reason } = await verifySession(token);
    if (!user) {
      if (isApi) {
        // Keep the cookie until logout so concurrent requests retain the reason.
        return NextResponse.json(
          { success: false, reason, message: sessionMessages[reason!] },
          { status: 401, headers: { "Cache-Control": "no-store" } },
        );
      }
      if (publicPage) {
        const response = NextResponse.next();
        response.cookies.delete("accessToken");
        return response;
      }
      const url = new URL("/login", req.url);
      if (token) url.searchParams.set("reason", reason!);
      const response = NextResponse.redirect(url);
      response.cookies.delete("accessToken");
      return response;
    }
    if (pathname === "/login")
      return NextResponse.redirect(
        new URL(
          user.role === "Teacher" ? "/dashboard" : "/attendance",
          req.url,
        ),
      );
    if (pathname.startsWith("/dashboard") && user.role !== "Teacher")
      return NextResponse.redirect(new URL("/attendance", req.url));
    return NextResponse.next();
  } catch {
    if (publicPage) return NextResponse.next();
    return NextResponse.json(
      { success: false, message: "ไม่สามารถตรวจสอบเซสชันได้ กรุณาลองอีกครั้ง" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export const config = {
  matcher: [
    "/api/:path*",
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.[^/]+$).*)",
  ],
};
