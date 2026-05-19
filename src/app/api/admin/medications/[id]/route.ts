import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/tier";

const PatchBody = z.object({
  name: z.string().min(1).max(120).optional(),
  dose: z.string().min(1).max(120).optional(),
  schedule: z.string().max(200).nullable().optional(),
  notes: z.string().max(800).nullable().optional(),
  tier: z.enum(["ADMIN", "FULL_MEDICAL", "SHARED"]).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireAdmin(); } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  const existing = await db.medication.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.medication.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireAdmin(); } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const existing = await db.medication.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  // Cascade safety: pharmacist reviews reference medication. Set FK to null on delete via update first.
  await db.pharmacistReview.updateMany({ where: { medicationId: params.id }, data: { medicationId: null } });
  await db.medication.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
