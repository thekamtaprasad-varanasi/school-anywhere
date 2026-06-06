// app/api/notices/add/route.js
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
  const title = formData.get("title");
  const content = formData.get("content");
  const category = formData.get("category") || "general";
  const priority = formData.get("priority") || "normal";

  if (!title || !content) {
    await setFlash("error", "Title and content are required");
    return NextResponse.redirect(new URL("/notices/add", request.url), { status: 303 });
  }

  // ─── Duplicate check: same title + content in last 5 minutes ───────────
  // Notices don't have a strict unique key (same notice can be re-posted
  // legitimately weeks later), so we just protect against rapid retries.
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
  const conditions = [
    eq(schema.notices.user_id, MASTER_USER_ID),
    eq(schema.notices.title, title),
    eq(schema.notices.content, content),
  ];
  const recent = await db
    .select()
    .from(schema.notices)
    .where(and(...conditions));
  const veryRecent = recent.filter(
    (n) => n.created_at && new Date(n.created_at) > fiveMinAgo,
  );
  if (veryRecent.length > 0) {
    await setFlash(
      "error",
      "This notice was just posted a moment ago. Please wait or change the content.",
    );
    return NextResponse.redirect(new URL("/notices", request.url), { status: 303 });
  }

  // ─── Insert ────────────────────────────────────────────────────────────
  await db.insert(schema.notices).values({
    title,
    content,
    category,
    priority,
    user_id: MASTER_USER_ID,
  });

  await setFlash("success", "Notice posted successfully!");
  return NextResponse.redirect(new URL("/notices", request.url), { status: 303 });
}