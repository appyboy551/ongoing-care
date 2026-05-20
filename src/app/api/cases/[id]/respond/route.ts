// One-tap response from a member who was paged by an escalation. The three
// outcomes ("reached him", "tried, no answer", "calling 000") write a typed
// CaseEvent that the cron's second-tier block treats as "network has engaged"
// and therefore suppresses follow-up escalation.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/tier";
import { writeAudit } from "@/lib/audit";

const Body = z.object({
  action: z.enum(["REACHED", "NO_ANSWER", "CALLING_000"]),
  note: z.string().max(500).optional(),
});

const KIND_FOR_ACTION = {
  REACHED: "RESPONSE_REACHED",
  NO_ANSWER: "RESPONSE_NO_ANSWER",
  CALLING_000: "RESPONSE_CALLING_000",
} as const;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let viewer;
  try {
    viewer = await requireMember();
  } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const c = await db.case.findUnique({ where: { id: params.id } });
  if (!c) return NextResponse.json({ error: "Case not found" }, { status: 404 });

  const actorName = viewer.shortName ?? viewer.fullName;
  const messages: Record<typeof parsed.data.action, string> = {
    REACHED: `${actorName} reported reaching David.`,
    NO_ANSWER: `${actorName} tried David and got no answer.`,
    CALLING_000: `${actorName} is calling 000 for a welfare check.`,
  };
  const message = parsed.data.note
    ? `${messages[parsed.data.action]} Note: ${parsed.data.note}`
    : messages[parsed.data.action];

  await db.caseEvent.create({
    data: {
      caseId: c.id,
      kind: KIND_FOR_ACTION[parsed.data.action],
      actorId: viewer.id,
      actorLabel: actorName,
      message,
    },
  });
  await db.case.update({
    where: { id: c.id },
    data: { lastActivityAt: new Date() },
  });

  // CALLING_000 is a strong signal. Make sure the case status reflects that
  // a welfare check is in progress so the dashboard surfaces it clearly.
  if (parsed.data.action === "CALLING_000" && c.status !== "ESCALATED") {
    await db.case.update({
      where: { id: c.id },
      data: { status: "ESCALATED" },
    });
  }

  await writeAudit({
    kind: "CHECK_IN_MISSED",
    actorId: viewer.id,
    detail: { caseId: c.id, action: parsed.data.action, note: parsed.data.note ?? null },
  });

  return NextResponse.json({ ok: true });
}
