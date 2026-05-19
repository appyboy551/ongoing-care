import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireMember } from "@/lib/tier";
import { addCaseNote } from "@/lib/cases";

const Body = z.object({ note: z.string().min(1).max(800) });

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  let viewer;
  try {
    viewer = await requireMember();
  } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  await addCaseNote({
    caseId: params.id,
    note: parsed.data.note,
    actor: { id: viewer.id, name: viewer.shortName ?? viewer.fullName },
  });
  return NextResponse.json({ ok: true });
}
