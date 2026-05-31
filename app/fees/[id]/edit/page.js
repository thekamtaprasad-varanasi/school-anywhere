export const dynamic = "force-dynamic";

import { db } from "@/lib/db";
import { fees, students } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import EditFeeForm from "./EditFeeForm";

export default async function EditFeePage({ params }) {
  const { id } = await params;
  const feeId = parseInt(id, 10);
  if (!feeId) redirect("/fees");

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  const session = token ? await getSession(token) : null;
  if (!session) redirect("/login");

  const rows = await db
    .select({
      id: fees.id,
      amount: fees.amount,
      fee_type: fees.fee_type,
      academic_year: fees.academic_year,
      month: fees.month,
      due_date: fees.due_date,
      paid_date: fees.paid_date,
      status: fees.status,
      receipt_no: fees.receipt_no,
      paid_amount: fees.paid_amount,
      student_id: fees.student_id,
      student_name: students.name,
      class: students.class,
      section: students.section,
    })
    .from(fees)
    .leftJoin(students, eq(fees.student_id, students.id))
    .where(and(eq(fees.id, feeId), eq(fees.user_id, 2)));

  const fee = rows[0];
  if (!fee) redirect("/fees");

  const months = [
    "April", "May", "June", "July", "August", "September",
    "October", "November", "December", "January", "February", "March",
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Edit Fee Record</h1>
        <p className="text-gray-500 text-xs mt-0.5">
          {fee.student_name} — Class {fee.class} {fee.section || ""}
        </p>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <EditFeeForm fee={fee} months={months} />
      </div>
    </div>
  );
}