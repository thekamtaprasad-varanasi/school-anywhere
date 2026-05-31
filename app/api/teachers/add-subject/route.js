// app/api/teachers/add-subject/route.js
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
  const teacherIdRaw = formData.get("teacher_id");
  const teacher_id = parseInt(teacherIdRaw, 10);
  const subject = formData.get("subject");
  const className = formData.get("class");
  const section = formData.get("section") || null;

  if (isNaN(teacher_id)) {
    await setFlash("error", "Invalid teacher");
    return NextResponse.redirect(new URL("/teachers", request.url), { status: 303 });
  }
  if (!subject || !className) {
    await setFlash("error", "Subject and class are required");
    return NextResponse.redirect(new URL(`/teachers/${teacher_id}`, request.url), { status: 303 });
  }

  // ─── Ownership check ───────────────────────────────────────────────────
  const teacherCheck = await db
    .select()
    .from(schema.teachers)
    .where(
      and(
        eq(schema.teachers.id, teacher_id),
        eq(schema.teachers.user_id, 2),
      ),
    );
  if (!teacherCheck.length) {
    return NextResponse.redirect(new URL("/teachers", request.url), { status: 303 });
  }

  // ─── Duplicate check: same teacher + subject + class + section ─────────
  const conditions = [
    eq(schema.teacher_subjects.user_id, 2),
    eq(schema.teacher_subjects.teacher_id, teacher_id),
    eq(schema.teacher_subjects.subject, subject),
    eq(schema.teacher_subjects.class, className),
  ];
  if (section) {
    conditions.push(eq(schema.teacher_subjects.section, section));
  }
  const existing = await db
    .select()
    .from(schema.teacher_subjects)
    .where(and(...conditions));
  if (existing.length > 0) {
    await setFlash(
      "error",
      `${subject} is already assigned for Class ${className}${section ? `-${section}` : ""}.`,
    );
    return NextResponse.redirect(new URL(`/teachers/${teacher_id}`, request.url), { status: 303 });
  }

  // ─── Insert ────────────────────────────────────────────────────────────
  await db.insert(schema.teacher_subjects).values({
    teacher_id,
    subject,
    class: className,
    section,
    user_id: 2,
  });

  await setFlash("success", "Subject assigned successfully!");
  return NextResponse.redirect(new URL(`/teachers/${teacher_id}`, request.url), { status: 303 });
}