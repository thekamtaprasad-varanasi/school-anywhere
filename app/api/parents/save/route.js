// app/api/parents/save/route.js
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

  if (isNaN(student_id)) {
    await setFlash("error", "Invalid student");
    return NextResponse.redirect(new URL("/students", request.url), { status: 303 });
  }

  const name = formData.get("name");
  const phone = formData.get("phone");
  const email = formData.get("email");
  const password = formData.get("password");

  if (!name || !phone) {
    await setFlash("error", "Name and phone are required");
    return NextResponse.redirect(
      new URL(`/students/${student_id}/parent`, request.url),
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
    return NextResponse.redirect(new URL("/students", request.url), { status: 303 });
  }

  const data = {
    name,
    phone,
    email: email || null,
    password,
    user_id: MASTER_USER_ID,
  };

  // ─── UPSERT pattern (naturally retry-safe) ─────────────────────────────
  // One parent record per student. Existing → UPDATE; new → INSERT.
  // Retry harmlessly goes through UPDATE path on second try.
  const existing = await db
    .select()
    .from(schema.parents)
    .where(
      and(
        eq(schema.parents.student_id, student_id),
        eq(schema.parents.user_id, MASTER_USER_ID),
      ),
    );

  if (existing.length > 0) {
    // Don't overwrite password if user left it blank
    const updateData = { ...data };
    if (!password || password.trim() === "") {
      delete updateData.password;
    }
    await db
      .update(schema.parents)
      .set(updateData)
      .where(
        and(
          eq(schema.parents.student_id, student_id),
          eq(schema.parents.user_id, MASTER_USER_ID),
        ),
      );
    await setFlash("success", "Parent account updated successfully!");
  } else {
    if (!password || password.trim() === "") {
      await setFlash("error", "Password is required for new parent account");
      return NextResponse.redirect(
        new URL(`/students/${student_id}/parent`, request.url),
        { status: 303 },
      );
    }
    await db.insert(schema.parents).values({ student_id, ...data });
    await setFlash("success", "Parent account created successfully!");
  }

  return NextResponse.redirect(new URL("/students", request.url), { status: 303 });
}