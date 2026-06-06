// app/api/students/promote/route.js
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
  const from_class = formData.get("from_class");
  const to_class = formData.get("to_class");
  const new_academic_year = formData.get("new_academic_year");

  if (!from_class || !to_class || !new_academic_year) {
    await setFlash("error", "All fields are required.");
    return NextResponse.redirect(new URL("/promote", request.url), { status: 303 });
  }

  if (from_class === to_class) {
    await setFlash("error", "From and To class cannot be the same.");
    return NextResponse.redirect(new URL("/promote", request.url), { status: 303 });
  }

  // ─── Count students before promotion (for confirmation message) ────────
  const toPromote = await db
    .select({ id: schema.students.id })
    .from(schema.students)
    .where(
      and(
        eq(schema.students.class, from_class),
        eq(schema.students.user_id, MASTER_USER_ID),
      ),
    );

  if (toPromote.length === 0) {
    await setFlash("error", `No students in Class ${from_class} to promote.`);
    return NextResponse.redirect(new URL("/promote", request.url), { status: 303 });
  }

  // ─── Promote ───────────────────────────────────────────────────────────
  await db
    .update(schema.students)
    .set({
      class: to_class,
      academic_year: new_academic_year,
      fee_status: "pending",
    })
    .where(
      and(
        eq(schema.students.class, from_class),
        eq(schema.students.user_id, MASTER_USER_ID),
      ),
    );

  await setFlash(
    "success",
    `${toPromote.length} students promoted: Class ${from_class} → Class ${to_class} (${new_academic_year})`,
  );
  return NextResponse.redirect(new URL("/promote", request.url), { status: 303 });
}