"use client";

export default function DeleteCertificate({ certId, studentName, certType }) {
  function handleSubmit(e) {
    if (
      !confirm(
        `Delete this ${certType} for ${studentName || "this student"}? This cannot be undone.`,
      )
    ) {
      e.preventDefault();
    }
  }

  return (
    <form
      action="/api/certificates/delete"
      method="POST"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="id" value={certId} />
      <button
        type="submit"
        className="text-xs text-red-500 font-medium bg-red-50 px-3 py-1.5 rounded-lg"
      >
        🗑 Delete
      </button>
    </form>
  );
}