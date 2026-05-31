export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { exams, students, results } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { users } from "@/lib/schema";

export default async function MarksEntryPage({ params }) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("session")?.value);
  if (!session) redirect("/login");
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];
  const { id } = await params;

  const examResult = await db
    .select()
    .from(exams)
    .where(and(eq(exams.id, parseInt(id)), eq(exams.user_id, 2)));
  if (examResult.length === 0) notFound();
  const exam = examResult[0];

  const classStudents = await db
    .select()
    .from(students)
    .where(and(eq(students.class, exam.class), eq(students.user_id, 2)));

  const existingResults = await db
    .select()
    .from(results)
    .where(eq(results.exam_id, parseInt(id)));
  const resultsMap = {};
  existingResults.forEach((r) => {
    resultsMap[r.student_id] = r;
  });

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Marks Entry</h1>
        <p className="text-gray-500 text-sm mt-1">
          {exam.name} — {exam.class} — {exam.subject} — Max: {exam.max_marks} |
          Pass: {exam.passing_marks}
        </p>
      </div>

      <form action="/api/results/save" method="POST">
        <input type="hidden" name="exam_id" value={exam.id} />

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Roll No
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Marks (out of {exam.max_marks})
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Grade
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Remarks
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {classStudents.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    No students found in {exam.class}.
                  </td>
                </tr>
              ) : (
                classStudents.map((student) => {
                  const existing = resultsMap[student.id];
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {student.roll_number || "—"}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="hidden"
                          name="student_id"
                          value={student.id}
                        />
                        <input
                          type="number"
                          name={`marks_${student.id}`}
                          defaultValue={existing?.marks_obtained ?? ""}
                          min={0}
                          max={exam.max_marks}
                          placeholder="0"
                          className="w-24 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {existing?.grade ? (
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              existing.grade === "A+" || existing.grade === "A"
                                ? "bg-green-100 text-green-700"
                                : existing.grade === "B"
                                  ? "bg-blue-100 text-blue-700"
                                  : existing.grade === "C"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : existing.grade === "D"
                                      ? "bg-orange-100 text-orange-700"
                                      : "bg-red-100 text-red-700"
                            }`}
                          >
                            {existing.grade}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          name={`remarks_${student.id}`}
                          defaultValue={existing?.remarks ?? ""}
                          placeholder="Optional"
                          className="w-36 border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 text-sm font-medium"
          >
            Save Marks
          </button>
          <a
            href="/exams"
            className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-200 text-sm font-medium"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}