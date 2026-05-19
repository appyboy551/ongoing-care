// Full medical detail. FULL_MEDICAL tier and above.

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";
import ShellLayout from "@/components/Layout/ShellLayout";
import { NETWORK_NAV } from "@/content/navigation";
import { Card, PageHead, Pill, SectionTitle } from "@/components/ui/Card";
import { canView } from "@/lib/tier";
import { COPY } from "@/content/static-copy";
import MedicationInteractions from "@/components/MedicationInteractions";
import { getAllNumbers } from "@/lib/secure-numbers";
import { getSetting } from "@/lib/settings";
import { writeAudit } from "@/lib/audit";
import SecureReveal from "@/components/SecureReveal";

export default async function MedicalPage() {
  const viewer = await getCurrentMember();
  if (!viewer) redirect("/login");
  if (!canView(viewer.tier, "FULL_MEDICAL")) redirect("/dashboard");

  const meds = await db.medication.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  const team = await db.careTeamMember.findMany({ orderBy: { isCurrent: "desc" } });
  const programs = await db.program.findMany({ orderBy: { isActive: "desc" } });
  const admissions = await db.admission.findMany({ orderBy: { startDate: "desc" }, take: 3 });
  const pharmacistReviews = await db.pharmacistReview.findMany({
    orderBy: { reviewDate: "desc" },
    take: 5,
  });
  const numbers = await getAllNumbers();
  const insurerAuthority = await getSetting("insurer.authority", "");
  // Audit that a Full Medical viewer rendered the secure numbers section.
  await writeAudit({
    kind: "PII_VIEW",
    actorId: viewer.id,
    detail: { surface: "/medical", scope: "medicare+medibank" },
  });

  return (
    <ShellLayout nav={NETWORK_NAV} currentPath="/medical" viewerTier={viewer.tier} viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead title="Medical" sub="Full medical information. Full Medical tier only." />

      <section className="mb-6">
        <SectionTitle>Medicare and Medibank</SectionTitle>
        <Card>
          <p className="text-[12px] text-ink-soft mb-4">
            Numbers are encrypted at rest. They show as dots until you click Show. Every reveal is logged in the audit log.
          </p>
          <div className="grid md:grid-cols-2 gap-6 text-[14px]">
            <div className="space-y-3">
              <div>
                <div className="text-xs text-ink-soft uppercase mb-1">Medicare number</div>
                <SecureReveal value={numbers.medicare.number} />
              </div>
              <div>
                <div className="text-xs text-ink-soft uppercase mb-1">IRN (position on card)</div>
                <SecureReveal value={numbers.medicare.irn} />
              </div>
              <div>
                <div className="text-xs text-ink-soft uppercase mb-1">Valid to</div>
                <div>{numbers.medicare.validTo ?? <span className="text-ink-soft">Not set</span>}</div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-xs text-ink-soft uppercase mb-1">Medibank membership</div>
                <SecureReveal value={numbers.medibank.membership} />
              </div>
              <div>
                <div className="text-xs text-ink-soft uppercase mb-1">Plan</div>
                <div>{numbers.medibank.plan ?? <span className="text-ink-soft">Not set</span>}</div>
              </div>
              <div>
                <div className="text-xs text-ink-soft uppercase mb-1">Excess</div>
                <div>{numbers.medibank.excess ?? <span className="text-ink-soft">Not set</span>}</div>
              </div>
            </div>
          </div>
          {insurerAuthority ? (
            <div className="mt-4 pt-4 border-t border-line text-[13px] text-ink-soft">
              <span className="text-xs uppercase tracking-wider text-accent">Authority on file:</span> {insurerAuthority}
            </div>
          ) : null}
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle>Medications</SectionTitle>
        <Card>
          <table className="w-full text-[14px]">
            <thead>
              <tr className="text-left text-xs text-accent uppercase">
                <th className="py-2">Medication</th>
                <th>Dose</th>
                <th>Schedule</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {meds.map((m) => (
                <tr key={m.id} className="border-t border-line align-top">
                  <td className="py-3 font-medium">{m.name}</td>
                  <td>{m.dose}</td>
                  <td>{m.schedule ?? ""}</td>
                  <td>{m.notes ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4">
            <SectionTitle>Pharmacist reviews</SectionTitle>
            {pharmacistReviews.length === 0 ? (
              <p className="text-[14px] text-ink-soft">No pharmacist review has been recorded yet.</p>
            ) : (
              <ul className="text-[14px] space-y-2">
                {pharmacistReviews.map((r) => (
                  <li key={r.id}>
                    <strong>{r.reviewDate.toISOString().slice(0, 10)}</strong>, {r.reviewerName}: {r.outcome}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </section>

      <MedicationInteractions />

      <section className="mb-6">
        <SectionTitle>Care team</SectionTitle>
        <Card>
          <ul className="space-y-3 text-[14px]">
            {team.map((t) => (
              <li key={t.id}>
                <div className="font-medium">
                  {t.name} <Pill tone={t.isCurrent ? "green" : "neutral"}>{t.isCurrent ? "Current" : "Past"}</Pill>
                </div>
                <div className="text-ink-soft">
                  {t.role}
                  {t.organisation ? `, ${t.organisation}` : ""}
                </div>
                {t.phone ? <div className="text-[13px]">{t.phone}</div> : null}
                {t.address ? <div className="text-[13px]">{t.address}</div> : null}
                {t.notes ? <div className="text-[13px] text-ink-soft mt-1">{t.notes}</div> : null}
              </li>
            ))}
          </ul>
          <p className="text-xs text-ink-soft mt-4">{COPY.consent.melbourneClinicians}</p>
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle>Programs</SectionTitle>
        <Card>
          <ul className="space-y-2 text-[14px]">
            {programs.map((p) => (
              <li key={p.id}>
                <strong>{p.name}</strong>, {p.runBy}{" "}
                <Pill tone={p.isActive ? "green" : "neutral"}>{p.isActive ? "Active" : "Inactive"}</Pill>
                <div className="text-ink-soft text-[13px]">
                  {p.contactName ?? ""} {p.contactEmail ? `, ${p.contactEmail}` : ""}{" "}
                  {p.contactPhone ? `, ${p.contactPhone}` : ""}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle>Admission history</SectionTitle>
        <Card>
          <ul className="space-y-3 text-[14px]">
            {admissions.map((a) => (
              <li key={a.id}>
                <div className="font-medium">{a.hospital}</div>
                <div className="text-ink-soft">
                  {a.startDate.toISOString().slice(0, 10)}
                  {a.endDate ? ` to ${a.endDate.toISOString().slice(0, 10)}` : ", ongoing"}
                  . {a.voluntary ? "Voluntary." : "Involuntary."}
                </div>
                {a.reason ? <div className="text-[13px] text-ink-soft mt-1">{a.reason}</div> : null}
              </li>
            ))}
          </ul>
        </Card>
      </section>
    </ShellLayout>
  );
}
