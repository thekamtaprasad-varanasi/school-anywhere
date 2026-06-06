import { google } from "@/lib/auth";
import { generateState, generateCodeVerifier } from "arctic";
import { NextResponse } from "next/server";

export async function GET() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, [
    "openid",
    "profile",
    "email",
  ]);

  const response = NextResponse.redirect(url.toString());
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "none",
    secure: true,
  });
  response.cookies.set("code_verifier", codeVerifier, {
    httpOnly: true,
    maxAge: 600,
    path: "/",
    sameSite: "none",
    secure: true,
  });
  return response;
}