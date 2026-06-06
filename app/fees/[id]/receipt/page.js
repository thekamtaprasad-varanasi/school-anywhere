import { db } from "@/lib/db";
import { MASTER_USER_ID } from "@/lib/config";
import { redirect } from "next/navigation";
import {
  fees,
  students,
  school_settings,
  users,
  fee_payments,
  fee_concessions,
} from "@/lib/schema";
import { eq, and, asc } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import PrintButton from "./PrintButton";
import PaymentQR from "@/components/PaymentQR";

export const dynamic = "force-dynamic";

const FEE_LABEL = {
  monthly: "Monthly Fee",
  transport: "Transport Fee",
  amenity: "Amenity Fee",
  exam: "Exam Fee",
  admission: "Admission Fee",
  late: "Late Payment",
};

function labelOf(type) {
  if (FEE_LABEL[type]) return FEE_LABEL[type];
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function FeeReceiptPage({ params }) {
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

  const settingsResult = await db
    .select()
    .from(school_settings)
    .where(eq(school_settings.user_id, MASTER_USER_ID));
  const settings = settingsResult[0] || {};

  const [anchor] = await db
    .select({
      id: fees.id,
      student_id: fees.student_id,
      receipt_no: fees.receipt_no,
      academic_year: fees.academic_year,
      paid_date: fees.paid_date,
      due_date: fees.due_date,
      student_name: students.name,
      student_class: students.class,
      student_section: students.section,
      roll_number: students.roll_number,
      admission_no: students.admission_no,
      parent_name: students.father_name,
      parent_phone: students.phone,
    })
    .from(fees)
    .leftJoin(students, eq(fees.student_id, students.id))
    .where(and(eq(fees.id, parseInt(id)), eq(fees.user_id, MASTER_USER_ID)));

  if (!anchor)
    return <div className="p-8 text-red-500">Receipt not found.</div>;

  // Consolidated — all fees with same receipt_no + student_id
  const consolidated = await db
    .select({
      id: fees.id,
      amount: fees.amount,
      paid_amount: fees.paid_amount,
      fee_type: fees.fee_type,
      month: fees.month,
      status: fees.status,
      due_date: fees.due_date,
      paid_date: fees.paid_date,
      discount: fees.discount,
    })
    .from(fees)
    .where(
      and(
        eq(fees.user_id, MASTER_USER_ID),
        eq(fees.student_id, anchor.student_id),
        eq(fees.receipt_no, anchor.receipt_no),
      ),
    )
    .orderBy(asc(fees.id));

  const concessionResult = anchor.student_id
    ? await db
        .select()
        .from(fee_concessions)
        .where(eq(fee_concessions.student_id, anchor.student_id))
    : [];
  const concession = concessionResult[0] || null;

  const receiptNo =
    anchor.receipt_no || `RCP-${String(anchor.id).padStart(5, "0")}`;
  const receiptDate = anchor.paid_date
    ? new Date(anchor.paid_date).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : new Date(anchor.due_date || Date.now()).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

  const totalAmount = consolidated.reduce((s, f) => s + (f.amount || 0), 0);
  const totalDiscount = consolidated.reduce((s, f) => s + (f.discount || 0), 0);
  const netPayable = totalAmount - totalDiscount;
  const totalPaid = consolidated.reduce((s, f) => s + (f.paid_amount || 0), 0);
  const balance = netPayable - totalPaid;
  return (
    <div>
      <div className="flex justify-between items-center mb-6 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fee Receipt</h1>
          <p className="text-gray-500 text-sm mt-1">{receiptNo}</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/fees"
            className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg hover:bg-gray-200 text-sm font-medium"
          >
            ← Back
          </a>
          <PrintButton />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 max-w-2xl mx-auto print:shadow-none print:border-none">
        <div className="text-center border-b-2 border-indigo-600 p-6">
          {settings.logo_url && (
            <img
              src={settings.logo_url}
              alt="logo"
              className="h-16 object-contain mx-auto mb-3"
            />
          )}
          <h2 className="text-2xl font-bold text-indigo-700">
            {settings.school_name || "School"}
          </h2>
          {settings.address && (
            <p className="text-gray-500 text-xs mt-1">{settings.address}</p>
          )}
          {settings.phone && (
            <p className="text-gray-500 text-xs">📞 {settings.phone}</p>
          )}
          {settings.affiliation_no && (
            <p className="text-gray-400 text-xs mt-0.5">
              Affiliation No: {settings.affiliation_no}
            </p>
          )}
          <div className="mt-3 inline-block bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full">
            FEE PAYMENT RECEIPT
          </div>
        </div>

        <div className="p-6">
          <div className="flex justify-between mb-5 bg-gray-50 rounded-lg px-4 py-3 text-sm">
            <div>
              <span className="text-gray-500">Receipt No:</span>
              <span className="font-bold text-gray-900 ml-2">{receiptNo}</span>
            </div>
            <div>
              <span className="text-gray-500">Date:</span>
              <span className="font-medium text-gray-900 ml-2">
                {receiptDate}
              </span>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-4 mb-5">
            <h3 className="text-xs font-bold text-indigo-600 uppercase mb-3">
              Student Details
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-500">Name:</span>
                <span className="font-semibold text-gray-900 ml-2">
                  {anchor.student_name}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Class:</span>
                <span className="font-semibold text-gray-900 ml-2">
                  {anchor.student_class} {anchor.student_section}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Roll No:</span>
                <span className="font-semibold text-gray-900 ml-2">
                  {anchor.roll_number || "—"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Admission No:</span>
                <span className="font-semibold text-gray-900 ml-2">
                  {anchor.admission_no || "—"}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Parent:</span>
                <span className="font-semibold text-gray-900 ml-2">
                  {anchor.parent_name || "—"}
                </span>
              </div>
              {anchor.academic_year && (
                <div>
                  <span className="text-gray-500">Session:</span>
                  <span className="font-semibold text-gray-900 ml-2">
                    {anchor.academic_year}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden mb-5">
            <table className="min-w-full">
              <thead className="bg-indigo-600">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-white uppercase">
                    Description
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-white uppercase">
                    Month
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold text-white uppercase">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {consolidated.map((f) => (
                  <tr key={f.id} className="border-t border-gray-100">
                    <td className="px-4 py-2.5 text-sm text-gray-700">
                      {labelOf(f.fee_type)}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-700 text-center">
                      {f.month || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-gray-900 text-right font-medium">
                      ₹{f.amount}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-gray-300 bg-gray-50">
                  <td
                    className="px-4 py-3 text-sm font-bold text-gray-900"
                    colSpan={2}
                  >
                    Grand Total
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                    ₹{totalAmount}
                  </td>
                </tr>
                {totalDiscount > 0 && (
                  <>
                    <tr className="border-t border-gray-100">
                      <td
                        className="px-4 py-3 text-sm text-amber-700"
                        colSpan={2}
                      >
                        Discount
                      </td>
                      <td className="px-4 py-3 text-sm text-amber-700 text-right font-bold">
                        −₹{totalDiscount}
                      </td>
                    </tr>
                    <tr className="border-t border-gray-100 bg-indigo-50">
                      <td
                        className="px-4 py-3 text-sm font-bold text-indigo-700"
                        colSpan={2}
                      >
                        Net Payable
                      </td>
                      <td className="px-4 py-3 text-sm font-bold text-indigo-700 text-right">
                        ₹{netPayable}
                      </td>
                    </tr>
                  </>
                )}
                <tr className="border-t border-gray-100">
                  <td className="px-4 py-3 text-sm text-gray-600" colSpan={2}>
                    Amount Paid
                  </td>
                  <td className="px-4 py-3 text-sm text-green-600 text-right font-bold">
                    ₹{totalPaid}
                  </td>
                </tr>
                {concession && (
                  <tr className="border-t border-gray-100 bg-green-50">
                    <td
                      className="px-4 py-3 text-sm text-green-600"
                      colSpan={2}
                    >
                      Concession{" "}
                      {concession.reason ? `(${concession.reason})` : ""}
                    </td>
                    <td className="px-4 py-3 text-sm text-green-600 text-right font-bold">
                      {concession.discount_type === "percent"
                        ? `${concession.discount_value}%`
                        : `₹${concession.discount_value}`}{" "}
                      off
                    </td>
                  </tr>
                )}
                {balance > 0 && (
                  <tr className="border-t border-gray-100 bg-red-50">
                    <td className="px-4 py-3 text-sm text-red-600" colSpan={2}>
                      Balance Due
                    </td>
                    <td className="px-4 py-3 text-sm text-red-600 text-right font-bold">
                      ₹{balance}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center mb-6">
            {balance === 0 ? (
              <span className="px-6 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                ✅ Payment Complete
              </span>
            ) : (
              <span className="px-6 py-2 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold">
                ⚠️ Balance ₹{balance} Due
              </span>
            )}
          </div>

          {balance > 0 && <PaymentQR />}

          <div className="border-t border-gray-200 pt-5 flex justify-between items-end">
            <div className="text-xs text-gray-400">
              <p className="font-medium">{settings.school_name || "School"}</p>
              {settings.address && <p>{settings.address}</p>}
            </div>
            <div className="text-right text-xs text-gray-500">
              <p className="mb-2">Authorised Signature</p>
              {settings.principal_signature_url ? (
                <img
                  src={settings.principal_signature_url}
                  alt="Signature"
                  className="h-12 ml-auto mb-1 object-contain"
                />
              ) : (
                <p className="mb-6">___________________</p>
              )}
              {settings.principal_name && (
                <p className="font-medium text-gray-700">
                  {settings.principal_name}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
