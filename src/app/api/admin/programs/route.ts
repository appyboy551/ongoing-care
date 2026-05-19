import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/tier";

const Body = z.object({
  name: z.string().min(1).max(120),
  runBy: z.string().min(1).max(120),
  contactName: z.string().max(120).nullable().optional(),
  contactEmail: z.string().email().max(200).nullable().optional().or(z.literal("")),
  contactPhone: z.string().max(40).nullable().optional(),
  isActive: z.boolean().optional(),
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
  const created = await db.program.create({
    data: {
      name: parsed.data.name,
      runBy: parsed.data.runBy,
      contactName: parsed.data.contactName || null,
      contactEmail: parsed.data.contactEmail || null,
      contactPhone: parsed.data.contactPhone || null,
      isActive: parsed.data.isActive ?? true,
    },
  });
  return NextResponse.json({ ok: true, id: created.id });
}
