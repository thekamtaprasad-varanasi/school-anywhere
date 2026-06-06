// app/api/students/import/route.js
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
  const csvText = formData.get("csv_data");
  const className = formData.get("class");
  const section = formData.get("section") || "";

  if (!csvText) {
    await setFlash("error", "No data found.");
    return NextResponse.redirect(new URL("/students/import", request.url), { status: 303 });
  }

  if (!className) {
    await setFlash("error", "Please select a class.");
    return NextResponse.redirect(new URL("/students/import", request.url), { status: 303 });
  }

  // ─── Pre-fetch existing roll_numbers in this class+section ─────────────
  // This avoids try/catch per row and matches our explicit duplicate-handling pattern
  const existing = await db
    .select({ roll_number: schema.students.roll_number })
    .from(schema.students)
    .where(
      and(
        eq(schema.students.user_id, MASTER_USER_ID),
        eq(schema.students.class, className),
        eq(schema.students.section, section),
      ),
    );
  const takenRolls = new Set(
    existing.map((r) => r.roll_number).filter(Boolean),
  );

  // ─── Parse CSV ─────────────────────────────────────────────────────────
  const lines = csvText.trim().split("\n").filter(Boolean);
  const dataLines = lines[0]?.toLowerCase().includes("name")
    ? lines.slice(1)
    : lines;

  let inserted = 0;
  let skippedDuplicate = 0;
  let skippedEmpty = 0;

  // Track within-CSV duplicates too (someone pastes same roll twice)
  const seenInBatch = new Set();

  for (const line of dataLines) {
    const cols = line.split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    const [name, roll_number, phone] = cols;

    if (!name) {
      skippedEmpty++;
      continue;
    }

    // Duplicate check: existing in DB OR already in this batch
    if (roll_number) {
      if (takenRolls.has(roll_number) || seenInBatch.has(roll_number)) {
        skippedDuplicate++;
        continue;
      }
      seenInBatch.add(roll_number);
    }

    await db.insert(schema.students).values({
      name,
      class: className,
      section,
      roll_number: roll_number || null,
      phone: phone || null,
      fee_status: "pending",
      user_id: MASTER_USER_ID,
    });
    inserted++;
  }

  // ─── Build summary message ─────────────────────────────────────────────
  let msg = `${inserted} students imported.`;
  if (skippedDuplicate > 0) {
    msg += ` ${skippedDuplicate} skipped (duplicate roll).`;
  }
  if (skippedEmpty > 0) {
    msg += ` ${skippedEmpty} skipped (empty name).`;
  }

  await setFlash(inserted > 0 ? "success" : "error", msg);
  return NextResponse.redirect(new URL("/students", request.url), { status: 303 });
}