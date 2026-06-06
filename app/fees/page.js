export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { MASTER_USER_ID } from "@/lib/config";
import { fees, students, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import Link from "next/link";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

const FEE_LABEL = {
  previous_dues: "Previous Dues",
  monthly: "Monthly",
  transport: "Transport",
  amenity: "Amenity",
  exam: "Exam",
  admission: "Admission",
  late: "Late Payment",
};

function labelOf(type) {
  if (FEE_LABEL[type]) return FEE_LABEL[type];
  return type.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function FeesPage({ searchParams }) {
  const params = await searchParams;
  const tab = params?.tab || "students";
  const cookieStore = await cookies();
  const session = await getSession(cookieStore.get("session")?.value);
  if (!session) redirect("/login");
  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];

  const allFees = await db
    .select({
      id: fees.id,
      amount: fees.amount,
      paid_amount: fees.paid_amount,
      due_date: fees.due_date,
      paid_date: fees.paid_date,
      status: fees.status,
      fee_type: fees.fee_type,
      month: fees.month,
      student_name: students.name,
      student_id: fees.student_id,
      class: students.class,
      section: students.section,
      parent_phone: students.phone,
      parent_name: students.father_name,
    })
    .from(fees)
    .leftJoin(students, eq(fees.student_id, students.id))
    .where(eq(students.user_id, MASTER_USER_ID))
    .orderBy(fees.due_date);

  const todayDate = new Date();
  const isOverdue = (f) =>
    f.status !== "paid" && f.due_date && new Date(f.due_date) < todayDate;

  const summary = {
    total_collected: allFees.reduce((s, f) => s + (f.paid_amount || 0), 0),
    total_pending: allFees
      .filter((f) => f.status !== "paid")
      .reduce((s, f) => s + ((f.amount || 0) - (f.paid_amount || 0)), 0),
    total_overdue: allFees
      .filter(isOverdue)
      .reduce((s, f) => s + ((f.amount || 0) - (f.paid_amount || 0)), 0),
    paid_count: allFees.filter((f) => f.status === "paid").length,
  };

  // Group fees by student
  const byStudent = {};
  for (const f of allFees) {
    if (!byStudent[f.student_id]) {
      byStudent[f.student_id] = {
        student_id: f.student_id,
        name: f.student_name,
        class: f.class,
        section: f.section,
        parent_phone: f.parent_phone,
        parent_name: f.parent_name,
        rows: [],
        total: 0,
        paid: 0,
      };
    }
    const grp = byStudent[f.student_id];
    grp.rows.push(f);
    grp.total += f.amount || 0;
    grp.paid += f.paid_amount || 0;
  }
  const studentGroups = Object.values(byStudent).sort((a, b) => {
    const ca = parseInt(a.class),
      cb = parseInt(b.class);
    if (!isNaN(ca) && !isNaN(cb) && ca !== cb) return ca - cb;
    return (a.name || "").localeCompare(b.name || "");
  });

  const defaulterGroups = studentGroups.filter((g) => g.total - g.paid > 0);

  function waLink(grp, balance) {
    const phone = grp.parent_phone?.replace(/\D/g, "") || "";
    const fullPhone = phone.startsWith("91") ? phone : `91${phone}`;
    const msg = encodeURIComponent(
      `Dear ${grp.parent_name || "Parent"},\n\nTotal pending fee of ₹${balance} for ${grp.name} is due. Please pay at the earliest.\n\n— School`,
    );
    return `https://wa.me/${fullPhone}?text=${msg}`;
  }

  const StudentCard = ({ grp }) => {
    const balance = grp.total - grp.paid;
    return (
      <div className="bg-white rounded-xl border border-indigo-100 shadow-sm overflow-hidden">
        <div className="bg-indigo-600 px-4 py-2.5 flex justify-between items-center">
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{grp.name}</p>
            <p className="text-indigo-200 text-xs">
              Class {grp.class} {grp.section || ""}
            </p>
          </div>
          <span
            className={`shrink-0 px-2 py-0.5 text-xs rounded-full font-medium ${
              balance <= 0
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {balance <= 0 ? "Cleared" : `Due ₹${balance}`}
          </span>
        </div>

        <div className="divide-y divide-gray-50">
          {grp.rows.map((f) => {
            const rowBal = (f.amount || 0) - (f.paid_amount || 0);
            const overdueFlag = isOverdue(f);
            const st =
              f.status === "paid"
                ? "paid"
                : overdueFlag
                  ? "overdue"
                  : f.status === "partial"
                    ? "partial"
                    : "pending";
            return (
              <div
                key={f.id}
                className="px-4 py-2.5 flex justify-between items-center"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-gray-900">
                      {FEE_LABEL[f.fee_type] || f.fee_type}
                    </p>
                    {f.month && (
                      <span className="text-xs text-gray-400">{f.month}</span>
                    )}
                    <span
                      className={`shrink-0 px-1.5 py-0.5 text-xs rounded-full font-medium ${
                        st === "paid"
                          ? "bg-green-100 text-green-700"
                          : st === "overdue"
                            ? "bg-red-100 text-red-700"
                            : st === "partial"
                              ? "bg-orange-100 text-orange-700"
                              : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {st === "paid"
                        ? "Paid"
                        : st === "partial"
                          ? `Partial · ₹${rowBal}`
                          : st === "overdue"
                            ? "Overdue"
                            : "Pending"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    Due: {new Date(f.due_date).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <div className="ml-3 shrink-0 text-right">
                  <p className="text-sm font-bold text-gray-900">₹{f.amount}</p>
                  {st !== "paid" ? (
                    <div className="flex gap-2 justify-end mt-0.5">
                      <Link
                        href={`/fees/${f.id}/pay`}
                        className="text-xs text-indigo-600 font-medium"
                      >
                        Pay
                      </Link>
                      <form method="POST" action="/api/fees/delete">
                        <input type="hidden" name="id" value={f.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-500 font-medium"
                        >
                          Del
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="flex gap-2 justify-end mt-0.5">
                      <Link
                        href={`/fees/${f.id}/receipt`}
                        className="text-xs text-green-600 font-medium"
                      >
                        Receipt
                      </Link>
                      <form method="POST" action="/api/fees/delete">
                        <input type="hidden" name="id" value={f.id} />
                        <button
                          type="submit"
                          className="text-xs text-red-500 font-medium"
                        >
                          Del
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-gray-50 px-4 py-2.5 flex justify-between items-center text-xs">
          <div className="flex gap-4">
            <span className="text-gray-500">
              Total:{" "}
              <span className="font-bold text-gray-900">₹{grp.total}</span>
            </span>
            <span className="text-green-600">
              Paid: <span className="font-bold">₹{grp.paid}</span>
            </span>
            <span className="text-red-500">
              Balance: <span className="font-bold">₹{balance}</span>
            </span>
          </div>
          {balance > 0 && grp.parent_phone && (
            <a
              href={waLink(grp, balance)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-600 font-medium"
            >
              Remind
            </a>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-gray-500 text-xs mt-0.5">
            Student-wise fee tracking
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/fee-structure"
            className="bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium"
          >
            🏷️ Templates
          </Link>
          <Link
            href="/fees/add"
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Record
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-green-50 rounded-xl p-3 border border-green-100">
          <p className="text-xs text-green-600 font-medium">Collected</p>
          <p className="text-lg font-bold text-green-700 mt-1">
            ₹{summary.total_collected || 0}
          </p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border border-red-100">
          <p className="text-xs text-red-500 font-medium">Pending</p>
          <p className="text-lg font-bold text-red-600 mt-1">
            ₹{summary.total_pending || 0}
          </p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 border border-red-200">
          <p className="text-xs text-red-700 font-medium">Overdue</p>
          <p className="text-lg font-bold text-red-700 mt-1">
            ₹{summary.total_overdue || 0}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        <a
          href="/fees?tab=students"
          className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium ${
            tab === "students"
              ? "bg-indigo-600 text-white"
              : "bg-white border border-gray-200 text-gray-600"
          }`}
        >
          All Students
        </a>
        <a
          href="/fees?tab=defaulters"
          className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium ${
            tab === "defaulters"
              ? "bg-red-600 text-white"
              : "bg-white border border-gray-200 text-red-600"
          }`}
        >
          Defaulters ({defaulterGroups.length})
        </a>
      </div>

      {tab === "students" && (
        <div className="space-y-4">
          {studentGroups.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center text-gray-400 text-sm">
              No records found.
            </div>
          ) : (
            studentGroups.map((grp) => (
              <StudentCard key={grp.student_id} grp={grp} />
            ))
          )}
        </div>
      )}

      {tab === "defaulters" && (
        <div className="space-y-4">
          {defaulterGroups.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
              No defaulters.
            </div>
          ) : (
            defaulterGroups.map((grp) => (
              <StudentCard key={grp.student_id} grp={grp} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
