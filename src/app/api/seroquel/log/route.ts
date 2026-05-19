import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/tier";
import { getConfiguredTimerHours } from "@/lib/timer";
import { sendEmail } from "@/lib/email";
import { writeAudit } from "@/lib/audit";
import { doseInWords, formatAuTime } from "@/lib/format";
import { openCaseForSeroquelLog } from "@/lib/cases";
import { getCurrentMember } from "@/lib/auth";

const Body = z.object({
  doseMg: z.union([z.literal(25), z.literal(50)]),
  stressors: z.array(z.string()).max(20),
  emotions: z.array(z.string()).max(20),
  inFacility: z.boolean(),
  facilityName: z.string().nullish(),
  severity: z.number().int().min(1).max(5),
  drivingThis: z.string().nullish(),
  whatWouldHelp: z.string().nullish(),
  reflectionNote: z.string().max(280).nullish(),
  location: z
    .object({
      lat: z.number(),
      lng: z.number(),
      accuracyM: z.number().nullish(),
      takenAt: z.string().datetime().optional(),
    })
    .nullable(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid log payload", issues: parsed.error.issues }, { status: 400 });
  }
  const b = parsed.data;
  const now = new Date();
  const timerHours = await getConfiguredTimerHours();
  const expectedCheckInBy = new Date(now.getTime() + timerHours * 3_600_000);

  const log = await db.seroquelLog.create({
    data: {
      doseMg: b.doseMg,
      takenAt: now,
      locationLat: b.location?.lat,
      locationLng: b.location?.lng,
      locationAccuracyM: b.location?.accuracyM ?? null,
      locationTakenAt: b.location ? now : null,
      stressors: b.stressors,
      emotions: b.emotions,
      inFacility: b.inFacility,
      facilityName: b.facilityName ?? null,
      severity: b.severity,
      drivingThis: b.drivingThis ?? null,
      whatWouldHelp: b.whatWouldHelp ?? null,
      reflectionNote: b.reflectionNote ?? null,
      timerHours,
      expectedCheckInBy,
    },
  });

  // Open a live case so the network can watch the action plan in real time.
  const david = await getCurrentMember();
  const caseRow = david
    ? await openCaseForSeroquelLog({
        seroquelLogId: log.id,
        davidMemberId: david.id,
        takenAt: now,
        doseMg: b.doseMg,
      })
    : null;

  // Notify Bron and Joanna only. Email states the dose in words, no emoji.
  const fullMedicalMembers = await db.member.findMany({
    where: { tier: "FULL_MEDICAL", isActive: true },
  });

  for (const m of fullMedicalMembers) {
    const subject = `Seroquel log from David at ${formatAuTime(now)}`;
    const lines = [
      `Hi ${m.shortName ?? m.fullName},`,
      "",
      `David has logged ${doseInWords(b.doseMg)} of Seroquel at ${formatAuTime(now)}.`,
      `Expected check-in by ${formatAuTime(expectedCheckInBy)} (timer set to ${timerHours} hours).`,
      "",
      "Severity: " + b.severity + " of 5.",
      b.inFacility ? `In facility: ${b.facilityName ?? "yes"}.` : "Not in a facility at the time of logging.",
      b.reflectionNote ? `\nNote from David: ${b.reflectionNote}` : "",
      "",
      "If David has not checked in by the expected time, the portal will prompt the action plan. You will receive a follow-up.",
    ];
    await sendEmail({
      kind: "SEROQUEL_LOG",
      to: m.email,
      toName: m.shortName ?? m.fullName,
      subject,
      bodyText: lines.filter(Boolean).join("\n"),
      metadata: { logId: log.id },
    });
  }

  await writeAudit({
    kind: "SEROQUEL_LOGGED",
    actorLabel: "admin:david",
    detail: { logId: log.id, doseMg: b.doseMg, severity: b.severity },
  });

  return NextResponse.json({
    ok: true,
    logId: log.id,
    caseId: caseRow?.id ?? null,
    expectedCheckInBy,
  });
}
