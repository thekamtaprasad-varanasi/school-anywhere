"use client";

import { useState, useEffect } from "react";

export default function EditStudentForm({ s, classes }) {
  const [photoUrl, setPhotoUrl] = useState(s.photo_url || "");
  const [photoPreview, setPhotoPreview] = useState(s.photo_url || "");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [admissionNo, setAdmissionNo] = useState(s.admission_no || "");
  const [admissionStatus, setAdmissionStatus] = useState("idle");
  const [admissionConflict, setAdmissionConflict] = useState(null);

  // Live duplicate check whenever admissionNo changes
  useEffect(() => {
    const trimmed = admissionNo.trim();
    // No check if empty or unchanged from original
    if (!trimmed || trimmed === (s.admission_no || "")) {
      setAdmissionStatus("idle");
      setAdmissionConflict(null);
      return;
    }
    setAdmissionStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/students/check-admission-no?admission_no=${encodeURIComponent(trimmed)}&exclude_id=${s.id}`,
        );
        const data = await res.json();
        if (data.available) {
          setAdmissionStatus("available");
          setAdmissionConflict(null);
        } else {
          setAdmissionStatus("taken");
          setAdmissionConflict(data.conflict);
        }
      } catch {
        setAdmissionStatus("idle");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [admissionNo, s.admission_no, s.id]);

  async function handlePhotoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("photo", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    setPhotoUrl(data.url);
    setPhotoPreview(data.url);
    setUploading(false);
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Edit Student</h1>
        <p className="text-gray-500 text-xs mt-0.5">{s.name}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <form
          method="POST"
          action="/api/students/update"
          onSubmit={() => setSubmitting(true)}
          className="space-y-4"
        >
          <input type="hidden" name="id" value={s.id} />
          <input type="hidden" name="photo_url" value={photoUrl} />

          {/* Photo */}
          <div className="flex flex-col items-center gap-3 pb-2">
            <div className="w-24 h-24 rounded-full border-2 border-indigo-200 overflow-hidden bg-gray-50 flex items-center justify-center">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Photo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl">👤</span>
              )}
            </div>
            <label className="cursor-pointer bg-indigo-50 text-indigo-600 text-xs font-medium px-4 py-2 rounded-lg border border-indigo-200">
              {uploading ? "Uploading..." : "Change Photo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoChange}
                disabled={uploading}
              />
            </label>
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              defaultValue={s.name}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Class + Section */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                name="class"
                required
                defaultValue={s.class}
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
                Section <span className="text-red-500">*</span>
              </label>
              <select
                name="section"
                required
                defaultValue={s.section}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select...</option>
                {["A", "B", "C", "D", "E"].map((sec) => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Roll + Scholar No */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Roll Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="roll_number"
                required
                defaultValue={s.roll_number || ""}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Scholar No. (Oblique No.)
              </label>
              <input
                type="text"
                name="admission_no"
                value={admissionNo}
                onChange={(e) => setAdmissionNo(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 ${
                  admissionStatus === "taken"
                    ? "border-red-500 focus:ring-red-500 bg-red-50"
                    : admissionStatus === "available"
                      ? "border-green-400 focus:ring-green-500"
                      : "border-gray-300 focus:ring-indigo-500"
                }`}
              />
              {admissionStatus === "checking" && (
                <p className="text-xs text-gray-500 mt-1">Checking...</p>
              )}
              {admissionStatus === "taken" && admissionConflict && (
                <p className="text-xs text-red-600 mt-1">
                  ⚠️ Already used by {admissionConflict.name} (Class{" "}
                  {admissionConflict.class}-{admissionConflict.section})
                </p>
              )}
              {admissionStatus === "available" && (
                <p className="text-xs text-green-600 mt-1">✓ Available</p>
              )}
            </div>
          </div>

          {/* PEN */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PEN (Permanent Education Number)
            </label>
            <input
              type="text"
              name="pen"
              placeholder="11-digit PEN"
              defaultValue={s.pen || ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Admission Date + Academic Year */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admission Date
              </label>
              <input
                type="date"
                name="admission_date"
                defaultValue={
                  s.admission_date
                    ? new Date(s.admission_date).toISOString().split("T")[0]
                    : ""
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Academic Year
              </label>
              <input
                type="text"
                name="academic_year"
                placeholder="e.g. 2024-25"
                defaultValue={s.academic_year || ""}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Gender + DOB */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                defaultValue={s.gender || ""}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select...</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date of Birth
              </label>
              <input
                type="date"
                name="dob"
                defaultValue={s.dob || ""}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Father + Mother */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Father Name
              </label>
              <input
                type="text"
                name="father_name"
                defaultValue={s.father_name || ""}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mother Name
              </label>
              <input
                type="text"
                name="mother_name"
                defaultValue={s.mother_name || ""}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Guardian */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Guardian Name
            </label>
            <input
              type="text"
              name="guardian_name"
              defaultValue={s.guardian_name || ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Phone + Alt Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                required
                defaultValue={s.phone || ""}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Alt Phone
              </label>
              <input
                type="tel"
                name="alt_phone"
                defaultValue={s.alt_phone || ""}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Religion + Caste */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Religion
              </label>
              <input
                type="text"
                name="religion"
                placeholder="e.g. Hindu"
                defaultValue={s.religion || ""}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Caste
              </label>
              <input
                type="text"
                name="caste"
                defaultValue={s.caste || ""}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Aadhaar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Aadhaar No.
            </label>
            <input
              type="text"
              name="aadhaar"
              defaultValue={s.aadhaar || ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <textarea
              name="address"
              rows={2}
              defaultValue={s.address || ""}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={
                submitting ||
                uploading ||
                admissionStatus === "taken" ||
                admissionStatus === "checking"
              }
              className="flex-1 bg-indigo-600 text-white py-2.5 rounded-lg hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Updating..." : "Update Student"}
            </button>
            <a
              href={`/students/${s.id}`}
              className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-lg text-sm font-medium text-center"
            >
              Cancel
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
