"use client";

import { useState } from "react";

export default function PromoteForm({
  classes,
  allClassOptions,
  classCounts,
  nextAcademicYear,
}) {
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e) {
    if (!confirm("Are you sure? This cannot be undone.")) {
      e.preventDefault();
      return;
    }
    setSubmitting(true);
  }

  return (
    <form
      method="POST"
      action="/api/students/promote"
      onSubmit={handleSubmit}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          From Class <span className="text-red-500">*</span>
        </label>
        <select
          name="from_class"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select class to promote...</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              Class {c} ({classCounts[c] || 0} students)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          To Class <span className="text-red-500">*</span>
        </label>
        <select
          name="to_class"
          required
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select destination class...</option>
          {allClassOptions.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          New Academic Year <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="new_academic_year"
          required
          defaultValue={nextAcademicYear}
          placeholder="e.g. 2025-26"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Promoting..." : "Promote Students →"}
      </button>
    </form>
  );
}
