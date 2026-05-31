// app/api/concessions/delete/route.js
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

  const userResult = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, session.email));
  const user = userResult[0];
  if (!user) {
    return NextResponse.redirect(new URL("/login", request.url), { status: 303 });
  }

  const formData = await request.formData();
  const id = parseInt(formData.get("id"), 10);
  const student_id = parseInt(formData.get("student_id"), 10);
  if (isNaN(id) || isNaN(student_id)) {
    return NextResponse.redirect(new URL("/students", request.url), { status: 303 });
  }

  // Ownership-scoped delete (user_id ensures cross-school safety)
  await db
    .delete(schema.fee_concessions)
    .where(
      and(
        eq(schema.fee_concessions.id, id),
        eq(schema.fee_concessions.student_id, student_id),
        eq(schema.fee_concessions.user_id, 2),
      ),
    );

  await setFlash("success", "Concession removed!");
  return NextResponse.redirect(new URL(`/students/${student_id}`, request.url), { status: 303 });
}