// app/api/teachers/save-schedule/route.js
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
  const teacherId = parseInt(teacherIdRaw, 10);
  if (isNaN(teacherId)) {
    await setFlash("error", "Invalid teacher");
    return NextResponse.redirect(new URL("/teachers", request.url), { status: 303 });
  }

  // ─── Ownership check ───────────────────────────────────────────────────
  const teacherResult = await db
    .select()
    .from(schema.teachers)
    .where(
      and(
        eq(schema.teachers.id, teacherId),
        eq(schema.teachers.user_id, 2),
      ),
    );
  const teacher = teacherResult[0];
  if (!teacher) {
    await setFlash("error", "Teacher not found");
    return NextResponse.redirect(new URL("/teachers", request.url), { status: 303 });
  }

  const totalPeriodsRaw = formData.get("total_periods");
  const totalPeriods = parseInt(totalPeriodsRaw, 10);
  if (isNaN(totalPeriods) || totalPeriods < 1) {
    await setFlash("error", "Invalid periods count");
    return NextResponse.redirect(
      new URL(`/teachers/${teacherId}/timetable`, request.url),
      { status: 303 },
    );
  }

  // ─── Fetch period timings for this user ────────────────────────────────
  const timings = await db
    .select()
    .from(schema.period_timings)
    .where(eq(schema.period_timings.user_id, 2));
  const timingMap = {};
  timings.forEach((t) => {
    timingMap[t.period_no] = { start: t.start_time, end: t.end_time };
  });

  // ─── Delete existing periods for this teacher (idempotent re-save) ─────
  await db
    .delete(schema.timetable)
    .where(
      and(
        eq(schema.timetable.user_id, 2),
        eq(schema.timetable.teacher_name, teacher.name),
      ),
    );

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const getPeriodData = (day, p) => ({
    subject: formData.get(`subject_${day}_${p}`),
    className: formData.get(`class_${day}_${p}`),
    section: formData.get(`section_${day}_${p}`),
  });

  const buildDayRows = (sourceDay, targetDay) => {
    const rows = [];
    for (let p = 1; p <= totalPeriods; p++) {
      const { subject, className, section } = getPeriodData(sourceDay, p);
      if (!subject || !className) continue;
      const timing = timingMap[p];
      const startTime = timing?.start || "00:00";
      const endTime = timing?.end || "00:00";
      const fullClass = section ? `${className}-${section}` : className;
      rows.push({
        user_id: 2,
        class: fullClass,
        day: targetDay,
        period: p,
        subject,
        teacher_name: teacher.name,
        start_time: startTime,
        end_time: endTime,
      });
    }
    return rows;
  };

  const allRows = [];
  for (const day of days) {
    const sameAsMonday = formData.get(`same_${day}`) === "1";
    const sourceDay =
      day === "Monday" ? "Monday" : sameAsMonday ? "Monday" : day;
    const dayRows = buildDayRows(sourceDay, day);
    allRows.push(...dayRows);
  }

  if (allRows.length > 0) {
    await db.insert(schema.timetable).values(allRows);
  }

  await setFlash(
    "success",
    `Weekly timetable saved for ${teacher.name} (${allRows.length} entries)`,
  );
  return NextResponse.redirect(
    new URL(`/teachers/${teacherId}`, request.url),
    { status: 303 },
  );
}