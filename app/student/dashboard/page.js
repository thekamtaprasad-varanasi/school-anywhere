export const dynamic = "force-dynamic";
import { db } from "@/lib/db";
import {
  students,
  attendance,
  results,
  exams,
  notices,
  homeworks,
  teachers,
  fees,
  fee_payments,
  school_settings,
} from "@/lib/schema";
import { eq, and, desc } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import PaymentQR from "@/components/PaymentQR";

export default async function StudentDashboardPage() {
  const cookieStore = await cookies();
  const studentId = cookieStore.get("student_session")?.value;

  if (!studentId) redirect("/student/login");

  const studentResult = await db
    .select()
    .from(students)
    .where(eq(students.id, parseInt(studentId)));
  if (studentResult.length === 0) redirect("/student/login");
  const student = studentResult[0];

  const attendanceRecords = await db
    .select()
    .from(attendance)
    .where(eq(attendance.student_id, student.id));
  const totalDays = attendanceRecords.length;
  const presentDays = attendanceRecords.filter(
    (a) => a.status === "present",
  ).length;
  const attendancePercent =
    totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

  const allNotices = await db
    .select()
    .from(notices)
    .where(eq(notices.user_id, student.user_id))
    .orderBy(notices.created_at)
    .limit(5);

  const examResults = await db
    .select({
      marks_obtained: results.marks_obtained,
      grade: results.grade,
      exam_name: exams.name,
      subject: exams.subject,
      max_marks: exams.max_marks,
    })
    .from(results)
    .leftJoin(exams, eq(results.exam_id, exams.id))
    .where(eq(results.student_id, student.id));

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

  const myFees = await db
    .select()
    .from(fees)
    .where(eq(fees.student_id, student.id))
    .orderBy(fees.due_date);

  const settingsResult = await db
    .select()
    .from(school_settings)
    .where(eq(school_settings.user_id, student.user_id));
  const settings = settingsResult[0] || {};

  const myPayments = await db
    .select()
    .from(fee_payments)
    .where(eq(fee_payments.student_id, student.id))
    .orderBy(desc(fee_payments.paid_date));

  const todayDate = new Date();
  const feeSummary = {
    total: myFees.reduce((s, f) => s + (f.amount || 0), 0),
    paid: myFees.reduce((s, f) => s + (f.paid_amount || 0), 0),
    pending: myFees
      .filter((f) => f.status !== "paid")
      .reduce((s, f) => s + ((f.amount || 0) - (f.paid_amount || 0)), 0),
    overdue: myFees
      .filter(
        (f) =>
          f.status !== "paid" && f.due_date && new Date(f.due_date) < todayDate,
      )
      .reduce((s, f) => s + ((f.amount || 0) - (f.paid_amount || 0)), 0),
  };

  // Pending = due_date today or future
  const today = new Date().toISOString().slice(0, 10);
  const pendingHomeworks = myHomeworks.filter(
    (hw) => hw.homeworks.due_date && hw.homeworks.due_date >= today,
  );

  const recentHomeworks = myHomeworks.slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-indigo-900 text-white px-8 py-4 flex justify-between items-center">
        <div className="font-bold text-lg">
          Nishant School — Students Portal
        </div>
        <div className="flex items-center gap-4">
          <span className="text-indigo-200 text-sm">{student.name}</span>
          <a
            href="/api/student/logout"
            className="text-red-300 text-sm hover:text-red-100"
          >
            Logout
          </a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">Profile</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>{" "}
              <span className="font-medium">{student.name}</span>
            </div>
            <div>
              <span className="text-gray-500">Class:</span>{" "}
              <span className="font-medium">
                {student.class} — {student.section}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Roll No:</span>{" "}
              <span className="font-medium">{student.roll_number}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600">
              {attendancePercent}%
            </div>
            <div className="text-sm text-gray-500 mt-1">Attendance</div>
            <div className="text-xs text-gray-400 mt-1">
              {presentDays} / {totalDays} days
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="text-3xl font-bold text-yellow-500">
              {pendingHomeworks.length}
            </div>
            <div className="text-sm text-gray-500 mt-1">Pending Homework</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {examResults.length}
            </div>
            <div className="text-sm text-gray-500 mt-1">Exams Appeared</div>
          </div>
        </div>

        {myFees.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">💰 Fees Status</h2>
            </div>
            {feeSummary.pending + feeSummary.overdue > 0 && (
              <div className="bg-blue-50 border-b border-blue-100 px-6 py-5">
                <p className="text-sm font-semibold text-gray-700 mb-1 text-center">
                  Pending ₹{feeSummary.pending + feeSummary.overdue} — Pay
                  Online
                </p>
                <PaymentQR />
                <p className="text-xs text-gray-500 mt-3 text-center">
                  Scan any QR. Inform school after payment.
                </p>
              </div>
            )}{" "}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-100">
              <div className="bg-white px-4 py-4 text-center">
                <div className="text-xs text-gray-500">Total</div>
                <div className="text-lg font-bold text-gray-900 mt-1">
                  ₹{feeSummary.total}
                </div>
              </div>
              <div className="bg-white px-4 py-4 text-center">
                <div className="text-xs text-green-600">Paid</div>
                <div className="text-lg font-bold text-green-700 mt-1">
                  ₹{feeSummary.paid}
                </div>
              </div>
              <div className="bg-white px-4 py-4 text-center">
                <div className="text-xs text-orange-600">Pending</div>
                <div className="text-lg font-bold text-orange-600 mt-1">
                  ₹{feeSummary.pending}
                </div>
              </div>
              <div className="bg-white px-4 py-4 text-center">
                <div className="text-xs text-red-600">Overdue</div>
                <div className="text-lg font-bold text-red-600 mt-1">
                  ₹{feeSummary.overdue}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100">
              <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                Fee Records
              </h3>
              <div className="space-y-2">
                {myFees.map((f) => {
                  const balance = (f.amount || 0) - (f.paid_amount || 0);
                  const isOverdue =
                    f.status !== "paid" &&
                    f.due_date &&
                    new Date(f.due_date) < todayDate;
                  return (
                    <div
                      key={f.id}
                      className="flex justify-between items-center text-sm border border-gray-100 rounded-lg px-3 py-2"
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {f.fee_type}
                          {f.month ? ` · ${f.month}` : ""}
                        </div>
                        <div className="text-xs text-gray-400">
                          Due:{" "}
                          {f.due_date
                            ? new Date(f.due_date).toLocaleDateString("en-IN")
                            : "—"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-gray-900">
                          ₹{f.amount}
                        </div>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            f.status === "paid"
                              ? "bg-green-100 text-green-700"
                              : isOverdue
                                ? "bg-red-100 text-red-700"
                                : f.status === "partial"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {f.status === "paid"
                            ? "Paid"
                            : isOverdue
                              ? "Overdue"
                              : f.status === "partial"
                                ? `Partial · ₹${balance} due`
                                : "Pending"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            {myPayments.length > 0 && (
              <div className="px-6 py-4 border-t border-gray-100">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                  Payment History
                </h3>
                <div className="space-y-2">
                  {myPayments.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between items-center text-sm"
                    >
                      <div>
                        <div className="text-gray-700">
                          {new Date(p.paid_date).toLocaleDateString("en-IN")}
                          <span className="text-xs text-gray-400 ml-2 uppercase">
                            {p.payment_mode}
                          </span>
                        </div>
                        {p.receipt_no && (
                          <div className="text-xs text-gray-400">
                            Receipt: {p.receipt_no}
                          </div>
                        )}
                      </div>
                      <div className="font-bold text-green-700">
                        ₹{p.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {recentHomeworks.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h2 className="font-bold text-gray-800">📚 Homework</h2>
              <Link
                href="/student/homework"
                className="text-indigo-600 text-sm hover:underline"
              >
                View All →
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {recentHomeworks.map((hw) => (
                <div
                  key={hw.homeworks.id}
                  className="px-6 py-4 flex justify-between items-start"
                >
                  <div>
                    <div className="font-medium text-gray-900 text-sm">
                      {hw.homeworks.title}
                    </div>
                    <div className="text-indigo-600 text-xs mt-1">
                      {hw.homeworks.subject}
                      {hw.homeworks.section ? ` (${hw.homeworks.section})` : ""}
                    </div>
                    {hw.homeworks.description && (
                      <div className="text-gray-500 text-xs mt-1">
                        {hw.homeworks.description}
                      </div>
                    )}
                  </div>
                  {hw.homeworks.due_date && (
                    <span className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg whitespace-nowrap ml-4">
                      Due: {hw.homeworks.due_date}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {examResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">Exam Results</h2>
            </div>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Exam
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Marks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {examResults.map((r, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {r.exam_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {r.subject}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {r.marks_obtained} / {r.max_marks}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          r.grade === "A+" || r.grade === "A"
                            ? "bg-green-100 text-green-700"
                            : r.grade === "B"
                              ? "bg-blue-100 text-blue-700"
                              : r.grade === "C"
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-red-100 text-red-700"
                        }`}
                      >
                        {r.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {allNotices.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800">Notices</h2>
            </div>
            <div className="divide-y divide-gray-100">
              {allNotices.map((n) => (
                <div key={n.id} className="px-6 py-4">
                  <div className="font-medium text-gray-900 text-sm">
                    {n.title}
                  </div>
                  <div className="text-gray-500 text-xs mt-1">{n.content}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
