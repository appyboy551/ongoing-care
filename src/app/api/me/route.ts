import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/tier";
import { writeAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { formatAuTime } from "@/lib/format";
import { clearConfirmationGateCookie } from "@/lib/auth";

export async function GET() {
  let me;
  try {
    me = await requireMember();
  } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const row = await db.member.findUnique({
    where: { id: me.id },
    select: {
      id: true,
      fullName: true,
      shortName: true,
      email: true,
      phone: true,
      relationship: true,
      tier: true,
      profileConfirmedAt: true,
    },
  });
  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(row);
}

const Body = z.object({
  phone: z
    .string()
    .trim()
    .min(6, "Phone is too short.")
    .max(30, "Phone is too long.")
    .regex(/^[+0-9 ()-]+$/, "Phone may only contain digits, spaces, +, -, and parentheses.")
    .optional(),
  confirm: z.boolean().optional(),
});

export async function PATCH(req: NextRequest) {
  let me;
  try {
    me = await requireMember();
  } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid payload" }, { status: 400 });
  }
  const { phone, confirm } = parsed.data;
  if (!phone && !confirm) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const before = await db.member.findUnique({
    where: { id: me.id },
    select: { phone: true, profileConfirmedAt: true, shortName: true, fullName: true },
  });
  if (!before) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const phoneChanged = phone !== undefined && phone !== before.phone;
  const newlyConfirmed = confirm === true && before.profileConfirmedAt === null;

  const data: { phone?: string; profileConfirmedAt?: Date } = {};
  if (phoneChanged) data.phone = phone;
  if (confirm === true && before.profileConfirmedAt === null) data.profileConfirmedAt = new Date();

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ ok: true, changed: false });
  }

  await db.member.update({ where: { id: me.id }, data });

  if (newlyConfirmed) {
    await writeAudit({
      kind: "MEMBER_PROFILE_CONFIRMED",
      actorId: me.id,
      detail: { phone: phoneChanged ? "updated at confirmation" : "unchanged" },
    });
    clearConfirmationGateCookie();
  }
  if (phoneChanged) {
    await writeAudit({
      kind: "MEMBER_PHONE_UPDATED",
      actorId: me.id,
      detail: { changed: true },
    });
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const displayName = before.shortName ?? before.fullName;
      await sendEmail({
        kind: "MEMBER_PROFILE_UPDATED",
        to: adminEmail,
        subject: `${displayName} updated their phone number`,
        bodyText:
          `${displayName} updated their phone number in the Ongoing Care portal.\n\n` +
          `Old: ${before.phone ?? "(not set)"}\n` +
          `New: ${phone}\n\n` +
          `Time: ${formatAuTime(new Date())}\n`,
        metadata: { memberId: me.id },
      });
    }
  }

  return NextResponse.json({ ok: true, changed: true });
}
