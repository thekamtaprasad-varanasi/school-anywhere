export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { teachers, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import TeacherEditForm from "./TeacherEditForm";

export default async function EditTeacherPage({ params }) {
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
    .from(teachers)
    .where(and(eq(teachers.id, Number(id)), eq(teachers.user_id, 2)));
  if (result.length === 0) notFound();
  const t = result[0];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Edit Teacher</h1>
        <p className="text-gray-500 text-sm mt-1">{t.name}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-2xl">
        <TeacherEditForm teacher={t} />
      </div>
    </div>
  );
}
