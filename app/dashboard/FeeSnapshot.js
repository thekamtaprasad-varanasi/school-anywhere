"use client";

import { useState } from "react";

export default function FeeSnapshot({
  totalCollected,
  totalPending,
  feeClassMap,
  feeClassList,
}) {
  const [open, setOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState("");

  return (
    <div className="mb-4">
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setOpen(open === "collected" ? false : "collected")}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left active:scale-95 transition"
        >
          <div className="text-2xl mb-1">✅</div>
          <div className="text-2xl font-bold text-green-600">
            ₹{totalCollected}
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Fees Collected</div>
          <div className="text-[10px] text-green-600 mt-1">Tap to view</div>
        </button>
        <button
          type="button"
          onClick={() => setOpen(open === "pending" ? false : "pending")}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left active:scale-95 transition"
        >
          <div className="text-2xl mb-1">⏳</div>
          <div className="text-2xl font-bold text-red-500">₹{totalPending}</div>
          <div className="text-xs text-gray-500 mt-0.5">Fees Pending</div>
          <div className="text-[10px] text-red-500 mt-1">Tap to view</div>
        </button>
      </div>

      {open && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mt-3">
          <h2 className="font-semibold text-gray-900 text-sm mb-3">
            {open === "collected" ? "Collected" : "Pending"} — Class-wise
          </h2>
          {feeClassList.length === 0 ? (
            <p className="text-xs text-gray-400">No fee records yet.</p>
          ) : (
            <div>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select class to view students...</option>
                {feeClassList.map((cls) => (
                  <option key={cls} value={cls}>
                    Class {cls}
                  </option>
                ))}
              </select>

              {selectedClass && feeClassMap[selectedClass] && (
                <div className="space-y-2">
                  {feeClassMap[selectedClass].map((s, i) => {
                    const fullPaid = s.total > 0 && s.remaining <= 0;
                    return (
                      <div
                        key={i}
                        className="flex justify-between items-center bg-gray-50 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm font-medium text-gray-800 truncate">
                          {s.name}
                        </span>
                        {fullPaid ? (
                          <span className="text-xs font-bold text-green-700 shrink-0">
                            100% Paid
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-red-600 shrink-0">
                            ₹{s.remaining} due
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}