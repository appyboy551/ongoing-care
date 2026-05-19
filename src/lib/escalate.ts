// Missed-check-in escalation. Runs on a schedule (Vercel Cron) and reacts to
// Seroquel logs whose check-in window has expired.
//
// Idempotent. Each Seroquel log gets escalatedAt set the first time we fire,
// so a subsequent cron tick will skip it. If you want to re-escalate manually,
// clear escalatedAt on the log row.

import { db } from "./db";
import { sendEmail } from "./email";
import { sendSms } from "./sms";
import { writeAudit } from "./audit";
import { formatAuTime } from "./format";
import { doseInWords } from "./format";
import { updateCaseStep } from "./cases";

const SYSTEM_ACTOR = { id: "system:cron", name: "Portal (automatic)" };

export type EscalationResult = {
  processedLogs: number;
  escalatedLogs: number;
  emailsSent: number;
  smsAttempted: number;
  smsSent: number;
};

export async function runMissedCheckInEscalation(now = new Date()): Promise<EscalationResult> {
  let processedLogs = 0;
  let escalatedLogs = 0;
  let smsAttempted = 0;
  let smsSent = 0;
  let emailsSent = 0;

  // Find every Seroquel log whose timer has expired, that has not been checked
  // in, not closed, and not already escalated.
  const overdue = await db.seroquelLog.findMany({
    where: {
      expectedCheckInBy: { lt: now },
      checkedInAt: null,
      closedAt: null,
      escalatedAt: null,
    },
    take: 20, // safety cap per run
  });

  if (overdue.length === 0) return { processedLogs: 0, escalatedLogs: 0, emailsSent: 0, smsAttempted: 0, smsSent: 0 };

  // Recipients of the escalation email: Admin (David) and the Full Medical tier
  // (Bron and Joanna) get the full detail. Shared tier members who hold a
  // physical key (Shannon and Jackson) get a separate, more directive email so
  // they know they may be needed for a welfare check.
  const fullMedical = await db.member.findMany({
    where: { tier: { in: ["ADMIN", "FULL_MEDICAL"] }, isActive: true },
  });
  const shared = await db.member.findMany({
    where: { tier: "SHARED", isActive: true },
  });

  for (const log of overdue) {
    processedLogs++;

    // Mark the log escalated FIRST to keep the cron idempotent even if the
    // notification step partially fails.
    await db.seroquelLog.update({
      where: { id: log.id },
      data: { escalatedAt: now },
    });
    escalatedLogs++;

    // Update the linked Case. Mark wait-checkin step DONE (overdue), activate
    // the next pending step (call-david).
    const linkedCase = await db.case.findFirst({
      where: { originSeroquelLogId: log.id, status: "OPEN" },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    if (linkedCase) {
      const waitStep = linkedCase.steps.find((s) => s.stepKey === "wait-checkin");
      if (waitStep && waitStep.status !== "DONE") {
        await updateCaseStep({
          caseId: linkedCase.id,
          stepId: waitStep.id,
          newStatus: "DONE",
          note: "Timer expired without check-in. The portal has escalated automatically.",
          actor: SYSTEM_ACTOR,
        });
      }
      // updateCaseStep moves the next pending step to ACTIVE automatically,
      // so call-david should now be ACTIVE.
      await db.case.update({
        where: { id: linkedCase.id },
        data: { status: "ESCALATED", lastActivityAt: now },
      });
    }

    const overdueHours = Math.max(0, Math.round((now.getTime() - log.expectedCheckInBy.getTime()) / 360_000) / 10);

    // Resolve admin name/phone and key-holder names from the DB so source-code
    // hardcoded PII is avoided.
    const admin = fullMedical.find((m) => m.tier === "ADMIN");
    const adminName = admin?.shortName ?? admin?.fullName ?? "David";
    const adminPhone = admin?.phone ?? "(phone not on file)";
    const keyHolders = shared.filter((m) => m.isFrontDoorKeyHolder);
    const keyHolderNames = keyHolders.length
      ? keyHolders.map((m) => m.shortName ?? m.fullName).join(" and ")
      : "the named front-door key holders";

    // Email David, Bron and Joanna.
    for (const m of fullMedical) {
      const subject = `${adminName} has not checked in. Action plan is live.`;
      const body = [
        `Hi ${m.shortName ?? m.fullName},`,
        ``,
        `${adminName} logged ${doseInWords(log.doseMg)} of Seroquel at ${formatAuTime(log.takenAt)}.`,
        `Expected check-in by ${formatAuTime(log.expectedCheckInBy)}. That window has now passed by approximately ${overdueHours} hours.`,
        ``,
        `Next step in the action plan:`,
        `1. Call ${adminName} on ${adminPhone}.`,
        `2. If he doesn't answer, open the live case in the portal and coordinate from there. ${keyHolderNames} hold a front-door key.`,
        ``,
        `Open the live case: ${process.env.APP_URL ?? "http://localhost:3000"}/cases${linkedCase ? `/${linkedCase.id}` : ""}`,
        ``,
        `If you have already heard from ${adminName}, sign in and close the case so the network knows.`,
      ].join("\n");
      await sendEmail({
        kind: "CHECK_IN_MISSED",
        to: m.email,
        toName: m.shortName ?? m.fullName,
        subject,
        bodyText: body,
        metadata: { logId: log.id, caseId: linkedCase?.id ?? null },
      });
      emailsSent++;
    }

    // Email Shannon, Jackson, Robyn with a tighter, directive note. Rose and
    // Stephen are also Shared tier but not physical welfare-check contacts;
    // they receive the same note for transparency.
    for (const m of shared) {
      const isKeyHolder = m.isFrontDoorKeyHolder;
      const subject = `${adminName} is overdue checking in. Action plan is live.`;
      const body = [
        `Hi ${m.shortName ?? m.fullName},`,
        ``,
        `${adminName} has not checked in after a logged Seroquel dose. The portal has automatically moved the action plan to the next step.`,
        ``,
        isKeyHolder
          ? `You hold a front-door key to ${adminName}'s apartment. Bron or Joanna will most likely call you to coordinate the welfare check. Stay reachable for the next few hours if you can.`
          : `You don't need to do anything right now. This message exists so you know what's happening.`,
        ``,
        `Open the live case: ${process.env.APP_URL ?? "http://localhost:3000"}/cases${linkedCase ? `/${linkedCase.id}` : ""}`,
        ``,
        `If you have already heard from ${adminName}, post a note on the case so the network knows.`,
      ].join("\n");
      await sendEmail({
        kind: "CHECK_IN_MISSED",
        to: m.email,
        toName: m.shortName ?? m.fullName,
        subject,
        bodyText: body,
        metadata: { logId: log.id, caseId: linkedCase?.id ?? null, isKeyHolder },
      });
      emailsSent++;
    }

    // SMS dispatch: urgent-only, to FULL_MEDICAL members and front-door key
    // holders with a phone on file. ~4 SMS per event maximum.
    const smsRecipients = [
      ...fullMedical.filter((m) => m.tier !== "ADMIN" && m.phone),
      ...keyHolders.filter((m) => m.phone),
    ];
    const appUrl = process.env.APP_URL ?? "http://localhost:3001";
    const smsLink = `${appUrl}/cases${linkedCase ? `/${linkedCase.id}` : ""}`;
    const smsBody = `ALERT: ${adminName} has not checked in. Action plan is live. Open: ${smsLink}`;
    for (const m of smsRecipients) {
      if (!m.phone) continue;
      smsAttempted++;
      const r = await sendSms({ to: m.phone, bodyText: smsBody });
      if (r.ok) smsSent++;
    }

    await writeAudit({
      kind: "CHECK_IN_MISSED",
      actorLabel: "system:cron",
      detail: {
        logId: log.id,
        caseId: linkedCase?.id ?? null,
        expectedCheckInBy: log.expectedCheckInBy.toISOString(),
        recipients: fullMedical.length + shared.length,
        smsAttempted,
        smsSent,
      },
    });
  }

  return { processedLogs, escalatedLogs, emailsSent, smsAttempted, smsSent };
}
