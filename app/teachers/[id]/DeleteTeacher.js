"use client";

export default function DeleteTeacher({ teacherId, teacherName }) {
  return (
    <form
      method="POST"
      action="/api/teachers/delete"
      onSubmit={(e) => {
        if (!confirm(`Delete ${teacherName}? This cannot be undone.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={teacherId} />
      <button
        type="submit"
        className="bg-red-600 text-white px-6 py-2.5 rounded-lg hover:bg-red-700 text-sm font-medium"
      >
        🗑 Delete Teacher
      </button>
    </form>
  );
}
