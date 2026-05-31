"use client";

import { useState } from "react";

export default function ParentForm({ student, existingParent }) {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      method="POST"
      action="/api/parents/save"
      onSubmit={() => setSubmitting(true)}
      className="space-y-5"
    >
      <input type="hidden" name="student_id" value={student.id} />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Parent Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="name"
          required
          defaultValue={existingParent?.name || student.father_name || ""}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number <span className="text-red-500">*</span>
          <span className="text-gray-400 font-normal ml-1">
            (used for login)
          </span>
        </label>
        <input
          type="tel"
          name="phone"
          required
          defaultValue={existingParent?.phone || student.phone || ""}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          type="email"
          name="email"
          defaultValue={existingParent?.email || ""}
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Password
          {!existingParent && <span className="text-red-500">*</span>}
          <span className="text-gray-400 font-normal ml-1">
            {existingParent
              ? "(leave blank to keep current password)"
              : "(share this with the parent)"}
          </span>
        </label>
        <input
          type="text"
          name="password"
          required={!existingParent}
          defaultValue=""
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting
            ? existingParent
              ? "Updating..."
              : "Creating..."
            : existingParent
              ? "Update Account"
              : "Create Account"}
        </button>
        <a
          href="/students"
          className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-200 text-sm font-medium"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}