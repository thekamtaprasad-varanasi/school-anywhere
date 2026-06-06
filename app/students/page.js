// app/students/page.js

export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { MASTER_USER_ID } from "@/lib/config";
import { students } from "@/lib/schema";
import Link from "next/link";
import DeleteStudentButton from "./DeleteStudentButton";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export default async function StudentsPage({ searchParams }) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("session")?.value);
  if (!session) redirect("/login");
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];
  const params = await searchParams;
  const search = params?.search?.toLowerCase() || "";
  const selectedClass = params?.class || "";
  const selectedYear = params?.year || "";
  const selectedSection = params?.section || "";

  const allStudents = await db
    .select()
    .from(students)
    .where(eq(students.user_id, MASTER_USER_ID));
  const classes = [...new Set(allStudents.map((s) => s.class))].sort();
  const sections = [
    ...new Set(allStudents.map((s) => s.section).filter(Boolean)),
  ].sort();
  const years = [
    ...new Set(allStudents.map((s) => s.academic_year).filter(Boolean)),
  ]
    .sort()
    .reverse();

  const filtered = allStudents.filter((s) => {
    const matchSearch =
      !search ||
      s.name?.toLowerCase().includes(search) ||
      s.roll_number?.toLowerCase().includes(search) ||
      s.father_name?.toLowerCase().includes(search) ||
      s.phone?.includes(search);
    const matchClass = !selectedClass || s.class === selectedClass;
    const matchSection = !selectedSection || s.section === selectedSection;
    const matchYear = !selectedYear || s.academic_year === selectedYear;
    return matchSearch && matchClass && matchSection && matchYear;
  });

  const grouped = {};
  filtered.forEach((s) => {
    const cls = s.class || "—";
    const sec = s.section || "—";
    if (!grouped[cls]) grouped[cls] = {};
    if (!grouped[cls][sec]) grouped[cls][sec] = [];
    grouped[cls][sec].push(s);
  });
  const sortedClasses = Object.keys(grouped).sort();

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Total enrolled: <strong>{allStudents.length}</strong> · Showing:{" "}
            {filtered.length}
          </p>
          <p className="text-amber-600 text-xs mt-1">
            Click on a student to view concession & details.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/students/import"
            className="bg-white border border-indigo-300 text-indigo-600 px-3 py-2 rounded-lg text-sm font-medium"
          >
            📥 Import
          </Link>
          <Link
            href="/students/add"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add
          </Link>
        </div>
      </div>

      <form
        method="GET"
        action="/students"
        className="bg-white rounded-xl border border-gray-100 p-3 mb-4 shadow-sm flex flex-col gap-2"
      >
        <input
          type="text"
          name="search"
          defaultValue={search}
          placeholder="🔍 Name, roll no, parent phone..."
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <div className="flex gap-2">
          <select
            name="class"
            defaultValue={selectedClass}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All Classes</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            name="section"
            defaultValue={selectedSection}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All Sections</option>
            {sections.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            name="year"
            defaultValue={selectedYear}
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="">All Years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Filter
          </button>
          {(search || selectedClass || selectedSection || selectedYear) && (
            <a
              href="/students"
              className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm"
            >
              ✕
            </a>
          )}
        </div>
      </form>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
          No students found.
        </div>
      ) : (
        <div className="space-y-5">
          {sortedClasses.map((cls) => {
            const sections = Object.keys(grouped[cls]).sort();
            const classTotal = sections.reduce(
              (sum, sec) => sum + grouped[cls][sec].length,
              0,
            );
            return (
              <div
                key={cls}
                className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden"
              >
                <div className="bg-indigo-600 px-4 py-2.5 flex justify-between items-center">
                  <span className="text-white font-bold text-sm">
                    Class {cls}
                  </span>
                  <span className="bg-white text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {classTotal} students
                  </span>
                </div>
                {sections.map((sec) => {
                  const sStudents = grouped[cls][sec];
                  return (
                    <div key={sec} className="border-t border-gray-100">
                      <div className="bg-indigo-50 px-4 py-2 flex justify-between items-center">
                        <span className="text-indigo-700 font-semibold text-xs">
                          Section {sec}
                        </span>
                        <span className="text-indigo-500 text-xs">
                          {sStudents.length} students
                        </span>
                      </div>
                      <div className="divide-y divide-gray-50">
                        {sStudents.map((student, idx) => (
                          <div
                            key={student.id}
                            className="px-4 py-2.5 flex justify-between items-center"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs text-gray-400 w-5 shrink-0">
                                {idx + 1}.
                              </span>
                              <div className="min-w-0">
                                <Link
                                  href={`/students/${student.id}`}
                                  className="text-sm font-medium text-gray-900 truncate hover:text-indigo-600"
                                >
                                  {student.name}
                                </Link>
                                <p className="text-xs text-gray-400">
                                  Roll {student.roll_number || "—"} ·{" "}
                                  {student.phone || "—"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 ml-2 shrink-0">
                              <Link
                                href={`/students/${student.id}/edit`}
                                className="text-xs text-indigo-600 font-medium"
                              >
                                Edit
                              </Link>
                              <DeleteStudentButton
                                studentId={student.id}
                                studentName={student.name}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
