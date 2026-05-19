import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/tier";
import { sendEmail } from "@/lib/email";
import { writeAudit } from "@/lib/audit";

const Body = z.object({
  id: z.string(),
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

  const member = await db.member.findUnique({ where: { id: parsed.data.id } });
  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });
  if (!member.isActive) return NextResponse.json({ error: "Member is revoked." }, { status: 400 });
  if (member.tier === "ADMIN") return NextResponse.json({ error: "Cannot invite the admin." }, { status: 400 });

  const appUrl = process.env.APP_URL ?? "http://localhost:3001";
  const adminName = admin.shortName ?? admin.fullName;
  const displayName = member.shortName ?? member.fullName;

  const bodyText =
    `Hi ${displayName},\n\n` +
    `${adminName} has added you to Ongoing Care, his private support network portal.\n\n` +
    `It is a single place where the people closest to him can coordinate if something happens with his mental health. Most of the time there will be nothing for you to do.\n\n` +
    `To sign in, go to ${appUrl} and enter this email address (${member.email}). You will receive a 6-digit code by email each time you sign in. The first time you sign in you will be asked to confirm your phone number, then you are set.\n\n` +
    `If you have any questions, ask ${adminName} directly. If you would prefer not to be in this network, also tell him.\n\n` +
    `Ongoing Care, ${adminName}'s support network portal.\n`;

  const result = await sendEmail({
    kind: "MEMBER_INVITED",
    to: member.email,
    toName: displayName,
    subject: `${adminName} has added you to his support portal`,
    bodyText,
    metadata: { memberId: member.id, invitedBy: admin.id },
  });

  await db.member.update({
    where: { id: member.id },
    data: { invitedAt: new Date() },
  });

  await writeAudit({
    kind: "MEMBER_INVITED",
    actorId: admin.id,
    detail: { memberId: member.id, emailQueued: result.ok },
  });

  return NextResponse.json({ ok: true, emailSent: result.ok });
}
