"use server";

import { cookies } from "next/headers";

export async function setFlash(type, message) {
  const cookieStore = await cookies();

  const flash = {
    type, // 'success', 'error', 'warning'
    message,
    key: crypto.randomUUID(), // Force re-render
  };

  cookieStore.set("flash", JSON.stringify(flash), {
    path: "/",
    maxAge: 1, // 1 second - enough for one request
  });
}

export async function getFlash() {
  const cookieStore = await cookies();
  const flashCookie = cookieStore.get("flash");

  if (!flashCookie) return null;

  try {
    return JSON.parse(flashCookie.value);
  } catch {
    return null;
  }
}
