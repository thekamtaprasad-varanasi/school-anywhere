"use client";

export default function DeleteStudentButton({ studentId, studentName }) {
  function handleSubmit(e) {
    if (
      !confirm(
        `Delete ${studentName || "this student"}? This cannot be undone.`,
      )
    ) {
      e.preventDefault();
    }
  }

  return (
    <form
      method="POST"
      action="/api/teacher/students/delete"
      onSubmit={handleSubmit}
      className="inline"
    >
      <input type="hidden" name="id" value={studentId} />
      <button
        type="submit"
        className="text-xs text-red-500 font-medium"
      >
        Delete
      </button>
    </form>
  );
}