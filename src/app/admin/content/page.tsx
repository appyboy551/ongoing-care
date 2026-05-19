// Draft, sign off, publish content sections.

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";
import ShellLayout from "@/components/Layout/ShellLayout";
import { ADMIN_NAV } from "@/content/navigation";
import { Card, PageHead, Pill, SectionTitle } from "@/components/ui/Card";
import ContentDraftForm from "./form";

export default async function ContentAdmin() {
  const viewer = await getCurrentMember();
  if (!viewer || viewer.tier !== "ADMIN") redirect("/dashboard");
  const sections = await db.contentSection.findMany({ orderBy: { title: "asc" } });

  return (
    <ShellLayout nav={ADMIN_NAV} currentPath="/admin/content" viewerTier="ADMIN" viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead title="Content" sub="Draft, sign off, then publish. Nothing reaches the network without your sign-off." />
      <section>
        <SectionTitle>Sections</SectionTitle>
        {sections.map((s) => (
          <Card key={s.id}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-bold">{s.title}</div>
                <div className="text-xs text-ink-soft">slug: {s.slug}</div>
              </div>
              <div className="flex items-center gap-2">
                <Pill tone={s.tier === "SHARED" ? "green" : s.tier === "FULL_MEDICAL" ? "amber" : "neutral"}>
                  {s.tier}
                </Pill>
                <Pill tone={s.isPublished ? "green" : "neutral"}>
                  {s.isPublished ? "Published" : "Draft only"}
                </Pill>
              </div>
            </div>
            <ContentDraftForm id={s.id} initial={s.body} />
          </Card>
        ))}
      </section>
    </ShellLayout>
  );
}
