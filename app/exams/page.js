// app/exams/page.js
export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { MASTER_USER_ID } from "@/lib/config";
import { exams, results } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import Link from "next/link";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { users } from "@/lib/schema";
import DeleteExam from "./DeleteExam";

export default async function ExamsPage({ searchParams }) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("session")?.value);
  if (!session) redirect("/login");
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];
  const params = await searchParams;
  const filterClass = params?.class || "";
  const filterType = params?.type || "";

  const allExams = await db
    .select({
      id: exams.id,
      name: exams.name,
      class: exams.class,
      subject: exams.subject,
      exam_date: exams.exam_date,
      max_marks: exams.max_marks,
      passing_marks: exams.passing_marks,
      exam_type: exams.exam_type,
      academic_year: exams.academic_year,
      result_count: sql`(SELECT COUNT(*) FROM results WHERE results.exam_id = ${exams.id})`,
    })
    .from(exams)
    .where(eq(exams.user_id, MASTER_USER_ID))
    .orderBy(sql`${exams.exam_date} DESC`);

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

  const filtered = allExams.filter((e) => {
    const matchClass = !filterClass || e.class === filterClass;
    const matchType = !filterType || e.exam_type === filterType;
    return matchClass && matchType;
  });

  const today = new Date().toISOString().split("T")[0];
  // Completed = date past AND at least one result entered
  // Upcoming = date today or future (regardless of results)
  const upcoming = allExams.filter((e) => e.exam_date >= today);
  const past = allExams.filter(
    (e) => e.exam_date < today && Number(e.result_count) > 0,
  );

  const TYPE_LABELS = {
    unit: "Unit Test",
    quarterly: "Quarterly",
    half_yearly: "Half Yearly",
    annual: "Annual",
  };

  const TYPE_COLORS = {
    unit: "bg-gray-100 text-gray-600",
    quarterly: "bg-blue-100 text-blue-700",
    half_yearly: "bg-yellow-100 text-yellow-700",
    annual: "bg-green-100 text-green-700",
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Exams & Results</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            {allExams.length} total · {upcoming.length} upcoming · {past.length}{" "}
            completed
          </p>
        </div>
        <Link
          href="/exams/add"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Schedule
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-indigo-700">{allExams.length}</p>
          <p className="text-xs text-indigo-500">Total</p>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-green-700">{upcoming.length}</p>
          <p className="text-xs text-green-500">Upcoming</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 text-center">
          <p className="text-lg font-bold text-yellow-700">{past.length}</p>
          <p className="text-xs text-yellow-600">Completed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {["", "unit", "quarterly", "half_yearly", "annual"].map((type) => (
          <a
            key={type}
            href={`/exams?class=${filterClass}&type=${type}`}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
              filterType === type
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {type === "" ? "All" : TYPE_LABELS[type]}
          </a>
        ))}
      </div>

      <form method="GET" action="/exams" className="flex gap-2 mb-5">
        <input type="hidden" name="type" value={filterType} />
        <select
          name="class"
          defaultValue={filterClass}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              Class {c}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          Filter
        </button>
        {(filterClass || filterType) && (
          <a
            href="/exams"
            className="bg-gray-100 text-gray-600 px-3 py-2 rounded-lg text-sm"
          >
            ✕
          </a>
        )}
      </form>

      {/* Exam List */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
          No exams found.{" "}
          <Link href="/exams/add" className="text-indigo-600 font-medium">
            Schedule one →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((exam) => {
            const isUpcoming = exam.exam_date >= today;
            const hasResults = Number(exam.result_count) > 0;
            const isCompleted = !isUpcoming && hasResults;
            return (
              <div
                key={exam.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {exam.name}
                      </p>
                      {exam.exam_type && (
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${TYPE_COLORS[exam.exam_type] || "bg-gray-100 text-gray-600"}`}
                        >
                          {TYPE_LABELS[exam.exam_type] || exam.exam_type}
                        </span>
                      )}
                      {isUpcoming ? (
                        <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-indigo-100 text-indigo-700">
                          Upcoming
                        </span>
                      ) : isCompleted ? (
                        <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-gray-100 text-gray-500">
                          Completed
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs rounded-full font-medium bg-orange-100 text-orange-700">
                          Pending Results
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      Class {exam.class} · {exam.subject}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      📅 {exam.exam_date} · Max: {exam.max_marks} · Pass:{" "}
                      {exam.passing_marks}
                      {exam.academic_year ? ` · ${exam.academic_year}` : ""}
                    </p>
                    {hasResults && (
                      <p className="text-xs text-green-600 mt-0.5">
                        ✓ {exam.result_count} results entered
                      </p>
                    )}
                  </div>
                  <div className="ml-3 shrink-0 flex flex-col gap-1.5 items-end">
                    <Link
                      href={`/exams/${exam.id}/results`}
                      className="text-xs font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg"
                    >
                      ✏️ Marks
                    </Link>
                    <Link
                      href={`/exams/${exam.id}/report`}
                      className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg"
                    >
                      📊 Report
                    </Link>
                    <DeleteExam examId={exam.id} examName={exam.name} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}