// Server-rendered PDF of the police-script document. Same content as the
// HTML page at /cases/[id]/police-script, but built with @react-pdf/renderer
// so the file is a real PDF (not a browser print-to-PDF).

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentMember } from "@/lib/auth";
import { formatAuTime } from "@/lib/format";
import { writeAudit } from "@/lib/audit";
import { STRESSORS, EMOTIONS } from "@/lib/seroquel-options";
import { renderPoliceScriptPdf } from "./pdf-renderer";

function labelsFromSlugs(
  slugs: unknown,
  source: readonly { slug: string; label: string }[]
): string[] {
  if (!Array.isArray(slugs)) return [];
  const map = new Map(source.map((s) => [s.slug, s.label]));
  const out: string[] = [];
  for (const s of slugs) {
    if (typeof s !== "string") continue;
    const label = map.get(s);
    if (label) out.push(label);
  }
  return out;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const viewer = await getCurrentMember();
  if (!viewer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const c = await db.case.findUnique({ where: { id: params.id } });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const log = c.originSeroquelLogId
    ? await db.seroquelLog.findUnique({ where: { id: c.originSeroquelLogId } })
    : null;
  const flag = c.originDistressingCallFlagId
    ? await db.distressingCallFlag.findUnique({ where: { id: c.originDistressingCallFlagId } })
    : null;
  const nok = await db.member.findMany({
    where: { tier: "FULL_MEDICAL", isActive: true },
    orderBy: { fullName: "asc" },
  });
  const idRows = await db.setting.findMany({
    where: { key: { in: ["identity.fullName", "identity.dob", "identity.address", "identity.phone"] } },
  });
  const idMap = Object.fromEntries(idRows.map((r) => [r.key, r.value]));

  const generatedAt = new Date();
  const lastHeardFrom = log?.takenAt ?? flag?.flaggedAt ?? c.openedAt;
  const stressors = log ? labelsFromSlugs(log.stressors, STRESSORS) : [];
  const emotions = log ? labelsFromSlugs(log.emotions, EMOTIONS) : [];

  const buffer = await renderPoliceScriptPdf({
    fullName: idMap["identity.fullName"] ?? "Not recorded",
    dob: idMap["identity.dob"] ?? "Not recorded",
    address: idMap["identity.address"] ?? "Not recorded",
    phone: idMap["identity.phone"] ?? "Not recorded",
    generatedAt: formatAuTime(generatedAt),
    generatedBy: viewer.shortName ?? viewer.fullName,
    caseId: c.id,
    lastHeardFrom: formatAuTime(lastHeardFrom),
    sourceLine: log
      ? "Self-logged a Seroquel dose. The portal expected a check-in within the configured window and has not received one."
      : flag
        ? "A member of the support network flagged a distressing call. No subsequent contact has been recorded."
        : "The portal opened this case but has no more recent contact recorded.",
    medication: log
      ? { name: "Seroquel (quetiapine)", doseMg: log.doseMg, takenAt: formatAuTime(log.takenAt) }
      : null,
    flag: flag ? { flaggedAt: formatAuTime(flag.flaggedAt) } : null,
    stressors,
    emotions,
    location: log?.locationLat != null && log.locationLng != null
      ? {
          lat: log.locationLat,
          lng: log.locationLng,
          accuracyM: log.locationAccuracyM ?? null,
          takenAt: formatAuTime(log.locationTakenAt ?? log.takenAt),
        }
      : null,
    nok: nok.map((m) => ({
      relationship: m.relationship ?? "Family",
      name: m.fullName,
      phone: m.phone ?? "phone not recorded",
    })),
  });

  await writeAudit({
    kind: "PII_VIEW",
    actorId: viewer.id,
    detail: { surface: "police-script-pdf", caseId: c.id },
  });

  return new Response(new Uint8Array(buffer), {
    headers: {
      "content-type": "application/pdf",
      "content-disposition": `attachment; filename="welfare-check-${c.id.slice(-8)}.pdf"`,
      "cache-control": "no-store",
    },
  });
}
