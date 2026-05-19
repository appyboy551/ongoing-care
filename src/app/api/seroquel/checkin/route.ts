import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/tier";
import { sendEmail } from "@/lib/email";
import { writeAudit } from "@/lib/audit";
import { formatAuTime } from "@/lib/format";
import { closeCase } from "@/lib/cases";

const Body = z.object({
  logId: z.string(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      accuracyM: z.number().nullish(),
    })
    .nullable(),
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
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid check-in payload" }, { status: 400 });
  }
  const now = new Date();
  const log = await db.seroquelLog.update({
    where: { id: parsed.data.logId },
    data: {
      checkedInAt: now,
      closedAt: now,
      locationLat: parsed.data.location?.lat ?? undefined,
      locationLng: parsed.data.location?.lng ?? undefined,
      locationAccuracyM: parsed.data.location?.accuracyM ?? undefined,
      locationTakenAt: parsed.data.location ? now : undefined,
    },
  });

  // Notify Bron and Joanna and resolve any active distressing-call flags.
  const fullMedicalMembers = await db.member.findMany({
    where: { tier: "FULL_MEDICAL", isActive: true },
  });
  for (const m of fullMedicalMembers) {
    await sendEmail({
      kind: "PLAN_CLOSED",
      to: m.email,
      toName: m.shortName ?? m.fullName,
      subject: `David has checked in at ${formatAuTime(now)}`,
      bodyText:
        `Hi ${m.shortName ?? m.fullName},\n\n` +
        `David checked in at ${formatAuTime(now)}. The action plan is closed.\n`,
      metadata: { logId: log.id },
    });
  }

  await db.distressingCallFlag.updateMany({
    where: { resolvedAt: null },
    data: { resolvedAt: now, resolution: "David checked in." },
  });

  // Close any open cases linked to this log or to current active flags.
  const openCases = await db.case.findMany({
    where: {
      status: "OPEN",
      OR: [
        { originSeroquelLogId: log.id },
        { origin: "DISTRESSING_CALL_FLAG" },
      ],
    },
  });
  for (const c of openCases) {
    await closeCase({
      caseId: c.id,
      resolution: "David checked in and is okay. Plan closed.",
      actor: { id: me.id, name: me.shortName ?? me.fullName },
      status: "RESOLVED",
    });
  }

  await writeAudit({
    kind: "SEROQUEL_CHECKIN",
    actorLabel: "admin:david",
    detail: { logId: log.id },
  });

  return NextResponse.json({ ok: true });
}
