import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/tier";

const Body = z.object({
  hospital: z.string().min(1).max(200),
  startDate: z.string().min(1),
  endDate: z.string().nullable().optional(),
  reason: z.string().max(1000).nullable().optional(),
  voluntary: z.boolean().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  const start = new Date(parsed.data.startDate);
  if (isNaN(start.getTime())) return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
  const end = parsed.data.endDate ? new Date(parsed.data.endDate) : null;
  if (end && isNaN(end.getTime())) return NextResponse.json({ error: "Invalid end date" }, { status: 400 });
  const created = await db.admission.create({
    data: {
      hospital: parsed.data.hospital,
      startDate: start,
      endDate: end,
      reason: parsed.data.reason ?? undefined,
      voluntary: parsed.data.voluntary ?? true,
      notes: parsed.data.notes ?? undefined,
    },
  });
  return NextResponse.json({ ok: true, id: created.id });
}
