import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireMember } from "@/lib/tier";
import { clearOnboardingGateCookie } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { formatAuTime } from "@/lib/format";

export async function POST() {
  let me;
  try {
    me = await requireMember();
  } catch (e) {
    return e instanceof Response ? e : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await db.member.update({
    where: { id: me.id },
    data: { onboardingCompletedAt: new Date() },
  });
  clearOnboardingGateCookie();

  await writeAudit({
    kind: "MEMBER_ONBOARDED",
    actorId: me.id,
    detail: { tier: me.tier },
  });

  // Notify the admin so they know which members have completed onboarding.
  const adminEmail = process.env.ADMIN_EMAIL;
  if (adminEmail) {
    const displayName = me.shortName ?? me.fullName;
    await sendEmail({
      kind: "MEMBER_ONBOARDED",
      to: adminEmail,
      subject: `${displayName} has completed onboarding`,
      bodyText:
        `${displayName} (${me.tier}) signed in for the first time and finished the onboarding walkthrough.\n\n` +
        `They are now in and will receive notifications.\n\n` +
        `Time: ${formatAuTime(new Date())}\n`,
      metadata: { memberId: me.id },
    });
  }

  return NextResponse.json({ ok: true });
}
