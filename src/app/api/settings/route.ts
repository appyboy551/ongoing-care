import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/tier";
import { setSetting } from "@/lib/settings";
import { writeAudit } from "@/lib/audit";

const Body = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(2000),
});

export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  await setSetting(parsed.data.key, parsed.data.value);
  await writeAudit({
    kind: "SETTING_CHANGED",
    actorId: admin.id,
    detail: { key: parsed.data.key },
  });
  return NextResponse.json({ ok: true });
}
