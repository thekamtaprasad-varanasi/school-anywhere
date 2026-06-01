import { google } from "@/lib/auth";
import { createSession } from "@/lib/session";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

function redirectWithCookie(request, path, token) {
  const response = NextResponse.redirect(new URL(path, request.url));
  response.cookies.set("session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
  return response;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  const cookieStore = await cookies();
  const storedState = cookieStore.get("oauth_state")?.value;
  const codeVerifier = cookieStore.get("code_verifier")?.value;

  if (!code || !state || state !== storedState) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url));
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const accessToken = tokens.accessToken();

    const googleRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${accessToken}` } },
    );
    const googleUser = await googleRes.json();

    if (!googleUser.email) {
      return NextResponse.redirect(new URL("/login?error=invalid", request.url));
    }

    const allowedEmails = (process.env.DEVELOPER_EMAIL || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean);

    if (!allowedEmails.includes(googleUser.email.toLowerCase())) {
      return NextResponse.redirect(new URL("/login?error=unauthorized", request.url));
    }

    let existing = await db.select().from(users).where(eq(users.email, googleUser.email));

    if (existing.length === 0) {
      await db.insert(users).values({
        email: googleUser.email,
        name: googleUser.name || "",
        status: "active",
        expiry_date: null,
        reminder_sent: 0,
      });
      existing = await db.select().from(users).where(eq(users.email, googleUser.email));
    }

    const user = existing[0];

    const token = await createSession(
      user.id,
      user.email,
      user.name,
      "active",
      null,
    );

    return redirectWithCookie(request, "/dashboard", token);
  } catch (e) {
    console.error(e);
    return NextResponse.redirect(new URL("/login?error=failed", request.url));
  }
}