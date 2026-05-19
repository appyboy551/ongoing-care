// Live case detail. Timeline of steps + free-form events. Auto-refreshes.

import { redirect, notFound } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { getCaseById } from "@/lib/cases";
import ShellLayout from "@/components/Layout/ShellLayout";
import { NETWORK_NAV, ADMIN_NAV } from "@/content/navigation";
import { BentoTile, PageHead, Pill } from "@/components/ui/Card";
import { formatAuTime } from "@/lib/format";
import { StepControls, NoteAndClose } from "./controls";
import FirstCaseBanner from "./FirstCaseBanner";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CaseDetail({ params }: { params: { id: string } }) {
  const viewer = await getCurrentMember();
  if (!viewer) redirect("/login");
  const c = await getCaseById(params.id);
  if (!c) notFound();
  const nav = viewer.tier === "ADMIN" ? ADMIN_NAV : NETWORK_NAV;

  const headTone: "armed" | "missed" | "calm" =
    c.status === "OPEN" ? "armed" : c.status === "ESCALATED" ? "missed" : "calm";
  const statusPill =
    c.status === "OPEN" ? "amber" : c.status === "ESCALATED" ? "red" : "green";

  return (
    <ShellLayout
      nav={nav}
      currentPath="/cases"
      viewerTier={viewer.tier}
      viewerName={viewer.shortName ?? viewer.fullName}
    >
      {/* Soft auto-refresh: the page re-renders every 20s while a case is open. */}
      {c.status === "OPEN" ? (
        <meta httpEquiv="refresh" content="20" />
      ) : null}

      <FirstCaseBanner />

      {/* Operational hero: state, timing, status, and police-script CTA. */}
      <section className="grid grid-cols-1 md:grid-cols-4 auto-rows-[minmax(120px,auto)] gap-4 mb-6">
        <BentoTile size="hero" tone={headTone}>
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold opacity-80">
            {c.status === "OPEN" ? "Case open" : c.status === "ESCALATED" ? "Case escalated" : "Case resolved"}
          </div>
          <h1 className="font-bold tracking-tight mt-2 text-[clamp(1.35rem,1.1rem+1.3vw,2rem)] leading-tight">
            {c.title}
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed opacity-85 flex-1">
            Opened {formatAuTime(c.openedAt)}. Last activity {formatAuTime(c.lastActivityAt)}.
            {c.status === "OPEN" ? " This page auto-refreshes every 20 seconds." : ""}
          </p>
          {c.closedAt ? (
            <p className="text-[13px] opacity-75 mt-2">
              Closed {formatAuTime(c.closedAt)}. {c.closedReason ?? ""}
            </p>
          ) : null}
        </BentoTile>

        <BentoTile size="square" tone="frost" className="justify-center text-center">
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-ink-soft">
            Status
          </div>
          <div className="mt-3"><Pill tone={statusPill}>{c.status}</Pill></div>
        </BentoTile>

        <BentoTile size="square" tone="frost" href={`/cases/${c.id}/police-script`} className="justify-center text-center">
          <div className="text-2xl" aria-hidden="true">📄</div>
          <div className="text-[13px] font-semibold text-accent mt-1">Police-script</div>
          <div className="text-[11px] text-ink-soft mt-1">Printable + PDF</div>
        </BentoTile>
      </section>

      <section className="mb-6">
        <div className="text-[13px] font-bold uppercase tracking-wider text-accent mb-3">Step by step</div>
        <div className="ghost-frost p-5 md:p-6">
          <ol className="space-y-4">
            {c.steps.map((s, i) => {
              const tone =
                s.status === "DONE" ? "green" :
                s.status === "ACTIVE" ? "amber" : "neutral";
              const emoji =
                s.status === "DONE" ? "✅" :
                s.status === "ACTIVE" ? "🟡" :
                s.status === "SKIPPED" ? "↪️" :
                s.status === "NA" ? "➖" : "⬜";
              return (
                <li key={s.id} className="border-t border-line/60 pt-4 first:border-t-0 first:pt-0">
                  <div className="flex items-start gap-3">
                    <div className="text-[18px]" aria-hidden="true">{emoji}</div>
                    <div className="flex-1">
                      <div className="font-semibold text-[14.5px]">
                        Step {i + 1}. {s.title}
                      </div>
                      {s.description ? (
                        <div className="text-[13px] text-ink-soft mt-1">{s.description}</div>
                      ) : null}
                      {s.completedAt ? (
                        <div className="text-[12px] text-ink-soft mt-1">
                          {s.status.toLowerCase()} at {formatAuTime(s.completedAt)}
                        </div>
                      ) : null}
                      {s.note ? (
                        <div className="text-[13px] mt-2 bg-bg p-2 rounded border border-line">
                          Note: {s.note}
                        </div>
                      ) : null}
                    </div>
                    <Pill tone={tone}>{s.status}</Pill>
                  </div>
                  {c.status === "OPEN" && (s.status === "ACTIVE" || s.status === "PENDING") ? (
                    <StepControls caseId={c.id} stepId={s.id} />
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <section className="mb-6">
        <div className="text-[13px] font-bold uppercase tracking-wider text-accent mb-3">Activity log</div>
        <div className="ghost-frost p-5 md:p-6">
          {c.events.length === 0 ? (
            <p className="text-[13px] text-ink-soft">No activity yet.</p>
          ) : (
            <ul className="space-y-2 text-[13px]">
              {c.events.map((e) => (
                <li key={e.id}>
                  <span className="text-ink-soft">{formatAuTime(e.createdAt)}. </span>
                  {e.message}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {c.status === "OPEN" ? (
        <NoteAndClose caseId={c.id} canClose={viewer.tier === "ADMIN"} />
      ) : null}
    </ShellLayout>
  );
}
