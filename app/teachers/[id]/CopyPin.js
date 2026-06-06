"use client";

export default function CopyPin({ pin }) {
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(pin);
        alert("PIN copied!");
      }}
      className="text-xs text-indigo-600 border border-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-50"
    >
      Copy PIN
    </button>
  );
}
