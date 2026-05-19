// Live case tracker: open, list, update steps, close.
// A case is one incident (Seroquel log or distressing-call flag).

import { db } from "./db";
import { writeAudit } from "./audit";
import { CaseOrigin, StepStatus } from "@prisma/client";

// Step template used for both Seroquel-log and distressing-call-flag origins.
// Phone numbers are read from the Member table at case-creation time so the
// source code stays free of PII and edits flow through the portal UI.
async function defaultStepTemplate(origin: CaseOrigin) {
  const seroquel = origin === "SEROQUEL_LOG";
  const [admin, keyHolders] = await Promise.all([
    db.member.findFirst({ where: { tier: "ADMIN" }, select: { fullName: true, shortName: true, phone: true } }),
    db.member.findMany({
      where: { isFrontDoorKeyHolder: true, isActive: true },
      select: { fullName: true, shortName: true, phone: true },
    }),
  ]);
  const adminName = admin?.shortName ?? admin?.fullName ?? "David";
  const adminPhone = admin?.phone ?? "(phone not on file)";
  const keyHolderLine = keyHolders.length
    ? keyHolders
        .map((m) => `${m.shortName ?? m.fullName} (${m.phone ?? "phone not on file"})`)
        .join(" or ")
    : "the named front-door key holders";
  return [
    {
      stepKey: "trigger",
      title: seroquel ? "Seroquel logged" : "Distressing call flagged",
      description: seroquel
        ? `${adminName} has logged Seroquel after a distressing call. Bron and Joanna have been emailed.`
        : `A member has flagged a distressing call with ${adminName}. The no-contact backstop is armed.`,
      // Auto-done at creation time.
      autoDone: true,
    },
    {
      stepKey: "wait-checkin",
      title: `Wait for ${adminName} to check in`,
      description:
        `Default timer is 14 hours from trigger (admin-configurable). If ${adminName} checks in, the plan closes here.`,
      autoActive: true,
    },
    {
      stepKey: "call-david",
      title: `Call ${adminName} on ${adminPhone}`,
      description:
        "If he answers and is okay, close the case. If he doesn't answer, move to the welfare check.",
    },
    {
      stepKey: "welfare-check",
      title: "Welfare check at apartment",
      description:
        `Contact ${keyHolderLine}. They hold a front-door key. Buzz a neighbour to enter the building. If uneasy, request a police-assisted welfare check.`,
    },
    {
      stepKey: "search-hospitals",
      title: "Search hospitals",
      description:
        "If David is not at home: ask attending police what next; follow up with St Vincent's and Prince of Wales Hospitals. Bron and Joanna as next of kin can ask for mental health, acute or PECC wards.",
    },
    {
      stepKey: "located",
      title: "David located",
      description: "Record where, who confirmed, and current status. Portal sends a group update.",
    },
    {
      stepKey: "hospital-handover",
      title: "Hospital handover (if needed)",
      description: "If David is admitted, generate the full medical report for the care team including the last 4 Seroquel logs.",
    },
    {
      stepKey: "closed",
      title: "Plan closed",
      description: "David has confirmed he is safe. Reminder to thank those who helped.",
    },
  ];
}

export async function openCaseForSeroquelLog(args: {
  seroquelLogId: string;
  davidMemberId: string;
  takenAt: Date;
  doseMg: number;
}) {
  const title = `Seroquel ${args.doseMg}mg logged`;
  const created = await db.case.create({
    data: {
      title,
      origin: "SEROQUEL_LOG",
      originSeroquelLogId: args.seroquelLogId,
      lastActivityAt: args.takenAt,
    },
  });

  const steps = await defaultStepTemplate("SEROQUEL_LOG");
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    await db.caseStep.create({
      data: {
        caseId: created.id,
        order: i + 1,
        stepKey: s.stepKey,
        title: s.title,
        description: s.description,
        status: s.autoDone
          ? "DONE"
          : s.autoActive
            ? "ACTIVE"
            : "PENDING",
        completedAt: s.autoDone ? args.takenAt : null,
        completedById: s.autoDone ? args.davidMemberId : null,
      },
    });
  }
  await db.caseEvent.create({
    data: {
      caseId: created.id,
      kind: "CASE_OPENED",
      actorId: args.davidMemberId,
      message: `Case opened: ${title}.`,
    },
  });
  return created;
}

