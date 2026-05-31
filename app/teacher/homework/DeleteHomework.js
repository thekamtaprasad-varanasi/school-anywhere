"use client";

export default function DeleteHomework({ homeworkId, homeworkTitle }) {
  function handleSubmit(e) {
    if (!confirm(`Delete homework "${homeworkTitle}"? This cannot be undone.`)) {
      e.preventDefault();
    }
  }

  return (
    <form
      action="/api/teacher/homework/delete"
      method="POST"
      onSubmit={handleSubmit}
    >
      <input type="hidden" name="homework_id" value={homeworkId} />
      <button
        type="submit"
        className="text-xs font-medium text-red-500 bg-red-50 px-3 py-1 rounded-lg"
      >
        🗑 Delete
      </button>
    </form>
  );
}