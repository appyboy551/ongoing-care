// Full action plan, visible to Shared tier and above.

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";
import ShellLayout from "@/components/Layout/ShellLayout";
import { NETWORK_NAV } from "@/content/navigation";
import { Card, PageHead, SectionTitle, Step, Warn } from "@/components/ui/Card";
import { COPY } from "@/content/static-copy";

export const dynamic = "force-dynamic";

export default async function ActionPlan() {
  const viewer = await getCurrentMember();
  if (!viewer) redirect("/login");
  const admin = await db.member.findFirst({
    where: { tier: "ADMIN" },
    select: { shortName: true, fullName: true, phone: true },
  });
  const adminName = admin?.shortName ?? admin?.fullName ?? "David";
  const adminPhone = admin?.phone ?? "(phone not on file)";
  return (
    <ShellLayout nav={NETWORK_NAV} currentPath="/action-plan" viewerTier={viewer.tier} viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead
        title="The action plan"
        sub="One situation only: when David may have harmed himself or the network fears for his safety."
      />

      <section className="mb-6">
        <SectionTitle>How this plan starts</SectionTitle>
        <Card>
          <ol className="list-decimal pl-5 space-y-2 text-[14px]">
            <li>David logs that he has taken Seroquel after a distressing call.</li>
            <li>
              Anyone who has a distressing call with David flags it in the portal. Flagging a
              distressing call is what arms the no-contact safety net. It is not optional courtesy.
            </li>
            <li>A distressing call has been flagged and David then goes silent past the no-contact period.</li>
          </ol>
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle>Steps</SectionTitle>
        <Card>
          <Step number={1} title="The distressing call and Seroquel">
            <p>
              David may take Seroquel to settle. Dose: 25mg for a difficult call, 50mg if particularly stressful. He logs the dose and time. Logging emails Bron and Joanna, captures location if permitted, and starts the timer (default 14 hours, configurable).
            </p>
          </Step>
          <Step number={2} title="Check in before the timer expires">
            <p>David updates the portal to confirm he is okay. If he does, the plan closes. If not, move to Step 3.</p>
          </Step>
          <Step number={3} title="Contact David">
            <p>Call {adminName} on {adminPhone}. If he answers and is okay, close the plan. If not, move to Step 4.</p>
          </Step>
          <Step number={4} title="Welfare check">
            <p>{COPY.network.keysHolders}</p>
            <p className="mt-2">If David's last logged location is available, the portal will show it as a starting point only, clearly marked with the timestamp.</p>
            <p className="mt-2">If Shannon or Jackson feels uneasy entering, they can ask police to assist with a welfare check.</p>
            <p className="mt-2">{COPY.network.notLocal}</p>
          </Step>
          <Step number={5} title="If David is not at home">
            <p>Ask attending police for next steps. Follow up with St Vincent's and Prince of Wales Hospitals. Bron and Joanna, as next of kin, can ask for the mental health, acute or PECC wards.</p>
          </Step>
          <Step number={6} title="When David is located">
            <p>The portal sends an automatic update to the whole group with David's status.</p>
          </Step>
          <Step number={7} title="If David needs hospital">
            <p>A full detailed report is produced for the care team, including David's last 4 Seroquel logs and the pattern they show.</p>
          </Step>
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle>Police script</SectionTitle>
        <Card>
          <Warn>{COPY.policeScriptIntro}</Warn>
          <p className="text-[14px]">When the action plan triggers, the portal generates a factual script with David's name, address, the welfare-check purpose, medication and dose, time taken, time last heard from, last known location with timestamp, and that Bron and Joanna are next of kin.</p>
        </Card>
      </section>
    </ShellLayout>
  );
}
