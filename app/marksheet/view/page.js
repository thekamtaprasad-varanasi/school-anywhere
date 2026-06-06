// app/marksheet/view/page.js

export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { MASTER_USER_ID } from "@/lib/config";
import { exams, students, results, school_settings, users } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import PrintButton from "./PrintButton";

export default async function MarksheetViewPage({ searchParams }) {
  const params = await searchParams;
  const selectedClass = params?.class || "";
  const selectedType = params?.type || "";
  const selectedYear = params?.year || "";

  if (!selectedClass || !selectedType) notFound();

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

  const settingsRows = await db
    .select()
    .from(school_settings)
    .where(eq(school_settings.user_id, MASTER_USER_ID));
  const school = settingsRows[0] || {};

  const classStudents = await db
    .select()
    .from(students)
    .where(
      and(eq(students.class, selectedClass), eq(students.user_id, MASTER_USER_ID)),
    )
    .orderBy(students.roll_number, students.name);
  if (classStudents.length === 0) {
    return (
      <div>
        <div className="print:hidden flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">Marksheet</h1>
          <a
            href="/marksheet"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
          >
            ← Back
          </a>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
          No students found in Class {selectedClass}.
          <br />
          <a
            href="/students/add"
            className="text-indigo-600 font-medium mt-2 inline-block"
          >
            + Add Students
          </a>
        </div>
      </div>
    );
  }

  const conditions = [
    eq(exams.class, selectedClass),
    eq(exams.exam_type, selectedType),
    eq(exams.user_id, MASTER_USER_ID),
  ];
  if (selectedYear) conditions.push(eq(exams.academic_year, selectedYear));

  const classExams = await db
    .select()
    .from(exams)
    .where(and(...conditions))
    .orderBy(exams.subject);

  if (classExams.length === 0) {
    return (
      <div>
        <div className="print:hidden flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">Marksheet</h1>
          <a
            href="/marksheet"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
          >
            ← Back
          </a>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
          No exams found for Class {selectedClass} — {selectedType}
          {selectedYear ? ` (${selectedYear})` : ""}.
          <br />
          <a
            href="/exams/add"
            className="text-indigo-600 font-medium mt-2 inline-block"
          >
            + Schedule Exam
          </a>
        </div>
      </div>
    );
  }

  const examIds = classExams.map((e) => e.id);
  const allResults = await db
    .select()
    .from(results)
    .where(inArray(results.exam_id, examIds));

  const resultsMap = {};
  allResults.forEach((r) => {
    if (!resultsMap[r.student_id]) resultsMap[r.student_id] = {};
    resultsMap[r.student_id][r.exam_id] = r;
  });

  const examTypeLabel = {
    quarterly: "Quarterly Examination",
    half_yearly: "Half Yearly Examination",
    annual: "Annual Examination",
    unit: "Unit Test",
  };

  // Pre-compute per-student summary (so JSX stays clean)
  const studentSummaries = classStudents.map((student) => {
    const studentResults = resultsMap[student.id] || {};

    let totalMax = 0;
    let totalObtained = 0;
    let enteredCount = 0;
    let anyFailedSubject = false;

    classExams.forEach((e) => {
      const r = studentResults[e.id];
      if (r && r.marks_obtained !== null && r.marks_obtained !== undefined) {
        totalMax += e.max_marks;
        totalObtained += r.marks_obtained;
        enteredCount += 1;
        if (r.marks_obtained < e.passing_marks) {
          anyFailedSubject = true;
        }
      }
    });

    const allEntered = enteredCount === classExams.length;
    const percentage =
      totalMax > 0 ? ((totalObtained / totalMax) * 100).toFixed(1) : null;

    let grade = "—";
    let status = "Pending"; // Pending | Pass | Fail

    if (totalMax > 0) {
      const pct = (totalObtained / totalMax) * 100;
      if (pct >= 90) grade = "A+";
      else if (pct >= 75) grade = "A";
      else if (pct >= 60) grade = "B";
      else if (pct >= 45) grade = "C";
      else if (pct >= 33) grade = "D";
      else grade = "F";
    }

    if (allEntered) {
      const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
      status = !anyFailedSubject && pct >= 33 ? "Pass" : "Fail";
    }

    return {
      student,
      studentResults,
      totalMax,
      totalObtained,
      enteredCount,
      allEntered,
      percentage,
      grade,
      status,
    };
  });

  return (
    <div>
      {/* Screen Controls */}
      <div className="print:hidden flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Marksheet</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Class {selectedClass} ·{" "}
            {examTypeLabel[selectedType] || selectedType}
            {selectedYear ? ` · ${selectedYear}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <PrintButton />
          <a
            href="/marksheet"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
          >
            ← Back
          </a>
        </div>
      </div>

      {/* Print Area */}
      <div
        id="print-area"
        className="bg-white rounded-xl border border-gray-200 p-4 print:p-6 print:rounded-none print:border-0"
      >
        {/* School Header */}
        <div className="text-center mb-4 border-b border-gray-300 pb-3">
          {school.logo_url && (
            <img
              src={school.logo_url}
              alt="Logo"
              className="h-14 w-14 object-contain mx-auto mb-1"
            />
          )}
          <h2 className="text-lg font-bold text-gray-900 uppercase">
            {school.school_name || "School Name"}
          </h2>
          {school.address && (
            <p className="text-xs text-gray-500">{school.address}</p>
          )}
          <h3 className="text-sm font-bold text-gray-800 mt-2 underline underline-offset-2">
            {examTypeLabel[selectedType] || selectedType} — Class{" "}
            {selectedClass}
            {selectedYear ? ` (${selectedYear})` : ""}
          </h3>
        </div>

        {/* Marksheet Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse border border-gray-300">
            <thead>
              <tr className="bg-indigo-600 text-white">
                <th className="border border-gray-300 px-2 py-2 text-left w-6">
                  #
                </th>
                <th className="border border-gray-300 px-2 py-2 text-left min-w-[120px]">
                  Student Name
                </th>
                <th className="border border-gray-300 px-2 py-2 text-center w-12">
                  Roll
                </th>
                {classExams.map((exam) => (
                  <th
                    key={exam.id}
                    className="border border-gray-300 px-2 py-2 text-center min-w-[60px]"
                  >
                    {exam.subject}
                    <div className="font-normal text-indigo-200">
                      ({exam.max_marks})
                    </div>
                  </th>
                ))}
                <th className="border border-gray-300 px-2 py-2 text-center w-16">
                  Total
                </th>
                <th className="border border-gray-300 px-2 py-2 text-center w-12">
                  %
                </th>
                <th className="border border-gray-300 px-2 py-2 text-center w-12">
                  Grade
                </th>
                <th className="border border-gray-300 px-2 py-2 text-center w-20">
                  Result
                </th>
              </tr>
            </thead>
            <tbody>
              {studentSummaries.map((s, idx) => {
                const {
                  student,
                  studentResults,
                  totalMax,
                  totalObtained,
                  allEntered,
                  percentage,
                  grade,
                  status,
                } = s;

                const statusClass =
                  status === "Pass"
                    ? "text-green-600"
                    : status === "Fail"
                      ? "text-red-600"
                      : "text-orange-600";

                return (
                  <tr
                    key={student.id}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="border border-gray-200 px-2 py-1.5 text-center text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="border border-gray-200 px-2 py-1.5 font-medium text-gray-900">
                      {student.name}
                    </td>
                    <td className="border border-gray-200 px-2 py-1.5 text-center text-gray-600">
                      {student.roll_number || "—"}
                    </td>
                    {classExams.map((exam) => {
                      const r = studentResults[exam.id];
                      const entered =
                        r && r.marks_obtained !== null && r.marks_obtained !== undefined;
                      const failed = entered && r.marks_obtained < exam.passing_marks;
                      return (
                        <td
                          key={exam.id}
                          className={`border border-gray-200 px-2 py-1.5 text-center font-medium ${
                            !entered
                              ? "text-gray-300"
                              : failed
                                ? "text-red-600"
                                : "text-gray-800"
                          }`}
                        >
                          {entered ? r.marks_obtained : "—"}
                        </td>
                      );
                    })}
                    <td className="border border-gray-200 px-2 py-1.5 text-center font-bold text-gray-900">
                      {totalMax > 0 ? `${totalObtained}/${totalMax}` : "—"}
                    </td>
                    <td className="border border-gray-200 px-2 py-1.5 text-center text-gray-700">
                      {percentage !== null ? `${percentage}%` : "—"}
                    </td>
                    <td className="border border-gray-200 px-2 py-1.5 text-center font-bold text-indigo-700">
                      {grade}
                    </td>
                    <td
                      className={`border border-gray-200 px-2 py-1.5 text-center font-bold text-xs ${statusClass}`}
                    >
                      {status}
                      {!allEntered && status === "Pending" && (
                        <div className="text-[10px] font-normal text-orange-500">
                          Awaiting marks
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-medium">
                <td
                  colSpan={3}
                  className="border border-gray-300 px-2 py-1.5 text-xs text-gray-600"
                >
                  Max Marks
                </td>
                {classExams.map((exam) => (
                  <td
                    key={exam.id}
                    className="border border-gray-300 px-2 py-1.5 text-center text-xs text-gray-600"
                  >
                    {exam.max_marks}
                  </td>
                ))}
                <td
                  colSpan={4}
                  className="border border-gray-300 px-2 py-1.5 text-center text-xs text-gray-600"
                >
                  Total: {classExams.reduce((s, e) => s + e.max_marks, 0)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Footer */}
        <div className="mt-8 flex justify-between items-end text-xs text-gray-500">
          <p>Generated: {new Date().toLocaleDateString("en-IN")}</p>
          <div className="text-center">
            <div className="border-t border-gray-400 w-32 mb-1" />
            <p>Class Teacher</p>
          </div>
          <div className="text-center">
            <div className="border-t border-gray-400 w-32 mb-1" />
            <p>{school.principal_name || "Principal"}</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}