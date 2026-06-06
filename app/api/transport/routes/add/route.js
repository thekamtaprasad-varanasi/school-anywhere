// app/api/transport/routes/add/route.js
import { NextResponse } from "next/server";
import { MASTER_USER_ID } from "@/lib/config";
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
  const route_name = formData.get("route_name");
  const stop_name = formData.get("stop_name");
  const monthlyFeeRaw = formData.get("monthly_fee");
  const monthly_fee = parseFloat(monthlyFeeRaw);
  const driver_name = formData.get("driver_name") || null;
  const vehicle_no = formData.get("vehicle_no") || null;

  if (!route_name || !stop_name) {
    await setFlash("error", "Route name and stop name are required");
    return NextResponse.redirect(new URL("/transport/add", request.url), { status: 303 });
  }

  if (isNaN(monthly_fee) || monthly_fee < 0) {
    await setFlash("error", "Valid monthly fee is required");
    return NextResponse.redirect(new URL("/transport/add", request.url), { status: 303 });
  }

  // ─── Duplicate check: same route + stop already exists ────────────────
  const conditions = [
    eq(schema.transport.user_id, MASTER_USER_ID),
    eq(schema.transport.route_name, route_name),
    eq(schema.transport.stop_name, stop_name),
  ];
  const existing = await db
    .select()
    .from(schema.transport)
    .where(and(...conditions));
  if (existing.length > 0) {
    await setFlash(
      "error",
      `Stop "${stop_name}" on route "${route_name}" already exists.`,
    );
    return NextResponse.redirect(new URL("/transport", request.url), { status: 303 });
  }

  // ─── Insert ────────────────────────────────────────────────────────────
  await db.insert(schema.transport).values({
    route_name,
    stop_name,
    monthly_fee,
    driver_name,
    vehicle_no,
    user_id: MASTER_USER_ID,
  });

  await setFlash("success", "Route added successfully!");
  return NextResponse.redirect(new URL("/transport", request.url), { status: 303 });
}