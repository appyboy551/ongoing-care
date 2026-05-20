// Missed-check-in escalation. Runs on a schedule (GitHub Actions) and reacts
// to four independent overdue conditions:
//
//   1. Seroquel logs whose check-in window has expired (first-tier).
//   2. Distressing-call flags whose no-contact window has expired and no
//      Seroquel was logged (first-tier, flag-only path - Gap 1).
//   3. Seroquel-log first-tier escalations that received no case-page
//      response inside the second-tier window (second-tier - Gap 2).
//   4. Flag-only first-tier escalations that received no case-page response
//      inside the second-tier window (second-tier flag-only - Gap 2).
//
// Each block writes its idempotency timestamp first, so a partial failure on
// notification dispatch cannot cause double-escalation on the next tick.

import { db } from "./db";
import { sendEmail } from "./email";
import { sendSms } from "./sms";
import { writeAudit } from "./audit";
import { formatAuTime } from "./format";
import { doseInWords } from "./format";
import { updateCaseStep } from "./cases";
import { getSettingNumber } from "./settings";

const SYSTEM_ACTOR = { id: "system:cron", name: "Portal (automatic)" };

// CaseEvent kinds that count as "the network has responded" for the purpose
// of suppressing second-tier escalation. The respond page writes the three
// RESPONSE_* kinds; STEP_UPDATED and NOTE_ADDED also count because they
// indicate someone has engaged with the case. CASE_CLOSED is included so
// that an admin closing the case via /api/cases/[id]/close (which does not
// touch SeroquelLog.closedAt or DistressingCallFlag.resolvedAt) suppresses
// the URGENT second-tier alert. Without this, closing a case in the UI
// after first-tier fired would still produce a phantom second-tier storm.
const RESPONSE_EVENT_KINDS = [
  "RESPONSE_REACHED",
  "RESPONSE_NO_ANSWER",
  "RESPONSE_CALLING_000",
  "NOTE_ADDED",
  "STEP_UPDATED",
  "CASE_CLOSED",
];

export type EscalationResult = {
  // First-tier Seroquel-log escalations.
  processedLogs: number;
  escalatedLogs: number;
  // First-tier flag-only escalations.
  processedFlags: number;
  escalatedFlags: number;
  // Second-tier escalations (Seroquel-log path).
  processedSecondTier: number;
  escalatedSecondTier: number;
  // Second-tier escalations (flag-only path).
  processedSecondTierFlags: number;
  escalatedSecondTierFlags: number;
  // Aggregate dispatch counters.
  emailsSent: number;
  smsAttempted: number;
  smsSent: number;
};

function emptyResult(): EscalationResult {
  return {
    processedLogs: 0,
    escalatedLogs: 0,
    processedFlags: 0,
    escalatedFlags: 0,
    processedSecondTier: 0,
    escalatedSecondTier: 0,
    processedSecondTierFlags: 0,
    escalatedSecondTierFlags: 0,
    emailsSent: 0,
    smsAttempted: 0,
    smsSent: 0,
  };
}

function appUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

function caseLink(caseId: string | null | undefined): string {
  // The respond page gives notified members the three action buttons
  // ("spoken to David", "tried, no answer", "calling 000") that suppress
  // second-tier escalation. Falls back to the case index if no case is
  // linked (shouldn't happen in normal flow, but defensive).
  return caseId ? `${appUrl()}/cases/${caseId}/respond` : `${appUrl()}/cases`;
}

