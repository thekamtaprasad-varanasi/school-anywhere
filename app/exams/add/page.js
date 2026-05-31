export const dynamic = "force-dynamic";

import AddExamForm from "./AddExamForm";

export default async function AddExamPage() {
  const classes = [
    "Nursery",
    "LKG",
    "UKG",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    "10",
    "11",
    "12",
  ];

  // Auto-suggest academic year (Apr-Mar cycle)
  const now = new Date();
  const month = now.getMonth(); // 0-Jan, 11-Dec
  const year = now.getFullYear();
  const startYear = month < 3 ? year - 1 : year;
  const defaultAcademicYear = `${startYear}-${String(startYear + 1).slice(-2)}`;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Schedule New Exam</h1>
        <p className="text-gray-500 text-sm mt-1">
          Fill in the exam details below
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 max-w-2xl">
        <AddExamForm
          classes={classes}
          defaultAcademicYear={defaultAcademicYear}
        />{" "}
      </div>
    </div>
  );
}
