// Onboarding screen 3 of 3: completion. Renders a button that finalises onboarding.

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";
import OnboardingDoneButton from "./button";

export const dynamic = "force-dynamic";

export default async function OnboardingDone() {
  const viewer = await getCurrentMember();
  if (!viewer) redirect("/login");
  const admin = await db.member.findFirst({
    where: { tier: "ADMIN" },
    select: { shortName: true, fullName: true },
  });
  const adminName = admin?.shortName ?? admin?.fullName ?? "David";

  return (
    <>
      <div className="text-xs uppercase tracking-wider text-accent mb-2">Done</div>
      <h1 className="text-2xl font-bold mb-3">You&apos;re set</h1>
      <p className="text-[15px] text-ink mb-4">
        The portal is here when you need it. Most of the time you will hear nothing.
      </p>
      <p className="text-[15px] text-ink mb-4">
        You will get an email when {adminName} logs Seroquel, when a case opens, when it closes, or if {adminName} misses a check-in.
      </p>
      <p className="text-[15px] text-ink mb-6">
        Your name, email, relationship and access tier are set by {adminName}. You can update your phone number any time at &quot;My details&quot; in the sidebar. If anything else is wrong, tell {adminName}.
      </p>
      <OnboardingDoneButton />
    </>
  );
}
