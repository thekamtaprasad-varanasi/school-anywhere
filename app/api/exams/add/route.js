// app/api/exams/add/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { setFlash } from "@/lib/flash";

export async function POST(request) {
  // ─── Auth ──────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }
  const session = await getSession(token);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const userResult = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, session.email));
  const user = userResult[0];
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  // ─── Parse form ────────────────────────────────────────────────────────
  const formData = await request.formData();
  const name = formData.get("name");
  const className = formData.get("class");
  const subject = formData.get("subject");
  const exam_date = formData.get("exam_date");
  const exam_type = formData.get("exam_type") || "unit";
  const academic_year = formData.get("academic_year") || null;
  const maxMarksRaw = formData.get("max_marks");
  const passingMarksRaw = formData.get("passing_marks");

  const max_marks = parseInt(maxMarksRaw, 10);
  const passing_marks = parseInt(passingMarksRaw, 10);

  if (!name || !className || !subject || !exam_date) {
    await setFlash("error", "Name, class, subject and exam date are required");
    return NextResponse.redirect(new URL("/exams/add", request.url), { status: 303 });
  }

  if (isNaN(max_marks) || max_marks <= 0) {
    await setFlash("error", "Valid maximum marks required");
    return NextResponse.redirect(new URL("/exams/add", request.url), { status: 303 });
  }

  if (isNaN(passing_marks) || passing_marks < 0 || passing_marks > max_marks) {
    await setFlash("error", "Passing marks must be between 0 and max marks");
    return NextResponse.redirect(new URL("/exams/add", request.url), { status: 303 });
  }

  // ─── Duplicate check: same exam (name + class + subject + date) ────────
  const conditions = [
    eq(schema.exams.user_id, 2),
    eq(schema.exams.name, name),
    eq(schema.exams.class, className),
    eq(schema.exams.subject, subject),
    eq(schema.exams.exam_date, exam_date),
  ];
  const existing = await db
    .select()
    .from(schema.exams)
    .where(and(...conditions));
  if (existing.length > 0) {
    await setFlash(
      "error",
      `An exam "${name}" for Class ${className} (${subject}) on ${exam_date} is already scheduled.`,
    );
    return NextResponse.redirect(new URL("/exams", request.url), { status: 303 });
  }

  // ─── Insert ────────────────────────────────────────────────────────────
  await db.insert(schema.exams).values({
    name,
    class: className,
    subject,
    exam_date,
    exam_type,
    academic_year,
    max_marks,
    passing_marks,
    user_id: 2,
  });

  await setFlash("success", "Exam scheduled successfully!");
  return NextResponse.redirect(new URL("/exams", request.url), { status: 303 });
}