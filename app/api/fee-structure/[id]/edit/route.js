// app/api/fee-structure/[id]/edit/route.js
import { NextResponse } from "next/server";
import { MASTER_USER_ID } from "@/lib/config";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq, and, ne } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { setFlash } from "@/lib/flash";

export async function POST(request, { params }) {
  const { id } = await params;
  const structureId = parseInt(id, 10);

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

  if (!structureId) {
    return NextResponse.redirect(new URL("/fee-structure", request.url), { status: 303 });
  }

  // ─── Parse form ────────────────────────────────────────────────────────
  const formData = await request.formData();
  const cls = formData.get("class");
  const fee_type = formData.get("fee_type");
  const amountRaw = formData.get("amount");
  const amount = parseInt(amountRaw, 10);
  const academic_year = formData.get("academic_year") || null;

  if (!cls || !fee_type || isNaN(amount) || amount <= 0) {
    await setFlash("error", "Class, fee type and valid amount are required");
    return NextResponse.redirect(
      new URL(`/fee-structure/${structureId}/edit`, request.url),
      { status: 303 },
    );
  }

  // ─── Ownership: row must belong to this school ─────────────────────────
  const ownRows = await db
    .select()
    .from(schema.fee_structures)
    .where(
      and(
        eq(schema.fee_structures.id, structureId),
        eq(schema.fee_structures.user_id, MASTER_USER_ID),
      ),
    );
  if (ownRows.length === 0) {
    return NextResponse.redirect(new URL("/fee-structure", request.url), { status: 303 });
  }

  // ─── Duplicate check (exclude self) ────────────────────────────────────
  const conditions = [
    eq(schema.fee_structures.user_id, MASTER_USER_ID),
    eq(schema.fee_structures.class, cls),
    eq(schema.fee_structures.fee_type, fee_type),
    ne(schema.fee_structures.id, structureId),
  ];
  if (academic_year) {
    conditions.push(eq(schema.fee_structures.academic_year, academic_year));
  }
  const existing = await db
    .select()
    .from(schema.fee_structures)
    .where(and(...conditions));
  if (existing.length > 0) {
    await setFlash(
      "error",
      `Another fee structure for Class ${cls} (${fee_type}) already exists. Delete it first.`,
    );
    return NextResponse.redirect(new URL("/fee-structure", request.url), { status: 303 });
  }

  // ─── Update ────────────────────────────────────────────────────────────
  await db
    .update(schema.fee_structures)
    .set({ class: cls, fee_type, amount, academic_year })
    .where(
      and(
        eq(schema.fee_structures.id, structureId),
        eq(schema.fee_structures.user_id, MASTER_USER_ID),
      ),
    );

  await setFlash("success", "Fee structure updated!");
  return NextResponse.redirect(new URL("/fee-structure", request.url), { status: 303 });
}