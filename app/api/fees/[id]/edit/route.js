import { NextResponse } from "next/server";
import { MASTER_USER_ID } from "@/lib/config";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { setFlash } from "@/lib/flash";

export async function POST(request, { params }) {
  const { id } = await params;
  const feeId = parseInt(id, 10);

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token)
    return NextResponse.redirect(new URL("/login", request.url), {
      status: 303,
    });
  const session = await getSession(token);
  if (!session)
    return NextResponse.redirect(new URL("/login", request.url), {
      status: 303,
    });

  if (!feeId)
    return NextResponse.redirect(new URL("/fees", request.url), {
      status: 303,
    });

  // Ownership check
  const ownRows = await db
    .select({ id: schema.fees.id })
    .from(schema.fees)
    .where(and(eq(schema.fees.id, feeId), eq(schema.fees.user_id, MASTER_USER_ID)));
  if (!ownRows.length)
    return NextResponse.redirect(new URL("/fees", request.url), {
      status: 303,
    });

  const formData = await request.formData();
  const fee_type = formData.get("fee_type") || "monthly";
  const amount = parseInt(formData.get("amount"), 10);
  const month = formData.get("month") || null;
  const academic_year = formData.get("academic_year") || null;
  const due_date_raw = formData.get("due_date");
  const paid_date_raw = formData.get("paid_date");
  const status = formData.get("status") || "pending";
  const receipt_no = formData.get("receipt_no") || null;

  if (!due_date_raw || isNaN(amount) || amount <= 0) {
    await setFlash("error", "Due date and valid amount are required");
    return NextResponse.redirect(new URL(`/fees/${feeId}/edit`, request.url), {
      status: 303,
    });
  }

  const due_date = new Date(due_date_raw);
  const paid_date = paid_date_raw ? new Date(paid_date_raw) : null;

  let paid_amount = 0;
  if (status === "paid") {
    paid_amount = amount;
  } else if (status === "partial") {
    paid_amount = parseInt(formData.get("paid_amount"), 10) || 0;
  }

  await db
    .update(schema.fees)
    .set({
      fee_type,
      amount,
      month,
      academic_year,
      due_date,
      paid_date,
      status,
      receipt_no,
      paid_amount,
    })
    .where(eq(schema.fees.id, feeId));

  await setFlash("success", "Fee record updated!");
  return NextResponse.redirect(new URL("/fees", request.url), { status: 303 });
}
