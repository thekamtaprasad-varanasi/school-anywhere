"use client";

import { useState, useRef } from "react";

export default function StaffAttendanceForm({
  selectedDate,
  allTeachers,
  attendanceMap,
}) {
  const [submitting, setSubmitting] = useState(false);
  const formRef = useRef(null);

  function markAllNA() {
    const form = formRef.current;
    if (!form) return;
    const naRadios = form.querySelectorAll('input[type="radio"][value="na"]');
    naRadios.forEach((r) => {
      r.checked = true;
    });
  }

  return (
    <form
      ref={formRef}
      method="POST"
      action="/api/teacher-attendance/save"
      onSubmit={() => setSubmitting(true)}
    >
      <input type="hidden" name="date" value={selectedDate} />

      {allTeachers.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 px-4 py-2 mb-3 flex items-center">
          <div className="flex-1" />
          <div className="flex items-center gap-3 shrink-0 text-xs font-bold">
            <span className="text-green-700 w-6 text-center">P</span>
            <span className="text-red-600 w-6 text-center">A</span>
            <button
              type="button"
              onClick={markAllNA}
              className="text-yellow-700 w-8 text-center underline decoration-dotted"
              title="Tap to mark all N/A (holiday)"
            >
              N/A
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3 mb-5">
        {allTeachers.map((t) => {
          const current = attendanceMap[t.id];
          const status = current?.status;
          return (
            <div
              key={t.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
            >
              <div className="flex justify-between items-center mb-2 gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">
                    {t.name}
                  </p>
                  <p className="text-xs text-gray-400">{t.phone || "—"}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <input
                    type="radio"
                    name={`status_${t.id}`}
                    value="present"
                    defaultChecked={status === "present"}
                    className="w-5 h-5 accent-green-600"
                    aria-label="Present"
                  />
                  <input
                    type="radio"
                    name={`status_${t.id}`}
                    value="absent"
                    defaultChecked={status === "absent"}
                    className="w-5 h-5 accent-red-500"
                    aria-label="Absent"
                  />
                  <input
                    type="radio"
                    name={`status_${t.id}`}
                    value="na"
                    defaultChecked={status === "na" || !status}
                    className="w-5 h-5 accent-yellow-500"
                    aria-label="N/A"
                  />
                </div>
              </div>
              <input
                type="text"
                name={`note_${t.id}`}
                defaultValue={current?.note || ""}
                placeholder="Note (optional)"
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          );
        })}
      </div>

      {allTeachers.length > 0 && (
        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Saving..." : "Save Attendance"}
        </button>
      )}
    </form>
  );
}