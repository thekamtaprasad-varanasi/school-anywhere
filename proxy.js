import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

const PROTECTED_PATHS = [
  "/dashboard",
  "/students",
  "/teachers",
  "/fees",
  "/fee-structure",
  "/attendance",
  "/certificates",
  "/exams",
  "/settings",
  "/reports",
  "/notices",
  "/timetable",
  "/transport",
  "/admissions",
  "/marksheet",
  "/promote",
];

export async function proxy(request) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";

  // Hide Vercel default URL — redirect to custom domain
  if (host === "shashwat-public.vercel.app") {
    const url = new URL(request.url);
    url.host = "erp.spsvaranasi.in";
    url.protocol = "https:";
    return NextResponse.redirect(url, { status: 308 });
  }

  // Teacher routes — teacher_session
  if (pathname.startsWith("/teacher/")) {
    const teacherToken = request.cookies.get("teacher_session")?.value;
    if (!teacherToken) {
      return NextResponse.redirect(new URL("/teacher-login", request.url));
    }
    return NextResponse.next();
  }

  // Admin protected routes — session
  const isProtected = PROTECTED_PATHS.some((p) => pathname.startsWith(p));
  if (isProtected) {
    const token = request.cookies.get("session")?.value;
    const session = token ? await getSession(token) : null;
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};