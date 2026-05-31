import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { attendance, students, school_settings } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { sendWhatsApp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const today = new Date().toISOString().split("T")[0];
    let sent = 0;

    const settingsRows = await db
      .select()
      .from(school_settings)
      .where(eq(school_settings.user_id, 2));
    const schoolName = settingsRows[0]?.school_name || "School";

    const absentToday = await db
      .select()
      .from(attendance)
      .where(
        and(
          eq(attendance.user_id, 2),
          eq(attendance.date, today),
          eq(attendance.status, "absent"),
          eq(attendance.alert_sent, 0),
        ),
      );

    const allStudents = await db
      .select()
      .from(students)
      .where(eq(students.user_id, 2));
    const studentMap = {};
    allStudents.forEach((s) => {
      studentMap[s.id] = s;
    });

    for (const row of absentToday) {
      const student = studentMap[row.student_id];
      if (!student) continue;
      const phone = student.phone || student.alt_phone;
      if (!phone) continue;

      const msg =
        `Dear Parent,\nThis is a notice from ${schoolName}.\n` +
        `Your ward ${student.name} (Class ${student.class}${student.section ? "-" + student.section : ""}) ` +
        `is marked ABSENT today (${today}) without prior intimation. ` +
        `Please contact the school if this is unexpected.\nThank you.`;

      const ok = await sendWhatsApp(phone, msg);
      if (ok) {
        await db
          .update(attendance)
          .set({ alert_sent: 1 })
          .where(eq(attendance.id, row.id));
        sent++;
      }
    }

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}