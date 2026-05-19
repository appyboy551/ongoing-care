// Admin: care team management. Add, edit, delete clinicians.

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentMember } from "@/lib/auth";
import ShellLayout from "@/components/Layout/ShellLayout";
import { ADMIN_NAV } from "@/content/navigation";
import { Card, PageHead, Pill, SectionTitle } from "@/components/ui/Card";
import { NewCareTeamForm, EditCareTeamForm } from "./CareTeamForm";

export const dynamic = "force-dynamic";

export default async function CareTeamAdmin() {
  const viewer = await getCurrentMember();
  if (!viewer || viewer.tier !== "ADMIN") redirect("/dashboard");
  const team = await db.careTeamMember.findMany({
    orderBy: [{ isCurrent: "desc" }, { name: "asc" }],
  });

  return (
    <ShellLayout nav={ADMIN_NAV} currentPath="/admin/care-team" viewerTier="ADMIN" viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead
        title="Care team"
        sub="Doctors, psychologists, hospital staff. Visible to FULL_MEDICAL members and to clinicians via grant."
      />

      <section className="mb-6">
        <SectionTitle>Existing care team</SectionTitle>
        {team.length === 0 ? (
          <Card><p className="text-[14px] text-ink-soft">None yet. Add the first member below.</p></Card>
        ) : (
          team.map((t) => (
            <Card key={t.id}>
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <div>
                  <div className="font-bold text-[15px]">{t.name}</div>
                  <div className="text-[13px] text-ink-soft">{t.role}{t.organisation ? `, ${t.organisation}` : ""}</div>
                </div>
                <Pill tone={t.isCurrent ? "green" : "neutral"}>{t.isCurrent ? "Current" : "Past"}</Pill>
              </div>
              <details>
                <summary className="cursor-pointer text-[13px] text-accent">Edit</summary>
                <div className="mt-4">
                  <EditCareTeamForm initial={{
                    id: t.id,
                    name: t.name,
                    role: t.role,
                    organisation: t.organisation ?? "",
                    phone: t.phone ?? "",
                    address: t.address ?? "",
                    notes: t.notes ?? "",
                    isCurrent: t.isCurrent,
                  }} />
                </div>
              </details>
            </Card>
          ))
        )}
      </section>

      <section className="mb-6">
        <SectionTitle>Add a new care team member</SectionTitle>
        <Card>
          <NewCareTeamForm />
        </Card>
      </section>
    </ShellLayout>
  );
}
