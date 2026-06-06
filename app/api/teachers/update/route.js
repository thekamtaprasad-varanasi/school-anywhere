// app/api/teachers/update/route.js
import { NextResponse } from "next/server";
import { MASTER_USER_ID } from "@/lib/config";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq, and, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { setFlash } from "@/lib/flash";

export async function POST(request) {
  // ─── Auth ──────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url), {
      status: 303,
    });
  }
  const session = await getSession(token);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url), {
      status: 303,
    });
  }

  const userResult = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, session.email));
  const user = userResult[0];
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), {
      status: 303,
    });
  }

  // ─── Parse form ────────────────────────────────────────────────────────
  const formData = await request.formData();
  const idRaw = formData.get("id");
  const id = parseInt(idRaw, 10);
  if (isNaN(id)) {
    await setFlash("error", "Invalid teacher id");
    return NextResponse.redirect(new URL("/teachers", request.url), {
      status: 303,
    });
  }

  // ─── Ownership check ───────────────────────────────────────────────────
  const teacherCheck = await db
    .select()
    .from(schema.teachers)
    .where(and(eq(schema.teachers.id, id), eq(schema.teachers.user_id, MASTER_USER_ID)));
  if (!teacherCheck.length) {
    return NextResponse.redirect(new URL("/teachers", request.url), {
      status: 303,
    });
  }

  const name = formData.get("name");
  const qualification = formData.get("qualification") || null;
  const phone = formData.get("phone") || null;
  const email = formData.get("email") || null;
  const pin = formData.get("pin") || null;
  // PIN duplicate check
  if (pin) {
    const pinConflict = await db
      .select()
      .from(schema.teachers)
      .where(
        and(
          eq(schema.teachers.user_id, MASTER_USER_ID),
          eq(schema.teachers.pin, pin),
          ne(schema.teachers.id, id),
        ),
      );
    if (pinConflict.length > 0) {
      await setFlash(
        "error",
        "This PIN is already assigned to another teacher.",
      );
      return NextResponse.redirect(
        new URL(`/teachers/${id}/edit`, request.url),
        { status: 303 },
      );
    }
  }

  if (!name) {
    await setFlash("error", "Name is required");
    return NextResponse.redirect(new URL(`/teachers/${id}/edit`, request.url), {
      status: 303,
    });
  }

  // ─── Duplicate check: same name + phone (excluding self) ───────────────
  if (phone) {
    const conditions = [
      eq(schema.teachers.user_id, MASTER_USER_ID),
      eq(schema.teachers.name, name),
      eq(schema.teachers.phone, phone),
      ne(schema.teachers.id, id),
    ];
    const conflict = await db
      .select()
      .from(schema.teachers)
      .where(and(...conditions));
    if (conflict.length > 0) {
      await setFlash(
        "error",
        `Another teacher named ${name} with phone ${phone} already exists.`,
      );
      return NextResponse.redirect(
        new URL(`/teachers/${id}/edit`, request.url),
        { status: 303 },
      );
    }
  }

  // ─── Update ────────────────────────────────────────────────────────────
  await db
    .update(schema.teachers)
    .set({
      name,
      qualification,
      phone,
      email,
      pin,
    })
    .where(and(eq(schema.teachers.id, id), eq(schema.teachers.user_id, MASTER_USER_ID)));

  await setFlash("success", "Teacher updated successfully!");
  return NextResponse.redirect(new URL(`/teachers/${id}`, request.url), {
    status: 303,
  });
}
