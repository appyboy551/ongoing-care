import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getRealAdminFromSession, setViewMode } from "@/lib/auth";

const Body = z.object({
  mode: z.enum(["admin", "network"]),
});

export async function POST(req: NextRequest) {
  const admin = await getRealAdminFromSession();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  setViewMode(parsed.data.mode);
  return NextResponse.json({ ok: true });
}
