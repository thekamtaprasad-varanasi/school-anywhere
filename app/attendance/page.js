export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { students, attendance } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { users } from "@/lib/schema";
import { and } from "drizzle-orm";

export default async function AttendancePage({ searchParams }) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("session")?.value);
  if (!session) redirect("/login");
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];
  const params = await searchParams;
  const today = new Date().toISOString().split("T")[0];
  const selectedDate = params?.date || today;
  const selectedClass = params?.class || "";

  const allStudents = await db
    .select()
    .from(students)
    .where(eq(students.user_id, 2));

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

  const filteredStudents = selectedClass
    ? allStudents.filter((s) => s.class === selectedClass)
    : allStudents;

  const todayAttendance = await db
    .select()
    .from(attendance)
    .leftJoin(students, eq(attendance.student_id, students.id))
    .where(and(eq(attendance.date, selectedDate), eq(students.user_id, 2)));
  const attendanceMap = {};
  todayAttendance.forEach((a) => {
    attendanceMap[a.student_id] = a.status;
  });

  const presentCount = filteredStudents.filter(
    (s) => attendanceMap[s.id] === "present",
  ).length;
  const absentCount = filteredStudents.filter(
    (s) => attendanceMap[s.id] === "absent",
  ).length;
  const notMarked = filteredStudents.filter((s) => !attendanceMap[s.id]).length;

  const classWiseSummary = classes.map((cls) => {
    const clsStudents = allStudents.filter((s) => s.class === cls);
    const present = clsStudents.filter(
      (s) => attendanceMap[s.id] === "present",
    ).length;
    const absent = clsStudents.filter(
      (s) => attendanceMap[s.id] === "absent",
    ).length;
    const unmarked = clsStudents.filter((s) => !attendanceMap[s.id]).length;
    return { cls, total: clsStudents.length, present, absent, unmarked };
  });

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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Student Attendance
          </h1>
          <p className="text-gray-500 text-xs mt-0.5">{selectedDate}</p>
        </div>
        <Link
          href={`/attendance/mark?date=${selectedDate}&class=${selectedClass}`}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Mark
        </Link>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 shadow-sm">
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
              <label className="block text-xs text-gray-500 mb-1">Class</label>
              <select
                name="class"
                defaultValue={selectedClass}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Classes</option>
                {classes.map((c) => (
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
            Show
          </button>
        </form>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
          <div className="text-xl font-bold text-green-700">{presentCount}</div>
          <div className="text-xs text-green-600 mt-0.5">Present</div>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
          <div className="text-xl font-bold text-red-600">{absentCount}</div>
          <div className="text-xs text-red-500 mt-0.5">Absent</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-200">
          <div className="text-xl font-bold text-gray-500">{notMarked}</div>
          <div className="text-xs text-gray-400 mt-0.5">Not Marked</div>
        </div>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 text-sm text-blue-800">
        👉 To mark attendance, tap{" "}
        <span className="font-semibold">"Mark →"</span> next to any class below.
      </div>
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-5">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-sm font-semibold text-gray-700">
            Class-wise — {selectedDate}
          </h2>
          {selectedClass && (
            <a
              href={`/attendance?date=${selectedDate}`}
              className="text-xs text-indigo-500 font-medium"
            >
              Show All
            </a>
          )}
        </div>
        <div className="divide-y divide-gray-50">
          {classWiseSummary.map(({ cls, total, present, absent, unmarked }) => {
            const pct = total > 0 ? ((present / total) * 100).toFixed(0) : 0;
            return (
              <div
                key={cls}
                className={`px-4 py-3 ${cls === selectedClass ? "bg-indigo-50" : ""}`}
              >
                <div className="flex justify-between items-center mb-1.5">
                  <a
                    href={`/attendance?date=${selectedDate}&class=${cls}`}
                    className="text-sm font-semibold text-indigo-700 hover:underline"
                  >
                    Class {cls}
                  </a>
                  <div className="flex gap-3 items-center">
                    <span className="text-xs font-bold text-gray-700">
                      {pct}%
                    </span>
                    <a
                      href={`/attendance/mark?date=${selectedDate}&class=${cls}`}
                      className="text-xs text-indigo-500 font-medium"
                    >
                      Mark →
                    </a>
                  </div>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 mb-1.5">
                  <div
                    className="bg-green-500 h-1.5 rounded-full"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex gap-4 text-xs">
                  <span className="text-gray-500">Total: {total}</span>
                  <span className="text-green-600">Present: {present}</span>
                  <span className="text-red-500">Absent: {absent}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {sortedKeys.map((key) => {
          const { cls, sec, students: secStudents } = grouped[key];
          const secPresent = secStudents.filter(
            (s) => attendanceMap[s.id] === "present",
          ).length;
          const secAbsent = secStudents.filter(
            (s) => attendanceMap[s.id] === "absent",
          ).length;
          const secUnmarked = secStudents.filter(
            (s) => !attendanceMap[s.id],
          ).length;
          return (
            <div
              key={key}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="bg-indigo-50 px-4 py-2 flex justify-between items-center border-b border-indigo-100">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-800 font-bold text-sm">
                    Class {cls}
                  </span>
                  {sec !== "—" && (
                    <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">
                      Sec {sec}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    · {secStudents.length} students
                  </span>
                </div>
                <div className="flex gap-3 text-xs font-medium">
                  <span className="text-green-600">P:{secPresent}</span>
                  <span className="text-red-500">A:{secAbsent}</span>
                  {secUnmarked > 0 && (
                    <span className="text-yellow-500">?:{secUnmarked}</span>
                  )}
                </div>
              </div>
              <div className="divide-y divide-gray-50">
                {[...secStudents]
                  .sort((a, b) => {
                    const ra = parseInt(a.roll_number),
                      rb = parseInt(b.roll_number);
                    if (!isNaN(ra) && !isNaN(rb)) return ra - rb;
                    return (a.name || "").localeCompare(b.name || "");
                  })
                  .map((student) => (
                    <div
                      key={student.id}
                      className="px-4 py-2.5 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {student.name}
                        </p>
                        <p className="text-gray-400 text-xs">
                          Roll {student.roll_number || "—"}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full font-medium ${
                          attendanceMap[student.id] === "present"
                            ? "bg-green-100 text-green-700"
                            : attendanceMap[student.id] === "absent"
                              ? "bg-red-100 text-red-700"
                              : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {attendanceMap[student.id] === "present"
                          ? "✓ Present"
                          : attendanceMap[student.id] === "absent"
                            ? "✗ Absent"
                            : "—"}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
