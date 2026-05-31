import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { setFlash } from "@/lib/flash";

const FIXED_TYPES = [
  "monthly",
  "transport",
  "amenity",
  "exam",
  "admission",
  "late",
];

function slugify(s) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

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
  const cls = formData.get("class")?.trim();
  const academic_year = formData.get("academic_year")?.trim();

  if (!cls || !academic_year) {
    await setFlash("error", "Class and academic year are required");
    return NextResponse.redirect(
      new URL("/fee-structure/packages/add", request.url),
      { status: 303 },
    );
  }

  const items = [];

  for (const feeType of FIXED_TYPES) {
    const typeVal = formData.get(`fee_type_${feeType}`);
    if (!typeVal) continue;
    const amt = parseInt(formData.get(`amount_${feeType}`), 10);
    if (isNaN(amt) || amt <= 0) {
      await setFlash("error", `Invalid amount for ${feeType}`);
      return NextResponse.redirect(
        new URL("/fee-structure/packages/add", request.url),
        { status: 303 },
      );
    }
    items.push({ fee_type: feeType, amount: amt });
  }

  const customCount = parseInt(formData.get("custom_count"), 10) || 0;
  const usedTypes = new Set(items.map((i) => i.fee_type));
  for (let i = 0; i < customCount; i++) {
    const nameRaw = formData.get(`custom_name_${i}`)?.trim();
    const amtRaw = formData.get(`custom_amount_${i}`);
    if (!nameRaw || !amtRaw) continue;
    const slug = slugify(nameRaw);
    if (!slug) continue;
    if (usedTypes.has(slug)) {
      await setFlash("error", `Duplicate item name: ${nameRaw}`);
      return NextResponse.redirect(
        new URL("/fee-structure/packages/add", request.url),
        { status: 303 },
      );
    }
    const amt = parseInt(amtRaw, 10);
    if (isNaN(amt) || amt <= 0) {
      await setFlash("error", `Invalid amount for ${nameRaw}`);
      return NextResponse.redirect(
        new URL("/fee-structure/packages/add", request.url),
        { status: 303 },
      );
    }
    usedTypes.add(slug);
    items.push({ fee_type: slug, amount: amt });
  }

  if (items.length === 0) {
    await setFlash("error", "Select at least one fee type");
    return NextResponse.redirect(
      new URL("/fee-structure/packages/add", request.url),
      { status: 303 },
    );
  }

  const existing = await db
    .select({ id: schema.fee_packages.id })
    .from(schema.fee_packages)
    .where(
      and(
        eq(schema.fee_packages.user_id, 2),
        eq(schema.fee_packages.class, cls),
        eq(schema.fee_packages.academic_year, academic_year),
      ),
    );

  if (existing.length > 0) {
    await setFlash(
      "error",
      `Package for Class ${cls} (${academic_year}) already exists. Edit it instead.`,
    );
    return NextResponse.redirect(
      new URL("/fee-structure", request.url),
      { status: 303 },
    );
  }

  const computedTotal = items.reduce((sum, i) => sum + i.amount, 0);

  await db.insert(schema.fee_packages).values({
    user_id: 2,
    class: cls,
    academic_year,
    total_amount: computedTotal,
    created_at: new Date(),
  });

  const inserted = await db
    .select({ id: schema.fee_packages.id })
    .from(schema.fee_packages)
    .where(
      and(
        eq(schema.fee_packages.user_id, 2),
        eq(schema.fee_packages.class, cls),
        eq(schema.fee_packages.academic_year, academic_year),
      ),
    );
  const packageId = inserted[0]?.id;

  if (!packageId) {
    await setFlash("error", "Package insert failed");
    return NextResponse.redirect(
      new URL("/fee-structure", request.url),
      { status: 303 },
    );
  }

  await db.insert(schema.fee_package_items).values(
    items.map((it) => ({
      package_id: packageId,
      fee_type: it.fee_type,
      amount: it.amount,
    })),
  );

  await setFlash(
    "success",
    `Package saved — Class ${cls} (${academic_year}), ₹${computedTotal}`,
  );
  return NextResponse.redirect(new URL("/fee-structure", request.url), {
    status: 303,
  });
}