export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { students, attendance, teacher_subjects } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { teachers } from "@/lib/schema";
import AttendanceForm from "@/app/attendance/mark/AttendanceForm";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);

export default async function TeacherAttendancePage({ searchParams }) {
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
  const teacherRow = await db
    .select()
    .from(teachers)
    .where(eq(teachers.id, teacherId));
  const teacher = teacherRow[0];
  const params = await searchParams;
  const today = new Date().toISOString().split("T")[0];
  const selectedDate = params?.date || today;
  const selectedClass = params?.class || "";

  // Teacher  assigned classes
  const assignedSubjects = await db
    .select()
    .from(teacher_subjects)
    .where(eq(teacher_subjects.teacher_id, teacherId));

  const assignedClasses = [...new Set(assignedSubjects.map((s) => s.class))];

  if (assignedClasses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">No classes assigned yet.</p>
          <p className="text-gray-400 text-xs mt-1">Contact your principal.</p>
        </div>
      </div>
    );
  }

  const allStudents = await db
    .select()
    .from(students)
    .where(eq(students.user_id, teacher.user_id));
  const filteredStudents = allStudents.filter(
    (s) =>
      assignedClasses.includes(s.class) &&
      (!selectedClass || s.class === selectedClass),
  );

  const existing = await db
    .select()
    .from(attendance)
    .where(eq(attendance.date, selectedDate));
  const attendanceMap = {};
  existing.forEach((a) => {
    attendanceMap[a.student_id] = a.status;
  });

  const alreadyMarked = existing.length > 0;

  const grouped = {};
  filteredStudents.forEach((s) => {
    const cls = s.class || "—";
    const sec = s.section || "—";
    const key = `${cls}||${sec}`;
    if (!grouped[key]) grouped[key] = { cls, sec, students: [] };
    grouped[key].students.push(s);
  });

  const sortedKeys = Object.keys(grouped).sort((a, b) => {
    const [ac, as_] = a.split("||");
    const [bc, bs] = b.split("||");
    const nc = parseInt(ac) - parseInt(bc);
    if (!isNaN(nc) && nc !== 0) return nc;
    return as_.localeCompare(bs);
  });

  const presentCount = filteredStudents.filter(
    (s) => attendanceMap[s.id] === "present",
  ).length;
  const absentCount = filteredStudents.filter(
    (s) => attendanceMap[s.id] === "absent",
  ).length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-700 px-4 py-4 flex justify-between items-center">
        <div>
          <p className="text-white font-bold">{payload.teacherName}</p>
          <p className="text-indigo-200 text-xs">Teacher Portal</p>
        </div>
        <a
          href="/api/teacher-logout"
          className="text-red-300 text-sm font-medium"
        >
          Logout
        </a>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <h1 className="text-xl font-bold text-gray-900">Mark Attendance</h1>
          <p className="text-gray-500 text-xs mt-0.5">{selectedDate}</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
          <form className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Date</label>
                <input
                  type="date"
                  name="date"
                  defaultValue={selectedDate}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">
                  Class
                </label>
                <select
                  name="class"
                  defaultValue={selectedClass}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">All My Classes</option>
                  {assignedClasses.map((c) => (
                    <option key={c} value={c}>
                      Class {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-gray-800 text-white py-2 rounded-lg text-sm font-medium"
            >
              Filter
            </button>
          </form>
        </div>

        {alreadyMarked && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-4 text-xs text-yellow-800">
            ⚠️ Attendance already marked for this date.
            <span className="ml-2 font-semibold">
              P: {presentCount} · A: {absentCount}
            </span>
          </div>
        )}

        <AttendanceForm
          selectedDate={selectedDate}
          attendanceMap={attendanceMap}
          sortedKeys={sortedKeys}
          grouped={grouped}
        />
      </div>
    </div>
  );
}
