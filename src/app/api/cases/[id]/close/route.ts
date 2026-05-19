import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/tier";
import { closeCase } from "@/lib/cases";

const Body = z.object({
  resolution: z.string().min(1).max(500),
  status: z.enum(["RESOLVED", "ESCALATED"]).default("RESOLVED"),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  await closeCase({
    caseId: params.id,
    resolution: parsed.data.resolution,
    actor: { id: admin.id, name: admin.shortName ?? admin.fullName },
    status: parsed.data.status,
  });
  return NextResponse.json({ ok: true });
}
