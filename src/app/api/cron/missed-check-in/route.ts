// Vercel Cron endpoint. Triggers the missed-check-in escalation.
//
// Vercel calls this with header `Authorization: Bearer <CRON_SECRET>`. We
// validate the header so a random internet hit can't trigger escalations.

import { NextResponse } from "next/server";
import { runMissedCheckInEscalation } from "@/lib/escalate";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  const got = req.headers.get("authorization");
  if (got !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const result = await runMissedCheckInEscalation();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Escalation failed" },
      { status: 500 }
    );
  }
}
