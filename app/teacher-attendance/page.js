// app/teacher-attendance/page.js
export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { MASTER_USER_ID } from "@/lib/config";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { teachers, teacher_attendance, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import StaffAttendanceForm from "./StaffAttendanceForm";

export default async function TeacherAttendancePage({ searchParams }) {
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

  const params = await searchParams;
  const today = new Date().toISOString().split("T")[0];
  const selectedDate = params?.date || today;

  const allTeachers = await db
    .select()
    .from(teachers)
    .where(eq(teachers.user_id, MASTER_USER_ID));

  const existing = await db
    .select()
    .from(teacher_attendance)
    .where(
      and(
        eq(teacher_attendance.date, selectedDate),
        eq(teacher_attendance.user_id, MASTER_USER_ID),
      ),
    );

  const attendanceMap = {};
  existing.forEach((a) => {
    attendanceMap[a.teacher_id] = { status: a.status, note: a.note };
  });

  const alreadyMarked = existing.length > 0;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Teacher Attendance
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">{selectedDate}</p>
        </div>
        <Link
          href="/dashboard"
          className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
        >
          ← Back
        </Link>
      </div>

      <form className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input
              type="date"
              name="date"
              defaultValue={selectedDate}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Filter
          </button>
        </div>
      </form>

      {alreadyMarked && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4 text-xs text-yellow-800">
          ⚠️ Attendance already marked for this date. Submitting again will
          update it.
        </div>
      )}

      {allTeachers.length === 0 ? (
        <p className="text-center text-gray-400 mt-10">No teachers found.</p>
      ) : (
        <StaffAttendanceForm
          selectedDate={selectedDate}
          allTeachers={allTeachers}
          attendanceMap={attendanceMap}
        />
      )}
    </div>
  );
}
