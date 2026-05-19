import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentMember } from "@/lib/auth";
import ShellLayout from "@/components/Layout/ShellLayout";
import { ADMIN_NAV } from "@/content/navigation";
import { Card, PageHead, Pill, SectionTitle } from "@/components/ui/Card";
import { NewContentSectionForm, EditContentSectionForm } from "./ContentSectionForm";

export const dynamic = "force-dynamic";

export default async function ContentSectionsAdmin() {
  const viewer = await getCurrentMember();
  if (!viewer || viewer.tier !== "ADMIN") redirect("/dashboard");
  const sections = await db.contentSection.findMany({ orderBy: { slug: "asc" } });
  return (
    <ShellLayout nav={ADMIN_NAV} currentPath="/admin/content-sections" viewerTier="ADMIN" viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead title="Content sections" sub="Statement of wishes, action plan copy, what helps, and other published text. Editable inline." />
      <section className="mb-6">
        <SectionTitle>Existing sections</SectionTitle>
        {sections.length === 0 ? (
          <Card><p className="text-[14px] text-ink-soft">None yet. Add the first below.</p></Card>
        ) : (
          sections.map((s) => (
            <Card key={s.id}>
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <div>
                  <div className="font-bold text-[15px]">{s.title}</div>
                  <div className="text-[12px] text-ink-soft font-mono">{s.slug}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone="neutral">{s.tier}</Pill>
                  <Pill tone={s.isPublished ? "green" : "amber"}>{s.isPublished ? "Published" : "Draft"}</Pill>
                </div>
              </div>
              <details>
                <summary className="cursor-pointer text-[13px] text-accent">Edit</summary>
                <div className="mt-4">
                  <EditContentSectionForm initial={{
                    id: s.id,
                    slug: s.slug,
                    title: s.title,
                    body: s.body,
                    tier: s.tier,
                    isPublished: s.isPublished,
                  }} />
                </div>
              </details>
            </Card>
          ))
        )}
      </section>
      <section className="mb-6">
        <SectionTitle>Add a new section</SectionTitle>
        <Card><NewContentSectionForm /></Card>
      </section>
    </ShellLayout>
  );
}
