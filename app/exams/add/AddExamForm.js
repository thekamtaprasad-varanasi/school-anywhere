"use client";

import { useState } from "react";

export default function AddExamForm({ classes, defaultAcademicYear }) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      method="POST"
      action="/api/exams/add"
      onSubmit={() => setSubmitting(true)}
      className="space-y-6"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Exam Name <span className="text-red-500">*</span>
        </label>
        <select
          name="name"
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select...</option>
          <option value="Unit Test 1">Unit Test 1</option>
          <option value="Unit Test 2">Unit Test 2</option>
          <option value="Unit Test 3">Unit Test 3</option>
          <option value="Quarterly Exam">Quarterly Exam</option>
          <option value="Half Yearly Exam">Half Yearly Exam</option>
          <option value="Annual Exam">Annual Exam</option>
          <option value="Pre-Board Exam">Pre-Board Exam</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Exam Type <span className="text-red-500">*</span>
        </label>
        <select
          name="exam_type"
          required
          defaultValue="unit"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="unit">Unit Test</option>
          <option value="quarterly">Quarterly</option>
          <option value="half_yearly">Half Yearly</option>
          <option value="annual">Annual</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Class <span className="text-red-500">*</span>
          </label>
          <select
            name="class"
            required
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select...</option>
            {classes.map((c) => (
              <option key={c} value={c}>
                Class {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Subject <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="subject"
            required
            placeholder="e.g., Mathematics"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Exam Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="exam_date"
          required
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Marks <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="max_marks"
            required
            defaultValue={100}
            min={1}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Passing Marks <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            name="passing_marks"
            required
            defaultValue={33}
            min={1}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Academic Year
        </label>
        <input
          type="text"
          name="academic_year"
          defaultValue={defaultAcademicYear}
          placeholder="e.g., 2026-27"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Saving..." : "Save Exam"}
        </button>
        <a
          href="/exams"
          className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-200 text-sm font-medium"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}