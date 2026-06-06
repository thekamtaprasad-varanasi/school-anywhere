"use client";

export default function DeleteExam({ examId, examName }) {
  function handleSubmit(e) {
    if (!confirm(`Delete exam "${examName}"? All marks entered will also be removed. This cannot be undone.`)) {
      e.preventDefault();
    }
  }

  return (
    <form action="/api/exams/delete" method="POST" onSubmit={handleSubmit}>
      <input type="hidden" name="exam_id" value={examId} />
      <button
        type="submit"
        className="text-xs font-medium text-red-500 bg-red-50 px-3 py-1.5 rounded-lg"
      >
        🗑 Delete
      </button>
    </form>
  );
}