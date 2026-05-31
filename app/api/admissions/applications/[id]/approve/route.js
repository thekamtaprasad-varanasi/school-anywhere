import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import * as schema from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";
import { setFlash } from "@/lib/flash";

export async function POST(request, { params }) {
  const { id } = await params;
  const applicationId = parseInt(id, 10);

  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }
  const session = await getSession(token);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  if (!applicationId) {
    return NextResponse.redirect(
      new URL("/admissions/applications", request.url),
      { status: 303 },
    );
  }

  const rows = await db
    .select()
    .from(schema.admission_applications)
    .where(
      and(
        eq(schema.admission_applications.id, applicationId),
        eq(schema.admission_applications.user_id, 2),
      ),
    );
  const app = rows[0];
  if (!app) {
    await setFlash("error", "Application not found");
    return NextResponse.redirect(
      new URL("/admissions/applications", request.url),
      { status: 303 },
    );
  }
  if (app.status !== "pending") {
    await setFlash("error", "Already processed");
    return NextResponse.redirect(
      new URL("/admissions/applications", request.url),
      { status: 303 },
    );
  }

  const now = new Date();
  const baseYear =
    now.getMonth() < 3 ? now.getFullYear() - 1 : now.getFullYear();
  const academicYear = `${baseYear}-${String(baseYear + 1).slice(-2)}`;

  await db.insert(schema.students).values({
    user_id: 2,
    name: app.name,
    class: app.applying_class,
    section: null,
    roll_number: null,
    admission_no: null,
    dob: app.dob || null,
    religion: app.religion || null,
    address: app.address || null,
    father_name: app.father_name || null,
    mother_name: app.mother_name || null,
    guardian_name: app.guardian_name || null,
    phone: app.phone,
    alt_phone: app.alt_phone || null,
    academic_year: academicYear,
    admission_date: now,
    created_at: now,
  });

  await db
    .update(schema.admission_applications)
    .set({ status: "approved" })
    .where(eq(schema.admission_applications.id, applicationId));

  await setFlash(
    "success",
    `${app.name} added to students. Set roll number and admission number from /students.`,
  );
  return NextResponse.redirect(
    new URL("/admissions/applications?tab=approved", request.url),
    { status: 303 },
  );
}