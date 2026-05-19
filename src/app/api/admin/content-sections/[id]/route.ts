import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/tier";

const PatchBody = z.object({
  title: z.string().min(1).max(200).optional(),
  body: z.string().min(1).max(20000).optional(),
  tier: z.enum(["ADMIN", "FULL_MEDICAL", "SHARED"]).optional(),
  isPublished: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireAdmin(); } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = PatchBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  const existing = await db.contentSection.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await db.contentSection.update({ where: { id: params.id }, data: parsed.data });
  return NextResponse.json({ ok: true });
}

// Slugs referenced by hardcoded page code. Deleting them breaks the page.
// Edit or unpublish instead. Keep this list in sync with grep of `slug:` in src/app.
const SYSTEM_SLUGS = new Set(["statement-of-wishes", "financial-status-detail"]);

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try { await requireAdmin(); } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const existing = await db.contentSection.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (SYSTEM_SLUGS.has(existing.slug)) {
    return NextResponse.json(
      {
        error: `The section "${existing.slug}" is referenced by built-in pages (clinician grant, financial detail) and cannot be deleted. Edit the body or untick "Published" if you want to hide it from readers.`,
      },
      { status: 400 }
    );
  }
  await db.contentSection.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
