import { db } from "@/lib/db";
import { teachers } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);

export async function POST(request) {
  const formData = await request.formData();
  const pin = formData.get("pin");
  const phone = formData.get("phone");

  if (!pin || !phone) {
    return NextResponse.redirect(new URL("/teacher-login?error=1", request.url));
  }

  const result = await db.select().from(teachers).where(
    and(eq(teachers.pin, pin), eq(teachers.phone, phone))
  );
  const teacher = result[0];

  if (!teacher) {
    return NextResponse.redirect(new URL("/teacher-login?error=1", request.url));
  }

  const token = await new SignJWT({
    teacherId: teacher.id,
    teacherName: teacher.name,
    role: "teacher",
  })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("12h")
    .sign(SECRET);

  const response = NextResponse.redirect(new URL("/teacher/dashboard", request.url));
  response.cookies.set("teacher_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 12,
    path: "/",
  });
  return response;
}