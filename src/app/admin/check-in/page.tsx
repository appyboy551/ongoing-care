// Admin check-in page. Polished so each state (idle, armed, missed) gives
// the right next action and the right amount of information.

import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import ShellLayout from "@/components/Layout/ShellLayout";
import { ADMIN_NAV } from "@/content/navigation";
import { Card, PageHead, Pill, SectionTitle } from "@/components/ui/Card";
import CheckInButton from "@/components/CheckInButton";
import { getActionPlanState } from "@/lib/timer";
import { formatAuTime, hoursAndMinutes } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function CheckIn() {
  const viewer = await getCurrentMember();
  if (!viewer || viewer.tier !== "ADMIN") redirect("/dashboard");
  const state = await getActionPlanState();

  return (
    <ShellLayout nav={ADMIN_NAV} currentPath="/admin/check-in" viewerTier="ADMIN" viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead title="Check in" sub="Tell the network you're okay." />

      <section className="mb-6">
        <SectionTitle>Status</SectionTitle>
        <Card>
          {state.state === "IDLE" ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Pill tone="green">Idle</Pill>
                <span className="text-[14px] text-ink-soft">No active Seroquel log.</span>
              </div>
              <p className="text-[14px] mb-4">
                There is nothing to check in against right now. The network is at rest.
              </p>
              <Link
                href="/admin/log-seroquel"
                className="inline-block bg-card border border-line text-ink-soft hover:text-accent font-semibold text-[14px] rounded-lg px-4 py-2"
              >
                Log a Seroquel dose
              </Link>
            </>
          ) : state.state === "ARMED" ? (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Pill tone="amber">Armed</Pill>
                <span className="text-[14px] text-ink-soft">
                  {hoursAndMinutes(state.hoursRemaining)} until expected check-in
                </span>
              </div>
              <p className="text-[14px] mb-2">
                You logged Seroquel at <strong>{formatAuTime(state.takenAt)}</strong>.
              </p>
              <p className="text-[14px] mb-4 text-ink-soft">
                The network is expecting you to check in by <strong>{formatAuTime(state.expectedCheckInBy)}</strong>. Tapping the button below tells Bron and Joanna you are okay and closes the action plan.
              </p>
              <CheckInButton logId={state.logId} />
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 mb-3">
                <Pill tone="red">Missed</Pill>
                <span className="text-[14px] text-red font-semibold">
                  Overdue by {hoursAndMinutes(state.hoursOverdue)}
                </span>
              </div>
              <p className="text-[14px] mb-2">
                You logged Seroquel at <strong>{formatAuTime(state.takenAt)}</strong> and expected to check in by <strong>{formatAuTime(state.expectedCheckInBy)}</strong>. The window has passed.
              </p>
              <p className="text-[14px] mb-4 text-ink-soft">
                The action plan has been escalated. Check in now if you are okay.
              </p>
              <CheckInButton logId={state.logId} />
            </>
          )}
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle>About your location</SectionTitle>
        <Card>
          <p className="text-[13.5px] text-ink">
            Sharing your location with the check-in is optional. It helps the network reach you if needed. The check-in posts whether you share or not.
          </p>
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle>What checking in does</SectionTitle>
        <Card>
          <ul className="text-[13.5px] text-ink space-y-2 list-disc pl-5">
            <li>Records your check-in time.</li>
            <li>Closes any open case linked to this Seroquel log.</li>
            <li>Sends an email to Bron and Joanna confirming you are okay.</li>
            <li>Resolves any open distressing-call flags.</li>
            <li>Marks the action plan as idle again.</li>
          </ul>
        </Card>
      </section>
    </ShellLayout>
  );
}