export async function runMissedCheckInEscalation(now = new Date()): Promise<EscalationResult> {
  const result = emptyResult();

  // Recipient lists reused across all blocks. Pulled once per cron tick.
  const fullMedical = await db.member.findMany({
    where: { tier: { in: ["ADMIN", "FULL_MEDICAL"] }, isActive: true },
  });
  const shared = await db.member.findMany({
    where: { tier: "SHARED", isActive: true },
  });

  // ------------------------------------------------------------------
  // Block 1. Seroquel-log first-tier escalation.
  // ------------------------------------------------------------------
  const overdueLogs = await db.seroquelLog.findMany({
    where: {
      expectedCheckInBy: { lt: now },
      checkedInAt: null,
      closedAt: null,
      escalatedAt: null,
    },
    take: 20, // safety cap per run
  });

  for (const log of overdueLogs) {
    result.processedLogs++;
    // Idempotency first.
    await db.seroquelLog.update({
      where: { id: log.id },
      data: { escalatedAt: now },
    });
    result.escalatedLogs++;

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
      await db.case.update({
        where: { id: linkedCase.id },
        data: { status: "ESCALATED", lastActivityAt: now },
      });
    }

    const overdueHours =
      Math.max(0, Math.round((now.getTime() - log.expectedCheckInBy.getTime()) / 360_000) / 10);

    const admin = fullMedical.find((m) => m.tier === "ADMIN");
    const adminName = admin?.shortName ?? admin?.fullName ?? "David";
    const adminPhone = admin?.phone ?? "(phone not on file)";
    const keyHolders = shared.filter((m) => m.isFrontDoorKeyHolder);
    const keyHolderNames = keyHolders.length
      ? keyHolders.map((m) => m.shortName ?? m.fullName).join(" and ")
      : "the named front-door key holders";

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
        `Open the live case and tell the network what you found: ${caseLink(linkedCase?.id)}`,
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
      result.emailsSent++;
    }

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
        `Open the live case: ${caseLink(linkedCase?.id)}`,
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
      result.emailsSent++;
    }

    const smsRecipients = [
      ...fullMedical.filter((m) => m.tier !== "ADMIN" && m.phone),
      ...keyHolders.filter((m) => m.phone),
    ];
    const smsBody = `ALERT: ${adminName} has not checked in. Action plan is live. Open: ${caseLink(linkedCase?.id)}`;
    for (const m of smsRecipients) {
      if (!m.phone) continue;
      result.smsAttempted++;
      const r = await sendSms({ to: m.phone, bodyText: smsBody });
      if (r.ok) result.smsSent++;
    }

    await writeAudit({
      kind: "CHECK_IN_MISSED",
      actorLabel: "system:cron",
      detail: {
        logId: log.id,
        caseId: linkedCase?.id ?? null,
        expectedCheckInBy: log.expectedCheckInBy.toISOString(),
        recipients: fullMedical.length + shared.length,
        tier: "first",
      },
    });
  }

  // ------------------------------------------------------------------
  // Block 2. Flag-only first-tier escalation (Gap 1).
  // A distressing-call flag arms a no-contact window. If David neither logs
  // Seroquel nor clears the flag within the window, escalate identically.
  // ------------------------------------------------------------------
  const overdueFlags = await db.distressingCallFlag.findMany({
    where: {
      expectedResponseBy: { lt: now },
      escalatedAt: null,
      resolvedAt: null,
    },
    include: { flaggedBy: true },
    take: 20,
  });

  for (const flag of overdueFlags) {
    result.processedFlags++;
    await db.distressingCallFlag.update({
      where: { id: flag.id },
      data: { escalatedAt: now },
    });
    result.escalatedFlags++;

    const linkedCase = await db.case.findFirst({
      where: { originDistressingCallFlagId: flag.id, status: "OPEN" },
      include: { steps: { orderBy: { order: "asc" } } },
    });
    if (linkedCase) {
      const waitStep = linkedCase.steps.find((s) => s.stepKey === "wait-checkin");
      if (waitStep && waitStep.status !== "DONE") {
        await updateCaseStep({
          caseId: linkedCase.id,
          stepId: waitStep.id,
          newStatus: "DONE",
          note: "No-contact window passed after distressing-call flag. The portal has escalated automatically.",
          actor: SYSTEM_ACTOR,
        });
      }
      await db.case.update({
        where: { id: linkedCase.id },
        data: { status: "ESCALATED", lastActivityAt: now },
      });
    }

    const overdueHours = flag.expectedResponseBy
      ? Math.max(0, Math.round((now.getTime() - flag.expectedResponseBy.getTime()) / 360_000) / 10)
      : 0;

    const admin = fullMedical.find((m) => m.tier === "ADMIN");
    const adminName = admin?.shortName ?? admin?.fullName ?? "David";
    const adminPhone = admin?.phone ?? "(phone not on file)";
    const keyHolders = shared.filter((m) => m.isFrontDoorKeyHolder);
    const keyHolderNames = keyHolders.length
      ? keyHolders.map((m) => m.shortName ?? m.fullName).join(" and ")
      : "the named front-door key holders";
    const flaggerName = flag.flaggedBy.shortName ?? flag.flaggedBy.fullName;

    for (const m of fullMedical) {
      const subject = `${adminName} has not responded after a flagged distressing call.`;
      const body = [
        `Hi ${m.shortName ?? m.fullName},`,
        ``,
        `${flaggerName} flagged a distressing call with ${adminName} at ${formatAuTime(flag.flaggedAt)}.`,
        flag.context ? `Context they shared: ${flag.context}` : "",
        `${adminName} has not logged Seroquel and has not cleared the flag. The no-contact window has now passed by approximately ${overdueHours} hours.`,
        ``,
        `Next step in the action plan:`,
        `1. Call ${adminName} on ${adminPhone}.`,
        `2. If he doesn't answer, open the live case in the portal and coordinate from there. ${keyHolderNames} hold a front-door key.`,
        ``,
        `Open the live case and tell the network what you found: ${caseLink(linkedCase?.id)}`,
        ``,
        `If you have already heard from ${adminName}, sign in and close the case so the network knows.`,
      ].filter((l) => l !== "").join("\n");
      await sendEmail({
        kind: "CHECK_IN_MISSED",
        to: m.email,
        toName: m.shortName ?? m.fullName,
        subject,
        bodyText: body,
        metadata: { flagId: flag.id, caseId: linkedCase?.id ?? null },
      });
      result.emailsSent++;
    }

    for (const m of shared) {
      const isKeyHolder = m.isFrontDoorKeyHolder;
      const subject = `${adminName} has not responded after a flagged distressing call.`;
      const body = [
        `Hi ${m.shortName ?? m.fullName},`,
        ``,
        `${flaggerName} flagged a distressing call with ${adminName}. The no-contact window has now passed without a response from ${adminName}. The portal has automatically moved the action plan to the next step.`,
        ``,
        isKeyHolder
          ? `You hold a front-door key to ${adminName}'s apartment. Bron or Joanna will most likely call you to coordinate the welfare check. Stay reachable for the next few hours if you can.`
          : `You don't need to do anything right now. This message exists so you know what's happening.`,
        ``,
        `Open the live case: ${caseLink(linkedCase?.id)}`,
      ].join("\n");
      await sendEmail({
        kind: "CHECK_IN_MISSED",
        to: m.email,
        toName: m.shortName ?? m.fullName,
        subject,
        bodyText: body,
        metadata: { flagId: flag.id, caseId: linkedCase?.id ?? null, isKeyHolder },
      });
      result.emailsSent++;
    }

    const smsRecipients = [
      ...fullMedical.filter((m) => m.tier !== "ADMIN" && m.phone),
      ...keyHolders.filter((m) => m.phone),
    ];
    const smsBody = `ALERT: ${adminName} has not responded after a flagged call. Action plan is live. Open: ${caseLink(linkedCase?.id)}`;
    for (const m of smsRecipients) {
      if (!m.phone) continue;
      result.smsAttempted++;
      const r = await sendSms({ to: m.phone, bodyText: smsBody });
      if (r.ok) result.smsSent++;
    }

    await writeAudit({
      kind: "CHECK_IN_MISSED",
      actorLabel: "system:cron",
      detail: {
        flagId: flag.id,
        caseId: linkedCase?.id ?? null,
        expectedResponseBy: flag.expectedResponseBy?.toISOString() ?? null,
        recipients: fullMedical.length + shared.length,
        tier: "first",
        origin: "flag-only",
      },
    });
  }

  // ------------------------------------------------------------------
  // Block 3. Second-tier escalation (Gap 2, Seroquel-log path).
  // For Seroquel logs that were first-tier escalated >= secondTierHours ago
  // and have had zero qualifying CaseEvent activity since first-tier fired.
  // ------------------------------------------------------------------
  const secondTierHours = await getSettingNumber("escalation.second-tier.hours", 1);
  const secondTierThreshold = new Date(now.getTime() - secondTierHours * 3_600_000);

  const dueForSecondTier = await db.seroquelLog.findMany({
    where: {
      escalatedAt: { not: null, lt: secondTierThreshold },
      escalatedTwiceAt: null,
      // Only escalate-twice if David still hasn't checked in or closed the loop.
      checkedInAt: null,
      closedAt: null,
    },
    take: 20,
  });

  for (const log of dueForSecondTier) {
    result.processedSecondTier++;

    const linkedCase = await db.case.findFirst({
      where: { originSeroquelLogId: log.id },
    });

    // Suppression rule: any qualifying CaseEvent since first-tier fired
    // means the network has engaged. Skip second-tier and do not set the
    // idempotency flag, so it can fire later if engagement stalls.
    //
    // Excludes events produced by the cron itself (actorId "system:cron"),
    // since first-tier writes its own STEP_UPDATED event when it marks
    // wait-checkin as DONE. Without this filter, every Seroquel-log
    // escalation would self-suppress second-tier forever.
    if (linkedCase && log.escalatedAt) {
      const recentResponse = await db.caseEvent.findFirst({
        where: {
          caseId: linkedCase.id,
          createdAt: { gt: log.escalatedAt },
          kind: { in: RESPONSE_EVENT_KINDS },
          NOT: { actorId: SYSTEM_ACTOR.id },
        },
      });
      if (recentResponse) continue;
    }

    await db.seroquelLog.update({
      where: { id: log.id },
      data: { escalatedTwiceAt: now },
    });
    result.escalatedSecondTier++;

    const admin = fullMedical.find((m) => m.tier === "ADMIN");
    const adminName = admin?.shortName ?? admin?.fullName ?? "David";
    const adminPhone = admin?.phone ?? "(phone not on file)";
    const keyHolders = shared.filter((m) => m.isFrontDoorKeyHolder);
    const policeScriptLink = linkedCase
      ? `${appUrl()}/cases/${linkedCase.id}/police-script`
      : null;

    for (const m of fullMedical) {
      const subject = `URGENT: ${adminName} still has not checked in. ${secondTierHours}h since first alert.`;
      const body = [
        `Hi ${m.shortName ?? m.fullName},`,
        ``,
        `${secondTierHours} hour${secondTierHours === 1 ? "" : "s"} have passed since the first alert and no one in the network has logged a response on the case page.`,
        ``,
        `If you have not already done so, please attempt to contact ${adminName} on ${adminPhone} now.`,
        `If he does not answer, the next step is a welfare check at his apartment. ${keyHolders.length ? keyHolders.map((k) => k.shortName ?? k.fullName).join(" and ") : "Front-door key holders"} hold a key.`,
        `If you cannot reach anyone, call 000 and request a welfare check.`,
        ``,
        `Tell the network what you have done: ${caseLink(linkedCase?.id)}`,
        policeScriptLink ? `` : "",
        policeScriptLink ? `If you may need to brief police, use the prepared script: ${policeScriptLink}` : "",
      ].filter((l) => l !== "").join("\n");
      await sendEmail({
        kind: "CHECK_IN_MISSED",
        to: m.email,
        toName: m.shortName ?? m.fullName,
        subject,
        bodyText: body,
        metadata: { logId: log.id, caseId: linkedCase?.id ?? null, tier: "second" },
      });
      result.emailsSent++;
    }

    for (const m of shared) {
      const isKeyHolder = m.isFrontDoorKeyHolder;
      if (!isKeyHolder) {
        // Non-key-holder SHARED members already received the first-tier email
        // and have no action. Skip the second-tier email to reduce noise.
        continue;
      }
      const subject = `URGENT: ${adminName} still has not checked in. ${secondTierHours}h since first alert.`;
      const body = [
        `Hi ${m.shortName ?? m.fullName},`,
        ``,
        `${secondTierHours} hour${secondTierHours === 1 ? "" : "s"} have passed since the first alert and no one in the network has logged a response.`,
        ``,
        `You hold a front-door key. Bron or Joanna may need you for the welfare check. Stay reachable.`,
        ``,
        `Open the case: ${caseLink(linkedCase?.id)}`,
        policeScriptLink ? `Police script (if needed): ${policeScriptLink}` : "",
      ].filter((l) => l !== "").join("\n");
      await sendEmail({
        kind: "CHECK_IN_MISSED",
        to: m.email,
        toName: m.shortName ?? m.fullName,
        subject,
        bodyText: body,
        metadata: { logId: log.id, caseId: linkedCase?.id ?? null, tier: "second" },
      });
      result.emailsSent++;
    }

    const smsRecipients = [
      ...fullMedical.filter((m) => m.tier !== "ADMIN" && m.phone),
      ...keyHolders.filter((m) => m.phone),
    ];
    const smsBody = `URGENT: ${adminName} still has not checked in. ${secondTierHours}h since first alert. Open: ${caseLink(linkedCase?.id)}`;
    for (const m of smsRecipients) {
      if (!m.phone) continue;
      result.smsAttempted++;
      const r = await sendSms({ to: m.phone, bodyText: smsBody });
      if (r.ok) result.smsSent++;
    }

    await writeAudit({
      kind: "CHECK_IN_MISSED",
      actorLabel: "system:cron",
      detail: {
        logId: log.id,
        caseId: linkedCase?.id ?? null,
        tier: "second",
        secondTierHours,
      },
    });
  }

  // ------------------------------------------------------------------
  // Block 4. Second-tier escalation (Gap 2, flag-only path).
  // Mirrors Block 3 but for DistressingCallFlag rows whose first-tier
  // escalation fired >= secondTierHours ago and that have seen no qualifying
  // CaseEvent activity since. Same suppression and idempotency pattern.
  // ------------------------------------------------------------------
  const dueFlagsForSecondTier = await db.distressingCallFlag.findMany({
    where: {
      escalatedAt: { not: null, lt: secondTierThreshold },
      escalatedTwiceAt: null,
      resolvedAt: null,
    },
    include: { flaggedBy: true },
    take: 20,
  });

  for (const flag of dueFlagsForSecondTier) {
    result.processedSecondTierFlags++;

    const linkedCase = await db.case.findFirst({
      where: { originDistressingCallFlagId: flag.id },
    });

    // Same suppression rule as Block 3: skip (without setting the idempotency
    // flag) if the network has engaged with the case since first-tier fired.
    // Excludes the cron's own STEP_UPDATED event from Block 2.
    if (linkedCase && flag.escalatedAt) {
      const recentResponse = await db.caseEvent.findFirst({
        where: {
          caseId: linkedCase.id,
          createdAt: { gt: flag.escalatedAt },
          kind: { in: RESPONSE_EVENT_KINDS },
          NOT: { actorId: SYSTEM_ACTOR.id },
        },
      });
      if (recentResponse) continue;
    }

    await db.distressingCallFlag.update({
      where: { id: flag.id },
      data: { escalatedTwiceAt: now },
    });
    result.escalatedSecondTierFlags++;

    const admin = fullMedical.find((m) => m.tier === "ADMIN");
    const adminName = admin?.shortName ?? admin?.fullName ?? "David";
    const adminPhone = admin?.phone ?? "(phone not on file)";
    const keyHolders = shared.filter((m) => m.isFrontDoorKeyHolder);
    const policeScriptLink = linkedCase
      ? `${appUrl()}/cases/${linkedCase.id}/police-script`
      : null;

    for (const m of fullMedical) {
      const subject = `URGENT: ${adminName} still has not responded after the flagged call. ${secondTierHours}h since first alert.`;
      const body = [
        `Hi ${m.shortName ?? m.fullName},`,
        ``,
        `${secondTierHours} hour${secondTierHours === 1 ? "" : "s"} have passed since the first alert about the flagged distressing call and no one in the network has logged a response on the case page.`,
        ``,
        `If you have not already done so, please attempt to contact ${adminName} on ${adminPhone} now.`,
        `If he does not answer, the next step is a welfare check at his apartment. ${keyHolders.length ? keyHolders.map((k) => k.shortName ?? k.fullName).join(" and ") : "Front-door key holders"} hold a key.`,
        `If you cannot reach anyone, call 000 and request a welfare check.`,
        ``,
        `Tell the network what you have done: ${caseLink(linkedCase?.id)}`,
        policeScriptLink ? `` : "",
        policeScriptLink ? `If you may need to brief police, use the prepared script: ${policeScriptLink}` : "",
      ].filter((l) => l !== "").join("\n");
      await sendEmail({
        kind: "CHECK_IN_MISSED",
        to: m.email,
        toName: m.shortName ?? m.fullName,
        subject,
        bodyText: body,
        metadata: { flagId: flag.id, caseId: linkedCase?.id ?? null, tier: "second", origin: "flag-only" },
      });
      result.emailsSent++;
    }

    for (const m of shared) {
      const isKeyHolder = m.isFrontDoorKeyHolder;
      if (!isKeyHolder) {
        // Non-key-holder SHARED members already received the first-tier email
        // and have no action. Skip the second-tier email to reduce noise.
        continue;
      }
      const subject = `URGENT: ${adminName} still has not responded after the flagged call. ${secondTierHours}h since first alert.`;
      const body = [
        `Hi ${m.shortName ?? m.fullName},`,
        ``,
        `${secondTierHours} hour${secondTierHours === 1 ? "" : "s"} have passed since the first alert about the flagged distressing call and no one in the network has logged a response.`,
        ``,
        `You hold a front-door key. Bron or Joanna may need you for the welfare check. Stay reachable.`,
        ``,
        `Open the case: ${caseLink(linkedCase?.id)}`,
        policeScriptLink ? `Police script (if needed): ${policeScriptLink}` : "",
      ].filter((l) => l !== "").join("\n");
      await sendEmail({
        kind: "CHECK_IN_MISSED",
        to: m.email,
        toName: m.shortName ?? m.fullName,
        subject,
        bodyText: body,
        metadata: { flagId: flag.id, caseId: linkedCase?.id ?? null, tier: "second", origin: "flag-only" },
      });
      result.emailsSent++;
    }

    const smsRecipients = [
      ...fullMedical.filter((m) => m.tier !== "ADMIN" && m.phone),
      ...keyHolders.filter((m) => m.phone),
    ];
    const smsBody = `URGENT: ${adminName} still has not responded after the flagged call. ${secondTierHours}h since first alert. Open: ${caseLink(linkedCase?.id)}`;
    for (const m of smsRecipients) {
      if (!m.phone) continue;
      result.smsAttempted++;
      const r = await sendSms({ to: m.phone, bodyText: smsBody });
      if (r.ok) result.smsSent++;
    }

    await writeAudit({
      kind: "CHECK_IN_MISSED",
      actorLabel: "system:cron",
      detail: {
        flagId: flag.id,
        caseId: linkedCase?.id ?? null,
        tier: "second",
        origin: "flag-only",
        secondTierHours,
      },
    });
  }

  return result;
}
