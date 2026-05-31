// app/api/teachers/delete/route.js
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
    return NextResponse.redirect(new URL("/login", request.url), {
      status: 303,
    });
  }
  const session = await getSession(token);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url), {
      status: 303,
    });
  }

  const userResult = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, session.email));
  const user = userResult[0];
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), {
      status: 303,
    });
  }

  const formData = await request.formData();
  const id = parseInt(formData.get("id"), 10);
  if (isNaN(id)) {
    return NextResponse.redirect(new URL("/teachers", request.url), {
      status: 303,
    });
  }

  const teacherCheck = await db
    .select()
    .from(schema.teachers)
    .where(and(eq(schema.teachers.id, id), eq(schema.teachers.user_id, 2)));
  if (!teacherCheck.length) {
    return NextResponse.redirect(new URL("/teachers", request.url), {
      status: 303,
    });
  }

  await db.delete(schema.homeworks).where(eq(schema.homeworks.teacher_id, id));
  await db
    .delete(schema.teacher_attendance)
    .where(eq(schema.teacher_attendance.teacher_id, id));
  await db
    .delete(schema.teacher_subjects)
    .where(eq(schema.teacher_subjects.teacher_id, id));
  await db.delete(schema.teachers).where(eq(schema.teachers.id, id));

  await setFlash("success", "Teacher deleted successfully!");
  return NextResponse.redirect(new URL("/teachers", request.url), {
    status: 303,
  });
}
