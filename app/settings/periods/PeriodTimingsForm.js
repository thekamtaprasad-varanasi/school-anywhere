"use client";

import { useState } from "react";

export default function PeriodTimingsForm({
  totalPeriods,
  timingMap,
  defaultTimings,
  periodTypes,
}) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      method="POST"
      action="/api/settings/save-period-timings"
      onSubmit={() => setSubmitting(true)}
      className="space-y-4"
    >
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 flex-wrap">
        <label className="text-sm font-medium text-gray-700">
          Total periods per day
        </label>
        <input
          type="number"
          name="total_periods"
          min={1}
          max={14}
          required
          defaultValue={totalPeriods}
          className="w-20 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <span className="text-xs text-gray-400">
          (Press Save after changing this)
        </span>
      </div>

      <div className="hidden md:grid grid-cols-12 gap-3 text-xs font-medium text-gray-500 uppercase pb-2">
        <div className="col-span-2">Period</div>
        <div className="col-span-3">Start Time</div>
        <div className="col-span-3">End Time</div>
        <div className="col-span-4">Type</div>
      </div>

      {Array.from({ length: totalPeriods }, (_, i) => {
        const periodNo = i + 1;
        const current = timingMap[periodNo];
        const fallback = defaultTimings[i] || {
          start: "",
          end: "",
          label: "teaching",
        };
        const startVal = current?.start || fallback.start;
        const endVal = current?.end || fallback.end;
        const labelVal = current?.label || fallback.label;

        return (
          <div
            key={periodNo}
            className="grid grid-cols-12 gap-3 items-center py-2 border-b border-gray-50 last:border-0"
          >
            <div className="col-span-12 md:col-span-2 text-sm font-semibold text-gray-700">
              Period {periodNo}
            </div>
            <div className="col-span-4 md:col-span-3">
              <input
                type="time"
                name={`start_${periodNo}`}
                required
                defaultValue={startVal}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-4 md:col-span-3">
              <input
                type="time"
                name={`end_${periodNo}`}
                required
                defaultValue={endVal}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="col-span-4 md:col-span-4">
              <select
                name={`label_${periodNo}`}
                defaultValue={labelVal}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {periodTypes.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}

      <div className="pt-4 border-t border-gray-100">
        <button
          type="submit"
          disabled={submitting}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Saving..." : "Save Timings"}
        </button>
      </div>
    </form>
  );
}
