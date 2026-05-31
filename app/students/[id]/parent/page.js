export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { students, parents, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import ParentForm from "./ParentForm";

export default async function CreateParentPage({ params }) {
  const { id } = await params;
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

  const result = await db
    .select()
    .from(students)
    .where(and(eq(students.id, parseInt(id)), eq(students.user_id, 2)));
  if (result.length === 0) notFound();
  const student = result[0];

  const parentResult = await db
    .select()
    .from(parents)
    .where(eq(parents.student_id, student.id));
  const existingParent = parentResult[0] || null;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Parent Account</h1>
        <p className="text-gray-500 text-sm mt-1">
          {student.name} — {student.class}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-lg">
        {existingParent && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-700 mb-6">
            ✅ Parent account already exists. Update details below if needed.
          </div>
        )}

        <ParentForm student={student} existingParent={existingParent} />
      </div>
    </div>
  );
}
