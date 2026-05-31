// app/transport/students/add/page.js

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { transport, students, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import AssignTransportForm from "./AssignTransportForm";

export default async function AssignTransportPage() {
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
  const allStudents = await db
    .select()
    .from(students)
    .where(eq(students.user_id, 2))
    .orderBy(students.class, students.name);
  const allRoutes = await db
    .select()
    .from(transport)
    .where(eq(transport.user_id, 2))
    .orderBy(transport.route_name);

  const today = new Date().toISOString().split("T")[0];
  const now = new Date();
  const baseYear =
    now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
  const academicYear = `${baseYear}-${String(baseYear + 1).slice(-2)}`;

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Assign Transport</h1>
        <p className="text-gray-500 text-xs mt-0.5">Student route assign </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <AssignTransportForm
          allStudents={allStudents}
          allRoutes={allRoutes}
          academicYear={academicYear}
          today={today}
        />
      </div>
    </div>
  );
}
