import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/tier";

const Body = z.object({
  name: z.string().min(1).max(120),
  role: z.string().min(1).max(120),
  organisation: z.string().max(200).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  notes: z.string().max(800).optional().nullable(),
  isCurrent: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  const created = await db.careTeamMember.create({
    data: {
      name: parsed.data.name,
      role: parsed.data.role,
      organisation: parsed.data.organisation ?? undefined,
      phone: parsed.data.phone ?? undefined,
      address: parsed.data.address ?? undefined,
      notes: parsed.data.notes ?? undefined,
      isCurrent: parsed.data.isCurrent ?? true,
    },
  });
  return NextResponse.json({ ok: true, id: created.id });
}
