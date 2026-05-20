// Lets David clear an open distressing-call flag before the no-contact window
// expires. Without this endpoint a flag-only path could only be silenced by
// logging Seroquel or letting the cron escalate. Both are heavier-weight than
// David just saying "I am okay" through the portal.
//
// ADMIN-only. Resolves every currently open flag (there is realistically only
// ever one at a time) and closes any linked open cases.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/tier";
import { sendEmail } from "@/lib/email";
import { writeAudit } from "@/lib/audit";
import { formatAuTime } from "@/lib/format";
import { closeCase } from "@/lib/cases";

const Body = z.object({
  // Optional short note David can attach to the resolution (e.g., "took a
  // walk, feeling okay").
  note: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  let me;
  try {
    me = await requireAdmin();
  } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const now = new Date();
  const resolution = parsed.data.note
    ? `David cleared the flag: ${parsed.data.note}`
    : "David cleared the flag.";

  const openFlags = await db.distressingCallFlag.findMany({
    where: { resolvedAt: null },
  });
  if (openFlags.length === 0) {
    return NextResponse.json({ ok: true, resolved: 0 });
  }

  await db.distressingCallFlag.updateMany({
    where: { resolvedAt: null },
    data: { resolvedAt: now, resolution },
  });

  // Close any open cases that originated from these flags.
  const flagIds = openFlags.map((f) => f.id);
  const openCases = await db.case.findMany({
    where: {
      status: "OPEN",
      originDistressingCallFlagId: { in: flagIds },
    },
  });
  for (const c of openCases) {
    await closeCase({
      caseId: c.id,
      resolution,
      actor: { id: me.id, name: me.shortName ?? me.fullName },
      status: "RESOLVED",
    });
  }

  // Confirm to Bron and Joanna that David is okay.
  const fullMedicalMembers = await db.member.findMany({
    where: { tier: "FULL_MEDICAL", isActive: true },
  });
  for (const m of fullMedicalMembers) {
    await sendEmail({
      kind: "PLAN_CLOSED",
      to: m.email,
      toName: m.shortName ?? m.fullName,
      subject: `David has cleared the flagged-call alert at ${formatAuTime(now)}`,
      bodyText:
        `Hi ${m.shortName ?? m.fullName},\n\n` +
        `David has cleared the open distressing-call flag at ${formatAuTime(now)}. The action plan is closed.\n` +
        (parsed.data.note ? `\nHis note: ${parsed.data.note}\n` : ""),
      metadata: { flagIds, resolvedAt: now.toISOString() },
    });
  }

  await writeAudit({
    kind: "PLAN_CLOSED",
    actorId: me.id,
    detail: { flagIds, resolution, casesClosed: openCases.length },
  });

  return NextResponse.json({ ok: true, resolved: openFlags.length });
}
