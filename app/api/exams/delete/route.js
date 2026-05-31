import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { exams, results, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  const session = await getSession(token);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const formData = await request.formData();
  const examId = parseInt(formData.get("exam_id"));
  if (!examId) {
    return NextResponse.redirect(new URL("/exams", request.url), 303);
  }

  // Verify exam belongs to this user
  const examResult = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, examId), eq(exams.user_id, 2)));
  if (examResult.length === 0) {
    return NextResponse.redirect(new URL("/exams", request.url), 303);
  }

  // Delete child rows first (results), then exam
  await db.delete(results).where(eq(results.exam_id, examId));
  await db.delete(exams).where(and(eq(exams.id, examId), eq(exams.user_id, 2)));

  return NextResponse.redirect(new URL("/exams", request.url), 303);
}