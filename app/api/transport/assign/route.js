// app/api/transport/assign/route.js
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
  const studentIdRaw = formData.get("student_id");
  const transportIdRaw = formData.get("transport_id");
  const student_id = parseInt(studentIdRaw, 10);
  const transport_id = parseInt(transportIdRaw, 10);
  const academic_year = formData.get("academic_year") || null;
  const joined_date = formData.get("joined_date") || null;

  if (isNaN(student_id) || isNaN(transport_id)) {
    await setFlash("error", "Student and transport route must be selected");
    return NextResponse.redirect(
      new URL("/transport/students/add", request.url),
      { status: 303 },
    );
  }

  // ─── Ownership check: student belongs to this user ─────────────────────
  const studentCheck = await db
    .select()
    .from(schema.students)
    .where(
      and(
        eq(schema.students.id, student_id),
        eq(schema.students.user_id, MASTER_USER_ID),
      ),
    );
  if (!studentCheck.length) {
    return NextResponse.redirect(new URL("/transport", request.url), { status: 303 });
  }

  // ─── Ownership check: transport route belongs to this user ─────────────
  const transportCheck = await db
    .select()
    .from(schema.transport)
    .where(
      and(
        eq(schema.transport.id, transport_id),
        eq(schema.transport.user_id, MASTER_USER_ID),
      ),
    );
  if (!transportCheck.length) {
    return NextResponse.redirect(new URL("/transport", request.url), { status: 303 });
  }

  // ─── Duplicate check: same student already on same route this year? ────
  const conditions = [
    eq(schema.student_transport.user_id, MASTER_USER_ID),
    eq(schema.student_transport.student_id, student_id),
    eq(schema.student_transport.transport_id, transport_id),
  ];
  if (academic_year) {
    conditions.push(eq(schema.student_transport.academic_year, academic_year));
  }
  const existing = await db
    .select()
    .from(schema.student_transport)
    .where(and(...conditions));
  if (existing.length > 0) {
    await setFlash(
      "error",
      `${studentCheck[0].name} is already assigned to this transport route${academic_year ? ` for ${academic_year}` : ""}.`,
    );
    return NextResponse.redirect(new URL("/transport", request.url), { status: 303 });
  }

  // ─── Insert ────────────────────────────────────────────────────────────
  await db.insert(schema.student_transport).values({
    student_id,
    transport_id,
    academic_year,
    joined_date,
    user_id: MASTER_USER_ID,
  });

  await setFlash("success", "Student assigned to transport successfully!");
  return NextResponse.redirect(new URL("/transport", request.url), { status: 303 });
}