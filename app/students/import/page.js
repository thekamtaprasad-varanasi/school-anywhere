export default function ImportPage() {
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

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          📥 Bulk Import Students
        </h1>
        <p className="text-gray-500 text-xs mt-1">
          Import entire class at once
        </p>
      </div>

      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 text-sm text-indigo-800">
        <p className="font-semibold mb-2">CSV Format:</p>
        <code className="block bg-white rounded p-2 text-xs text-gray-700 leading-relaxed">
          name, roll_number, phone
          <br />
          Rahul Sharma, 1, 9876543210
          <br />
          Priya Singh, 2, 9812345678
        </code>
        <p className="text-xs mt-2 text-indigo-600">
          ✓ First row (header) will be skipped automatically
          <br />
          ✓ Duplicate roll numbers will be skipped
          <br />✓ Class & Section selected below applies to all students
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 max-w-2xl">
        <form method="POST" action="/api/students/import" className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                name="class"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select...</option>
                {classes.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Section
              </label>
              <select
                name="section"
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">None</option>
                {["A", "B", "C", "D", "E"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CSV Data <span className="text-red-500">*</span>
            </label>
            <textarea
              name="csv_data"
              required
              rows={12}
              placeholder="name, roll_number, phone&#10;Rahul Sharma, 1, 9876543210&#10;Priya Singh, 2, 9812345678"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700"
            >
              📥 Import
            </button>
            <a
              href="/students"
              className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-medium"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
