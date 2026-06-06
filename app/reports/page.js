export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { MASTER_USER_ID } from "@/lib/config";
import { students, fees, attendance, results, exams } from "@/lib/schema";
import { sql, eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { users } from "@/lib/schema";
import { and } from "drizzle-orm";

export default async function ReportsPage() {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("session")?.value);
  if (!session) redirect("/login");
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];
  const classWiseStudents = await db
    .select({ class: students.class, count: sql`COUNT(*)` })
    .from(students)
    .where(eq(students.user_id, MASTER_USER_ID))
    .groupBy(students.class)
    .orderBy(students.class);

  const classWiseFees = await db
    .select({
      class: students.class,
      total_pending: sql`SUM(CASE WHEN ${fees.status} = 'pending' THEN ${fees.amount} ELSE 0 END)`,
      total_paid: sql`SUM(CASE WHEN ${fees.status} = 'paid' THEN ${fees.amount} ELSE 0 END)`,
      pending_count: sql`SUM(CASE WHEN ${fees.status} = 'pending' THEN 1 ELSE 0 END)`,
      paid_count: sql`SUM(CASE WHEN ${fees.status} = 'paid' THEN 1 ELSE 0 END)`,
    })
    .from(fees)
    .leftJoin(students, eq(fees.student_id, students.id))
    .where(eq(students.user_id, MASTER_USER_ID))
    .groupBy(students.class)
    .orderBy(students.class);

  const classWiseAttendance = await db
    .select({
      class: students.class,
      present: sql`SUM(CASE WHEN ${attendance.status} = 'present' THEN 1 ELSE 0 END)`,
      absent: sql`SUM(CASE WHEN ${attendance.status} = 'absent' THEN 1 ELSE 0 END)`,
    })
    .from(attendance)
    .leftJoin(students, eq(attendance.student_id, students.id))
    .where(eq(students.user_id, MASTER_USER_ID))
    .groupBy(students.class)
    .orderBy(students.class);

  const examSummary = await db
    .select({
      exam_name: exams.name,
      class: exams.class,
      subject: exams.subject,
      exam_date: exams.exam_date,
      max_marks: exams.max_marks,
      passing_marks: exams.passing_marks,
      total_appeared: sql`COUNT(${results.id})`,
      total_passed: sql`SUM(CASE WHEN ${results.marks_obtained} >= ${exams.passing_marks} THEN 1 ELSE 0 END)`,
      avg_marks: sql`ROUND(AVG(${results.marks_obtained}), 1)`,
      top_marks: sql`MAX(${results.marks_obtained})`,
    })
    .from(exams)
    .leftJoin(results, eq(results.exam_id, exams.id))
    .where(eq(exams.user_id, MASTER_USER_ID))
    .groupBy(exams.id)
    .orderBy(sql`${exams.exam_date} DESC`);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          School summary at a glance
        </p>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              🎓 Class-wise Students
            </h2>
          </div>
          {classWiseStudents.length === 0 ? (
            <p className="text-sm text-gray-400 p-4">No data.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {classWiseStudents.map((row, i) => (
                <div
                  key={i}
                  className="flex justify-between items-center px-4 py-3"
                >
                  <p className="text-sm font-medium text-gray-900">
                    Class {row.class}
                  </p>
                  <p className="text-sm text-gray-600 font-semibold">
                    {row.count} students
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              💰 Fee Collection
            </h2>
          </div>
          {classWiseFees.length === 0 ? (
            <p className="text-sm text-gray-400 p-4">No data.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {classWiseFees.map((row, i) => (
                <div key={i} className="px-4 py-3">
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    Class {row.class || "—"}
                  </p>
                  <div className="flex gap-4 text-xs">
                    <span className="text-green-600">
                      ✓ ₹{row.total_paid || 0} ({row.paid_count || 0})
                    </span>
                    <span className="text-red-500">
                      ✗ ₹{row.total_pending || 0} ({row.pending_count || 0})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              ✅ Attendance
            </h2>
          </div>
          {classWiseAttendance.length === 0 ? (
            <p className="text-sm text-gray-400 p-4">No data.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {classWiseAttendance.map((row, i) => {
                const total =
                  (Number(row.present) || 0) + (Number(row.absent) || 0);
                const pct =
                  total > 0
                    ? ((Number(row.present) / total) * 100).toFixed(1)
                    : 0;
                return (
                  <div key={i} className="px-4 py-3">
                    <div className="flex justify-between items-center mb-1.5">
                      <p className="text-sm font-medium text-gray-900">
                        Class {row.class || "—"}
                      </p>
                      <p className="text-sm font-semibold text-gray-700">
                        {pct}%
                      </p>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="bg-green-500 h-1.5 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="flex gap-3 mt-1 text-xs">
                      <span className="text-green-600">
                        {row.present || 0} present
                      </span>
                      <span className="text-red-500">
                        {row.absent || 0} absent
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
            <h2 className="text-sm font-semibold text-gray-700">
              📝 Exam Results
            </h2>
          </div>
          {examSummary.length === 0 ? (
            <p className="text-sm text-gray-400 p-4">No exams found.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {examSummary.map((row, i) => (
                <div key={i} className="px-4 py-3">
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {row.exam_name}
                    </p>
                    <p className="text-xs text-gray-400">{row.exam_date}</p>
                  </div>
                  <p className="text-xs text-gray-500 mb-1.5">
                    Class {row.class} · {row.subject}
                  </p>
                  <div className="flex flex-wrap gap-3 text-xs">
                    <span className="text-gray-600">
                      Appeared: {row.total_appeared || 0}
                    </span>
                    <span className="text-green-600">
                      Passed: {row.total_passed || 0}
                    </span>
                    <span className="text-indigo-600">
                      Avg: {row.avg_marks || "—"}
                    </span>
                    <span className="text-indigo-800">
                      Top: {row.top_marks || "—"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
