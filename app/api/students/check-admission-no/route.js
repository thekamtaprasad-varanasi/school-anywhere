// app/api/students/check-admission-no/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq, and, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";

export async function GET(request) {
  // ─── Auth ──────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const session = await getSession(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userResult = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, session.email));
  const user = userResult[0];
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ─── Read query params ─────────────────────────────────────────────────
  const { searchParams } = new URL(request.url);
  const admissionNo = searchParams.get("admission_no")?.trim() || "";
  const excludeId = searchParams.get("exclude_id");

  // ─── Empty input is always "available" ─────────────────────────────────
  if (!admissionNo) {
    return NextResponse.json({ available: true });
  }

  // ─── Build conditions ──────────────────────────────────────────────────
  const conditions = [
    eq(schema.students.user_id, 2),
    eq(schema.students.admission_no, admissionNo),
  ];

  // For edit case: exclude current student's own id
  if (excludeId) {
    const idNum = parseInt(excludeId, 10);
    if (!isNaN(idNum)) {
      conditions.push(ne(schema.students.id, idNum));
    }
  }

  // ─── Check for existing ────────────────────────────────────────────────
  const existing = await db
    .select({
      id: schema.students.id,
      name: schema.students.name,
      class: schema.students.class,
      section: schema.students.section,
    })
    .from(schema.students)
    .where(and(...conditions));

  if (existing.length > 0) {
    const s = existing[0];
    return NextResponse.json({
      available: false,
      conflict: {
        name: s.name,
        class: s.class,
        section: s.section,
      },
    });
  }

  return NextResponse.json({ available: true });
}