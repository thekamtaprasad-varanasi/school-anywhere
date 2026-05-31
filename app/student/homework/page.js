export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { students, homeworks, teachers } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";

export default async function StudentHomeworkPage() {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("student_session")?.value;
  if (!studentId) redirect("/student/login");

  const studentResult = await db
    .select()
    .from(students)
    .where(eq(students.id, parseInt(studentId)));
  if (studentResult.length === 0) redirect("/student/login");
  const student = studentResult[0];

  const myHomeworks = await db
    .select()
    .from(homeworks)
    .leftJoin(teachers, eq(homeworks.teacher_id, teachers.id))
    .where(
      and(
        eq(homeworks.class, student.class),
        eq(teachers.user_id, student.user_id),
      ),
    )
    .orderBy(homeworks.created_at);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-900 px-4 py-4 flex justify-between items-center">
        <div>
          <p className="text-white font-bold">Homework</p>
          <p className="text-indigo-200 text-xs">
            {student.name} — Class {student.class}
          </p>
        </div>
        <Link href="/student/dashboard" className="text-indigo-200 text-sm">
          ← Back
        </Link>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {myHomeworks.length === 0 ? (
          <p className="text-center text-gray-400 mt-10">
            No homework assigned yet.
          </p>
        ) : (
          <div className="space-y-3 mt-4">
            {myHomeworks.map((hw) => {
              const h = hw.homeworks;
              const t = hw.teachers;
              return (
                <div
                  key={h.id}
                  className="bg-white rounded-xl border border-indigo-100 p-4 shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-gray-800">{h.title}</p>
                      <p className="text-xs text-indigo-600 mt-1">
                        {h.subject}
                        {h.section ? ` (${h.section})` : ""}
                      </p>
                      {t?.name && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          — {t.name}
                        </p>
                      )}
                      {h.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {h.description}
                        </p>
                      )}
                    </div>
                    {h.due_date && (
                      <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg whitespace-nowrap ml-4">
                        Due: {h.due_date}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}