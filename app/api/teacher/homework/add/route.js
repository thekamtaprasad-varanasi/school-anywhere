// app/api/teacher/homework/add/route.js

import { db } from "@/lib/db";
import { homeworks, teachers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("teacher_session")?.value;
  if (!token) return NextResponse.redirect(new URL("/teacher-login", request.url));

  let payload;
  try {
    const verified = await jwtVerify(token, SECRET);
    payload = verified.payload;
  } catch {
    return NextResponse.redirect(new URL("/teacher-login", request.url));
  }

  const teacherResult = await db.select().from(teachers).where(eq(teachers.id, payload.teacherId));
  const teacher = teacherResult[0];
  if (!teacher) return NextResponse.redirect(new URL("/teacher-login", request.url));

  const formData = await request.formData();
  const subject_class = formData.get("subject_class");
  const title = formData.get("title");
  const description = formData.get("description") || null;
  const due_date = formData.get("due_date");

  if (!subject_class || !title || !due_date) {
    return NextResponse.redirect(new URL("/teacher/homework/add", request.url));
  }

  const [subject, className, section] = subject_class.split("||");

  await db.insert(homeworks).values({
    teacher_id: payload.teacherId,
    class: className,
    section: section || null,
    subject,
    title,
    description,
    due_date,
    user_id: teacher.user_id,
    created_at: new Date(),
  });

  return NextResponse.redirect(new URL("/teacher/homework", request.url));
}