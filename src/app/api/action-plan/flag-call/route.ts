import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/tier";
import { sendEmail } from "@/lib/email";
import { writeAudit } from "@/lib/audit";
import { formatAuTime } from "@/lib/format";
import { openCaseForCallFlag } from "@/lib/cases";

const Body = z.object({ context: z.string().max(500).nullable() });

export async function POST(req: NextRequest) {
  let viewer;
  try {
    viewer = await requireMember();
  } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const flag = await db.distressingCallFlag.create({
    data: {
      flaggedById: viewer.id,
      context: parsed.data.context ?? undefined,
    },
  });

  // Open a live case the whole network can watch.
  const openCase = await openCaseForCallFlag({
    flagId: flag.id,
    flaggedByMemberId: viewer.id,
    flaggedByName: viewer.shortName ?? viewer.fullName,
    flaggedAt: flag.flaggedAt,
  });

  // Notify Admin + Full Medical tier.
  const recipients = await db.member.findMany({
    where: { OR: [{ tier: "ADMIN" }, { tier: "FULL_MEDICAL" }], isActive: true },
  });
  for (const m of recipients) {
    await sendEmail({
      kind: "DISTRESSING_CALL_FLAGGED",
      to: m.email,
      toName: m.shortName ?? m.fullName,
      subject: `A distressing call with David has been flagged (${formatAuTime(flag.flaggedAt)})`,
      bodyText:
        `Hi ${m.shortName ?? m.fullName},\n\n` +
        `${viewer.fullName} flagged a distressing call with David at ${formatAuTime(flag.flaggedAt)}.\n\n` +
        (parsed.data.context ? `Context they shared: ${parsed.data.context}\n\n` : "") +
        "The no-contact backstop is now armed. If David goes silent past the no-contact period without checking in, the portal will prompt the action plan.",
      metadata: { flagId: flag.id },
    });
  }

  await writeAudit({
    kind: "DISTRESSING_CALL_FLAGGED",
    actorId: viewer.id,
    detail: { flagId: flag.id, hasContext: Boolean(parsed.data.context) },
  });

  return NextResponse.json({ ok: true, caseId: openCase.id });
}
