import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/tier";

const Body = z.object({
  reviewerName: z.string().min(1).max(120),
  reviewDate: z.string().min(1),
  outcome: z.string().min(1).max(1000),
  medicationId: z.string().nullable().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  const date = new Date(parsed.data.reviewDate);
  if (isNaN(date.getTime())) return NextResponse.json({ error: "Invalid review date" }, { status: 400 });
  const created = await db.pharmacistReview.create({
    data: {
      reviewerName: parsed.data.reviewerName,
      reviewDate: date,
      outcome: parsed.data.outcome,
      medicationId: parsed.data.medicationId || null,
      notes: parsed.data.notes ?? undefined,
    },
  });
  return NextResponse.json({ ok: true, id: created.id });
}
