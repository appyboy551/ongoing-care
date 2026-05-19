// Phase 0 safety fix. Records server-side acknowledgement of the Seroquel
// dose-pattern alert modal so a dismissal on one device propagates to all
// devices. The previous design keyed dismissal on a per-tab sessionStorage
// flag, which could not be trusted across devices and could re-show or be
// missed entirely.

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/tier";
import { writeAudit } from "@/lib/audit";

const Body = z.object({
  logId: z.string(),
});

export async function POST(req: NextRequest) {
  let me;
  try {
    me = await requireAdmin();
  } catch (e) {
    return e instanceof Response
      ? e
      : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid acknowledgement payload" },
      { status: 400 }
    );
  }

  const now = new Date();
  try {
    await db.seroquelLog.update({
      where: { id: parsed.data.logId },
      data: { alertAcknowledgedAt: now },
    });
  } catch {
    return NextResponse.json({ error: "Log not found" }, { status: 404 });
  }

  // SETTING_CHANGED with a discriminating action mirrors the existing pattern
  // used by /admin/draft-helper. Keeps the AuditKind enum unchanged, which
  // honours the Section 0.5 do-not-touch rule.
  await writeAudit({
    kind: "SETTING_CHANGED",
    actorId: me.id,
    actorLabel: me.shortName ?? me.fullName,
    detail: {
      action: "seroquel-alert-acknowledged",
      logId: parsed.data.logId,
    },
  });

  return NextResponse.json({ ok: true });
}
