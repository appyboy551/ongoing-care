import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/tier";
import { writeAudit } from "@/lib/audit";

const Body = z.object({ id: z.string(), active: z.boolean() });

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

  const target = await db.member.update({
    where: { id: parsed.data.id },
    data: { isActive: parsed.data.active },
  });
  // Revoke all active sessions if deactivating.
  if (!parsed.data.active) {
    await db.session.updateMany({
      where: { memberId: target.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  await writeAudit({
    kind: "MEMBER_ACCESS_REVOKED",
    actorId: admin.id,
    detail: { targetId: target.id, active: parsed.data.active },
  });
  return NextResponse.json({ ok: true });
}
