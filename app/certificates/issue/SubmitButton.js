"use client";

import { useState, useEffect } from "react";

export default function SubmitButton() {
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const form = document.querySelector('form[action="/api/certificates/issue"]');
    if (!form) return;
    const handler = () => setSubmitting(true);
    form.addEventListener("submit", handler);
    return () => form.removeEventListener("submit", handler);
  }, []);

  return (
    <button
      type="submit"
      disabled={submitting}
      className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {submitting ? "Issuing..." : "Issue Certificate"}
    </button>
  );
}