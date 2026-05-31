export const dynamic = "force-dynamic";

import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { teacher_subjects, homeworks } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";

const SECRET = new TextEncoder().encode(process.env.SESSION_SECRET);

export default async function AddHomework() {
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

  const subjects = await db
    .select()
    .from(teacher_subjects)
    .where(eq(teacher_subjects.teacher_id, payload.teacherId));

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-700 px-4 py-4 flex justify-between items-center">
        <div>
          <p className="text-white font-bold">Assign Homework</p>
          <p className="text-indigo-200 text-xs">{payload.teacherName}</p>
        </div>
        <Link href="/teacher/homework" className="text-indigo-200 text-sm">← Back</Link>
      </div>

      <div className="p-4 max-w-2xl mx-auto">
        <form action="/api/teacher/homework/add" method="POST" className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject & Class <span className="text-red-500">*</span></label>
            {subjects.length === 0 ? (
              <p className="text-sm text-red-500">No subjects assigned. Contact admin.</p>
            ) : (
              <select name="subject_class" required className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">-- Select Subject & Class --</option>
                {subjects.map((s) => (
                  <option
                    key={s.id}
                    value={`${s.subject}||${s.class}||${s.section || ""}`}
                  >
                    {s.subject} — Class {s.class}{s.section ? ` (${s.section})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="title"
              required
              placeholder="e.g. Chapter 5 Exercise"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              name="description"
              rows={3}
              placeholder="Details about the homework..."
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              name="due_date"
              required
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition"
          >
            Assign Homework
          </button>
        </form>
      </div>
    </div>
  );
}