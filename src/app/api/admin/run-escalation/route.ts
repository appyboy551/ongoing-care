// Admin-only manual trigger of the missed-check-in escalation logic.
// Lets David verify the flow without waiting 14 hours, or fire it on demand
// if a real situation calls for it.

import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/tier";
import { runMissedCheckInEscalation } from "@/lib/escalate";
import { writeAudit } from "@/lib/audit";

export async function POST() {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  try {
    const result = await runMissedCheckInEscalation();
    await writeAudit({
      kind: "CHECK_IN_MISSED",
      actorId: admin.id,
      detail: { manual: true, ...result },
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Escalation failed" },
      { status: 500 }
    );
  }
}
