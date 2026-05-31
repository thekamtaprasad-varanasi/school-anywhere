export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect, notFound } from "next/navigation";
import { db } from "@/lib/db";
import { students, teachers } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import EditStudentForm from "./EditStudentForm";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);

export default async function TeacherEditStudentPage({ params }) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get("teacher_session")?.value;
  if (!token) redirect("/teacher-login");

  let payload;
  try {
    const verified = await jwtVerify(token, SECRET);
    payload = verified.payload;
  } catch {
    redirect("/teacher-login");
  }

  const teacherResult = await db
    .select()
    .from(teachers)
    .where(eq(teachers.id, payload.teacherId));
  const teacher = teacherResult[0];
  if (!teacher) redirect("/teacher-login");

  const result = await db
    .select()
    .from(students)
    .where(
      and(
        eq(students.id, Number(id)),
        eq(students.user_id, teacher.user_id),
      ),
    );
  if (result.length === 0) notFound();
  const s = result[0];

  const classes = [
    "Nursery",
    "LKG",
    "UKG",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];

  return <EditStudentForm s={s} classes={classes} />;
}