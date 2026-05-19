// Issue a per-clinician time-limited access grant. No shared passcode.

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";
import ShellLayout from "@/components/Layout/ShellLayout";
import { ADMIN_NAV } from "@/content/navigation";
import { Card, PageHead, Pill, SectionTitle } from "@/components/ui/Card";
import ClinicianGrantForm from "./form";
import { formatAuTime } from "@/lib/format";

export default async function ClinicianAdmin() {
  const viewer = await getCurrentMember();
  if (!viewer || viewer.tier !== "ADMIN") redirect("/dashboard");
  const grants = await db.clinicianAccessGrant.findMany({ orderBy: { issuedAt: "desc" } });
  return (
    <ShellLayout nav={ADMIN_NAV} currentPath="/admin/clinician" viewerTier="ADMIN" viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead
        title="Clinician access"
        sub="Per-clinician, time-limited, fully audited. No shared passcode."
      />
      <section className="mb-6">
        <SectionTitle>Issue new grant</SectionTitle>
        <Card>
          <ClinicianGrantForm />
        </Card>
      </section>
      <section>
        <SectionTitle>Existing grants</SectionTitle>
        {grants.length === 0 ? (
          <Card><p className="text-[14px] text-ink-soft">None yet.</p></Card>
        ) : (
          grants.map((g) => {
            const now = new Date();
            const active = !g.revokedAt && g.expiresAt > now;
            return (
              <Card key={g.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold">{g.clinicianName}</div>
                    <div className="text-xs text-ink-soft">
                      {g.clinicianRole ?? ""} {g.organisation ? `, ${g.organisation}` : ""}
                    </div>
                    <div className="text-xs text-ink-soft mt-1">
                      Issued {formatAuTime(g.issuedAt)}, expires {formatAuTime(g.expiresAt)}
                    </div>
                    {g.reason ? (
                      <div className="text-[13px] mt-2">Reason: {g.reason}</div>
                    ) : null}
                    {g.lastUsedAt ? (
                      <div className="text-[13px] mt-1">Last used: {formatAuTime(g.lastUsedAt)}</div>
                    ) : null}
                  </div>
                  <Pill tone={active ? "green" : "neutral"}>{active ? "Active" : g.revokedAt ? "Revoked" : "Expired"}</Pill>
                </div>
              </Card>
            );
          })
        )}
      </section>
    </ShellLayout>
  );
}
