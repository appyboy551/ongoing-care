// David-only admin dashboard.

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import ShellLayout from "@/components/Layout/ShellLayout";
import { ADMIN_NAV } from "@/content/navigation";
import { Card, Metric, PageHead, Pill, SectionTitle, Warn } from "@/components/ui/Card";
import { getCurrentMember } from "@/lib/auth";
import { getActionPlanState } from "@/lib/timer";
import { getSetting } from "@/lib/settings";
import { formatAuTime, hoursAndMinutes } from "@/lib/format";
import CheckInButton from "@/components/CheckInButton";
import ImpersonationPicker from "./ImpersonationPicker";
import RunEscalationButton from "./RunEscalationButton";
import TestSmsButton from "./TestSmsButton";
import { ensureMonthlyReviewSent } from "@/lib/monthly-review";

export default async function AdminHome() {
  const viewer = await getCurrentMember();
  if (!viewer || viewer.tier !== "ADMIN") redirect("/dashboard");

  // Autonomous monthly review trigger. Fires the email if >30 days since last,
  // otherwise returns immediately. Idempotent via Setting timestamp.
  await ensureMonthlyReviewSent();

  const state = await getActionPlanState();
  const timerHours = await getSetting("seroquel.timer.hours", "14");
  const last4 = await db.seroquelLog.findMany({
    orderBy: { takenAt: "desc" },
    take: 4,
  });
  const flagsOpen = await db.distressingCallFlag.count({ where: { resolvedAt: null } });
  const impersonatableMembers = await db.member.findMany({
    where: { isActive: true, tier: { not: "ADMIN" } },
    select: { id: true, fullName: true, shortName: true, tier: true },
    orderBy: { fullName: "asc" },
  });

  // CrisisTakeover is now mounted in ShellLayout so it surfaces on every
  // page when a case is ESCALATED. No need to invoke from this page.

  return (
    <ShellLayout nav={ADMIN_NAV} currentPath="/admin" viewerTier="ADMIN" viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead title="Admin" sub="Where you log, check in, and manage what your network sees." />

      {state.state === "MISSED" ? (
        <Warn>You missed the check-in. The network can see this. Check in now if you are okay.</Warn>
      ) : null}

      <section className="mb-6">
        <SectionTitle>Right now</SectionTitle>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric
            label="Action plan"
            value={
              <Pill tone={state.state === "IDLE" ? "green" : state.state === "ARMED" ? "amber" : "red"}>
                {state.state === "IDLE" ? "Idle" : state.state === "ARMED" ? "Armed" : "Missed"}
              </Pill>
            }
          />
          <Metric label="Timer (configurable)" value={`${timerHours} h`} />
          <Metric label="Open call flags" value={flagsOpen} />
          <Metric label="Last 4 Seroquel logs" value={last4.length} />
        </div>
      </section>

      {state.state !== "IDLE" ? (
        <section className="mb-6">
          <SectionTitle>Check in</SectionTitle>
          <Card>
            <p className="text-[14px] mb-3">
              You logged Seroquel at {formatAuTime(state.takenAt)}. Expected check-in by{" "}
              {formatAuTime(state.expectedCheckInBy)}.
              {state.state === "ARMED"
                ? ` ${hoursAndMinutes(state.hoursRemaining)} remaining.`
                : ` Overdue by ${hoursAndMinutes(state.hoursOverdue)}.`}
            </p>
            <CheckInButton logId={state.logId} />
          </Card>
        </section>
      ) : null}

      <section className="mb-6">
        <SectionTitle>Quick actions</SectionTitle>
        <div className="grid md:grid-cols-3 gap-3">
          <a
            href="/admin/log-seroquel"
            className="block bg-card border border-line rounded-card-lg p-5"
          >
            <div className="font-bold mb-1">Log Seroquel</div>
            <div className="text-[13px] text-ink-soft">Three-part log. Trigger, context, reflection.</div>
          </a>
          <a
            href="/admin/content"
            className="block bg-card border border-line rounded-card-lg p-5"
          >
            <div className="font-bold mb-1">Edit and publish content</div>
            <div className="text-[13px] text-ink-soft">Draft, sign off, then publish to the network.</div>
          </a>
          <a
            href="/admin/clinician"
            className="block bg-card border border-line rounded-card-lg p-5"
          >
            <div className="font-bold mb-1">Issue clinician access</div>
            <div className="text-[13px] text-ink-soft">Per-clinician, time-limited, audited.</div>
          </a>
        </div>
      </section>

      <section className="mb-6">
        <SectionTitle>View as a network member</SectionTitle>
        <ImpersonationPicker members={impersonatableMembers} />
      </section>

      <section className="mb-6">
        <SectionTitle>Admin tools</SectionTitle>
        <Card>
          <div className="space-y-4">
            <div>
              <p className="text-[13px] text-ink-soft mb-2">
                <strong className="text-ink">Test SMS.</strong> Sends one SMS to your own phone. Does not email anyone. Use to verify ClickSend is wired correctly.
              </p>
              <TestSmsButton />
            </div>
            <div className="pt-4 border-t border-line">
              <p className="text-[13px] text-ink-soft mb-2">
                <strong className="text-ink">Run missed-check-in escalation.</strong> Forces the cron logic to run now. Sends emails AND SMS to the relevant network members. Only use for a real situation or a planned drill.
              </p>
              <RunEscalationButton />
            </div>
          </div>
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle>Recent Seroquel logs</SectionTitle>
        <Card>
          {last4.length === 0 ? (
            <p className="text-[14px] text-ink-soft">No logs yet.</p>
          ) : (
            <ul className="space-y-2 text-[14px]">
              {last4.map((l) => (
                <li key={l.id}>
                  <strong>{formatAuTime(l.takenAt)}</strong>, {l.doseMg}mg, severity {l.severity}
                  {l.checkedInAt ? ", checked in" : l.expectedCheckInBy < new Date() ? ", missed check-in" : ", awaiting check-in"}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </ShellLayout>
  );
}
