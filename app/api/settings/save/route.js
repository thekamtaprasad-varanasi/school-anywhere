// app/api/settings/save/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { setFlash } from "@/lib/flash";
import { z } from "zod";

const settingsSchema = z.object({
  school_name: z.string().min(1, "School name is required"),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  principal_name: z.string().optional(),
  affiliation_no: z.string().optional(),
  school_code: z.string().optional(),
});

async function uploadToCloudinary(file) {
  if (!file || file.size === 0) return null;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", uploadPreset);
  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: fd },
  );
  const data = await res.json();
  return data.secure_url || null;
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

  const existing = await db
    .select()
    .from(schema.school_settings)
    .where(eq(schema.school_settings.user_id, 2));
  const current = existing[0] || {};

  const formData = await request.formData();

  const logoFile = formData.get("logo");
  const signatureFile = formData.get("principal_signature");

  let logo_url = current.logo_url || null;
  let principal_signature_url = current.principal_signature_url || null;

  const uploadedLogo = await uploadToCloudinary(logoFile);
  if (uploadedLogo) logo_url = uploadedLogo;

  const uploadedSignature = await uploadToCloudinary(signatureFile);
  if (uploadedSignature) principal_signature_url = uploadedSignature;

  const raw = {
    school_name: formData.get("school_name"),
    address: formData.get("address") || undefined,
    phone: formData.get("phone") || undefined,
    email: formData.get("email") || undefined,
    principal_name: formData.get("principal_name") || undefined,
    affiliation_no: formData.get("affiliation_no") || undefined,
    school_code: formData.get("school_code") || undefined,
  };

  const parsed = settingsSchema.safeParse(raw);
  if (!parsed.success) {
    await setFlash(
      "error",
      "Invalid data: " + JSON.stringify(parsed.error.flatten().fieldErrors),
    );
    return NextResponse.redirect(new URL("/settings", request.url), { status: 303 });
  }

  const data = {
    user_id: 2,
    ...parsed.data,
    logo_url,
    principal_signature_url,
    updated_at: new Date(),
  };

  if (existing.length > 0) {
    await db
      .update(schema.school_settings)
      .set(data)
      .where(eq(schema.school_settings.user_id, 2));
  } else {
    await db.insert(schema.school_settings).values(data);
  }

  await setFlash("success", "Settings saved successfully!");
  return NextResponse.redirect(new URL("/settings", request.url), { status: 303 });
}