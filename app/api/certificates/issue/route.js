// app/api/certificates/issue/route.js
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
  const student_id = parseInt(studentIdRaw, 10);
  const cert_type = formData.get("cert_type");
  const issue_date = formData.get("issue_date");
  const serial_no = formData.get("serial_no") || null;
  const reason = formData.get("reason") || null;
  const last_class = formData.get("last_class") || null;
  const last_exam_passed = formData.get("last_exam_passed") || null;
  const conduct = formData.get("conduct") || "Good";
  const custom_content = formData.get("custom_content") || null;

  if (isNaN(student_id)) {
    await setFlash("error", "Invalid student");
    return NextResponse.redirect(new URL("/certificates", request.url), { status: 303 });
  }

  if (!cert_type || !issue_date) {
    await setFlash("error", "Certificate type and issue date are required");
    return NextResponse.redirect(new URL("/certificates", request.url), { status: 303 });
  }

  // ─── Ownership check ───────────────────────────────────────────────────
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
    return NextResponse.redirect(new URL("/students", request.url), { status: 303 });
  }

  // ─── Duplicate check 1: serial_no must be unique per user (if given) ───
  if (serial_no) {
    const serialConflict = await db
      .select()
      .from(schema.certificates)
      .where(
        and(
          eq(schema.certificates.user_id, MASTER_USER_ID),
          eq(schema.certificates.serial_no, serial_no),
        ),
      );
    if (serialConflict.length > 0) {
      await setFlash(
        "error",
        `Serial No. ${serial_no} is already used by another certificate.`,
      );
      return NextResponse.redirect(new URL("/certificates", request.url), { status: 303 });
    }
  }

  // ─── Duplicate check 2: same student + cert_type + issue_date ──────────
  // Prevents accidental re-issue of the same certificate on the same day
  const conditions = [
    eq(schema.certificates.user_id, MASTER_USER_ID),
    eq(schema.certificates.student_id, student_id),
    eq(schema.certificates.cert_type, cert_type),
    eq(schema.certificates.issue_date, issue_date),
  ];
  const existing = await db
    .select()
    .from(schema.certificates)
    .where(and(...conditions));
  if (existing.length > 0) {
    await setFlash(
      "error",
      `A ${cert_type} certificate was already issued to ${studentCheck[0].name} on ${issue_date}.`,
    );
    return NextResponse.redirect(new URL("/certificates", request.url), { status: 303 });
  }

  // ─── Insert ────────────────────────────────────────────────────────────
  await db.insert(schema.certificates).values({
    student_id,
    cert_type,
    issue_date,
    serial_no,
    reason,
    last_class,
    last_exam_passed,
    conduct,
    custom_content,
    user_id: MASTER_USER_ID,
  });

  await setFlash("success", "Certificate issued successfully!");
  return NextResponse.redirect(new URL("/certificates", request.url), { status: 303 });
}