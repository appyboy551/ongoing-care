import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import {
  getRealAdminFromSession,
  setImpersonationCookie,
  clearImpersonationCookie,
} from "@/lib/auth";
import { writeAudit } from "@/lib/audit";

const StartBody = z.object({
  memberId: z.string(),
});

export async function POST(req: NextRequest) {
  const admin = await getRealAdminFromSession();
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const json = await req.json().catch(() => null);
  const parsed = StartBody.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  if (parsed.data.memberId === admin.id) {
    return NextResponse.json({ error: "Cannot impersonate yourself." }, { status: 400 });
  }

  const target = await db.member.findUnique({ where: { id: parsed.data.memberId } });
  if (!target || !target.isActive) {
    return NextResponse.json({ error: "Member not found or inactive." }, { status: 404 });
  }

  setImpersonationCookie(target.id);

  // Mirror the gate cookies so the admin experiences the same redirects the target would.
  const c = cookies();
  if (target.tier !== "ADMIN" && !target.profileConfirmedAt) {
    c.set("ocp_needs_confirm", "1", { sameSite: "lax", path: "/", maxAge: 60 * 60 });
  } else {
    c.delete("ocp_needs_confirm");
  }
  if (target.tier !== "ADMIN" && !target.onboardingCompletedAt) {
    c.set("ocp_needs_onboarding", "1", { sameSite: "lax", path: "/", maxAge: 60 * 60 });
  } else {
    c.delete("ocp_needs_onboarding");
  }

  await writeAudit({
    kind: "IMPERSONATION_STARTED",
    actorId: admin.id,
    detail: { targetMemberId: target.id, targetTier: target.tier, targetName: target.shortName ?? target.fullName },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  // Stopping impersonation does not require admin verification beyond having an
  // impersonation cookie. Anyone clearing their own cookie is fine.
  const admin = await getRealAdminFromSession();
  clearImpersonationCookie();
  // Clear the mirrored gate cookies so the admin returns to their own (un-gated) state.
  const c = cookies();
  c.delete("ocp_needs_confirm");
  c.delete("ocp_needs_onboarding");
  if (admin) {
    await writeAudit({
      kind: "IMPERSONATION_ENDED",
      actorId: admin.id,
    });
  }
  return NextResponse.json({ ok: true });
}
