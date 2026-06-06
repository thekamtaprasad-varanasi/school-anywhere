// app/marksheet/page.js

export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { MASTER_USER_ID } from "@/lib/config";
import { exams } from "@/lib/schema";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export default async function MarksheetPage({ searchParams }) {
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("session")?.value);
  if (!session) redirect("/login");
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];
  const params = await searchParams;
  const selectedClass = params?.class || "";
  const selectedType = params?.type || "";
  const selectedYear = params?.year || "";

  const allExams = await db
    .select()
    .from(exams)
    .where(eq(exams.user_id, MASTER_USER_ID));

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

  const years = [
    ...new Set(allExams.map((e) => e.academic_year).filter(Boolean)),
  ]
    .sort()
    .reverse();

  const examTypes = [
    { val: "quarterly", label: "Quarterly" },
    { val: "half_yearly", label: "Half Yearly" },
    { val: "annual", label: "Annual" },
    { val: "unit", label: "Unit Test" },
  ];

  // Build quick-access list: class -> set of exam_types that exist
  const classExamMap = {};
  allExams.forEach((e) => {
    if (!classExamMap[e.class]) classExamMap[e.class] = new Set();
    if (e.exam_type) classExamMap[e.class].add(e.exam_type);
  });

  const quickAccess = [];
  Object.entries(classExamMap).forEach(([cls, typeSet]) => {
    typeSet.forEach((type) => {
      quickAccess.push({ class: cls, type });
    });
  });
  quickAccess.sort((a, b) => {
    const ac = isNaN(parseInt(a.class)) ? 99 : parseInt(a.class);
    const bc = isNaN(parseInt(b.class)) ? 99 : parseInt(b.class);
    if (ac !== bc) return ac - bc;
    return a.type.localeCompare(b.type);
  });

  const typeLabelMap = {};
  examTypes.forEach((t) => (typeLabelMap[t.val] = t.label));

  return (
    <div>
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">Marksheet</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          Quarterly · Half Yearly · Annual
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-4">
        <form method="GET" action="/marksheet/view" className="space-y-3">
          {/* Class */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Class <span className="text-red-500">*</span>
            </label>
            <select
              name="class"
              defaultValue={selectedClass}
              required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  Class {c}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Type */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Exam Type <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {examTypes.map(({ val, label }) => (
                <label
                  key={val}
                  className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 cursor-pointer has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50"
                >
                  <input
                    type="radio"
                    name="type"
                    value={val}
                    required
                    defaultChecked={selectedType === val}
                    className="accent-indigo-600"
                  />
                  <span className="text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Academic Year */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Academic Year
            </label>
            {years.length > 0 ? (
              <select
                name="year"
                defaultValue={selectedYear}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="">All Years</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                name="year"
                defaultValue={selectedYear}
                placeholder="e.g. 2024-25"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium"
          >
            Generate Marksheet →
          </button>
        </form>
      </div>

      {/* Quick Access — सिर्फ वो classes जिनमें exams हैं */}
      {quickAccess.length > 0 ? (
        <div>
          <p className="text-xs font-medium text-gray-500 mb-2">
            Quick Access ({quickAccess.length})
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickAccess.map((qa, idx) => (
              <a
                key={idx}
                href={`/marksheet/view?class=${qa.class}&type=${qa.type}`}
                className="bg-white border border-gray-100 rounded-xl p-3 shadow-sm text-center hover:border-indigo-200 hover:shadow"
              >
                <p className="text-sm font-bold text-indigo-700">
                  Class {qa.class}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {typeLabelMap[qa.type] || qa.type}
                </p>
              </a>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-100 rounded-xl p-6 text-center text-gray-400 text-xs">
          No exams scheduled yet.{" "}
          <a
            href="/exams/add"
            className="text-indigo-600 font-medium"
          >
            Schedule one →
          </a>
        </div>
      )}
    </div>
  );
}