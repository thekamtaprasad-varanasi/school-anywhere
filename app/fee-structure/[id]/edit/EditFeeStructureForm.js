"use client";

import { useState } from "react";

export default function EditFeeStructureForm({ structure, classes }) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      method="POST"
      action={`/api/fee-structure/${structure.id}/edit`}
      onSubmit={() => setSubmitting(true)}
      className="space-y-4"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Class <span className="text-red-500">*</span>
        </label>
        <select
          name="class"
          required
          defaultValue={structure.class}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select...</option>
          {classes.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Fee Type <span className="text-red-500">*</span>
        </label>
        <select
          name="fee_type"
          required
          defaultValue={structure.fee_type}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="monthly">Monthly Fee</option>
          <option value="admission">Admission Fee</option>
          <option value="exam">Exam Fee</option>
          <option value="late">Late Payment</option>
          <option value="transport">Transport Fee</option>
          <option value="misc">Miscellaneous</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount (₹) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="amount"
          required
          min="1"
          defaultValue={structure.amount}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Academic Year
        </label>
        <input
          type="text"
          name="academic_year"
          defaultValue={structure.academic_year || ""}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Saving..." : "Update"}
        </button>
        <a
          href="/fee-structure"
          className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium text-center"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
