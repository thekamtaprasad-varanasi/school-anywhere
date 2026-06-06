"use client";

import { useState, useMemo } from "react";

const FIXED_TYPES = [
  { value: "monthly", label: "Monthly Fee" },
  { value: "transport", label: "Transport Fee" },
  { value: "amenity", label: "Amenity Fee" },
  { value: "exam", label: "Exam Fee" },
  { value: "admission", label: "Admission Fee" },
  { value: "late", label: "Late Payment" },
];

const FIXED_VALUES = new Set(FIXED_TYPES.map((f) => f.value));

const CLASSES = [
  "Nursery", "LKG", "UKG", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12",
];

function humanize(slug) {
  return slug.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function EditPackageForm({ pkg }) {
  const initialChecked = {};
  const initialAmounts = {};
  const initialCustom = [];
  for (const it of pkg.items) {
    if (FIXED_VALUES.has(it.fee_type)) {
      initialChecked[it.fee_type] = true;
      initialAmounts[it.fee_type] = String(it.amount);
    } else {
      initialCustom.push({ name: humanize(it.fee_type), amount: String(it.amount) });
    }
  }

  const [selectedClass, setSelectedClass] = useState(pkg.class || "");
  const [academicYear, setAcademicYear] = useState(pkg.academic_year || "");
  const [checkedTypes, setCheckedTypes] = useState(initialChecked);
  const [amounts, setAmounts] = useState(initialAmounts);
  const [customItems, setCustomItems] = useState(initialCustom);
  const [submitting, setSubmitting] = useState(false);

  function handleCheck(feeType) {
    setCheckedTypes((prev) => ({ ...prev, [feeType]: !prev[feeType] }));
  }
  function handleAmountChange(feeType, val) {
    setAmounts((prev) => ({ ...prev, [feeType]: val }));
  }
  function addCustomItem() {
    setCustomItems((prev) => [...prev, { name: "", amount: "" }]);
  }
  function updateCustom(index, field, val) {
    setCustomItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: val } : it)),
    );
  }
  function removeCustom(index) {
    setCustomItems((prev) => prev.filter((_, i) => i !== index));
  }

  const total = useMemo(() => {
    const fixed = FIXED_TYPES.filter((ft) => checkedTypes[ft.value]).reduce(
      (sum, ft) => sum + (parseInt(amounts[ft.value]) || 0),
      0,
    );
    const custom = customItems.reduce(
      (sum, it) => sum + (parseInt(it.amount) || 0),
      0,
    );
    return fixed + custom;
  }, [checkedTypes, amounts, customItems]);

  const checkedCount = FIXED_TYPES.filter((ft) => checkedTypes[ft.value]).length;
  const validCustomCount = customItems.filter(
    (it) => it.name.trim() && parseInt(it.amount) > 0,
  ).length;
  const itemCount = checkedCount + validCustomCount;

  return (
    <form
      method="POST"
      action={`/api/fee-structure/packages/${pkg.id}/edit`}
      onSubmit={() => setSubmitting(true)}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Class <span className="text-red-500">*</span>
          </label>
          <select
            name="class"
            required
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select...</option>
            {CLASSES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Academic Year <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="academic_year"
            required
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Fee Types</label>
        <div className="space-y-2">
          {FIXED_TYPES.map((ft) => (
            <div
              key={ft.value}
              className={`border rounded-lg px-3 py-2.5 flex items-center gap-3 ${
                checkedTypes[ft.value] ? "border-indigo-400 bg-indigo-50" : "border-gray-200 bg-white"
              }`}
            >
              <input
                type="checkbox"
                id={ft.value}
                checked={!!checkedTypes[ft.value]}
                onChange={() => handleCheck(ft.value)}
                className="w-4 h-4 accent-indigo-600"
              />
              <label htmlFor={ft.value} className="flex-1 text-sm font-medium text-gray-700 cursor-pointer">
                {ft.label}
              </label>
              {checkedTypes[ft.value] && (
                <>
                  <input type="hidden" name={`fee_type_${ft.value}`} value={ft.value} />
                  <input
                    type="number"
                    name={`amount_${ft.value}`}
                    value={amounts[ft.value] || ""}
                    onChange={(e) => handleAmountChange(ft.value, e.target.value)}
                    min="1"
                    required
                    placeholder="₹"
                    className="w-24 border border-gray-300 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium text-gray-700">
            Custom Items <span className="text-gray-400 text-xs font-normal">(i-card, uniform, books, etc.)</span>
          </label>
          <button type="button" onClick={addCustomItem} className="text-xs text-indigo-600 font-medium">
            + Add Item
          </button>
        </div>
        {customItems.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No custom items.</p>
        ) : (
          <div className="space-y-2">
            {customItems.map((it, i) => (
              <div key={i} className="border border-amber-200 bg-amber-50 rounded-lg px-3 py-2 flex items-center gap-2">
                <input
                  type="text"
                  name={`custom_name_${i}`}
                  value={it.name}
                  onChange={(e) => updateCustom(i, "name", e.target.value)}
                  placeholder="Item name (e.g. i-card)"
                  required
                  className="flex-1 border border-amber-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <input
                  type="number"
                  name={`custom_amount_${i}`}
                  value={it.amount}
                  onChange={(e) => updateCustom(i, "amount", e.target.value)}
                  min="1"
                  required
                  placeholder="₹"
                  className="w-24 border border-amber-300 rounded-lg px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button type="button" onClick={() => removeCustom(i)} className="text-red-500 text-lg font-bold w-6" title="Remove">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        <input type="hidden" name="custom_count" value={customItems.length} />
      </div>

      {itemCount > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3 flex justify-between items-center">
          <span className="text-sm font-medium text-indigo-700">Total ({itemCount} items)</span>
          <span className="text-lg font-bold text-indigo-700">₹{total}</span>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || itemCount === 0 || !selectedClass || !academicYear}
          className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "Updating..." : "Update Package"}
        </button>
        <a href="/fee-structure" className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium text-center">
          Cancel
        </a>
      </div>
    </form>
  );
}