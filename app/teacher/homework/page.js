export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { homeworks, teacher_subjects } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import DeleteHomework from "./DeleteHomework";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);

export default async function TeacherHomework() {
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

  const teacherId = payload.teacherId;

  const myHomeworks = await db
    .select()
    .from(homeworks)
    .where(eq(homeworks.teacher_id, teacherId))
    .orderBy(homeworks.created_at);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-700 px-4 py-4 flex justify-between items-center">
        <div>
          <p className="text-white font-bold">Homework</p>
          <p className="text-indigo-200 text-xs">{payload.teacherName}</p>
        </div>
        <Link href="/teacher/dashboard" className="text-indigo-200 text-sm">
          ← Back
        </Link>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        <Link
          href="/teacher/homework/add"
          className="block w-full bg-indigo-600 text-white text-center py-3 rounded-xl font-semibold mb-6 hover:bg-indigo-700 transition"
        >
          + Assign New Homework
        </Link>

        {myHomeworks.length === 0 ? (
          <p className="text-center text-gray-400 mt-10">
            No homework assigned yet.
          </p>
        ) : (
          <div className="space-y-3">
            {myHomeworks.map((hw) => (
              <div
                key={hw.id}
                className="bg-white rounded-xl border border-indigo-100 p-4 shadow-sm"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-800">{hw.title}</p>
                    <p className="text-xs text-indigo-600 mt-1">
                      {hw.subject} — Class {hw.class}
                      {hw.section ? ` (${hw.section})` : ""}
                    </p>
                    {hw.description && (
                      <p className="text-sm text-gray-600 mt-2">
                        {hw.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg whitespace-nowrap ml-2">
                    Due: {hw.due_date}
                  </span>
                </div>
                <div className="mt-3 flex justify-end">
                  <DeleteHomework homeworkId={hw.id} homeworkTitle={hw.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}