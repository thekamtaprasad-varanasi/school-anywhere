// app/api/students/delete/route.js
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
    return NextResponse.redirect(new URL("/students", request.url), { status: 303 });
  }

  // Ownership check
  const studentCheck = await db
    .select()
    .from(schema.students)
    .where(
      and(eq(schema.students.id, id), eq(schema.students.user_id, 2)),
    );
  if (!studentCheck.length) {
    return NextResponse.redirect(new URL("/students", request.url), { status: 303 });
  }

  // Cascade delete all related rows
  await db.delete(schema.fees).where(eq(schema.fees.student_id, id));
  await db.delete(schema.fee_payments).where(eq(schema.fee_payments.student_id, id));
  await db.delete(schema.attendance).where(eq(schema.attendance.student_id, id));
  await db.delete(schema.results).where(eq(schema.results.student_id, id));
  await db.delete(schema.parents).where(eq(schema.parents.student_id, id));
  await db.delete(schema.student_transport).where(eq(schema.student_transport.student_id, id));
  await db.delete(schema.certificates).where(eq(schema.certificates.student_id, id));
  await db.delete(schema.fee_concessions).where(eq(schema.fee_concessions.student_id, id));
  await db.delete(schema.students).where(eq(schema.students.id, id));

  await setFlash("success", "Student deleted successfully!");
  return NextResponse.redirect(new URL("/students", request.url), { status: 303 });
}