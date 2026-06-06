export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { MASTER_USER_ID } from "@/lib/config";
import { teachers, timetable, teacher_subjects } from "@/lib/schema";
import Link from "next/link";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export default async function TeachersPage() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("session")?.value);
  if (!session) redirect("/login");
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];
  const allTeachers = await db
    .select()
    .from(teachers)
    .where(eq(teachers.user_id, MASTER_USER_ID))
    .orderBy(teachers.name);
  const allPeriods = await db
    .select()
    .from(timetable)
    .where(eq(timetable.user_id, MASTER_USER_ID));

  const allSubjects = await db
    .select()
    .from(teacher_subjects)
    .where(eq(teacher_subjects.user_id, MASTER_USER_ID));
  const subjectCount = {};
  allSubjects.forEach((s) => {
    subjectCount[s.subject] = (subjectCount[s.subject] || 0) + 1;
  });

  const teacherSubjectCount = {};
  allSubjects.forEach((s) => {
    teacherSubjectCount[s.teacher_id] =
      (teacherSubjectCount[s.teacher_id] || 0) + 1;
  });

  const teacherPeriods = {};
  allPeriods.forEach((p) => {
    if (!p.teacher_name) return;
    if (!teacherPeriods[p.teacher_name]) teacherPeriods[p.teacher_name] = [];
    teacherPeriods[p.teacher_name].push(p);
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Teachers</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            {allTeachers.length} staff members
          </p>
        </div>
        <Link
          href="/teachers/add"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Add
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-5">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            📚 Subject-wise Staff
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 p-4">
          {Object.entries(subjectCount)
            .sort()
            .map(([sub, cnt]) => (
              <span
                key={sub}
                className="bg-indigo-50 text-indigo-700 text-xs font-medium px-3 py-1.5 rounded-full border border-indigo-100"
              >
                {sub}: {cnt}
              </span>
            ))}
        </div>
      </div>

      {allTeachers.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          No teachers found. Add your first teacher.
        </div>
      ) : (
        <div className="space-y-3">
          {allTeachers.map((teacher) => {
            const periods = teacherPeriods[teacher.name] || [];
            const subjectsAssigned = teacherSubjectCount[teacher.id] || 0;
            const byDay = {};
            periods.forEach((p) => {
              if (!byDay[p.day]) byDay[p.day] = [];
              byDay[p.day].push(p);
            });
            const dayOrder = [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
              "Saturday",
            ];
            const sortedDays = dayOrder.filter((d) => byDay[d]);

            return (
              <div
                key={teacher.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
              >
                <div className="px-4 py-3 flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900 text-sm">
                        {teacher.name}
                      </p>
                    </div>
                    <p className="text-gray-400 text-xs mt-1">
                      {teacher.qualification || "—"}
                      {teacher.phone ? ` · 📞 ${teacher.phone}` : ""}
                    </p>
                    {teacher.email && (
                      <p className="text-gray-400 text-xs">{teacher.email}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-0.5">
                      {subjectsAssigned > 0
                        ? `Teaches ${subjectsAssigned} ${
                            subjectsAssigned === 1 ? "class" : "classes"
                          }`
                        : "No classes assigned yet"}
                    </p>
                  </div>
                  <div className="ml-3 shrink-0 flex flex-col gap-1 items-end">
                    <Link
                      href={`/teachers/${teacher.id}/timetable`}
                      className="text-xs font-medium text-green-600"
                    >
                      📅 Timetable
                    </Link>
                    <Link
                      href={`/teachers/${teacher.id}`}
                      className="text-xs font-medium text-indigo-600"
                    >
                      Edit Subjects
                    </Link>
                    <form method="POST" action="/api/teachers/delete">
                      <input type="hidden" name="id" value={teacher.id} />
                      <button
                        type="submit"
                        className="text-xs font-medium text-red-500"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>

                {sortedDays.length > 0 && (
                  <div className="border-t border-gray-100 px-4 py-3 bg-gray-50">
                    <p className="text-xs font-semibold text-gray-500 mb-2">
                      📅 Period Schedule
                    </p>
                    <div className="space-y-1.5">
                      {sortedDays.map((day) => (
                        <div
                          key={day}
                          className="flex flex-wrap gap-1.5 items-center"
                        >
                          <span className="text-xs text-gray-500 w-8 shrink-0">
                            {day.slice(0, 3)}:
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {byDay[day]
                              .sort((a, b) => a.period - b.period)
                              .map((p) => (
                                <span
                                  key={p.id}
                                  className="bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded"
                                >
                                  P{p.period} · {p.class} · {p.subject} ·{" "}
                                  {p.start_time}–{p.end_time}
                                </span>
                              ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
