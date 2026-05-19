// Onboarding: action plan walkthrough. Only shown to key-holders + FULL_MEDICAL.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OnboardingActionPlan() {
  const viewer = await getCurrentMember();
  if (!viewer) redirect("/login");
  const row = await db.member.findUnique({
    where: { id: viewer.id },
    select: { tier: true, isFrontDoorKeyHolder: true },
  });
  if (!row) redirect("/login");
  // SHARED non-key-holders skip this screen.
  if (row.tier === "SHARED" && !row.isFrontDoorKeyHolder) {
    redirect("/onboarding/notifications");
  }
  const admin = await db.member.findFirst({
    where: { tier: "ADMIN" },
    select: { shortName: true, fullName: true, phone: true },
  });
  const adminName = admin?.shortName ?? admin?.fullName ?? "David";

  return (
    <>
      <div className="text-xs uppercase tracking-wider text-accent mb-2">Action plan</div>
      <h1 className="text-2xl font-bold mb-3">What happens if {adminName} goes silent</h1>
      <p className="text-[15px] text-ink mb-4">
        The action plan is the seven steps the network follows if {adminName} logs Seroquel and then does not check in within the timer window (currently 14 hours). You will get an email when it triggers.
      </p>
      <ol className="text-[14px] text-ink space-y-2 mb-6 list-decimal pl-5">
        <li><strong>{adminName} logs Seroquel.</strong> All members are emailed.</li>
        <li><strong>Wait for check-in.</strong> Default 14 hours. If {adminName} checks in, the plan closes here.</li>
        <li><strong>Call {adminName}.</strong> If he answers and is okay, close the case.</li>
        <li><strong>Welfare check at the apartment.</strong> A key-holder visits. Buzz a neighbour to get into the building. If uneasy, request police-assisted welfare check.</li>
        <li><strong>Search hospitals.</strong> If not at home, follow up with St Vincent&apos;s and Prince of Wales mental health, acute, or PECC wards.</li>
        <li><strong>{adminName} located.</strong> Record where, who confirmed, current status. The portal sends a group update.</li>
        <li><strong>Hospital handover (if needed).</strong> A full medical report is generated for the care team.</li>
      </ol>
      <p className="text-[14px] text-ink-soft mb-6">
        You do not need to memorise this. The portal will walk the live case step by step when it happens.
      </p>
      <div className="flex gap-2">
        <Link
          href="/onboarding/role"
          className="inline-block bg-card border border-line text-ink font-semibold rounded-lg px-5 py-3"
        >
          Back
        </Link>
        <Link
          href="/onboarding/notifications"
          className="inline-block bg-accent text-white font-semibold rounded-lg px-5 py-3"
        >
          Continue
        </Link>
      </div>
    </>
  );
}
