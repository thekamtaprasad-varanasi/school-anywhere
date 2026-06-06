export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { students, teachers } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import DeleteStudentButton from "./DeleteStudentButton";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);

const ERROR_MESSAGES = {
  has_fees: "Cannot delete: student has fee records.",
  has_attendance: "Cannot delete: student has attendance records.",
  has_results: "Cannot delete: student has exam results.",
  has_certificates: "Cannot delete: student has issued certificates.",
};

export default async function TeacherStudentsPage({ searchParams }) {
  const params = await searchParams;
  const deletedFlag = params?.deleted === "1";
  const updatedFlag = params?.updated === "1";
  const errorCode = params?.error;
  const errorMsg = errorCode ? ERROR_MESSAGES[errorCode] : null;

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

  const teacherResult = await db
    .select()
    .from(teachers)
    .where(eq(teachers.id, payload.teacherId));
  const teacher = teacherResult[0];

  const myStudents = teacher
    ? await db
        .select()
        .from(students)
        .where(eq(students.user_id, teacher.user_id))
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-700 px-4 py-4 flex justify-between items-center">
        <div>
          <p className="text-white font-bold">{payload.teacherName}</p>
          <p className="text-indigo-200 text-xs">Teacher Portal</p>
        </div>
        <div className="flex gap-4 items-center">
          <Link href="/teacher/dashboard" className="text-indigo-200 text-sm">
            ← Back
          </Link>
          <a href="/api/teacher-logout" className="text-red-300 text-sm">
            Logout
          </a>
        </div>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        {deletedFlag && (
          <div className="mb-3 bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-lg">
            Student deleted successfully.
          </div>
        )}
        {updatedFlag && (
          <div className="mb-3 bg-green-50 border border-green-200 text-green-700 text-sm px-3 py-2 rounded-lg">
            Student updated successfully.
          </div>
        )}
        {errorMsg && (
          <div className="mb-3 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
            {errorMsg}
          </div>
        )}

        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-gray-900">Students</h1>
          <Link
            href="/teacher/students/add"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Add Student
          </Link>
        </div>

        {myStudents.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            No students found.
          </div>
        ) : (
          <div className="space-y-2">
            {myStudents.map((s) => (
              <div
                key={s.id}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.name}</p>
                  <p className="text-xs text-gray-400">
                    Class {s.class} {s.section ? `— ${s.section}` : ""} · Roll{" "}
                    {s.roll_number || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-3 ml-2 shrink-0">
                  <Link
                    href={`/teacher/students/${s.id}/edit`}
                    className="text-xs text-indigo-600 font-medium"
                  >
                    Edit
                  </Link>
                  <DeleteStudentButton studentId={s.id} studentName={s.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
