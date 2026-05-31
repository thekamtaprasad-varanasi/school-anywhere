import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { results, users } from "@/lib/schema";
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
  const exam_id = parseInt(formData.get("exam_id"));
  const studentIds = formData.getAll("student_id");

  for (const sid of studentIds) {
    const marks = formData.get(`marks_${sid}`);
    if (marks === "" || marks === null) continue;

    const marksNum = parseFloat(marks);
    if (isNaN(marksNum)) continue;

    const remarks = formData.get(`remarks_${sid}`) || "";

    let grade = "F";
    if (marksNum >= 90) grade = "A+";
    else if (marksNum >= 75) grade = "A";
    else if (marksNum >= 60) grade = "B";
    else if (marksNum >= 45) grade = "C";
    else if (marksNum >= 33) grade = "D";

    const existing = await db
      .select()
      .from(results)
      .where(
        and(
          eq(results.exam_id, exam_id),
          eq(results.student_id, parseInt(sid)),
        ),
      );

    if (existing.length > 0) {
      await db
        .update(results)
        .set({ marks_obtained: marksNum, grade, remarks })
        .where(
          and(
            eq(results.exam_id, exam_id),
            eq(results.student_id, parseInt(sid)),
            eq(results.user_id, 2),
          ),
        );
    } else {
      await db.insert(results).values({
        exam_id,
        student_id: parseInt(sid),
        marks_obtained: marksNum,
        grade,
        remarks,
        user_id: 2,
      });
    }
  }

  return NextResponse.redirect(new URL("/exams", request.url), 303);
}