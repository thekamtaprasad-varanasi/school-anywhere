export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { timetable, period_timings, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import Link from "next/link";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

const NON_TEACHING_LABELS = {
  lunch: "🍱 Lunch Break",
  misc: "🎯 Misc / Activity",
  assembly: "📢 Assembly",
  break: "☕ Short Break",
};

export default async function TimetablePage({ searchParams }) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("session")?.value);
  if (!session) redirect("/login");

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];
  if (!user) redirect("/login");

  const params = await searchParams;
  const selectedClass = params?.class || "";

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

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Parallel fetch: schedule + period timings
  const [schedule, timings] = await Promise.all([
    selectedClass
      ? db
          .select()
          .from(timetable)
          .where(
            and(
              eq(timetable.class, selectedClass),
              eq(timetable.user_id, 2),
            ),
          )
      : Promise.resolve([]),
    db
      .select()
      .from(period_timings)
      .where(eq(period_timings.user_id, 2))
      .orderBy(period_timings.period_no),
  ]);

  // schedule: day -> period -> entry
  const scheduleMap = {};
  days.forEach((day) => {
    scheduleMap[day] = {};
  });
  schedule.forEach((entry) => {
    if (!scheduleMap[entry.day]) scheduleMap[entry.day] = {};
    scheduleMap[entry.day][entry.period] = entry;
  });

  // timings: period_no -> {start, end, label}
  const timingMap = {};
  timings.forEach((t) => {
    timingMap[t.period_no] = {
      start: t.start_time,
      end: t.end_time,
      label: t.label || "teaching",
    };
  });

  let totalPeriods = timings.length;
  if (totalPeriods === 0 && schedule.length > 0) {
    totalPeriods = Math.max(...schedule.map((s) => s.period));
  }
  if (totalPeriods === 0) totalPeriods = 8;

  return (
    <div>
      <div className="flex justify-between items-center mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Timetable</h1>
          <p className="text-gray-500 text-sm mt-1">
            Class-wise weekly schedule
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link
            href="/settings/periods"
            className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-lg hover:bg-gray-200 text-sm font-medium"
          >
            ⏱ Period Timings
          </Link>
          {selectedClass && (
            <Link
              href={`/timetable/add?class=${selectedClass}`}
              className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 text-sm font-medium"
            >
              + Add Period
            </Link>
          )}
        </div>
      </div>

      {timings.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5 text-sm text-yellow-800">
          ⚠ Period timings not configured yet.{" "}
          <Link href="/settings/periods" className="underline font-medium">
            Set them now
          </Link>{" "}
          — one-time setup, applies school-wide.
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
        <form className="flex gap-4 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              Select Class
            </label>
            <select
              name="class"
              defaultValue={selectedClass}
              className="border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Select Class --</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-gray-800 text-white px-5 py-2.5 rounded-lg text-sm hover:bg-gray-700"
          >
            Show
          </button>
        </form>
      </div>

      {!selectedClass ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
          Please select a class to view its timetable.
        </div>
      ) : schedule.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center text-gray-400">
          No timetable found for class {selectedClass}.{" "}
          <Link
            href={`/timetable/add?class=${selectedClass}`}
            className="text-indigo-600 hover:underline"
          >
            Add periods
          </Link>{" "}
          or set a teacher's weekly schedule from{" "}
          <Link href="/teachers" className="text-indigo-600 hover:underline">
            Teachers
          </Link>
          .
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Day
                </th>
                {Array.from({ length: totalPeriods }, (_, i) => {
                  const p = i + 1;
                  const timing = timingMap[p];
                  const isNonTeaching =
                    timing && timing.label && timing.label !== "teaching";
                  return (
                    <th
                      key={p}
                      className={`px-4 py-3 text-center text-xs font-medium uppercase ${
                        isNonTeaching ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      <div>Period {p}</div>
                      {timing && (
                        <div className="text-[10px] font-normal text-gray-400 mt-0.5 normal-case">
                          {timing.start}–{timing.end}
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {days.map((day) => (
                <tr key={day} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-700">
                    {day}
                  </td>
                  {Array.from({ length: totalPeriods }, (_, i) => {
                    const p = i + 1;
                    const timing = timingMap[p];
                    const isNonTeaching =
                      timing && timing.label && timing.label !== "teaching";

                    if (isNonTeaching) {
                      const label =
                        NON_TEACHING_LABELS[timing.label] || "Break";
                      return (
                        <td
                          key={p}
                          className="px-2 py-3 text-center bg-gray-50"
                        >
                          <div className="text-xs text-gray-500 font-medium">
                            {label}
                          </div>
                        </td>
                      );
                    }

                    const entry = scheduleMap[day]?.[p];
                    return (
                      <td key={p} className="px-4 py-3 text-center">
                        {entry ? (
                          <div className="bg-indigo-50 rounded-lg p-2">
                            <div className="text-xs font-semibold text-indigo-700">
                              {entry.subject}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {entry.teacher_name}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}