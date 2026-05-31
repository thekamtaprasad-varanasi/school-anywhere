export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { students, teachers, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { setFlash } from "@/lib/flash";
import AddPeriodForm from "./AddPeriodForm";

export default async function AddPeriodPage({ searchParams }) {
  const params = await searchParams;
  const selectedClass = params?.class || "";

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

  const [allStudents, allTeachers] = await Promise.all([
    db.select().from(students).where(eq(students.user_id, 2)),
    db.select().from(teachers).where(eq(teachers.user_id, 2)),
  ]);
  const classes = [...new Set(allStudents.map((s) => s.class))].sort();
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Add Period</h1>
        <p className="text-gray-500 text-sm mt-1">
          Add a new period to the timetable
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-2xl">
        <AddPeriodForm
          classes={classes}
          days={days}
          allTeachers={allTeachers}
          selectedClass={selectedClass}
        />{" "}
      </div>
    </div>
  );
}
