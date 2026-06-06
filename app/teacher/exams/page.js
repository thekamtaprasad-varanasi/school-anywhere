export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);

export default async function TeacherExamsPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("teacher_session")?.value;
  if (!token) redirect("/teacher-login");

  try {
    await jwtVerify(token, SECRET);
  } catch {
    redirect("/teacher-login");
  }

  redirect("/exams");
}