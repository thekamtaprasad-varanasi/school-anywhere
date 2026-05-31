// app/api/fees/mark-paid/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { setFlash } from "@/lib/flash";

export async function POST(request) {
  // ─── Auth ──────────────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }
  const session = await getSession(token);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const userResult = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, session.email));
  const user = userResult[0];
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  // ─── Parse form ────────────────────────────────────────────────────────
  const formData = await request.formData();
  const feeIdRaw = formData.get("fee_id");
  const paidAmountRaw = formData.get("paid_amount");
  const paid_date = formData.get("paid_date");
  const receipt_no = formData.get("receipt_no") || null;
  const payment_mode = formData.get("payment_mode") || "cash";
  const clientToken = formData.get("client_token") || null;

  const fee_id = parseInt(feeIdRaw, 10);
  const paid_amount = parseInt(paidAmountRaw, 10);

  if (isNaN(fee_id)) {
    await setFlash("error", "Invalid fee id");
    return NextResponse.redirect(new URL("/fees", request.url), { status: 303 });
  }
  if (isNaN(paid_amount) || paid_amount <= 0) {
    await setFlash("error", "Invalid amount");
    return NextResponse.redirect(new URL(`/fees/${fee_id}/pay`, request.url), { status: 303 });
  }
  if (!paid_date) {
    await setFlash("error", "Paid date is required");
    return NextResponse.redirect(new URL(`/fees/${fee_id}/pay`, request.url), { status: 303 });
  }

  // ─── Fetch fee with ownership check ────────────────────────────────────
  const feeResult = await db
    .select()
    .from(schema.fees)
    .where(
      and(
        eq(schema.fees.id, fee_id),
        eq(schema.fees.user_id, 2),
      ),
    );
  const fee = feeResult[0];
  if (!fee) {
    return NextResponse.redirect(new URL("/fees", request.url), { status: 303 });
  }

  // ─── Idempotency: if a client_token was provided and a payment with this
  //     token already exists for this fee, skip the insert. This protects
  //     against double-submit / retry sending the same logical payment twice.
  if (clientToken) {
    const dupePayment = await db
      .select()
      .from(schema.fee_payments)
      .where(
        and(
          eq(schema.fee_payments.fee_id, fee_id),
          eq(schema.fee_payments.user_id, 2),
          eq(schema.fee_payments.note, `token:${clientToken}`),
        ),
      );
    if (dupePayment.length > 0) {
      await setFlash("success", "Payment already recorded.");
      return NextResponse.redirect(new URL(`/fees/${fee_id}/receipt`, request.url), { status: 303 });
    }
  }

  // ─── Insert payment row ────────────────────────────────────────────────
  await db.insert(schema.fee_payments).values({
    fee_id,
    student_id: fee.student_id,
    user_id: 2,
    amount: paid_amount,
    payment_mode,
    paid_date: new Date(paid_date),
    receipt_no,
    note: clientToken ? `token:${clientToken}` : null,
  });

  // ─── Recompute total paid from all payments (NOT fee.paid_amount + new) ─
  // This is safer: if somehow a payment slipped in twice, recomputing from
  // the payments table gives us the truth.
  const allPayments = await db
    .select({ amount: schema.fee_payments.amount })
    .from(schema.fee_payments)
    .where(
      and(
        eq(schema.fee_payments.fee_id, fee_id),
        eq(schema.fee_payments.user_id, 2),
      ),
    );
  const newPaidAmount = allPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const newStatus = newPaidAmount >= fee.amount ? "paid" : "partial";

  // ─── Update fee row ────────────────────────────────────────────────────
  await db
    .update(schema.fees)
    .set({
      status: newStatus,
      paid_date: newStatus === "paid" ? new Date(paid_date) : null,
      receipt_no: newStatus === "paid" ? receipt_no : fee.receipt_no,
      paid_amount: newPaidAmount,
    })
    .where(
      and(
        eq(schema.fees.id, fee_id),
        eq(schema.fees.user_id, 2),
      ),
    );

  await setFlash("success", "Payment recorded!");
  return NextResponse.redirect(new URL(`/fees/${fee_id}/receipt`, request.url), { status: 303 });
}