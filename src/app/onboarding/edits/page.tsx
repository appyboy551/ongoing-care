// Onboarding: how to change something.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OnboardingEdits() {
  const viewer = await getCurrentMember();
  if (!viewer) redirect("/login");
  const admin = await db.member.findFirst({
    where: { tier: "ADMIN" },
    select: { shortName: true, fullName: true },
  });
  const adminName = admin?.shortName ?? admin?.fullName ?? "David";

  return (
    <>
      <div className="text-xs uppercase tracking-wider text-accent mb-2">Changing things</div>
      <h1 className="text-2xl font-bold mb-3">If something is wrong</h1>
      <p className="text-[15px] text-ink mb-4">
        You can update your <strong>phone number</strong> any time via &quot;My details&quot; in the sidebar. {adminName} gets an email each time you do.
      </p>
      <p className="text-[15px] text-ink mb-4">
        You <strong>cannot</strong> edit your name, email, relationship, or access tier from inside the portal. If any of those are wrong, tell {adminName} directly and he will update them for you.
      </p>
      <p className="text-[15px] text-ink mb-4">
        If you would prefer not to be in this network at all, also tell {adminName}. He can revoke your access in one click; you stop getting emails and lose sign-in. He can reactivate later.
      </p>
      <p className="text-[15px] text-ink mb-6">
        Every action in the portal is recorded in an audit log. {adminName} can see who viewed what and when. This is intentional: anyone holding sensitive information about another person should be accountable.
      </p>
      <div className="flex gap-2">
        <Link
          href="/onboarding/notifications"
          className="inline-block bg-card border border-line text-ink font-semibold rounded-lg px-5 py-3"
        >
          Back
        </Link>
        <Link
          href="/onboarding/done"
          className="inline-block bg-accent text-white font-semibold rounded-lg px-5 py-3"
        >
          Continue
        </Link>
      </div>
    </>
  );
}
