import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentMember } from "@/lib/auth";
import ShellLayout from "@/components/Layout/ShellLayout";
import { ADMIN_NAV } from "@/content/navigation";
import { Card, PageHead, Pill, SectionTitle } from "@/components/ui/Card";
import { NewAdmissionForm, EditAdmissionForm } from "./AdmissionForm";

export const dynamic = "force-dynamic";

function iso(d: Date | null) { return d ? d.toISOString().slice(0, 10) : ""; }

export default async function AdmissionsAdmin() {
  const viewer = await getCurrentMember();
  if (!viewer || viewer.tier !== "ADMIN") redirect("/dashboard");
  const admissions = await db.admission.findMany({ orderBy: { startDate: "desc" } });
  return (
    <ShellLayout nav={ADMIN_NAV} currentPath="/admin/admissions" viewerTier="ADMIN" viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead title="Admissions" sub="Hospital admission history. The most recent 3 surface on the clinician report and Medical page." />
      <section className="mb-6">
        <SectionTitle>Existing admissions</SectionTitle>
        {admissions.length === 0 ? (
          <Card><p className="text-[14px] text-ink-soft">None recorded yet.</p></Card>
        ) : (
          admissions.map((a) => (
            <Card key={a.id}>
              <div className="flex items-start justify-between mb-3 gap-3 flex-wrap">
                <div>
                  <div className="font-bold text-[15px]">{a.hospital}</div>
                  <div className="text-[13px] text-ink-soft">
                    {iso(a.startDate)}{a.endDate ? ` to ${iso(a.endDate)}` : ", ongoing"}
                  </div>
                  {a.reason ? <div className="text-[13px] text-ink mt-2">{a.reason}</div> : null}
                </div>
                <Pill tone={a.voluntary ? "green" : "amber"}>{a.voluntary ? "Voluntary" : "Involuntary"}</Pill>
              </div>
              <details>
                <summary className="cursor-pointer text-[13px] text-accent">Edit</summary>
                <div className="mt-4">
                  <EditAdmissionForm initial={{
                    id: a.id,
                    hospital: a.hospital,
                    startDate: iso(a.startDate),
                    endDate: iso(a.endDate),
                    reason: a.reason ?? "",
                    voluntary: a.voluntary,
                    notes: a.notes ?? "",
                  }} />
                </div>
              </details>
            </Card>
          ))
        )}
      </section>
      <section className="mb-6">
        <SectionTitle>Add a new admission</SectionTitle>
        <Card><NewAdmissionForm /></Card>
      </section>
    </ShellLayout>
  );
}
