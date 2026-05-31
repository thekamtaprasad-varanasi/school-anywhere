"use client";

import { useState, useMemo } from "react";

const NON_TEACHING_LABELS = {
  lunch: "🍱 Lunch Break",
  misc: "🎯 Misc / Activity",
  assembly: "📢 Assembly",
  break: "☕ Short Break",
};

function isTeachingPeriod(timing) {
  const lbl = timing?.label || "teaching";
  return lbl === "teaching";
}

export default function WeekScheduleForm({
  teacherId,
  timings,
  totalPeriods,
  uniqueSubjects,
  allClasses,
  allSections,
  dayPeriodMap,
  days,
}) {
  const [activeDay, setActiveDay] = useState("Monday");
  const [submitting, setSubmitting] = useState(false);

  // For each non-Monday day, detect if it matches Monday exactly
  const detectSameAsMonday = (day) => {
    if (day === "Monday") return false;
    const monday = dayPeriodMap["Monday"] || {};
    const other = dayPeriodMap[day] || {};
    if (Object.keys(other).length === 0 && Object.keys(monday).length > 0) {
      return true;
    }
    if (Object.keys(other).length !== Object.keys(monday).length) return false;
    for (let p = 1; p <= totalPeriods; p++) {
      const m = monday[p] || {};
      const o = other[p] || {};
      if (
        (m.subject || "") !== (o.subject || "") ||
        (m.className || "") !== (o.className || "") ||
        (m.section || "") !== (o.section || "")
      ) {
        return false;
      }
    }
    return true;
  };

  const initialSame = useMemo(() => {
    const map = {};
    days.forEach((d) => {
      map[d] = d === "Monday" ? false : detectSameAsMonday(d);
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [sameAsMonday, setSameAsMonday] = useState(initialSame);

  const toggleSame = (day, checked) => {
    setSameAsMonday((prev) => ({ ...prev, [day]: checked }));
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6 max-w-4xl">
      <form
        method="POST"
        action="/api/teachers/save-schedule"
        onSubmit={() => setSubmitting(true)}
        className="space-y-5"
      >
        <input type="hidden" name="teacher_id" value={teacherId} />
        <input type="hidden" name="total_periods" value={totalPeriods} />

        {/* Day tabs */}
        <div className="flex flex-wrap gap-2 border-b border-gray-100 pb-3">
          {days.map((d) => {
            const isActive = activeDay === d;
            const sameNote = d !== "Monday" && sameAsMonday[d];
            return (
              <button
                key={d}
                type="button"
                onClick={() => setActiveDay(d)}
                className={`px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition ${
                  isActive
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {d.slice(0, 3)}
                {sameNote && (
                  <span className="ml-1 text-[10px] opacity-75">≡</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Per-day schedule */}
        {days.map((day) => {
          const isMon = day === "Monday";
          const isSame = !isMon && sameAsMonday[day];
          const hidden = activeDay !== day;
          const existing = dayPeriodMap[day] || {};

          return (
            <div key={day} className={hidden ? "hidden" : "block"}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="text-base font-semibold text-gray-800">{day}</h2>
                {!isMon && (
                  <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      name={`same_${day}`}
                      value="1"
                      checked={isSame}
                      onChange={(e) => toggleSame(day, e.target.checked)}
                      className="w-4 h-4 accent-indigo-600"
                    />
                    Same as Monday
                  </label>
                )}
              </div>

              {isSame ? (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 text-sm text-indigo-700">
                  ✓ {day} will use Monday's schedule. Uncheck above to set
                  differently.
                </div>
              ) : (
                <>
                  <div className="hidden md:grid grid-cols-12 gap-3 text-xs font-medium text-gray-500 uppercase pb-2 border-b border-gray-100">
                    <div className="col-span-2">Period</div>
                    <div className="col-span-4">Subject</div>
                    <div className="col-span-3">Class</div>
                    <div className="col-span-3">Section</div>
                  </div>

                  <div className="space-y-2 mt-2">
                    {timings.map((t) => {
                      const p = t.period_no;
                      const cell = existing[p] || {};
                      const teaching = isTeachingPeriod(t);
                      const nonTeachLabel =
                        NON_TEACHING_LABELS[t.label] || "Break";

                      if (!teaching) {
                        return (
                          <div
                            key={`${day}_${p}`}
                            className="grid grid-cols-12 gap-3 items-center py-2 bg-gray-50 rounded-lg px-2 border border-gray-100"
                          >
                            <div className="col-span-12 md:col-span-2">
                              <div className="text-sm font-semibold text-gray-500">
                                P{p}
                              </div>
                              <div className="text-xs text-gray-400">
                                {t.start_time}–{t.end_time}
                              </div>
                            </div>
                            <div className="col-span-12 md:col-span-10 text-sm text-gray-600 font-medium">
                              {nonTeachLabel}
                              <span className="ml-2 text-xs text-gray-400 font-normal">
                                (school-wide — no entry needed)
                              </span>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div
                          key={`${day}_${p}`}
                          className="grid grid-cols-12 gap-3 items-center py-2 border-b border-gray-50 last:border-0"
                        >
                          <div className="col-span-12 md:col-span-2">
                            <div className="text-sm font-semibold text-gray-700">
                              P{p}
                            </div>
                            <div className="text-xs text-gray-400">
                              {t.start_time}–{t.end_time}
                            </div>
                          </div>

                          <div className="col-span-12 md:col-span-4">
                            <input
                              type="text"
                              name={`subject_${day}_${p}`}
                              list={`subjects_${day}_${p}`}
                              placeholder="Free / Subject name"
                              defaultValue={cell.subject || ""}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                            <datalist id={`subjects_${day}_${p}`}>
                              {uniqueSubjects.map((s) => (
                                <option key={s} value={s} />
                              ))}
                            </datalist>
                          </div>

                          <div className="col-span-6 md:col-span-3">
                            <select
                              name={`class_${day}_${p}`}
                              defaultValue={cell.className || ""}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">— Class —</option>
                              {allClasses.map((c) => (
                                <option key={c} value={c}>
                                  {c}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="col-span-6 md:col-span-3">
                            <select
                              name={`section_${day}_${p}`}
                              defaultValue={cell.section || ""}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                              <option value="">— Section —</option>
                              {allSections.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}

        <div className="pt-4 border-t border-gray-100 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "Saving..." : "Save Weekly Schedule"}
          </button>
          <p className="text-xs text-gray-500 self-center">
            Lunch/Misc periods are auto-managed school-wide. Days marked "Same
            as Monday" auto-copy.
          </p>
        </div>
      </form>
    </div>
  );
}
