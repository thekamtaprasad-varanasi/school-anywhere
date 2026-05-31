import { NextResponse } from "next/server";

export async function GET(request) {
  const response = NextResponse.redirect(new URL("/teacher-login", request.url));
  response.cookies.delete("teacher_session");
  return response;
}