import { db } from "@/lib/db";
import { notices } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export async function GET(request, { params }) {
  const { id } = await params;

  await db.delete(notices).where(eq(notices.id, parseInt(id)));

  redirect("/notices");
}
