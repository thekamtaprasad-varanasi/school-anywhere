import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { homeworks } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("teacher_session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/teacher-login", request.url), 303);
  }

  let payload;
  try {
    const verified = await jwtVerify(token, SECRET);
    payload = verified.payload;
  } catch {
    return NextResponse.redirect(new URL("/teacher-login", request.url), 303);
  }

  const formData = await request.formData();
  const homeworkId = parseInt(formData.get("homework_id"));
  if (!homeworkId) {
    return NextResponse.redirect(new URL("/teacher/homework", request.url), 303);
  }

  await db
    .delete(homeworks)
    .where(
      and(
        eq(homeworks.id, homeworkId),
        eq(homeworks.teacher_id, payload.teacherId),
      ),
    );

  return NextResponse.redirect(new URL("/teacher/homework", request.url), 303);
}