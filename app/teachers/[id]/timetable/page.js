export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { MASTER_USER_ID } from "@/lib/config";
import {
  teachers,
  teacher_subjects,
  timetable,
  period_timings,
  users,
} from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import WeekScheduleForm from "./WeekScheduleForm";

export default async function TeacherTimetablePage({ params }) {
  const { id } = await params;
  const teacherId = parseInt(id);
  if (!teacherId) notFound();

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) redirect("/login");
  const session = await getSession(token);
  if (!session) redirect("/login");

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];
  if (!user) redirect("/login");

  // Fetch teacher
  const teacherResult = await db
    .select()
    .from(teachers)
    .where(and(eq(teachers.id, teacherId), eq(teachers.user_id, MASTER_USER_ID)));
  const teacher = teacherResult[0];
  if (!teacher) notFound();

  // Parallel fetch: assigned subjects + period_timings + existing entries
  const [subjects, timings, existingEntries] = await Promise.all([
    db
      .select()
      .from(teacher_subjects)
      .where(eq(teacher_subjects.teacher_id, teacherId)),
    db
      .select()
      .from(period_timings)
      .where(eq(period_timings.user_id, MASTER_USER_ID))
      .orderBy(period_timings.period_no),
    db
      .select()
      .from(timetable)
      .where(
        and(
          eq(timetable.user_id, MASTER_USER_ID),
          eq(timetable.teacher_name, teacher.name),
        ),
      ),
  ]);

  const uniqueSubjects = [...new Set(subjects.map((s) => s.subject))];
  const totalPeriods = timings.length;

  // Build day -> period -> entry map for pre-filling
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  const dayPeriodMap = {};
  days.forEach((d) => {
    dayPeriodMap[d] = {};
  });

  existingEntries.forEach((e) => {
    if (!dayPeriodMap[e.day]) dayPeriodMap[e.day] = {};
    // Parse "5-A" into class + section
    const parts = (e.class || "").split("-");
    dayPeriodMap[e.day][e.period] = {
      subject: e.subject || "",
      className: parts[0] || "",
      section: parts[1] || "",
    };
  });

  const allClasses = [
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

  const allSections = ["A", "B", "C", "D", "E"];

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Timetable</h1>
          <p className="text-gray-500 text-sm mt-1">
            {teacher.name} — fill Monday first, then mark other days same or set differently
          </p>
        </div>
        <Link
          href={`/teachers/${teacherId}`}
          className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 text-sm font-medium"
        >
          ← Back
        </Link>
      </div>

      {totalPeriods === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 max-w-2xl">
          <p className="text-sm text-yellow-800 font-medium mb-2">
            ⚠ Period timings not set yet
          </p>
          <p className="text-xs text-yellow-700 mb-3">
            Please configure school-wide period timings first. One-time setup.
          </p>
          <Link
            href="/settings/periods"
            className="inline-block bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700"
          >
            Go to Period Settings →
          </Link>
        </div>
      ) : (
        <>
          {subjects.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-5 max-w-4xl">
              <p className="text-xs text-blue-700 font-medium mb-1">
                Assigned subjects (reference)
              </p>
              <div className="flex flex-wrap gap-2 mt-1">
                {subjects.map((s) => (
                  <span
                    key={s.id}
                    className="bg-white text-blue-700 text-xs px-2.5 py-1 rounded-full border border-blue-200"
                  >
                    {s.subject} · Class {s.class}
                    {s.section ? ` (${s.section})` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}

          <WeekScheduleForm
            teacherId={teacherId}
            timings={timings}
            totalPeriods={totalPeriods}
            uniqueSubjects={uniqueSubjects}
            allClasses={allClasses}
            allSections={allSections}
            dayPeriodMap={dayPeriodMap}
            days={days}
          />
        </>
      )}
    </div>
  );
}