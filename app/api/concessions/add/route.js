// app/api/concessions/add/route.js
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
  const studentIdRaw = formData.get("student_id");
  const student_id = parseInt(studentIdRaw, 10);
  const reason = formData.get("reason") || null;
  const discount_type = formData.get("discount_type");
  const discountValueRaw = formData.get("discount_value");
  const discount_value = parseInt(discountValueRaw, 10);

  if (isNaN(student_id)) {
    await setFlash("error", "Invalid student");
    return NextResponse.redirect(new URL("/students", request.url), { status: 303 });
  }

  if (!discount_type || isNaN(discount_value) || discount_value <= 0) {
    await setFlash("error", "Valid discount type and value are required");
    return NextResponse.redirect(
      new URL(`/students/${student_id}`, request.url),
      { status: 303 },
    );
  }

  // Percentage > 100 doesn't make sense
  if (discount_type === "percent" && discount_value > 100) {
    await setFlash("error", "Percentage discount cannot exceed 100");
    return NextResponse.redirect(
      new URL(`/students/${student_id}`, request.url),
      { status: 303 },
    );
  }

  // ─── Ownership check ───────────────────────────────────────────────────
  const studentCheck = await db
    .select()
    .from(schema.students)
    .where(
      and(
        eq(schema.students.id, student_id),
        eq(schema.students.user_id, 2),
      ),
    );
  if (!studentCheck.length) {
    return NextResponse.redirect(new URL("/students", request.url), { status: 303 });
  }

  // ─── Duplicate check: student already has a concession? ────────────────
  // Schema doesn't distinguish by fee_type; one concession per student is policy
  const existing = await db
    .select()
    .from(schema.fee_concessions)
    .where(
      and(
        eq(schema.fee_concessions.user_id, 2),
        eq(schema.fee_concessions.student_id, student_id),
      ),
    );
  if (existing.length > 0) {
    await setFlash(
      "error",
      `${studentCheck[0].name} already has a concession. Remove the existing one first.`,
    );
    return NextResponse.redirect(
      new URL(`/students/${student_id}`, request.url),
      { status: 303 },
    );
  }

  // ─── Insert ────────────────────────────────────────────────────────────
  await db.insert(schema.fee_concessions).values({
    student_id,
    reason,
    discount_type,
    discount_value,
    user_id: 2,
    created_at: new Date(),
  });

  await setFlash("success", "Concession added!");
  return NextResponse.redirect(
    new URL(`/students/${student_id}`, request.url),
    { status: 303 },
  );
}