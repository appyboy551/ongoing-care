// Monthly review email. Fires autonomously on admin dashboard load if more
// than 30 days have passed since the last send. Idempotent via a timestamp
// stored in the Setting table; same-day calls return immediately.
//
// No cron required. The admin signs in often enough that the dashboard render
// is a reliable trigger.

import { db } from "./db";
import { sendEmail } from "./email";
import { writeAudit } from "./audit";
import { formatAuTime } from "./format";

const SETTING_KEY = "monthly_review.last_sent_at";
const INTERVAL_DAYS = 30;

const CHECKLIST = [
  "Pharmacist review of the full medication combination (Lamotrigine, Clonidine, Truvada, Doxy-PEP, Seroquel).",
  "Update your contact details if your phone or address has changed (sidebar > My details).",
  "Review the support network: anyone to add or remove? (sidebar > Network).",
  "Review the care team: any new or past clinicians to update? (sidebar > Care team).",
  "Confirm your Medicare and Medibank numbers are still current (sidebar > Medicare and Medibank).",
  "Review the statement of wishes: any changes? (sidebar > Content sections).",
  "Check whether enduring guardianship has been formalised.",
  "Close any stale cases (sidebar > Live case).",
  "Skim the audit log for anything unexpected (sidebar > Audit log).",
];

export async function ensureMonthlyReviewSent(now: Date = new Date()): Promise<{
  fired: boolean;
  reason: "no-admin-email" | "sent" | "not-due" | "no-admin-found" | "error";
}> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return { fired: false, reason: "no-admin-email" };

  const existing = await db.setting.findUnique({ where: { key: SETTING_KEY } });
  if (existing?.value) {
    const last = new Date(existing.value);
    if (!isNaN(last.getTime())) {
      const ageMs = now.getTime() - last.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);
      if (ageDays < INTERVAL_DAYS) {
        return { fired: false, reason: "not-due" };
      }
    }
  }

  const admin = await db.member.findFirst({ where: { tier: "ADMIN" }, select: { id: true, shortName: true, fullName: true } });
  if (!admin) return { fired: false, reason: "no-admin-found" };
  const adminName = admin.shortName ?? admin.fullName;

  const bodyText =
    `Hi ${adminName},\n\n` +
    `It has been at least ${INTERVAL_DAYS} days since the last monthly review of your Ongoing Care portal. A few things worth looking at:\n\n` +
    CHECKLIST.map((c, i) => `${i + 1}. ${c}`).join("\n") +
    `\n\nNothing is urgent. The portal does not stop you from using it; this is just a prompt.\n\n` +
    `Sent ${formatAuTime(now)}.\n`;

  try {
    await sendEmail({
      kind: "MONTHLY_UPDATE",
      to: adminEmail,
      toName: adminName,
      subject: "Monthly review checklist for your support portal",
      bodyText,
    });
    await db.setting.upsert({
      where: { key: SETTING_KEY },
      update: { value: now.toISOString() },
      create: { key: SETTING_KEY, value: now.toISOString() },
    });
    await writeAudit({
      kind: "SETTING_CHANGED",
      actorLabel: "system:monthly-review",
      detail: { key: SETTING_KEY, sentTo: adminEmail },
    });
    return { fired: true, reason: "sent" };
  } catch {
    return { fired: false, reason: "error" };
  }
}
