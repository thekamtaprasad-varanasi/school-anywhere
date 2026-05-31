import { NextResponse } from "next/server";
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
  const userResult = await db.select().from(schema.users).where(eq(schema.users.email, session.email));
  const user = userResult[0];
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const id = parseInt(formData.get("id"), 10);
  if (isNaN(id)) {
    return NextResponse.redirect(new URL("/fee-structure", request.url), { status: 303 });
  }

  const ownRows = await db
    .select({ id: schema.fee_packages.id })
    .from(schema.fee_packages)
    .where(and(eq(schema.fee_packages.id, id), eq(schema.fee_packages.user_id, 2)));
  if (ownRows.length === 0) {
    return NextResponse.redirect(new URL("/fee-structure", request.url), { status: 303 });
  }

  await db.delete(schema.fee_package_items).where(eq(schema.fee_package_items.package_id, id));

  await db
    .delete(schema.fee_packages)
    .where(and(eq(schema.fee_packages.id, id), eq(schema.fee_packages.user_id, 2)));

  await setFlash("success", "Package deleted");
  return NextResponse.redirect(new URL("/fee-structure", request.url), { status: 303 });
}