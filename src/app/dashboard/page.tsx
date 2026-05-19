// Network member dashboard. Bento layout. Reads top-to-bottom in
// importance order: state hero > flag-call action > help-now > info tiles.

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";
import { getActionPlanState } from "@/lib/timer";
import { getSetting } from "@/lib/settings";
import ShellLayout from "@/components/Layout/ShellLayout";
import { NETWORK_NAV } from "@/content/navigation";
import { BentoTile, PageHead, Pill } from "@/components/ui/Card";
import HelpNowButtons from "@/components/HelpNowButtons";
import FlagDistressingCall from "@/components/FlagDistressingCall";
import MemberBadge from "@/components/MemberBadge";
import { formatAuTime, hoursAndMinutes } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const viewer = await getCurrentMember();
  if (!viewer) redirect("/login");

  // Parallel data fetch. The old serial path made 6 sequential DB roundtrips.
  const [state, financial, insurer, coverage, guardianship, activeFlag, networkPreview] = await Promise.all([
    getActionPlanState(),
    getSetting("financial.status", "Unknown"),
    getSetting("insurer.name", "Unknown"),
    getSetting("insurer.coverage", ""),
    getSetting("guardianship.status", ""),
    db.distressingCallFlag.findFirst({
      where: { resolvedAt: null },
      orderBy: { flaggedAt: "desc" },
      include: { flaggedBy: true },
    }),
    db.member.findMany({
      where: { isActive: true, tier: { not: "ADMIN" } },
      select: { id: true, fullName: true, shortName: true, relationship: true, tier: true },
      orderBy: { fullName: "asc" },
      take: 4,
    }),
  ]);

  // Pre-compute hero variant so the JSX stays declarative.
  const hero =
    state.state === "MISSED"
      ? {
          tone: "missed" as const,
          eyebrow: "Action plan live",
          title: "David is overdue checking in",
          body: `Logged at ${formatAuTime(state.takenAt)}. Expected by ${formatAuTime(
            state.expectedCheckInBy
          )}. Overdue by ${hoursAndMinutes(state.hoursOverdue)}.`,
          cta: { label: "Open the live case", href: "/cases" },
        }
      : state.state === "ARMED"
        ? {
            tone: "armed" as const,
            eyebrow: "Action plan armed",
            title: "David logged Seroquel",
            body: `Logged at ${formatAuTime(state.takenAt)}. Check-in expected by ${formatAuTime(
              state.expectedCheckInBy
            )} (${hoursAndMinutes(state.hoursRemaining)} from now).`,
            cta: { label: "View the case", href: "/cases" },
          }
        : {
            tone: "calm" as const,
            eyebrow: "All calm",
            title: "Nothing live right now",
            body: "The portal will tell you when something changes. You can use the side nav any time.",
            cta: null,
          };

  return (
    <ShellLayout
      nav={NETWORK_NAV}
      currentPath="/dashboard"
      viewerTier={viewer.tier}
      viewerName={viewer.shortName ?? viewer.fullName}
    >
      <PageHead
        title={
          <span className="inline-flex items-center gap-3 flex-wrap">
            <span>Hi, {viewer.shortName ?? viewer.fullName}</span>
            <MemberBadge tier={viewer.tier} />
          </span>
        }
        sub="A quick read of where David is right now."
      />

      {/* Bento grid: 4 cols on md+, single column on mobile.
          Hero is 2x2, action tiles 2x1, info tiles 1x1. */}
      <section className="grid grid-cols-1 md:grid-cols-4 auto-rows-[minmax(140px,auto)] gap-4 mb-6">
        <BentoTile size="hero" tone={hero.tone} href={hero.cta?.href}>
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold opacity-80">
            {hero.eyebrow}
          </div>
          <div className="font-bold mt-2 text-[clamp(1.35rem,1.1rem+1.3vw,2rem)] leading-tight">
            {hero.title}
          </div>
          <p className="mt-3 text-[14px] leading-relaxed opacity-85 flex-1">{hero.body}</p>
          {hero.cta ? (
            <span className="mt-4 inline-block self-start text-[13px] font-semibold underline">
              {hero.cta.label}
            </span>
          ) : null}
        </BentoTile>

        <BentoTile size="wide" tone="frost">
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-accent">
            If you have just had a distressing call with David
          </div>
          <p className="text-[13.5px] text-ink-soft mt-2 mb-3 flex-1">
            Flagging arms the no-contact backstop. If David then goes silent past the timer, the action plan triggers automatically.
          </p>
          <FlagDistressingCall />
        </BentoTile>

        <BentoTile size="wide" tone="frost">
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-accent">
            I need help now
          </div>
          <div className="mt-2 flex-1">
            <HelpNowButtons />
          </div>
        </BentoTile>

        {activeFlag ? (
          <BentoTile size="wide" tone="armed">
            <div className="text-[11px] uppercase tracking-[0.14em] font-semibold opacity-80">
              Backstop armed
            </div>
            <p className="mt-2 text-[14px] leading-relaxed">
              <strong>{activeFlag.flaggedBy.shortName ?? activeFlag.flaggedBy.fullName}</strong> flagged a distressing call at {formatAuTime(activeFlag.flaggedAt)}.
            </p>
          </BentoTile>
        ) : null}

        <BentoTile size="square" tone="frost">
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-ink-soft">
            Insurer
          </div>
          <div className="mt-1 text-[15px] font-bold">{insurer}</div>
          {coverage ? <div className="text-[12px] text-ink-soft mt-1 leading-snug">{coverage}</div> : null}
        </BentoTile>

        <BentoTile size="square" tone="frost">
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-ink-soft">
            Guardianship
          </div>
          <div className="mt-2">
            <Pill tone={guardianship?.includes("Not in place") ? "amber" : "green"}>
              {guardianship?.includes("Not in place") ? "Not in place" : "In place"}
            </Pill>
          </div>
          {guardianship ? <div className="text-[12px] text-ink-soft mt-2 leading-snug">{guardianship}</div> : null}
        </BentoTile>

        <BentoTile size="square" tone="frost">
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-ink-soft">
            Financial
          </div>
          <div className="mt-2">
            <Pill tone={financial === "Stable" ? "green" : financial === "Strained" ? "amber" : "red"}>
              {financial}
            </Pill>
          </div>
        </BentoTile>

        <BentoTile size="square" tone="frost" href="/me" className="justify-center">
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-ink-soft">
            Your details
          </div>
          <div className="mt-2 text-[14px] font-semibold text-accent underline">View / edit</div>
        </BentoTile>

        <BentoTile size="wide" tone="frost" className="md:col-span-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-ink-soft">
              Network
            </div>
            <a href="/network" className="text-[11.5px] font-semibold text-accent hover:underline">
              See all
            </a>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1">
            {networkPreview.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between gap-3 p-3 rounded-xl bg-bg/60 border border-line/60"
              >
                <div className="min-w-0">
                  <div className="text-[14px] font-semibold truncate">
                    {m.shortName ?? m.fullName}
                  </div>
                  {m.relationship ? (
                    <div className="text-[11.5px] text-ink-soft truncate">{m.relationship}</div>
                  ) : null}
                </div>
                <MemberBadge tier={m.tier} />
              </div>
            ))}
          </div>
        </BentoTile>
      </section>

      <p className="text-[11.5px] text-ink-soft">
        Tip: the side nav has everything else. The action plan, support network, medical info, and your own details all live there.
      </p>
    </ShellLayout>
  );
}
