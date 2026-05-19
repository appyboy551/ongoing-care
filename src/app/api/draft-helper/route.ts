import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/tier";
import { shapeIntoDraft } from "@/lib/claude";
import { writeAudit } from "@/lib/audit";

const Body = z.object({
  rawNotes: z.string().min(1).max(4000),
  audience: z.enum(["SHARED", "FULL_MEDICAL", "ADMIN"]),
  intent: z.enum([
    "update-current-state",
    "monthly-update",
    "note-to-network",
    "police-script-context",
    "generic-draft",
  ]),
  extraDirection: z.string().max(500).optional(),
});

export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", issues: parsed.error.issues }, { status: 400 });
  }
  try {
    const result = await shapeIntoDraft(parsed.data);
    await writeAudit({
      kind: "SETTING_CHANGED", // closest existing kind; semantically: "AI draft generated"
      actorId: admin.id,
      detail: {
        action: "draft-helper",
        audience: parsed.data.audience,
        intent: parsed.data.intent,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        model: result.model,
      },
    });
    return NextResponse.json({
      ok: true,
      draft: result.draft,
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      model: result.model,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Draft generation failed." },
      { status: 500 }
    );
  }
}
