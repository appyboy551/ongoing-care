// Onboarding screen 2 of 3: per-tier role explanation.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OnboardingRole() {
  const viewer = await getCurrentMember();
  if (!viewer) redirect("/login");

  // Detect viewer's specific role for tailored copy.
  const row = await db.member.findUnique({
    where: { id: viewer.id },
    select: { tier: true, isFrontDoorKeyHolder: true, relationship: true },
  });
  if (!row) redirect("/login");

  const admin = await db.member.findFirst({
    where: { tier: "ADMIN" },
    select: { shortName: true, fullName: true },
  });
  const adminName = admin?.shortName ?? admin?.fullName ?? "David";

  let title: string;
  let body: React.ReactNode;
  if (row.tier === "FULL_MEDICAL") {
    title = `You have full medical access`;
    body = (
      <>
        <p>You can see everything in the portal, including {adminName}&apos;s medications, care team, admission history, Medicare and Medibank numbers (stored encrypted), and the detailed financial summary.</p>
        <p>You may be asked to be the named contact if {adminName} is unable to consent. {adminName} is working towards formally appointing you as enduring guardian.</p>
        <p>You can flag a distressing call you have had with {adminName}, post notes on a live case, and update your own phone number.</p>
        <p>You cannot formally close a case (admin-only), publish content, or manage clinician access.</p>
      </>
    );
  } else if (row.isFrontDoorKeyHolder) {
    title = `You are a front-door key holder`;
    body = (
      <>
        <p>You hold a front-door key to {adminName}&apos;s apartment. If something happens and {adminName} goes silent past the check-in window, you may be the first physical visit.</p>
        <p>The action plan in the portal tells you exactly what to do at each step. You will get an email if the network needs you.</p>
        <p>You can see the action plan, live cases, support network list, and the &quot;I need help now&quot; hotlines. You can flag a distressing call, post notes on a live case, and update your own phone number.</p>
        <p>You cannot see {adminName}&apos;s medications, care team, or financial detail. Those sit with the full-medical tier (Bron and Joanna).</p>
      </>
    );
  } else {
    title = `You are part of the support network`;
    body = (
      <>
        <p>You will be notified if something happens with {adminName}, but you are not expected to physically respond. Your role is to know what is going on, and to be available.</p>
        <p>You can see the action plan, live cases, support network list, and the &quot;I need help now&quot; hotlines. You can flag a distressing call and update your own phone number.</p>
        <p>You cannot see {adminName}&apos;s medications, care team, or financial detail. Those sit with the full-medical tier (Bron and Joanna).</p>
      </>
    );
  }

  return (
    <>
      <div className="text-xs uppercase tracking-wider text-accent mb-2">Your role</div>
      <h1 className="text-2xl font-bold mb-3">{title}</h1>
      <div className="text-[15px] text-ink space-y-3 mb-6">{body}</div>
      <div className="flex gap-2">
        <Link
          href="/onboarding/welcome"
          className="inline-block bg-card border border-line text-ink font-semibold rounded-lg px-5 py-3"
        >
          Back
        </Link>
        <Link
          href="/onboarding/action-plan"
          className="inline-block bg-accent text-white font-semibold rounded-lg px-5 py-3"
        >
          Continue
        </Link>
      </div>
    </>
  );
}
