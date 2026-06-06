import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { students } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(request) {
  const { phone, password, admission_no } = await request.json();

  if (!phone || !password || !admission_no) {
    return NextResponse.json(
      { success: false, message: "Mobile number and password required" },
      { status: 400 },
    );
  }

  const cleanPhone = String(phone).trim();
  const cleanPass = String(password).trim();

  // Password must be last 6 digits of phone
  if (cleanPhone.length < 6 || cleanPhone.slice(-6) !== cleanPass) {
    return NextResponse.json(
      { success: false, message: "Invalid mobile number or password" },
      { status: 401 },
    );
  }

  const result = await db
    .select()
    .from(students)
    .where(
      and(
        eq(students.phone, cleanPhone),
        eq(students.admission_no, admission_no.trim()),
      ),
    );

  if (result.length === 0) {
    return NextResponse.json(
      { success: false, message: "Mobile number not registered" },
      { status: 401 },
    );
  }

  const student = result[0];

  const response = NextResponse.json({ success: true });
  response.cookies.set("student_session", String(student.id), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
    sameSite: "lax",
  });

  return response;
}
