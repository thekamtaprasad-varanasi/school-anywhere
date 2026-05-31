export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { period_timings, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { cookies } from "next/headers";
import PeriodTimingsForm from "./PeriodTimingsForm";
import Link from "next/link";

export default async function PeriodTimingsPage() {
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

  // Fetch existing timings
  const existing = await db
    .select()
    .from(period_timings)
    .where(eq(period_timings.user_id, 2))
    .orderBy(period_timings.period_no);

  // Map period_no -> {start, end, label}
  const timingMap = {};
  existing.forEach((t) => {
    timingMap[t.period_no] = {
      start: t.start_time,
      end: t.end_time,
      label: t.label || "teaching",
    };
  });

  // Default 8 periods now (6 teaching + lunch + misc)
  const totalPeriods = Math.max(8, existing.length || 8);

  // Suggested default timings if none saved yet
  const defaultTimings = [
    { start: "08:00", end: "08:40", label: "teaching" },
    { start: "08:40", end: "09:20", label: "teaching" },
    { start: "09:20", end: "10:00", label: "teaching" },
    { start: "10:00", end: "10:30", label: "lunch" },
    { start: "10:30", end: "11:10", label: "teaching" },
    { start: "11:10", end: "11:50", label: "teaching" },
    { start: "11:50", end: "12:30", label: "teaching" },
    { start: "12:30", end: "13:00", label: "misc" },
    { start: "13:00", end: "13:40", label: "teaching" },
    { start: "13:40", end: "14:20", label: "teaching" },
    { start: "14:20", end: "15:00", label: "teaching" },
    { start: "15:00", end: "15:40", label: "teaching" },
  ];

  const periodTypes = [
    { value: "teaching", label: "Teaching" },
    { value: "lunch", label: "Lunch Break" },
    { value: "misc", label: "Misc / Activity" },
    { value: "assembly", label: "Assembly" },
    { value: "break", label: "Short Break" },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Period Timings</h1>
          <p className="text-gray-500 text-sm mt-1">
            Set school-wide period timings once. Change here for summer/winter
            shifts.
          </p>
        </div>
        <Link
          href="/settings"
          className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 text-sm font-medium"
        >
          ← Back
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-3xl">
        <PeriodTimingsForm
          totalPeriods={totalPeriods}
          timingMap={timingMap}
          defaultTimings={defaultTimings}
          periodTypes={periodTypes}
        />
      </div>

      {existing.length > 0 && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4 max-w-3xl text-sm text-green-800">
          ✓ {existing.length} periods configured
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4 max-w-3xl text-xs text-blue-800">
        <strong>Tip:</strong> Set Lunch / Misc / Assembly type for non-teaching
        periods. Teachers will see these as locked rows in their weekly schedule
        form — no need to fill them every time.
      </div>
    </div>
  );
}
