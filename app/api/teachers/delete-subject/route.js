// app/api/teachers/delete-subject/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { setFlash } from "@/lib/flash";

export async function POST(request) {
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

  const formData = await request.formData();
  const id = parseInt(formData.get("id"), 10);
  if (isNaN(id)) {
    return NextResponse.redirect(new URL("/teachers", request.url), { status: 303 });
  }

  // Fetch subject row to verify ownership via teacher
  const subjectResult = await db
    .select()
    .from(schema.teacher_subjects)
    .where(eq(schema.teacher_subjects.id, id));
  const subjectRow = subjectResult[0];
  if (!subjectRow) {
    return NextResponse.redirect(new URL("/teachers", request.url), { status: 303 });
  }

  const teacher_id = subjectRow.teacher_id;
  const teacherOwner = await db
    .select()
    .from(schema.teachers)
    .where(
      and(
        eq(schema.teachers.id, teacher_id),
        eq(schema.teachers.user_id, 2),
      ),
    );
  if (!teacherOwner.length) {
    return NextResponse.redirect(new URL("/teachers", request.url), { status: 303 });
  }

  await db
    .delete(schema.teacher_subjects)
    .where(eq(schema.teacher_subjects.id, id));

  await setFlash("success", "Subject removed!");
  return NextResponse.redirect(new URL(`/teachers/${teacher_id}`, request.url), { status: 303 });
}