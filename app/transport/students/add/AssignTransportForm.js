"use client";

import { useState } from "react";

export default function AssignTransportForm({
  allStudents,
  allRoutes,
  academicYear,
  today,
}) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      method="POST"
      action="/api/transport/assign"
      onSubmit={() => setSubmitting(true)}
      className="space-y-4"
    >
      {/* Student */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Student <span className="text-red-500">*</span>
        </label>
        <select
          name="student_id"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select student...</option>
          {allStudents.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} — Class {s.class} {s.section || ""}
              {s.roll_number ? ` · Roll ${s.roll_number}` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Route */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Route / Stop <span className="text-red-500">*</span>
        </label>
        {allRoutes.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5 text-sm text-yellow-700">
            No routes added yet.{" "}
            <a href="/transport/add" className="font-medium underline">
              first route add
            </a>
          </div>
        ) : (
          <select
            name="transport_id"
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select route...</option>
            {allRoutes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.route_name} — {r.stop_name} · ₹{r.monthly_fee}/mo
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Academic Year & Joined Date */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Academic Year
          </label>
          <input
            type="text"
            name="academic_year"
            defaultValue={academicYear}
            placeholder="e.g. 2024-25"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Joined Date
          </label>
          <input
            type="date"
            name="joined_date"
            defaultValue={today}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || allRoutes.length === 0}
          className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Assigning..." : "Assign"}
        </button>
        <a
          href="/transport"
          className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium text-center"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}