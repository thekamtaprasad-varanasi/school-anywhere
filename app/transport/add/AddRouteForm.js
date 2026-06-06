"use client";

import { useState } from "react";

export default function AddRouteForm() {
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      method="POST"
      action="/api/transport/routes/add"
      onSubmit={() => setSubmitting(true)}
      className="space-y-4"
    >
      {/* Route Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Route Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="route_name"
          required
          placeholder="e.g. Varanasi North Route"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Stop Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Stop Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          name="stop_name"
          required
          placeholder="e.g. Sigra Chowk"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Monthly Fee */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Monthly Fee (₹) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="monthly_fee"
          required
          min="0"
          step="1"
          placeholder="e.g. 500"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Driver & Vehicle */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Driver Name
          </label>
          <input
            type="text"
            name="driver_name"
            placeholder="e.g. Ramesh Kumar"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vehicle No.
          </label>
          <input
            type="text"
            name="vehicle_no"
            placeholder="e.g. UP65 AB 1234"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Saving..." : "Save Route"}
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