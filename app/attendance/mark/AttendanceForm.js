"use client";

import { useState, useRef } from "react";

export default function AttendanceForm({
  selectedDate,
  attendanceMap,
  sortedKeys,
  grouped,
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
      action="/api/attendance/save"
      onSubmit={() => setSubmitting(true)}
    >
      <input type="hidden" name="date" value={selectedDate} />

      {sortedKeys.length > 0 && (
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

      <div className="space-y-4 mb-6">
        {sortedKeys.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
            No students found.
          </div>
        ) : (
          sortedKeys.map((key) => {
            const { cls, sec, students: secStudents } = grouped[key];
            const sorted = [...secStudents].sort((a, b) => {
              const ra = parseInt(a.roll_number),
                rb = parseInt(b.roll_number);
              if (!isNaN(ra) && !isNaN(rb)) return ra - rb;
              return (a.name || "").localeCompare(b.name || "");
            });
            return (
              <div
                key={key}
                className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden"
              >
                <div className="bg-indigo-600 px-4 py-2.5 flex justify-between items-center">
                  <span className="text-white font-bold text-sm">
                    Class {cls} — Section {sec}
                  </span>
                  <span className="bg-white text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {secStudents.length} students
                  </span>
                </div>
                <div className="divide-y divide-gray-50">
                  {sorted.map((student) => {
                    const status = attendanceMap[student.id];
                    return (
                      <div
                        key={student.id}
                        className="px-4 py-3 flex justify-between items-center gap-3"
                      >
                        <input
                          type="hidden"
                          name="student_id"
                          value={student.id}
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {student.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Roll {student.roll_number || "—"}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <input
                            type="radio"
                            name={`status_${student.id}`}
                            value="present"
                            defaultChecked={status === "present"}
                            className="w-5 h-5 accent-green-600"
                            aria-label="Present"
                          />
                          <input
                            type="radio"
                            name={`status_${student.id}`}
                            value="absent"
                            defaultChecked={status === "absent"}
                            className="w-5 h-5 accent-red-500"
                            aria-label="Absent"
                          />
                          <input
                            type="radio"
                            name={`status_${student.id}`}
                            value="na"
                            defaultChecked={status === "na" || !status}
                            className="w-5 h-5 accent-yellow-500"
                            aria-label="N/A"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {sortedKeys.length > 0 && (
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