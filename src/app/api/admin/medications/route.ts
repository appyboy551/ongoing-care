import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/tier";
import { Tier } from "@prisma/client";

const Body = z.object({
  name: z.string().min(1).max(120),
  dose: z.string().min(1).max(120),
  schedule: z.string().max(200).nullable().optional(),
  notes: z.string().max(800).nullable().optional(),
  tier: z.enum(["ADMIN", "FULL_MEDICAL", "SHARED"]).optional(),
  isActive: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  const created = await db.medication.create({
    data: {
      name: parsed.data.name,
      dose: parsed.data.dose,
      schedule: parsed.data.schedule ?? undefined,
      notes: parsed.data.notes ?? undefined,
      tier: (parsed.data.tier as Tier) ?? "FULL_MEDICAL",
      isActive: parsed.data.isActive ?? true,
    },
  });
  revalidateTag("medications");
  return NextResponse.json({ ok: true, id: created.id });
}
