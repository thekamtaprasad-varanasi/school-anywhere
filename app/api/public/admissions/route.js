import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";

export async function POST(request) {
  const secret = request.headers.get("x-admission-secret");
  if (!secret || secret !== process.env.ADMISSION_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim();
  const phone = body.phone?.trim();
  const applying_class = body.applying_class?.trim();

  if (!name || !phone || !applying_class) {
    return NextResponse.json(
      { error: "name, phone, applying_class are required" },
      { status: 400 },
    );
  }

  await db.insert(schema.admission_applications).values({
    user_id: 2,
    name,
    dob: body.dob?.trim() || null,
    applying_class,
    mother_name: body.mother_name?.trim() || null,
    father_name: body.father_name?.trim() || null,
    guardian_name: body.guardian_name?.trim() || null,
    occupation: body.occupation?.trim() || null,
    address: body.address?.trim() || null,
    phone,
    alt_phone: body.alt_phone?.trim() || null,
    religion: body.religion?.trim() || null,
    previous_school: body.previous_school?.trim() || null,
    transport_required: body.transport_required ? 1 : 0,
    sibling_info: body.sibling_info?.trim() || null,
    status: "pending",
    created_at: new Date(),
  });

  return NextResponse.json({ success: true });
}