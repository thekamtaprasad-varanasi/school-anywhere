// app/api/fees/delete/route.js
import { NextResponse } from "next/server";
import { MASTER_USER_ID } from "@/lib/config";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { setFlash } from "@/lib/flash";

export async function POST(request) {
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

  const formData = await request.formData();
  const id = parseInt(formData.get("id"), 10);
  if (isNaN(id)) {
    return NextResponse.redirect(new URL("/fees", request.url), { status: 303 });
  }

  // Ownership check
  const ownRows = await db
    .select({ id: schema.fees.id })
    .from(schema.fees)
    .where(and(eq(schema.fees.id, id), eq(schema.fees.user_id, MASTER_USER_ID)));
  if (!ownRows.length) {
    return NextResponse.redirect(new URL("/fees", request.url), { status: 303 });
  }

  // Delete child payments first, then the fee
  await db
    .delete(schema.fee_payments)
    .where(and(eq(schema.fee_payments.fee_id, id), eq(schema.fee_payments.user_id, MASTER_USER_ID)));

  await db
    .delete(schema.fees)
    .where(and(eq(schema.fees.id, id), eq(schema.fees.user_id, MASTER_USER_ID)));

  await setFlash("success", "Fee record deleted!");
  return NextResponse.redirect(new URL("/fees", request.url), { status: 303 });
}