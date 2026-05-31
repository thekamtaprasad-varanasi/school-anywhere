"use client";

import { useState } from "react";

export default function AddConcessionForm({ studentId }) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      method="POST"
      action="/api/concessions/add"
      onSubmit={() => setSubmitting(true)}
      className="space-y-3"
    >
      <input type="hidden" name="student_id" value={studentId} />
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            name="discount_type"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="amount">Fixed Amount (₹)</option>
            <option value="percent">Percentage (%)</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Value
          </label>
          <input
            type="number"
            name="discount_value"
            required
            min="1"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Reason
        </label>
        <input
          type="text"
          name="reason"
          placeholder="e.g. Staff child, Merit, Poor family"
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-indigo-600 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Adding..." : "Add Concession"}
      </button>
    </form>
  );
}