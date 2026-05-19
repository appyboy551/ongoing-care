// Append-only audit log, newest first, with kind + actor + date-range filters.

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";
import ShellLayout from "@/components/Layout/ShellLayout";
import { ADMIN_NAV } from "@/content/navigation";
import { Card, PageHead, Pill, SectionTitle } from "@/components/ui/Card";
import { formatAuTime } from "@/lib/format";
import { AuditKind, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

type SearchParams = {
  kind?: string;
  actor?: string;
  from?: string;
  to?: string;
};

const AUDIT_KINDS: AuditKind[] = [
  "LOGIN_OTP_REQUESTED", "LOGIN_OTP_VERIFIED", "LOGIN_OTP_FAILED", "LOGOUT",
  "CONTENT_DRAFT_SAVED", "CONTENT_PUBLISHED",
  "SEROQUEL_LOGGED", "SEROQUEL_CHECKIN", "CHECK_IN_MISSED",
  "DISTRESSING_CALL_FLAGGED", "PLAN_CLOSED",
  "SETTING_CHANGED",
  "CLINICIAN_GRANT_ISSUED", "CLINICIAN_GRANT_USED", "CLINICIAN_GRANT_REVOKED",
  "MEMBER_ACCESS_REVOKED", "MEMBER_PROFILE_CONFIRMED", "MEMBER_PHONE_UPDATED",
  "MEMBER_INVITED", "MEMBER_ONBOARDED",
  "IMPERSONATION_STARTED", "IMPERSONATION_ENDED",
  "PII_VIEW",
];

export default async function AuditPage({ searchParams }: { searchParams: SearchParams }) {
  const viewer = await getCurrentMember();
  if (!viewer || viewer.tier !== "ADMIN") redirect("/dashboard");

  // Build Prisma where clause from search params.
  const where: Prisma.AuditEntryWhereInput = {};
  const kindFilter = searchParams.kind && AUDIT_KINDS.includes(searchParams.kind as AuditKind)
    ? (searchParams.kind as AuditKind)
    : null;
  if (kindFilter) where.kind = kindFilter;

  const actorQuery = searchParams.actor?.trim() ?? "";
  if (actorQuery) {
    where.OR = [
      { actor: { fullName: { contains: actorQuery, mode: "insensitive" } } },
      { actor: { shortName: { contains: actorQuery, mode: "insensitive" } } },
      { actor: { email: { contains: actorQuery, mode: "insensitive" } } },
      { actorLabel: { contains: actorQuery, mode: "insensitive" } },
    ];
  }

  let fromDate: Date | null = null;
  let toDate: Date | null = null;
  if (searchParams.from) {
    const d = new Date(searchParams.from);
    if (!isNaN(d.getTime())) fromDate = d;
  }
  if (searchParams.to) {
    const d = new Date(searchParams.to);
    if (!isNaN(d.getTime())) {
      // Include the whole day if a bare date is passed.
      d.setHours(23, 59, 59, 999);
      toDate = d;
    }
  }
  if (fromDate || toDate) {
    where.createdAt = {};
    if (fromDate) where.createdAt.gte = fromDate;
    if (toDate) where.createdAt.lte = toDate;
  }

  const entries = await db.auditEntry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: true },
  });

  const hasFilter = !!(kindFilter || actorQuery || fromDate || toDate);

  return (
    <ShellLayout nav={ADMIN_NAV} currentPath="/admin/audit" viewerTier="ADMIN" viewerName={viewer.shortName ?? viewer.fullName}>
      <PageHead title="Audit log" sub="Append-only, never edited or deleted. Showing up to 200 most recent matches." />

      <section className="mb-6">
        <SectionTitle>Filters</SectionTitle>
        <Card>
          <form method="get" className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <label className="block">
              <span className="text-xs text-ink-soft block mb-1">Kind</span>
              <select name="kind" defaultValue={kindFilter ?? ""} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]">
                <option value="">All</option>
                {AUDIT_KINDS.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-ink-soft block mb-1">Actor (name or label)</span>
              <input name="actor" defaultValue={actorQuery} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" placeholder="e.g. Bron, system:cron" />
            </label>
            <label className="block">
              <span className="text-xs text-ink-soft block mb-1">From</span>
              <input type="date" name="from" defaultValue={searchParams.from ?? ""} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" />
            </label>
            <label className="block">
              <span className="text-xs text-ink-soft block mb-1">To</span>
              <input type="date" name="to" defaultValue={searchParams.to ?? ""} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" />
            </label>
            <div className="md:col-span-4 flex gap-2 flex-wrap">
              <button type="submit" className="bg-accent text-white font-semibold rounded-lg px-4 py-2 text-[14px]">
                Apply filters
              </button>
              {hasFilter ? (
                <a href="/admin/audit" className="bg-card border border-line text-ink-soft hover:text-accent font-semibold rounded-lg px-4 py-2 text-[14px]">
                  Reset
                </a>
              ) : null}
              <span className="text-[12px] text-ink-soft self-center">
                {hasFilter ? `${entries.length} match${entries.length === 1 ? "" : "es"}` : ""}
              </span>
            </div>
          </form>
        </Card>
      </section>

      <section>
        <SectionTitle>Events</SectionTitle>
        <Card>
          {entries.length === 0 ? (
            <p className="text-[14px] text-ink-soft">
              {hasFilter ? "No events match those filters." : "No events recorded yet."}
            </p>
          ) : (
            <table className="w-full text-[13px]">
              <thead>
                <tr className="text-left text-xs text-accent uppercase">
                  <th className="py-2">When</th>
                  <th>Kind</th>
                  <th>Actor</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-t border-line align-top">
                    <td className="py-2 whitespace-nowrap">{formatAuTime(e.createdAt)}</td>
                    <td><Pill tone="neutral">{e.kind}</Pill></td>
                    <td>{e.actor?.shortName ?? e.actor?.fullName ?? e.actorLabel ?? "system"}</td>
                    <td className="font-mono text-[11.5px]">
                      {e.detail ? JSON.stringify(e.detail) : ""}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </section>
    </ShellLayout>
  );
}
