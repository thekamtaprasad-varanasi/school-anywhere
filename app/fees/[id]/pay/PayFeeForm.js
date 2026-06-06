"use client";

import { useState, useEffect } from "react";
import PaymentQR from "@/components/PaymentQR";

export default function PayFeeForm({ feeId, balance, today }) {
  const [submitting, setSubmitting] = useState(false);
  const [clientToken, setClientToken] = useState("");

  // Generate a unique token once when the form mounts.
  // This token is sent with the payment so retries can be detected server-side.
  useEffect(() => {
    const tok =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setClientToken(tok);
  }, []);

  return (
    <form
      method="POST"
      action="/api/fees/mark-paid"
      onSubmit={() => setSubmitting(true)}
      className="space-y-4"
    >
      <input type="hidden" name="fee_id" value={feeId} />
      <input type="hidden" name="client_token" value={clientToken} />

      <PaymentQR />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Amount Paying Now (₹) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          name="paid_amount"
          required
          min="1"
          defaultValue={balance}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payment Mode <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-4 gap-2">
          {["cash", "online", "upi", "cheque"].map((mode) => (
            <label
              key={mode}
              className="flex items-center justify-center border border-gray-300 rounded-lg px-2 py-2 text-xs font-medium cursor-pointer has-[:checked]:bg-indigo-600 has-[:checked]:text-white has-[:checked]:border-indigo-600"
            >
              <input
                type="radio"
                name="payment_mode"
                value={mode}
                required
                defaultChecked={mode === "cash"}
                className="sr-only"
              />
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Payment Date <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="paid_date"
          required
          defaultValue={today}
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Receipt No.
        </label>
        <input
          type="text"
          name="receipt_no"
          placeholder="e.g. RCP/2024/001"
          className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || !clientToken}
          className="flex-1 bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Recording..." : "Mark as Paid"}
        </button>
        <a
          href="/fees"
          className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium text-center"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}
