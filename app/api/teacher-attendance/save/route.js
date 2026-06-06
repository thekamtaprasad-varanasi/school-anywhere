// app/api/teacher-attendance/save/route.js

import { db } from "@/lib/db";
import { MASTER_USER_ID } from "@/lib/config";
import { teachers, teacher_attendance, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", request.url));
  const session = await getSession(token);
  if (!session) return NextResponse.redirect(new URL("/login", request.url));

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const formData = await request.formData();
  const date = formData.get("date");

  if (!date)
    return NextResponse.redirect(new URL("/teacher-attendance", request.url));

  const allTeachers = await db
    .select()
    .from(teachers)
    .where(eq(teachers.user_id, MASTER_USER_ID));

  for (const t of allTeachers) {
    const raw = formData.get(`status_${t.id}`);
    const status =
      raw === "present" ? "present" : raw === "absent" ? "absent" : "na";
    const note = formData.get(`note_${t.id}`) || null;

    const existing = await db
      .select()
      .from(teacher_attendance)
      .where(
        and(
          eq(teacher_attendance.teacher_id, t.id),
          eq(teacher_attendance.date, date),
        ),
      );

    if (status === "na") {
      if (existing.length > 0) {
        await db
          .delete(teacher_attendance)
          .where(
            and(
              eq(teacher_attendance.teacher_id, t.id),
              eq(teacher_attendance.date, date),
            ),
          );
      }
      continue;
    }

    if (existing.length > 0) {
      await db
        .update(teacher_attendance)
        .set({ status, note })
        .where(
          and(
            eq(teacher_attendance.teacher_id, t.id),
            eq(teacher_attendance.date, date),
          ),
        );
    } else {
      await db.insert(teacher_attendance).values({
        teacher_id: t.id,
        date,
        status,
        note,
        user_id: MASTER_USER_ID,
        created_at: new Date(),
      });
    }
  }

  return NextResponse.redirect(
    new URL(`/teacher-attendance?date=${date}`, request.url),
  );
}