// app/transport/receipt/page.js

export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import {
  transport,
  student_transport,
  students,
  school_settings,
} from "@/lib/schema";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { users } from "@/lib/schema";
import PrintButton from "./PrintButton";

export default async function TransportReceiptPage({ searchParams }) {
  const params = await searchParams;
  const studentId = params?.student_id ? parseInt(params.student_id) : null;
  const month = params?.month || "";

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
  if (!studentId) notFound();

  const settingsRows = await db
    .select()
    .from(school_settings)
    .where(eq(school_settings.user_id, 2));
  const school = settingsRows[0] || {};

  const rows = await db
    .select({
      assignment_id: student_transport.id,
      academic_year: student_transport.academic_year,
      joined_date: student_transport.joined_date,
      student_name: students.name,
      student_class: students.class,
      student_section: students.section,
      roll_number: students.roll_number,
      parent_name: students.father_name,
      route_name: transport.route_name,
      stop_name: transport.stop_name,
      monthly_fee: transport.monthly_fee,
      driver_name: transport.driver_name,
      vehicle_no: transport.vehicle_no,
    })
    .from(student_transport)
    .leftJoin(students, eq(student_transport.student_id, students.id))
    .leftJoin(transport, eq(student_transport.transport_id, transport.id))
    .where(eq(student_transport.student_id, studentId));

  if (rows.length === 0) notFound();
  const r = rows[0];

  const receiptNo = `TRP-${String(r.assignment_id).padStart(5, "0")}`;
  const today = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div>
      {/* Screen Controls */}
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transport Receipt</h1>
          <p className="text-gray-500 text-xs mt-1">{receiptNo}</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/transport"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium"
          >
            ← Back
          </a>
          <PrintButton />
        </div>
      </div>

      {/* Receipt */}
      <div
        id="print-area"
        className="bg-white rounded-xl shadow-sm border border-gray-100 max-w-2xl mx-auto p-8 print:shadow-none print:border-none"
      >
        {/* Header */}
        <div className="text-center border-b border-gray-200 pb-6 mb-6">
          {school.logo_url && (
            <img
              src={school.logo_url}
              alt="logo"
              className="h-16 object-contain mx-auto mb-3"
            />
          )}
          <h2 className="text-2xl font-bold text-indigo-700">
            {school.school_name || "School Name"}
          </h2>
          {school.address && (
            <p className="text-gray-400 text-xs mt-1">{school.address}</p>
          )}
          <p className="text-gray-500 text-sm mt-1">Transport Fee Receipt</p>
        </div>

        {/* Receipt No & Date */}
        <div className="flex justify-between mb-6 text-sm">
          <div>
            <span className="text-gray-500">Receipt No:</span>
            <span className="font-bold text-gray-900 ml-2">{receiptNo}</span>
          </div>
          <div>
            <span className="text-gray-500">Date:</span>
            <span className="font-medium text-gray-900 ml-2">{today}</span>
          </div>
        </div>

        {/* Student Details */}
        <div className="bg-gray-50 rounded-lg p-5 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
            Student Details
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>
              <span className="font-medium text-gray-900 ml-2">
                {r.student_name}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Class:</span>
              <span className="font-medium text-gray-900 ml-2">
                {r.student_class} {r.student_section || ""}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Roll No:</span>
              <span className="font-medium text-gray-900 ml-2">
                {r.roll_number || "—"}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Parent:</span>
              <span className="font-medium text-gray-900 ml-2">
                {r.parent_name || "—"}
              </span>
            </div>
          </div>
        </div>

        {/* Transport Details */}
        <div className="bg-indigo-50 rounded-lg p-5 mb-6">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
            Transport Details
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500">Route:</span>
              <span className="font-medium text-gray-900 ml-2">
                {r.route_name}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Stop:</span>
              <span className="font-medium text-gray-900 ml-2">
                {r.stop_name}
              </span>
            </div>
            {r.driver_name && (
              <div>
                <span className="text-gray-500">Driver:</span>
                <span className="font-medium text-gray-900 ml-2">
                  {r.driver_name}
                </span>
              </div>
            )}
            {r.vehicle_no && (
              <div>
                <span className="text-gray-500">Vehicle:</span>
                <span className="font-medium text-gray-900 ml-2">
                  {r.vehicle_no}
                </span>
              </div>
            )}
            {r.academic_year && (
              <div>
                <span className="text-gray-500">Academic Year:</span>
                <span className="font-medium text-gray-900 ml-2">
                  {r.academic_year}
                </span>
              </div>
            )}
            {month && (
              <div>
                <span className="text-gray-500">Month:</span>
                <span className="font-medium text-gray-900 ml-2">{month}</span>
              </div>
            )}
          </div>
        </div>

        {/* Fee Table */}
        <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
          <table className="min-w-full">
            <thead className="bg-indigo-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-semibold text-indigo-700 uppercase">
                  Description
                </th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-indigo-700 uppercase">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-gray-200">
                <td className="px-5 py-4 text-sm text-gray-700">
                  Transport Fee — {r.route_name} ({r.stop_name})
                  {month ? ` — ${month}` : ""}
                </td>
                <td className="px-5 py-4 text-sm text-gray-900 text-right">
                  ₹{r.monthly_fee}
                </td>
              </tr>
              <tr className="border-t border-gray-200 bg-gray-50">
                <td className="px-5 py-4 text-sm font-bold text-gray-900">
                  Total
                </td>
                <td className="px-5 py-4 text-sm font-bold text-green-600 text-right">
                  ₹{r.monthly_fee}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Status */}
        <div className="flex justify-center mb-8">
          <span className="px-6 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
            ✅ Payment Received
          </span>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6 flex justify-between text-xs text-gray-400 print:mt-8">
          <span>Nishant School Software</span>
          <span>Authorised Signature: _______________</span>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #print-area, #print-area * { visibility: visible; }
          #print-area { position: absolute; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
