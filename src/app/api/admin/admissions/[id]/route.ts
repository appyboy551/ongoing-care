import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/tier";

const PatchBody = z.object({
  hospital: z.string().min(1).max(200).optional(),
  startDate: z.string().min(1).optional(),
  endDate: z.string().nullable().optional(),
  reason: z.string().max(1000).nullable().optional(),
  voluntary: z.boolean().optional(),
  notes: z.string().max(1000).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireAdmin(); } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  const existing = await db.admission.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.startDate) {
    const d = new Date(parsed.data.startDate);
    if (isNaN(d.getTime())) return NextResponse.json({ error: "Invalid start date" }, { status: 400 });
    data.startDate = d;
  }
  if (parsed.data.endDate !== undefined) {
    if (parsed.data.endDate === null || parsed.data.endDate === "") {
      data.endDate = null;
    } else {
      const d = new Date(parsed.data.endDate);
      if (isNaN(d.getTime())) return NextResponse.json({ error: "Invalid end date" }, { status: 400 });
      data.endDate = d;
    }
  }
  await db.admission.update({ where: { id: params.id }, data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireAdmin(); } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const existing = await db.admission.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.admission.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
