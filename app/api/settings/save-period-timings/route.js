// app/api/settings/save-period-timings/route.js
import { NextResponse } from "next/server";
import { MASTER_USER_ID } from "@/lib/config";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";
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
  const totalPeriodsRaw = formData.get("total_periods");
  const totalPeriods = parseInt(totalPeriodsRaw, 10);
  if (isNaN(totalPeriods) || totalPeriods < 1) {
    await setFlash("error", "Invalid number of periods");
    return NextResponse.redirect(new URL("/settings/periods", request.url), { status: 303 });
  }

  // ─── Delete-then-insert pattern (naturally retry-safe) ─────────────────
  // Per-user data, full replacement on every save
  await db
    .delete(schema.period_timings)
    .where(eq(schema.period_timings.user_id, MASTER_USER_ID));

  const rows = [];
  for (let i = 1; i <= totalPeriods; i++) {
    const start = formData.get(`start_${i}`);
    const end = formData.get(`end_${i}`);
    const label = formData.get(`label_${i}`) || "teaching";
    if (!start || !end) continue;
    rows.push({
      user_id: MASTER_USER_ID,
      period_no: i,
      start_time: start,
      end_time: end,
      label,
    });
  }

  if (rows.length > 0) {
    await db.insert(schema.period_timings).values(rows);
  }

  await setFlash(
    "success",
    `Period timings saved (${rows.length} periods)`,
  );
  return NextResponse.redirect(new URL("/settings/periods", request.url), { status: 303 });
}