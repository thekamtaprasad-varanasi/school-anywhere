// app/api/attendance/save/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { setFlash } from "@/lib/flash";

export async function POST(request) {
  const cookieStore = await cookies();
  const adminToken = cookieStore.get("session")?.value;
  const teacherToken = cookieStore.get("teacher_session")?.value;
  if (!adminToken && !teacherToken) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  let userId = null;
  let isTeacher = false;

  if (adminToken) {
    const session = await getSession(adminToken);
    if (!session) {
      return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
    }
    const userResult = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.email, session.email));
    userId = userResult[0]?.id;
  } else if (teacherToken) {
    const teacherSession = await getSession(teacherToken);
    if (!teacherSession) {
      return NextResponse.redirect(new URL("/teacher-login", request.url), { status: 303 });
    }
    const teacherResult = await db
      .select()
      .from(schema.teachers)
      .where(eq(schema.teachers.id, teacherSession.teacherId));
    userId = teacherResult[0]?.user_id;
    isTeacher = true;
  }

  if (!userId) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const date = formData.get("date");
  const studentIds = formData.getAll("student_id");

  if (!date) {
    await setFlash("error", "Date is required");
    return NextResponse.redirect(
      new URL(isTeacher ? "/teacher/attendance" : "/attendance", request.url),
      { status: 303 },
    );
  }

  const owned = await db
    .select({ id: schema.students.id })
    .from(schema.students)
    .where(eq(schema.students.user_id, userId));
  const ownedIds = new Set(owned.map((s) => s.id));

  const existingRows = await db
    .select({
      student_id: schema.attendance.student_id,
      status: schema.attendance.status,
    })
    .from(schema.attendance)
    .where(
      and(
        eq(schema.attendance.date, date),
        eq(schema.attendance.user_id, userId),
      ),
    );
  const existingByStudent = new Map(
    existingRows.map((r) => [r.student_id, r.status]),
  );

  let inserted = 0;
  let updated = 0;
  let removed = 0;
  let skipped = 0;

  for (const idRaw of studentIds) {
    const studentId = parseInt(idRaw, 10);
    if (isNaN(studentId) || !ownedIds.has(studentId)) {
      skipped++;
      continue;
    }

    const raw = formData.get(`status_${idRaw}`);
    const status =
      raw === "present" ? "present" : raw === "absent" ? "absent" : "na";

    const hadExisting = existingByStudent.has(studentId);

    if (status === "na") {
      if (hadExisting) {
        await db
          .delete(schema.attendance)
          .where(
            and(
              eq(schema.attendance.student_id, studentId),
              eq(schema.attendance.date, date),
              eq(schema.attendance.user_id, userId),
            ),
          );
        removed++;
      }
      continue;
    }

    if (hadExisting) {
      if (existingByStudent.get(studentId) === status) {
        continue;
      }
      await db
        .update(schema.attendance)
        .set({ status })
        .where(
          and(
            eq(schema.attendance.student_id, studentId),
            eq(schema.attendance.date, date),
            eq(schema.attendance.user_id, userId),
          ),
        );
      updated++;
    } else {
      await db.insert(schema.attendance).values({
        student_id: studentId,
        date,
        status,
        user_id: userId,
      });
      inserted++;
    }
  }

  await setFlash(
    "success",
    `Attendance saved: ${inserted} new, ${updated} updated, ${removed} cleared${skipped > 0 ? `, ${skipped} skipped` : ""}.`,
  );

  return NextResponse.redirect(
    new URL(isTeacher ? "/teacher/attendance" : "/attendance", request.url),
    { status: 303 },
  );
}