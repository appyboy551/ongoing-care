// Onboarding screen 1 of 3: welcome.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function OnboardingWelcome() {
  const viewer = await getCurrentMember();
  if (!viewer) redirect("/login");
  const admin = await db.member.findFirst({
    where: { tier: "ADMIN" },
    select: { shortName: true, fullName: true },
  });
  const adminName = admin?.shortName ?? admin?.fullName ?? "David";
  const memberName = viewer.shortName ?? viewer.fullName;

  return (
    <>
      <div className="text-xs uppercase tracking-wider text-accent mb-2">Welcome</div>
      <h1 className="text-2xl font-bold mb-3">Hi {memberName}.</h1>
      <p className="text-[15px] text-ink mb-4">
        {adminName} has added you to <strong>Ongoing Care</strong>, his private support network portal.
      </p>
      <p className="text-[15px] text-ink mb-4">
        This is a single place where the people closest to {adminName} can coordinate if something happens with his mental health. Most of the time there will be nothing for you to do.
      </p>
      <p className="text-[15px] text-ink mb-6">
        The next few screens explain your role, what you can and cannot see, what emails you will get, and how to change things if something is wrong. Two or three minutes, no decisions to make.
      </p>
      <Link
        href="/onboarding/role"
        className="inline-block bg-accent text-white font-semibold rounded-lg px-5 py-3"
      >
        Continue
      </Link>
    </>
  );
}
