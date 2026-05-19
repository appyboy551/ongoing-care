// Onboarding: what emails to expect.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OnboardingNotifications() {
  const viewer = await getCurrentMember();
  if (!viewer) redirect("/login");
  const row = await db.member.findUnique({
    where: { id: viewer.id },
    select: { tier: true, isFrontDoorKeyHolder: true },
  });
  if (!row) redirect("/login");
  const admin = await db.member.findFirst({
    where: { tier: "ADMIN" },
    select: { shortName: true, fullName: true },
  });
  const adminName = admin?.shortName ?? admin?.fullName ?? "David";

  // Smart back link: skip action-plan if SHARED non-key-holder.
  const backHref = row.tier === "SHARED" && !row.isFrontDoorKeyHolder
    ? "/onboarding/role"
    : "/onboarding/action-plan";

  return (
    <>
      <div className="text-xs uppercase tracking-wider text-accent mb-2">Emails</div>
      <h1 className="text-2xl font-bold mb-3">What you will get in your inbox</h1>
      <p className="text-[15px] text-ink mb-4">
        Knowing the difference between routine and urgent matters. Here is the full list.
      </p>
      <ul className="text-[14px] text-ink space-y-3 mb-6">
        <li><strong>Seroquel logged.</strong> {adminName} has logged a dose. Action plan armed. Not necessarily urgent. Tells you when check-in is expected.</li>
        <li><strong>Distressing call flagged.</strong> A network member flagged a hard call with {adminName}. The no-contact backstop is now armed.</li>
        <li><strong>Check-in missed.</strong> {adminName} did not check in by the timer. Action plan is live. {row.isFrontDoorKeyHolder ? "You may be needed for a welfare check." : "You do not need to do anything physical."}</li>
        <li><strong>Plan closed.</strong> {adminName} has checked in. Network is safe. {row.tier === "FULL_MEDICAL" ? "Sent to you directly." : "Sent to the full-medical tier; you can see the closed case in the portal."}</li>
        <li><strong>Content updated.</strong> {adminName} has published a change to the care plan content.</li>
      </ul>
      <p className="text-[14px] text-ink-soft mb-6">
        If you keep getting emails you do not want, tell {adminName} and he can adjust your tier or revoke access entirely.
      </p>
      <div className="flex gap-2">
        <Link
          href={backHref}
          className="inline-block bg-card border border-line text-ink font-semibold rounded-lg px-5 py-3"
        >
          Back
        </Link>
        <Link
          href="/onboarding/edits"
          className="inline-block bg-accent text-white font-semibold rounded-lg px-5 py-3"
        >
          Continue
        </Link>
      </div>
    </>
  );
}
