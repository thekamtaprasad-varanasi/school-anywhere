"use client";

import { useState } from "react";

export default function AttendanceSnapshot({
  staffPresentList,
  staffAbsentList,
  staffNAList = [],
  classMap,
  classList,
}) {
  const [openStaff, setOpenStaff] = useState(null); // "present" | "absent" | "na" | null
  const [selectedClass, setSelectedClass] = useState("");

  const staffMarked =
    staffPresentList.length > 0 ||
    staffAbsentList.length > 0 ||
    staffNAList.length > 0;

  function StaffBox({ keyName, label, list, color }) {
    const isOpen = openStaff === keyName;
    return (
      <button
        type="button"
        onClick={() => setOpenStaff(isOpen ? null : keyName)}
        className={`${color.bg} rounded-lg px-3 py-3 text-left`}
      >
        <p className={`text-xs font-semibold ${color.text}`}>
          {label} ({list.length})
        </p>
        <p className={`text-[10px] ${color.sub} mt-0.5`}>
          {isOpen ? "Tap to hide" : "Tap to view"}
        </p>
        {isOpen && (
          <div className="mt-2 space-y-0.5">
            {list.length === 0 ? (
              <p className="text-xs text-gray-400">—</p>
            ) : (
              list.map((n, i) => (
                <p key={i} className="text-xs text-gray-800">
                  {n}
                </p>
              ))
            )}
          </div>
        )}
      </button>
    );
  }

  return (
    <div>
      {/* Staff Attendance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <h2 className="font-semibold text-gray-900 text-sm mb-3">
          Today's Staff Attendance
        </h2>
        {!staffMarked ? (
          <p className="text-xs text-gray-400">
            Staff attendance not marked yet for today.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <StaffBox
              keyName="present"
              label="Present"
              list={staffPresentList}
              color={{
                bg: "bg-green-50",
                text: "text-green-700",
                sub: "text-green-600",
              }}
            />
            <StaffBox
              keyName="absent"
              label="Absent"
              list={staffAbsentList}
              color={{
                bg: "bg-red-50",
                text: "text-red-600",
                sub: "text-red-500",
              }}
            />
            <div className="bg-yellow-50 rounded-lg px-3 py-3">
              <p className="text-xs font-semibold text-yellow-700">
                N/A ({staffNAList.length})
              </p>
              <p className="text-[10px] text-yellow-600 mt-0.5">
                Holiday/unmarked
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Class-wise Student Attendance */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <h2 className="font-semibold text-gray-900 text-sm mb-3">
          Today's attendance of students class-wise
        </h2>
        {classList.length === 0 ? (
          <p className="text-xs text-gray-400">No students found.</p>
        ) : (
          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select class to view names...</option>
              {classList.map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls} — P {classMap[cls].present.length}, A{" "}
                  {classMap[cls].absent.length}, N/A {classMap[cls].na.length}
                </option>
              ))}
            </select>

            {selectedClass && classMap[selectedClass] && (
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <p className="text-xs font-semibold text-green-700 mb-1">
                    Present ({classMap[selectedClass].present.length})
                  </p>
                  {classMap[selectedClass].present.length === 0 ? (
                    <p className="text-xs text-gray-400">—</p>
                  ) : (
                    classMap[selectedClass].present.map((n, i) => (
                      <p key={i} className="text-xs text-gray-800">
                        {n}
                      </p>
                    ))
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-red-600 mb-1">
                    Absent ({classMap[selectedClass].absent.length})
                  </p>
                  {classMap[selectedClass].absent.length === 0 ? (
                    <p className="text-xs text-gray-400">—</p>
                  ) : (
                    classMap[selectedClass].absent.map((n, i) => (
                      <p key={i} className="text-xs text-gray-800">
                        {n}
                      </p>
                    ))
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold text-yellow-700 mb-1">
                    N/A ({classMap[selectedClass].na.length})
                  </p>
                  <p className="text-xs text-gray-400">Holiday/unmarked</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
