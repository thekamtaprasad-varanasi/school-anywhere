// app/promote/page.js
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { students, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import PromoteForm from "./PromoteForm";

export default async function PromotePage() {
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
    .where(eq(students.user_id, 2));

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

  const now = new Date();
  const baseYear =
    now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
  const nextAcademicYear = `${baseYear + 1}-${String(baseYear + 2).slice(-2)}`;

  const classCounts = {};
  allStudents.forEach((s) => {
    classCounts[s.class] = (classCounts[s.class] || 0) + 1;
  });

  const allClassOptions = [
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

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Student Promotion</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          Class-wise bulk promotion — new academic year
        </p>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4 text-xs text-yellow-800">
        ⚠️ This action will move all students of the selected class to the next
        class. This cannot be undone.
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <p className="text-xs font-medium text-gray-600 mb-3">
          Current Classes
        </p>
        <div className="grid grid-cols-3 gap-2">
          {classes.map((c) => (
            <div
              key={c}
              className="bg-indigo-50 border border-indigo-100 rounded-lg p-2 text-center"
            >
              <p className="text-sm font-bold text-indigo-700">Class {c}</p>
              <p className="text-xs text-indigo-500">
                {classCounts[c] || 0} students
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <p className="text-xs font-medium text-gray-600 mb-3">
          Promote Students
        </p>
        <PromoteForm
          classes={classes}
          allClassOptions={allClassOptions}
          classCounts={classCounts}
          nextAcademicYear={nextAcademicYear}
        />
      </div>
    </div>
  );
}