export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { MASTER_USER_ID } from "@/lib/config";
import { students, users } from "@/lib/schema";
import { desc, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdmissionsPage() {
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

  const allStudents = await db
    .select()
    .from(students)
    .where(eq(students.user_id, MASTER_USER_ID))
    .orderBy(desc(students.admission_date));

  const now = new Date();
  const currentYear =
    now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
  const academicYearStart = new Date(currentYear, 3, 1);

  const newStudents = allStudents.filter(
    (s) => s.admission_date && new Date(s.admission_date) >= academicYearStart,
  );
  const oldStudents = allStudents.filter(
    (s) => !s.admission_date || new Date(s.admission_date) < academicYearStart,
  );

  const newByClass = {};
  newStudents.forEach((s) => {
    const cls = s.class || "—";
    if (!newByClass[cls]) newByClass[cls] = [];
    newByClass[cls].push(s);
  });

  const oldByClass = {};
  oldStudents.forEach((s) => {
    const cls = s.class || "—";
    oldByClass[cls] = (oldByClass[cls] || 0) + 1;
  });

  const allClasses = [
    ...new Set(allStudents.map((s) => s.class || "—")),
  ].sort();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Admissions</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Academic Year {currentYear}–{currentYear + 1}
          </p>
        </div>
      <div className="flex gap-2">
          <Link
            href="/admissions/applications"
            className="bg-white border border-amber-300 text-amber-700 px-3 py-2 rounded-lg text-sm font-medium"
          >
            📋 Online Applications
          </Link>
          <Link
            href="/students/add"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + New Admission
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 text-center">
          <div className="text-2xl font-bold text-indigo-700">
            {allStudents.length}
          </div>
          <div className="text-xs text-indigo-500 mt-1">Total Enrolled</div>
        </div>
        <div className="bg-green-50 rounded-xl p-4 border border-green-100 text-center">
          <div className="text-2xl font-bold text-green-700">
            {newStudents.length}
          </div>
          <div className="text-xs text-green-500 mt-1">New This Year</div>
        </div>
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-100 text-center">
          <div className="text-2xl font-bold text-yellow-700">
            {oldStudents.length}
          </div>
          <div className="text-xs text-yellow-600 mt-1">Returning Students</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden mb-6">
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            📊 Class-wise Summary
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {allClasses.map((cls) => {
            const nw = newByClass[cls]?.length || 0;
            const old = oldByClass[cls] || 0;
            return (
              <div
                key={cls}
                className="px-4 py-3 flex items-center justify-between"
              >
                <span className="text-sm font-semibold text-gray-800">
                  Class {cls}
                </span>
                <div className="flex gap-4 text-xs">
                  <span className="text-green-600 font-medium">New: {nw}</span>
                  <span className="text-gray-500">Returning: {old}</span>
                  <span className="text-indigo-600 font-bold">
                    Total: {nw + old}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {newStudents.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3">
            🆕 New Admissions This Year ({newStudents.length})
          </h2>
          <div className="space-y-4">
            {allClasses
              .filter((c) => newByClass[c]?.length > 0)
              .map((cls) => (
                <div
                  key={cls}
                  className="bg-white rounded-xl border border-green-100 shadow-sm overflow-hidden"
                >
                  <div className="bg-green-50 px-4 py-2.5 flex justify-between items-center border-b border-green-100">
                    <span className="text-green-800 font-bold text-sm">
                      Class {cls}
                    </span>
                    <span className="text-green-600 text-xs">
                      {newByClass[cls].length} new admissions
                    </span>
                  </div>
                  <div className="divide-y divide-gray-50">
                    {newByClass[cls].map((s, idx) => (
                      <div
                        key={s.id}
                        className="px-4 py-2.5 flex justify-between items-center"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs text-gray-400 w-5 shrink-0">
                            {idx + 1}.
                          </span>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900">
                              {s.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              Section {s.section || "—"} · Roll{" "}
                              {s.roll_number || "—"}
                            </p>
                            <p className="text-xs text-gray-400">
                              👤 {s.parent_name || "—"} · 📞{" "}
                              {s.parent_phone || "—"}
                            </p>
                            <p className="text-xs text-indigo-500">
                              📅{" "}
                              {s.admission_date
                                ? new Date(s.admission_date).toLocaleDateString(
                                    "en-IN",
                                    {
                                      day: "numeric",
                                      month: "long",
                                      year: "numeric",
                                    },
                                  )
                                : "—"}
                            </p>
                          </div>
                        </div>
                        <Link
                          href={`/students/${s.id}`}
                          className="text-xs font-medium text-indigo-600 ml-3 shrink-0"
                        >
                          View →
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {oldStudents.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 mb-3">
            Returning Students ({oldStudents.length})
          </h2>
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-50">
              {allClasses
                .filter((c) => oldByClass[c] > 0)
                .map((cls) => (
                  <div
                    key={cls}
                    className="px-4 py-3 flex justify-between items-center"
                  >
                    <span className="text-sm text-gray-700">Class {cls}</span>
                    <span className="text-sm font-semibold text-gray-600">
                      {oldByClass[cls]} students
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {allStudents.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          No admissions yet.
        </div>
      )}
    </div>
  );
}
