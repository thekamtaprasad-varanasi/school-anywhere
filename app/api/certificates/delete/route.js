import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { certificates, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";

export async function POST(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }
  const session = await getSession(token);
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const userResult = await db
    .select()
    .from(users)
    .where(eq(users.email, session.email));
  const user = userResult[0];
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), 303);
  }

  const formData = await request.formData();
  const id = parseInt(formData.get("id"));
  if (!id) {
    return NextResponse.redirect(new URL("/certificates", request.url), 303);
  }

  await db
    .delete(certificates)
    .where(and(eq(certificates.id, id), eq(certificates.user_id, 2)));

  return NextResponse.redirect(new URL("/certificates", request.url), 303);
}