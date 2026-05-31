export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import Link from "next/link";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);

export default async function TeacherDashboard() {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-700 px-4 py-4 flex justify-between items-center">
        <div>
          <p className="text-white font-bold">{payload.teacherName}</p>
          <p className="text-indigo-200 text-xs">Teacher Portal</p>
        </div>
        <a href="/api/teacher-logout" className="text-red-300 text-sm font-medium">Logout</a>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Welcome, {payload.teacherName}</h1>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/teacher/attendance" className="bg-white rounded-xl border border-indigo-100 p-6 text-center shadow-sm hover:shadow-md transition">
            <div className="text-4xl mb-2">✅</div>
            <div className="font-bold text-gray-800 text-sm">Attendance</div>
            <div className="text-gray-400 text-xs mt-1">Mark class attendance</div>
          </Link>

          <Link href="/teacher/students" className="bg-white rounded-xl border border-indigo-100 p-6 text-center shadow-sm hover:shadow-md transition">
            <div className="text-4xl mb-2">🎓</div>
            <div className="font-bold text-gray-800 text-sm">Students</div>
            <div className="text-gray-400 text-xs mt-1">View & add students</div>
          </Link>

          <Link href="/teacher/exams" className="bg-white rounded-xl border border-indigo-100 p-6 text-center shadow-sm hover:shadow-md transition">
            <div className="text-4xl mb-2">📝</div>
            <div className="font-bold text-gray-800 text-sm">Exams & Results</div>
            <div className="text-gray-400 text-xs mt-1">Enter marks</div>
          </Link>

          <Link href="/teacher/homework" className="bg-white rounded-xl border border-indigo-100 p-6 text-center shadow-sm hover:shadow-md transition">
            <div className="text-4xl mb-2">📚</div>
            <div className="font-bold text-gray-800 text-sm">Homework</div>
            <div className="text-gray-400 text-xs mt-1">Assign homework</div>
          </Link>
        </div>
      </div>
    </div>
  );
}