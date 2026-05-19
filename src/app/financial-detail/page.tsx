// Detailed financial breakdown. Bron and Joanna only.

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";
import ShellLayout from "@/components/Layout/ShellLayout";
import { NETWORK_NAV } from "@/content/navigation";
import { Card, PageHead, SectionTitle } from "@/components/ui/Card";
import { canView } from "@/lib/tier";

export default async function FinancialDetail() {
  const viewer = await getCurrentMember();
  if (!viewer) redirect("/login");
  if (!canView(viewer.tier, "FULL_MEDICAL")) redirect("/dashboard");

  const section = await db.contentSection.findUnique({ where: { slug: "financial-status-detail" } });

  return (
    <ShellLayout nav={NETWORK_NAV} currentPath="/financial-detail" viewerTier={viewer.tier} viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead title="Financial detail" sub="Bron and Joanna only." />
      <section>
        <SectionTitle>Detailed breakdown</SectionTitle>
        <Card>
          <pre className="whitespace-pre-wrap text-[14px] font-sans">
            {section?.body ?? "No detail recorded."}
          </pre>
        </Card>
      </section>
    </ShellLayout>
  );
}
