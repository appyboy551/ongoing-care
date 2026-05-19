// Live case list. Open cases first, then resolved.

import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentMember } from "@/lib/auth";
import { listCases } from "@/lib/cases";
import ShellLayout from "@/components/Layout/ShellLayout";
import { NETWORK_NAV, ADMIN_NAV } from "@/content/navigation";
import { Card, PageHead, Pill, SectionTitle } from "@/components/ui/Card";
import { formatAuTime } from "@/lib/format";

export default async function CasesIndex() {
  const viewer = await getCurrentMember();
  if (!viewer) redirect("/login");
  const cases = await listCases();
  const nav = viewer.tier === "ADMIN" ? ADMIN_NAV : NETWORK_NAV;

  return (
    <ShellLayout
      nav={nav}
      currentPath="/cases"
      viewerTier={viewer.tier}
      viewerName={viewer.shortName ?? viewer.fullName}
    >
      <PageHead
        title="Live cases"
        sub="One case per incident. Anyone in the network can update the steps. The page reflects the current state for everyone."
      />
      <section>
        <SectionTitle>Cases</SectionTitle>
        {cases.length === 0 ? (
          <Card>
            <p className="text-[14px]">
              <span aria-hidden="true">🟢 </span>
              No cases. Everything is calm right now.
            </p>
          </Card>
        ) : (
          cases.map((c) => {
            const done = c.steps.filter((s) => s.status === "DONE").length;
            const total = c.steps.length;
            const tone = c.status === "OPEN" ? "amber" : c.status === "ESCALATED" ? "red" : "green";
            const emoji = c.status === "OPEN" ? "🟡" : c.status === "ESCALATED" ? "🔴" : "✅";
            return (
              <Card key={c.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold">
                      <span aria-hidden="true">{emoji} </span>
                      <Link href={`/cases/${c.id}`} className="underline">{c.title}</Link>
                    </div>
                    <div className="text-xs text-ink-soft mt-1">
                      Opened {formatAuTime(c.openedAt)}.{" "}
                      Last activity {formatAuTime(c.lastActivityAt)}.
                    </div>
                    <div className="text-xs text-ink-soft mt-1">
                      Progress: {done} of {total} steps complete.
                    </div>
                  </div>
                  <Pill tone={tone}>{c.status}</Pill>
                </div>
              </Card>
            );
          })
        )}
      </section>
    </ShellLayout>
  );
}
