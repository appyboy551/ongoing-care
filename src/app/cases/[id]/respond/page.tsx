// Quick-response page deep-linked from escalation emails and SMS. The whole
// purpose is to let a paged member confirm engagement with one tap so the
// second-tier escalation block does not fire on the next cron tick.
//
// Plain, fast, mobile-first. No nav chrome - this page may be opened on a
// phone notification while the recipient is doing something else.

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { getCurrentMember } from "@/lib/auth";
import { getCaseById } from "@/lib/cases";
import { db } from "@/lib/db";
import { formatAuTime } from "@/lib/format";
import ResponseButtons from "./ResponseButtons";

export const dynamic = "force-dynamic";

export default async function CaseRespond({ params }: { params: { id: string } }) {
  const viewer = await getCurrentMember();
  if (!viewer) redirect(`/login?next=/cases/${params.id}/respond`);
  const c = await getCaseById(params.id);
  if (!c) notFound();

  const admin = await db.member.findFirst({ where: { tier: "ADMIN" } });
  const adminName = admin?.shortName ?? admin?.fullName ?? "David";
  const adminPhone = admin?.phone ?? null;
  const keyHolders = await db.member.findMany({
    where: { isFrontDoorKeyHolder: true, isActive: true },
    select: { fullName: true, shortName: true, phone: true },
  });

  return (
    <main className="min-h-screen bg-bg px-4 py-6">
      <div className="mx-auto max-w-md">
        <div className="mb-5">
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-red mb-1">
            Action plan is live
          </div>
          <h1 className="text-[22px] font-bold tracking-tight">
            {adminName} needs a check-in
          </h1>
          <p className="text-[13.5px] text-ink-soft mt-1">
            {c.title}. Escalated at {formatAuTime(c.lastActivityAt)}.
          </p>
        </div>

        <div className="bg-card border border-line rounded-card-lg p-4 mb-4">
          <div className="text-[12px] uppercase tracking-wide font-semibold text-ink-soft mb-2">
            First action
          </div>
          {adminPhone ? (
            <a
              href={`tel:${adminPhone}`}
              className="block w-full bg-accent text-white font-semibold rounded-xl px-4 py-4 text-[15px] text-center"
            >
              <span aria-hidden="true">📞 </span>
              Call {adminName} on {adminPhone}
            </a>
          ) : (
            <p className="text-[13.5px] text-ink-soft">
              {adminName}'s phone is not on file in the portal.
            </p>
          )}
          {keyHolders.length > 0 ? (
            <p className="text-[12.5px] text-ink-soft mt-3">
              Front-door key holders: {keyHolders.map((k) => `${k.shortName ?? k.fullName}${k.phone ? ` (${k.phone})` : ""}`).join(", ")}
            </p>
          ) : null}
        </div>

        <div className="bg-card border border-line rounded-card-lg p-4 mb-4">
          <div className="text-[12px] uppercase tracking-wide font-semibold text-ink-soft mb-3">
            Tell the network what happened
          </div>
          <ResponseButtons caseId={c.id} />
        </div>

        <div className="text-[12.5px] text-ink-soft text-center">
          <Link href={`/cases/${c.id}`} className="text-accent underline">
            Open the full case page
          </Link>
          {" "}for the activity log, steps, and police-script.
        </div>
      </div>
    </main>
  );
}