export async function openCaseForCallFlag(args: {
  flagId: string;
  flaggedByMemberId: string;
  flaggedByName: string;
  flaggedAt: Date;
}) {
  const title = `Distressing call flagged by ${args.flaggedByName}`;
  const created = await db.case.create({
    data: {
      title,
      origin: "DISTRESSING_CALL_FLAG",
      originDistressingCallFlagId: args.flagId,
      lastActivityAt: args.flaggedAt,
    },
  });
  const steps = await defaultStepTemplate("DISTRESSING_CALL_FLAG");
  for (let i = 0; i < steps.length; i++) {
    const s = steps[i];
    await db.caseStep.create({
      data: {
        caseId: created.id,
        order: i + 1,
        stepKey: s.stepKey,
        title: s.title,
        description: s.description,
        status: s.autoDone ? "DONE" : s.autoActive ? "ACTIVE" : "PENDING",
        completedAt: s.autoDone ? args.flaggedAt : null,
        completedById: s.autoDone ? args.flaggedByMemberId : null,
      },
    });
  }
  await db.caseEvent.create({
    data: {
      caseId: created.id,
      kind: "CASE_OPENED",
      actorId: args.flaggedByMemberId,
      message: `Case opened: ${title}.`,
    },
  });
  return created;
}

export async function updateCaseStep(args: {
  caseId: string;
  stepId: string;
  newStatus: StepStatus;
  note?: string;
  actor: { id: string; name: string };
}) {
  const step = await db.caseStep.update({
    where: { id: args.stepId },
    data: {
      status: args.newStatus,
      note: args.note ?? undefined,
      completedAt:
        args.newStatus === "DONE" || args.newStatus === "SKIPPED" || args.newStatus === "NA"
          ? new Date()
          : null,
      completedById:
        args.newStatus === "DONE" || args.newStatus === "SKIPPED" || args.newStatus === "NA"
          ? args.actor.id
          : null,
    },
  });

  // Advance the next pending step to ACTIVE when this one is marked DONE.
  if (args.newStatus === "DONE" || args.newStatus === "SKIPPED" || args.newStatus === "NA") {
    const next = await db.caseStep.findFirst({
      where: { caseId: args.caseId, order: { gt: step.order }, status: "PENDING" },
      orderBy: { order: "asc" },
    });
    if (next) {
      await db.caseStep.update({ where: { id: next.id }, data: { status: "ACTIVE" } });
    }
  }

  await db.case.update({
    where: { id: args.caseId },
    data: { lastActivityAt: new Date() },
  });
  await db.caseEvent.create({
    data: {
      caseId: args.caseId,
      kind: "STEP_UPDATED",
      actorId: args.actor.id,
      actorLabel: args.actor.name,
      message: `${args.actor.name} marked "${step.title}" as ${args.newStatus.toLowerCase()}${args.note ? `: ${args.note}` : ""}.`,
    },
  });
  return step;
}

export async function closeCase(args: {
  caseId: string;
  resolution: string;
  actor: { id: string; name: string };
  status?: "RESOLVED" | "ESCALATED";
}) {
  const closed = await db.case.update({
    where: { id: args.caseId },
    data: {
      status: args.status ?? "RESOLVED",
      closedAt: new Date(),
      closedById: args.actor.id,
      closedReason: args.resolution,
      lastActivityAt: new Date(),
    },
  });
  // Mark any still-pending or active steps as SKIPPED.
  await db.caseStep.updateMany({
    where: { caseId: args.caseId, status: { in: ["PENDING", "ACTIVE"] } },
    data: { status: "SKIPPED", completedAt: new Date(), completedById: args.actor.id },
  });
  await db.caseEvent.create({
    data: {
      caseId: args.caseId,
      kind: "CASE_CLOSED",
      actorId: args.actor.id,
      actorLabel: args.actor.name,
      message: `${args.actor.name} closed the case: ${args.resolution}`,
    },
  });
  await writeAudit({
    kind: "PLAN_CLOSED",
    actorId: args.actor.id,
    detail: { caseId: args.caseId, resolution: args.resolution },
  });
  return closed;
}

export async function addCaseNote(args: {
  caseId: string;
  note: string;
  actor: { id: string; name: string };
}) {
  await db.case.update({
    where: { id: args.caseId },
    data: { lastActivityAt: new Date() },
  });
  await db.caseEvent.create({
    data: {
      caseId: args.caseId,
      kind: "NOTE_ADDED",
      actorId: args.actor.id,
      actorLabel: args.actor.name,
      message: `${args.actor.name}: ${args.note}`,
    },
  });
}

export async function getOpenCase() {
  return db.case.findFirst({
    where: { status: "OPEN" },
    orderBy: { lastActivityAt: "desc" },
    include: {
      steps: { orderBy: { order: "asc" } },
      events: { orderBy: { createdAt: "desc" }, take: 30 },
    },
  });
}

export async function getCaseById(id: string) {
  return db.case.findUnique({
    where: { id },
    include: {
      steps: { orderBy: { order: "asc" }, include: { } },
      events: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  });
}

export async function listCases() {
  return db.case.findMany({
    orderBy: [{ status: "asc" }, { lastActivityAt: "desc" }],
    include: { steps: { orderBy: { order: "asc" } } },
    take: 50,
  });
}
