import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/tier";
import { Tier } from "@prisma/client";

const Body = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, digits, and hyphens."),
  title: z.string().min(1).max(200),
  body: z.string().min(1).max(20000),
  tier: z.enum(["ADMIN", "FULL_MEDICAL", "SHARED"]),
  isPublished: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try { await requireAdmin(); } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  try {
    const created = await db.contentSection.create({
      data: {
        slug: parsed.data.slug,
        title: parsed.data.title,
        body: parsed.data.body,
        tier: parsed.data.tier as Tier,
        isPublished: parsed.data.isPublished ?? false,
      },
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Create failed (slug may already exist)" }, { status: 400 });
  }
}
