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

  await db
    .update(schema.admission_applications)
    .set({ status: "rejected" })
    .where(
      and(
        eq(schema.admission_applications.id, applicationId),
        eq(schema.admission_applications.user_id, 2),
      ),
    );

  await setFlash("success", "Application rejected");
  return NextResponse.redirect(
    new URL("/admissions/applications?tab=rejected", request.url),
    { status: 303 },
  );
}