// app/api/teachers/add/route.js
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
  const name = formData.get("name");
  const qualification = formData.get("qualification") || null;
  const phone = formData.get("phone") || null;
  const email = formData.get("email") || null;
  const pin = formData.get("pin");

  if (!name || !pin) {
    await setFlash("error", "Name and PIN are required");
    return NextResponse.redirect(new URL("/teachers/add", request.url), { status: 303 });
  }

  // ─── Duplicate check 1: PIN is globally unique ─────────────────────────
  const pinCheck = await db
    .select({ id: schema.teachers.id, name: schema.teachers.name })
    .from(schema.teachers)
    .where(eq(schema.teachers.pin, pin));
  if (pinCheck.length > 0) {
    await setFlash(
      "error",
      `PIN ${pin} is already in use. Please choose a different PIN.`,
    );
    return NextResponse.redirect(new URL("/teachers/add", request.url), { status: 303 });
  }

  // ─── Duplicate check 2: same name + phone in this user's teachers ──────
  if (phone) {
    const conditions = [
      eq(schema.teachers.user_id, MASTER_USER_ID),
      eq(schema.teachers.name, name),
      eq(schema.teachers.phone, phone),
    ];
    const existing = await db
      .select()
      .from(schema.teachers)
      .where(and(...conditions));
    if (existing.length > 0) {
      await setFlash(
        "error",
        `Teacher ${name} with phone ${phone} already exists.`,
      );
      return NextResponse.redirect(new URL("/teachers/add", request.url), { status: 303 });
    }
  }

  // ─── Insert ────────────────────────────────────────────────────────────
  await db.insert(schema.teachers).values({
    name,
    qualification,
    phone,
    email,
    pin,
    user_id: MASTER_USER_ID,
  });

  await setFlash("success", "Teacher added successfully!");
  return NextResponse.redirect(new URL("/teachers", request.url), { status: 303 });
}