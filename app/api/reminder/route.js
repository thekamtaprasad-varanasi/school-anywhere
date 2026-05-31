import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, fees } from "@/lib/schema";
import { eq, and, lte, gt, lt } from "drizzle-orm";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

export async function GET(req) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const now = new Date();
    let sent = 0;

    // ── 1. Trial 6th day reminder ──────────────────────────────
    const trialUsers = await db
      .select()
      .from(users)
      .where(and(eq(users.status, "trial"), eq(users.reminder_sent, 0)));

    for (const user of trialUsers) {
      if (!user.email || !user.trial_start) continue;

      const trialStart = new Date(user.trial_start);
      const daysPassed = Math.floor((now - trialStart) / (1000 * 60 * 60 * 24));

      if (daysPassed >= 6) {
        await resend.emails.send({
          from: "Nishant School Software <no-reply@nishantsoftwares.in>",
          to: [user.email],
          subject: "Nishant School Software — Trial ends tomorrow",
          html: `
            <p>Hello ${user.name || ""}!</p>
            <p>Your <strong>7-day free trial ends tomorrow</strong>.</p>
            <p>To continue using the software, purchase now:</p>
            <p>
              <strong>First year: ₹4,999</strong> (1 year included)<br/>
              Renewal: ₹2,500/year
            </p>
            <p>
              <a href="https://nishantsoftwares.in/payment?software=school&email=${encodeURIComponent(user.email)}" 
                 style="background:#4f46e5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
                Buy Now
              </a>
            </p>
            <p style="color:#666;font-size:12px;">
              📞 9996865069 · 
              <a href="https://wa.me/919996865069">WhatsApp</a>
            </p>
          `,
        });

        await db
          .update(users)
          .set({ reminder_sent: 1 })
          .where(eq(users.email, user.email));

        sent++;
      }
    }

    // ── 2. Renewal reminder — 7 days before expiry ──────────────
    const in7Days = new Date();
    in7Days.setDate(in7Days.getDate() + 7);

    const renewalUsers = await db
      .select()
      .from(users)
      .where(
        and(
          eq(users.status, "active"),
          lte(users.expiry_date, in7Days.toISOString()),
          gt(users.expiry_date, now.toISOString()),
        ),
      );

    for (const user of renewalUsers) {
      if (!user.email) continue;

      const expiry = new Date(user.expiry_date);
      const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));

      await resend.emails.send({
        from: "Nishant School Software <no-reply@nishantsoftwares.in>",
        to: [user.email],
        subject: `Nishant School Software — Subscription expires in ${daysLeft} days`,
        html: `
          <p>Hello ${user.name || ""}!</p>
          <p>Your <strong>Nishant School Software subscription expires in ${daysLeft} days</strong>.</p>
          <p>Renew now to continue without interruption:</p>
          <p><strong>Renewal: ₹2,500/year</strong></p>
          <p>
            <a href="https://nishantsoftwares.in/payment?software=school&email=${encodeURIComponent(user.email)}"
               style="background:#4f46e5;color:#fff;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
              Renew Now
            </a>
          </p>
          <p style="color:#666;font-size:12px;">
            📞 9996865069 · 
            <a href="https://wa.me/919996865069">WhatsApp</a>
          </p>
        `,
      });

      sent++;
    }

    // ── 3. Fee overdue auto-set ──────────────────────────────────
    await db
      .update(fees)
      .set({ status: "overdue" })
      .where(
        and(
          eq(fees.status, "pending"),
          lt(fees.due_date, now),
        )
      );

    return NextResponse.json({ success: true, sent });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}