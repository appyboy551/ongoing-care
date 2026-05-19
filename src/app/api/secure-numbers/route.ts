import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/tier";
import { setSecureNumber } from "@/lib/secure-numbers";

const Body = z.object({
  kind: z.enum([
    "medicare-number",
    "medicare-irn",
    "medicare-valid-to",
    "medibank-membership",
    "medibank-plan",
    "medibank-excess",
  ]),
  value: z.string().min(1).max(200),
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
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  try {
    await setSecureNumber({
      kind: parsed.data.kind,
      value: parsed.data.value,
      actorId: admin.id,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Encryption failed." },
      { status: 500 }
    );
  }
}
