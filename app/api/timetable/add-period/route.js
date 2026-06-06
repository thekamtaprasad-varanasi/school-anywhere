// app/api/timetable/add-period/route.js
import { NextResponse } from "next/server";
import { MASTER_USER_ID } from "@/lib/config";
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
  const className = formData.get("class");
  const day = formData.get("day");
  const periodRaw = formData.get("period");
  const period = parseInt(periodRaw, 10);
  const subject = formData.get("subject");
  const teacher_name = formData.get("teacher_name");
  const start_time = formData.get("start_time");
  const end_time = formData.get("end_time");

  if (!className || !day || isNaN(period) || !subject) {
    await setFlash("error", "Class, day, period and subject are required");
    return NextResponse.redirect(new URL("/timetable/add", request.url), { status: 303 });
  }

  // ─── Duplicate check: same class + day + period already taken? ─────────
  const conditions = [
    eq(schema.timetable.user_id, MASTER_USER_ID),
    eq(schema.timetable.class, className),
    eq(schema.timetable.day, day),
    eq(schema.timetable.period, period),
  ];
  const existing = await db
    .select()
    .from(schema.timetable)
    .where(and(...conditions));
  if (existing.length > 0) {
    await setFlash(
      "error",
      `Class ${className} already has a period ${period} on ${day} (${existing[0].subject}). Delete it first to replace.`,
    );
    return NextResponse.redirect(new URL(`/timetable?class=${className}`, request.url), { status: 303 });
  }

  // ─── Insert ────────────────────────────────────────────────────────────
  await db.insert(schema.timetable).values({
    class: className,
    day,
    period,
    subject,
    teacher_name: teacher_name || null,
    start_time: start_time || "00:00",
    end_time: end_time || "00:00",
    user_id: MASTER_USER_ID,
  });

  await setFlash("success", "Period added successfully!");
  return NextResponse.redirect(new URL(`/timetable?class=${className}`, request.url), { status: 303 });
}