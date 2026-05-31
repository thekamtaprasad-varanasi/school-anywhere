// app/api/whatsapp/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { students, attendance, users } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { cookies } from "next/headers";
import { getSession } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const session = await getSession(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userResult = await db.select().from(users).where(eq(users.email, session.email));
  const user = userResult[0];
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  const absentRecords = await db
    .select()
    .from(attendance)
    .where(and(eq(attendance.date, date), eq(attendance.user_id, 2)));

  const absentIds = absentRecords
    .filter((a) => a.status === "absent")
    .map((a) => a.student_id);

  if (absentIds.length === 0) {
    return NextResponse.json({ message: "कोई absent नहीं।", links: [] });
  }

  const allStudents = await db
    .select()
    .from(students)
    .where(eq(students.user_id, 2));

  const absentStudents = allStudents.filter((s) => absentIds.includes(s.id));

  const links = absentStudents
    .filter((s) => s.phone)
    .map((s) => {
      const phone = s.phone.replace(/\D/g, "");
      const fullPhone = phone.startsWith("91") ? phone : `91${phone}`;
      const message = encodeURIComponent(
        `प्रिय ${s.father_name || "अभिभावक"},\n\nआपके बच्चे ${s.name} (Class ${s.class}${s.section ? " " + s.section : ""}) आज ${date} को स्कूल में अनुपस्थित हैं।\n\nकृपया सूचित करें।\n\n— निशांत स्कूल`
      );
      return {
        student_name: s.name,
        class: `${s.class} ${s.section || ""}`.trim(),
        parent_name: s.father_name || "—",
        parent_phone: s.phone,
        whatsapp_link: `https://wa.me/${fullPhone}?text=${message}`,
      };
    });

  return NextResponse.json({ date, total_absent: links.length, links });
}