// Admin: programs management. ACON, The Way Back, SPOT, etc.

import { redirect } from "next/navigation";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentMember } from "@/lib/auth";
import ShellLayout from "@/components/Layout/ShellLayout";
import { ADMIN_NAV } from "@/content/navigation";
import { Card, PageHead, Pill, SectionTitle } from "@/components/ui/Card";
import { NewProgramForm, EditProgramForm } from "./ProgramForm";

export const dynamic = "force-dynamic";

// Programs list is the same for every admin session. Write routes call
// revalidateTag("programs") for instant invalidation; the TTL is a backstop.
const getPrograms = unstable_cache(
  async () => db.program.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] }),
  ["admin-programs-list-v1"],
  { tags: ["programs"], revalidate: 300 }
);

export default async function ProgramsAdmin() {
  const viewer = await getCurrentMember();
  if (!viewer || viewer.tier !== "ADMIN") redirect("/dashboard");
  const programs = await getPrograms();

  return (
    <ShellLayout nav={ADMIN_NAV} currentPath="/admin/programs" viewerTier="ADMIN" viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead
        title="Programs"
        sub="Peer support and community programs David participates in. Visible to FULL_MEDICAL members and clinicians."
      />

      <section className="mb-6">
        <SectionTitle>Existing programs</SectionTitle>
        {programs.length === 0 ? (
          <Card><p className="text-[14px] text-ink-soft">None yet. Add the first program below.</p></Card>
        ) : (
          programs.map((p) => (
            <Card key={p.id}>
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <div>
                  <div className="font-bold text-[15px]">{p.name}</div>
                  <div className="text-[13px] text-ink-soft">{p.runBy}{p.contactName ? ` · ${p.contactName}` : ""}</div>
                </div>
                <Pill tone={p.isActive ? "green" : "neutral"}>{p.isActive ? "Active" : "Inactive"}</Pill>
              </div>
              <details>
                <summary className="cursor-pointer text-[13px] text-accent">Edit</summary>
                <div className="mt-4">
                  <EditProgramForm initial={{
                    id: p.id,
                    name: p.name,
                    runBy: p.runBy,
                    contactName: p.contactName ?? "",
                    contactEmail: p.contactEmail ?? "",
                    contactPhone: p.contactPhone ?? "",
                    isActive: p.isActive,
                  }} />
                </div>
              </details>
            </Card>
          ))
        )}
      </section>

      <section className="mb-6">
        <SectionTitle>Add a new program</SectionTitle>
        <Card>
          <NewProgramForm />
        </Card>
      </section>
    </ShellLayout>
  );
}
