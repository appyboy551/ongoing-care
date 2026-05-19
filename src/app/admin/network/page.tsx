// View and revoke per-member access. Shows invite + onboarding status pills.

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";
import ShellLayout from "@/components/Layout/ShellLayout";
import { ADMIN_NAV } from "@/content/navigation";
import { Card, PageHead, Pill, SectionTitle } from "@/components/ui/Card";
import { formatAuTime } from "@/lib/format";
import MemberBadge from "@/components/MemberBadge";
import NetworkAdminControls from "./controls";

export const dynamic = "force-dynamic";

function statusFor(m: { invitedAt: Date | null; profileConfirmedAt: Date | null; onboardingCompletedAt: Date | null }) {
  if (m.onboardingCompletedAt) return { label: "Onboarded", tone: "green" as const };
  if (m.profileConfirmedAt) return { label: "Confirmed", tone: "green" as const };
  if (m.invitedAt) return { label: "Invited", tone: "amber" as const };
  return { label: "Not invited", tone: "neutral" as const };
}

export default async function NetworkAdmin() {
  const viewer = await getCurrentMember();
  if (!viewer || viewer.tier !== "ADMIN") redirect("/dashboard");
  const members = await db.member.findMany({ orderBy: { fullName: "asc" } });
  return (
    <ShellLayout nav={ADMIN_NAV} currentPath="/admin/network" viewerTier="ADMIN" viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead title="Network" sub="Manage who can sign in and what tier they have." />
      <section>
        <SectionTitle>Members</SectionTitle>
        {members.map((m) => {
          const status = statusFor(m);
          return (
            <Card key={m.id}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-bold">{m.fullName}</div>
                  <div className="text-xs text-ink-soft">{m.email}</div>
                  {m.tier !== "ADMIN" ? (
                    <div className="text-[11px] text-ink-soft mt-1">
                      {m.invitedAt ? `Invited ${formatAuTime(m.invitedAt)}. ` : null}
                      {m.profileConfirmedAt ? `Confirmed ${formatAuTime(m.profileConfirmedAt)}. ` : null}
                      {m.onboardingCompletedAt ? `Onboarded ${formatAuTime(m.onboardingCompletedAt)}.` : null}
                    </div>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Pill tone={m.isActive ? "green" : "neutral"}>{m.isActive ? "Active" : "Revoked"}</Pill>
                  <MemberBadge tier={m.tier} />
                  {m.tier !== "ADMIN" ? <Pill tone={status.tone}>{status.label}</Pill> : null}
                </div>
              </div>
              {m.tier !== "ADMIN" ? <NetworkAdminControls id={m.id} isActive={m.isActive} tier={m.tier} /> : null}
            </Card>
          );
        })}
      </section>
    </ShellLayout>
  );
}
