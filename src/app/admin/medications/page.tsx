import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentMember } from "@/lib/auth";
import ShellLayout from "@/components/Layout/ShellLayout";
import { ADMIN_NAV } from "@/content/navigation";
import { Card, PageHead, Pill, SectionTitle } from "@/components/ui/Card";
import { NewMedicationForm, EditMedicationForm } from "./MedicationForm";

export const dynamic = "force-dynamic";

export default async function MedicationsAdmin() {
  const viewer = await getCurrentMember();
  if (!viewer || viewer.tier !== "ADMIN") redirect("/dashboard");
  const meds = await db.medication.findMany({ orderBy: [{ isActive: "desc" }, { name: "asc" }] });
  return (
    <ShellLayout nav={ADMIN_NAV} currentPath="/admin/medications" viewerTier="ADMIN" viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead title="Medications" sub="Active prescriptions and their schedules. Visible per-tier setting." />
      <section className="mb-6">
        <SectionTitle>Existing medications</SectionTitle>
        {meds.length === 0 ? (
          <Card><p className="text-[14px] text-ink-soft">None yet. Add the first below.</p></Card>
        ) : (
          meds.map((m) => (
            <Card key={m.id}>
              <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
                <div>
                  <div className="font-bold text-[15px]">{m.name} <span className="text-ink-soft font-normal">— {m.dose}</span></div>
                  <div className="text-[13px] text-ink-soft">{m.schedule ?? ""}{m.notes ? ` · ${m.notes}` : ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Pill tone={m.isActive ? "green" : "neutral"}>{m.isActive ? "Active" : "Stopped"}</Pill>
                  <Pill tone="neutral">{m.tier}</Pill>
                </div>
              </div>
              <details>
                <summary className="cursor-pointer text-[13px] text-accent">Edit</summary>
                <div className="mt-4">
                  <EditMedicationForm initial={{
                    id: m.id,
                    name: m.name,
                    dose: m.dose,
                    schedule: m.schedule ?? "",
                    notes: m.notes ?? "",
                    tier: m.tier,
                    isActive: m.isActive,
                  }} />
                </div>
              </details>
            </Card>
          ))
        )}
      </section>
      <section className="mb-6">
        <SectionTitle>Add a new medication</SectionTitle>
        <Card><NewMedicationForm /></Card>
      </section>
    </ShellLayout>
  );
}
