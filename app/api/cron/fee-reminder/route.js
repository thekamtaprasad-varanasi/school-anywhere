import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { fees, students, school_settings } from "@/lib/schema";
import { eq, and, inArray } from "drizzle-orm";
import { sendWhatsApp } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

const DAY = 1000 * 60 * 60 * 24;

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    let sent = 0;
    let lateAdded = 0;

    const settingsRows = await db
      .select()
      .from(school_settings)
      .where(eq(school_settings.user_id, 2));
    const schoolName = settingsRows[0]?.school_name || "School";
    const lateFeeAmount = settingsRows[0]?.late_fee_amount || 100;

    // ─── AUTO LATE FEE ──────────────────────────────────────────────────
    // महीना बीत जाने पर (>30 दिन पुरानी due_date) pending/partial monthly fee
    // पर एक बार ₹late_fee की नई row बने। auto_late=1 से दोबारा नहीं लगती।
    const monthlyUnpaid = await db
      .select()
      .from(fees)
      .where(
        and(
          eq(fees.user_id, 2),
          eq(fees.fee_type, "monthly"),
          inArray(fees.status, ["pending", "partial", "overdue"]),
        ),
      );

    for (const fee of monthlyUnpaid) {
      if (!fee.due_date) continue;
      if (fee.auto_late === 1) continue;

      const daysOverdue = Math.floor((now - new Date(fee.due_date)) / DAY);
      if (daysOverdue < 30) continue;

      // पहले से इसी बच्चे+महीने की late row न हो
      const lateConditions = [
        eq(fees.user_id, 2),
        eq(fees.student_id, fee.student_id),
        eq(fees.fee_type, "late"),
        eq(fees.month, fee.month),
      ];
      if (fee.academic_year) {
        lateConditions.push(eq(fees.academic_year, fee.academic_year));
      }
      const existingLate = await db
        .select({ id: fees.id })
        .from(fees)
        .where(and(...lateConditions));
      if (existingLate.length > 0) {
        await db
          .update(fees)
          .set({ auto_late: 1 })
          .where(eq(fees.id, fee.id));
        continue;
      }

      const dPart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
      const rPart = Math.floor(1000 + Math.random() * 9000);

      await db.insert(fees).values({
        student_id: fee.student_id,
        user_id: 2,
        amount: lateFeeAmount,
        paid_amount: 0,
        fee_type: "late",
        month: fee.month,
        academic_year: fee.academic_year,
        due_date: now,
        paid_date: null,
        status: "pending",
        receipt_no: `RCP-${dPart}-${rPart}`,
        auto_late: 1,
      });

      await db
        .update(fees)
        .set({ auto_late: 1 })
        .where(eq(fees.id, fee.id));

      lateAdded++;
    }

    // ─── WHATSAPP REMINDERS (पुरानी लॉजिक, अपरिवर्तित) ───────────────────
    const unpaidFees = await db
      .select()
      .from(fees)
      .where(
        and(
          eq(fees.user_id, 2),
          inArray(fees.status, ["pending", "overdue"]),
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

    for (const fee of unpaidFees) {
      if (!fee.due_date) continue;

      const daysOverdue = Math.floor((now - new Date(fee.due_date)) / DAY);
      if (daysOverdue < 20) continue;

      const count = fee.reminder_count || 0;
      if (count >= 2) continue;

      if (count === 1) {
        if (!fee.last_reminder_at) continue;
        const daysSince = Math.floor(
          (now - new Date(fee.last_reminder_at)) / DAY,
        );
        if (daysSince < 7) continue;
      }

      const student = studentMap[fee.student_id];
      if (!student) continue;
      const phone = student.phone || student.alt_phone;
      if (!phone) continue;

      const msg =
        `Dear Parent,\nThis is a reminder from ${schoolName}.\n` +
        `Fees for ${student.name} (Class ${student.class}${student.section ? "-" + student.section : ""}) ` +
        `for ${fee.month || ""} ${fee.academic_year || ""} amounting to Rs.${fee.amount} ` +
        `is overdue by ${daysOverdue} days. Please pay at the earliest.\nThank you.`;

      const ok = await sendWhatsApp(phone, msg);
      if (ok) {
        await db
          .update(fees)
          .set({ last_reminder_at: now, reminder_count: count + 1 })
          .where(eq(fees.id, fee.id));
        sent++;
      }
    }

    return NextResponse.json({ success: true, sent, lateAdded });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}