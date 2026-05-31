// app/api/students/next-admission-no/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq, and, like } from "drizzle-orm";
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

  // ─── Academic year (April–March cycle) ─────────────────────────────────
  const now = new Date();
  const year = now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
  const prefix = `ADM-${year}-`;

  // ─── Find existing numbers with this prefix ────────────────────────────
  const existing = await db
    .select({ admission_no: schema.students.admission_no })
    .from(schema.students)
    .where(
      and(
        eq(schema.students.user_id, 2),
        like(schema.students.admission_no, `${prefix}%`),
      ),
    );

  // ─── Extract numeric portion, find max ─────────────────────────────────
  let maxNum = 0;
  for (const row of existing) {
    const numPart = row.admission_no?.slice(prefix.length);
    const n = parseInt(numPart, 10);
    if (!isNaN(n) && n > maxNum) maxNum = n;
  }

  const nextNum = maxNum + 1;
  const padded = String(nextNum).padStart(4, "0");
  const nextAdmissionNo = `${prefix}${padded}`;

  return NextResponse.json({ admission_no: nextAdmissionNo });
}