// Clinician arrives here via email link. Token is verified, audited, and the medical report is rendered.

import { db } from "@/lib/db";
import { sha256 } from "@/lib/crypto";
import { writeAudit } from "@/lib/audit";
import { notFound } from "next/navigation";
import { Card, PageHead, Pill, SectionTitle } from "@/components/ui/Card";
import { formatAuTime } from "@/lib/format";
import { getSetting } from "@/lib/settings";
import { getAllNumbers } from "@/lib/secure-numbers";

export default async function ClinicianReport({ params }: { params: { token: string } }) {
  const tokenHash = await sha256(params.token);
  const grant = await db.clinicianAccessGrant.findUnique({ where: { tokenHash } });
  const now = new Date();
  if (!grant || grant.revokedAt || grant.expiresAt < now) {
    notFound();
  }

  await db.clinicianAccessGrant.update({
    where: { id: grant.id },
    data: { lastUsedAt: now },
  });
  await writeAudit({
    kind: "CLINICIAN_GRANT_USED",
    actorLabel: `clinician:${grant.clinicianName}`,
    detail: { grantId: grant.id },
  });

  const meds = await db.medication.findMany({ where: { isActive: true } });
  const team = await db.careTeamMember.findMany({ where: { isCurrent: true } });
  const admissions = await db.admission.findMany({ orderBy: { startDate: "desc" }, take: 3 });
  const last4 = await db.seroquelLog.findMany({ orderBy: { takenAt: "desc" }, take: 4 });
  const insurerName = await getSetting("insurer.name", "");
  const insurerCoverage = await getSetting("insurer.coverage", "");
  const insurerAuthority = await getSetting("insurer.authority", "");
  const guardianship = await getSetting("guardianship.status", "");
  const idFullName = await getSetting("identity.fullName", "Not recorded");
  const idDob = await getSetting("identity.dob", "Not recorded");
  const idAddress = await getSetting("identity.address", "Not recorded");
  const idPhone = await getSetting("identity.phone", "Not recorded");
  const admin = await db.member.findFirst({ where: { tier: "ADMIN" }, select: { email: true } });
  const idEmail = admin?.email ?? "Not recorded";
  const numbers = await getAllNumbers();
  const wishes = await db.contentSection.findUnique({ where: { slug: "statement-of-wishes" } });

  return (
    <div className="min-h-screen p-4 md:p-10 max-w-[900px] mx-auto">
      <PageHead
        title={`Medical report for ${idFullName}`}
        sub={`Time-limited clinician access. Issued to ${grant.clinicianName}. Expires ${formatAuTime(grant.expiresAt)}.`}
      />

      <section className="mb-6">
        <SectionTitle>Identity</SectionTitle>
        <Card>
          <p className="text-[14px]">{idFullName}, DOB {idDob}. Address {idAddress}. Phone {idPhone}. Email {idEmail}.</p>
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle>Insurance and authority</SectionTitle>
        <Card>
          <ul className="text-[14px] space-y-1">
            {insurerName ? <li><strong>Insurer:</strong> {insurerName}{insurerCoverage ? `, ${insurerCoverage}` : ""}</li> : null}
            {insurerAuthority ? <li><strong>Authority on insurer account:</strong> {insurerAuthority}</li> : null}
            {guardianship ? <li><strong>Guardianship status:</strong> {guardianship}</li> : null}
          </ul>
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle>Medicare and Medibank</SectionTitle>
        <Card>
          <div className="grid md:grid-cols-2 gap-6 text-[14px]">
            <div className="space-y-2">
              <div>
                <span className="text-xs text-ink-soft uppercase block mb-1">Medicare number</span>
                <div className="font-mono">{numbers.medicare.number ?? <span className="text-ink-soft">Not on file</span>}</div>
              </div>
              <div>
                <span className="text-xs text-ink-soft uppercase block mb-1">IRN</span>
                <div className="font-mono">{numbers.medicare.irn ?? <span className="text-ink-soft">Not on file</span>}</div>
              </div>
              <div>
                <span className="text-xs text-ink-soft uppercase block mb-1">Valid to</span>
                <div>{numbers.medicare.validTo ?? <span className="text-ink-soft">Not on file</span>}</div>
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-ink-soft uppercase block mb-1">Medibank membership</span>
                <div className="font-mono">{numbers.medibank.membership ?? <span className="text-ink-soft">Not on file</span>}</div>
              </div>
              <div>
                <span className="text-xs text-ink-soft uppercase block mb-1">Plan</span>
                <div>{numbers.medibank.plan ?? <span className="text-ink-soft">Not on file</span>}</div>
              </div>
              <div>
                <span className="text-xs text-ink-soft uppercase block mb-1">Excess</span>
                <div>{numbers.medibank.excess ?? <span className="text-ink-soft">Not on file</span>}</div>
              </div>
            </div>
          </div>
          <p className="text-xs text-ink-soft mt-3">Decrypted for this view. This access is logged in the portal audit log.</p>
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle>Medications</SectionTitle>
        <Card>
          <ul className="text-[14px] space-y-2">
            {meds.map((m) => (
              <li key={m.id}>
                <strong>{m.name}</strong>, {m.dose}, {m.schedule ?? ""}
                {m.notes ? <span className="text-ink-soft">, {m.notes}</span> : null}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle>Recent Seroquel logs (last 4)</SectionTitle>
        <Card>
          {last4.length === 0 ? (
            <p className="text-[14px] text-ink-soft">None logged.</p>
          ) : (
            <ul className="text-[14px] space-y-2">
              {last4.map((l) => (
                <li key={l.id}>
                  {formatAuTime(l.takenAt)}, {l.doseMg}mg, severity {l.severity}
                  {l.checkedInAt ? ", checked in" : ""}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle>Current care team</SectionTitle>
        <Card>
          <ul className="text-[14px] space-y-2">
            {team.map((t) => (
              <li key={t.id}>
                <strong>{t.name}</strong>, {t.role}
                {t.organisation ? `, ${t.organisation}` : ""}
                {t.phone ? `, ${t.phone}` : ""}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle>Admission history</SectionTitle>
        <Card>
          <ul className="text-[14px] space-y-2">
            {admissions.map((a) => (
              <li key={a.id}>
                {a.hospital}, {a.startDate.toISOString().slice(0, 10)}
                {a.endDate ? ` to ${a.endDate.toISOString().slice(0, 10)}` : ", ongoing"}.{" "}
                {a.voluntary ? "Voluntary." : "Involuntary."}
                {a.reason ? <div className="text-ink-soft">{a.reason}</div> : null}
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <section className="mb-6">
        <SectionTitle>Statement of wishes</SectionTitle>
        <Card>
          {wishes?.body ? (
            <div className="text-[14px] whitespace-pre-wrap">{wishes.body}</div>
          ) : (
            <p className="text-[14px] text-ink-soft">No statement of wishes recorded.</p>
          )}
        </Card>
      </section>

      <footer className="text-xs text-ink-soft mt-8">
        <Pill tone="neutral">This is a time-limited, audited view. All access is logged.</Pill>
      </footer>
    </div>
  );
}
