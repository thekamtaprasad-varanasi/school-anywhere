// app/api/certificates/route.js

import { db } from "@/lib/db";
import { MASTER_USER_ID } from "@/lib/config";
import { certificates, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";

async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return null;
  const session = await getSession(token);
  if (!session) return null;
  const userResult = await db.select().from(users).where(eq(users.email, session.email));
  return userResult[0] || null;
}

export async function GET(request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("student_id");

  let rows;
  if (studentId) {
    rows = await db.select().from(certificates).where(
      and(
        eq(certificates.student_id, Number(studentId)),
        eq(certificates.user_id, MASTER_USER_ID)
      )
    );
  } else {
    rows = await db.select().from(certificates).where(
      eq(certificates.user_id, MASTER_USER_ID)
    );
  }

  return Response.json(rows);
}

export async function POST(request) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const {
    student_id,
    cert_type,
    issue_date,
    serial_no,
    reason,
    last_class,
    last_exam_passed,
    conduct,
    custom_content,
  } = body;

  if (!student_id || !cert_type || !issue_date) {
    return Response.json({ error: "Missing required fields" }, { status: 400 });
  }

  await db.insert(certificates).values({
    student_id: Number(student_id),
    cert_type,
    issue_date,
    serial_no: serial_no || null,
    reason: reason || null,
    last_class: last_class || null,
    last_exam_passed: last_exam_passed || null,
    conduct: conduct || "Good",
    custom_content: custom_content || null,
    user_id: MASTER_USER_ID,
  });

  return Response.json({ success: true });
}