export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { MASTER_USER_ID } from "@/lib/config";
import { students, fee_concessions, users, fees } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import AddConcessionForm from "./AddConcessionForm";

export default async function StudentDetailPage({ params }) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) redirect("/login");
  const session = await getSession(token);
  if (!session) redirect("/login");

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];
  if (!user) redirect("/login");

  const result = await db
    .select()
    .from(students)
    .where(and(eq(students.id, Number(id)), eq(students.user_id, MASTER_USER_ID)));
  if (result.length === 0) notFound();
  const s = result[0];

  const concessions = await db
    .select()
    .from(fee_concessions)
    .where(eq(fee_concessions.student_id, Number(id)));

  const studentFees = await db
    .select()
    .from(fees)
    .where(eq(fees.student_id, Number(id)));
  const totalFees = studentFees.reduce((sum, f) => sum + (f.amount || 0), 0);
  const paidFees = studentFees
    .filter((f) => f.status === "paid")
    .reduce((sum, f) => sum + (f.amount || 0), 0);
  const pendingFees = totalFees - paidFees;
  const pendingList = studentFees.filter((f) => f.status !== "paid");

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Student Details</h1>
          <p className="text-gray-500 text-xs mt-0.5">{s.name}</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/students/${id}/edit`}
            className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-xs font-medium"
          >
            Edit
          </Link>
          <form method="POST" action="/api/students/delete">
            <input type="hidden" name="id" value={s.id} />
            <button
              type="submit"
              className="bg-red-500 text-white px-3 py-2 rounded-lg text-xs font-medium"
            >
              Delete
            </button>
          </form>
          <Link
            href="/students"
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-medium"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Photo + Name Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4 flex items-center gap-4">
        <div className="w-16 h-16 rounded-full border-2 border-indigo-100 overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
          {s.photo_url ? (
            <img
              src={s.photo_url}
              alt={s.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-3xl">👤</span>
          )}
        </div>
        <div>
          <p className="text-base font-bold text-gray-900">{s.name}</p>
          <p className="text-xs text-gray-500">
            Class {s.class} — {s.section}
          </p>
          <span
            className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full font-medium ${s.fee_status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
          >
            {s.fee_status}
          </span>
        </div>
      </div>

      {/* Details Grid */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">
              Roll Number
            </p>
            <p className="text-sm font-medium text-gray-900">
              {s.roll_number || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">
              Scholar No.
            </p>
            <p className="text-sm font-medium text-gray-900">
              {s.admission_no || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">
              PEN
            </p>
            <p className="text-sm font-medium text-gray-900">{s.pen || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">
              Aadhaar No.
            </p>
            <p className="text-sm font-medium text-gray-900">
              {s.aadhaar || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">
              Father Name
            </p>
            <p className="text-sm font-medium text-gray-900">
              {s.father_name || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">
              Mother Name
            </p>
            <p className="text-sm font-medium text-gray-900">
              {s.mother_name || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">
              Phone
            </p>
            <p className="text-sm font-medium text-gray-900">
              {s.phone || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">
              Alt Phone
            </p>
            <p className="text-sm font-medium text-gray-900">
              {s.alt_phone || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">
              Gender
            </p>
            <p className="text-sm font-medium text-gray-900">
              {s.gender || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">
              Date of Birth
            </p>
            <p className="text-sm font-medium text-gray-900">{s.dob || "—"}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">
              Religion
            </p>
            <p className="text-sm font-medium text-gray-900">
              {s.religion || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">
              Caste
            </p>
            <p className="text-sm font-medium text-gray-900">
              {s.caste || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">
              Academic Year
            </p>
            <p className="text-sm font-medium text-gray-900">
              {s.academic_year || "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">
              Admission Date
            </p>
            <p className="text-sm font-medium text-gray-900">
              {s.admission_date
                ? new Date(s.admission_date).toLocaleDateString("en-IN")
                : "—"}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-xs text-gray-400 uppercase font-medium mb-0.5">
              Address
            </p>
            <p className="text-sm font-medium text-gray-900">
              {s.address || "—"}
            </p>
          </div>
        </div>
      </div>

      {/* Fee Status */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-sm font-bold text-gray-900">💰 Fee Status</h2>
          <Link href="/fees" className="text-xs text-indigo-600 font-medium">
            View All →
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg p-2.5 text-center">
            <p className="text-xs text-gray-400">Total</p>
            <p className="text-sm font-bold text-gray-900">₹{totalFees}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-2.5 text-center">
            <p className="text-xs text-green-500">Paid</p>
            <p className="text-sm font-bold text-green-700">₹{paidFees}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-2.5 text-center">
            <p className="text-xs text-red-400">Pending</p>
            <p className="text-sm font-bold text-red-600">₹{pendingFees}</p>
          </div>
        </div>
        {pendingList.length > 0 && (
          <div className="space-y-1.5">
            {pendingList.map((f) => (
              <div
                key={f.id}
                className="flex justify-between items-center bg-red-50 rounded-lg px-3 py-2"
              >
                <p className="text-xs font-medium text-gray-800">
                  {f.month || "—"} {f.academic_year || ""}
                </p>
                <p className="text-xs font-bold text-red-600">₹{f.amount}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fee Concession */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-sm font-bold text-gray-900 mb-3">
          💸 Fee Concession
        </h2>
        {concessions.length > 0 ? (
          <div className="space-y-2 mb-4">
            {concessions.map((c) => (
              <div
                key={c.id}
                className="flex justify-between items-center bg-green-50 border border-green-100 rounded-lg px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {c.discount_type === "percent"
                      ? `${c.discount_value}% discount`
                      : `₹${c.discount_value} off`}
                  </p>
                  {c.reason && (
                    <p className="text-xs text-gray-500 mt-0.5">{c.reason}</p>
                  )}
                </div>
                <form method="POST" action="/api/concessions/delete">
                  <input type="hidden" name="id" value={c.id} />
                  <input type="hidden" name="student_id" value={s.id} />
                  <button
                    type="submit"
                    className="text-xs text-red-500 font-medium"
                  >
                    Remove
                  </button>
                </form>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 mb-4">No concession set.</p>
        )}
        <AddConcessionForm studentId={s.id} />
      </div>
    </div>
  );
}
