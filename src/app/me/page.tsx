// Member self-profile page. Bento: read-only identity tiles + the phone
// edit form as the primary action.

import { redirect } from "next/navigation";
import { getCurrentMember } from "@/lib/auth";
import { db } from "@/lib/db";
import ShellLayout from "@/components/Layout/ShellLayout";
import { NETWORK_NAV, ADMIN_NAV } from "@/content/navigation";
import { BentoTile, PageHead, Pill } from "@/components/ui/Card";
import { formatAuTime } from "@/lib/format";
import MemberBadge from "@/components/MemberBadge";
import MyDetailsForm from "./form";

export const dynamic = "force-dynamic";

export default async function MyDetailsPage() {
  const viewer = await getCurrentMember();
  if (!viewer) redirect("/login");
  const row = await db.member.findUnique({
    where: { id: viewer.id },
    select: {
      fullName: true,
      shortName: true,
      email: true,
      phone: true,
      relationship: true,
      tier: true,
      profileConfirmedAt: true,
    },
  });
  if (!row) redirect("/login");

  const nav = viewer.tier === "ADMIN" ? ADMIN_NAV : NETWORK_NAV;
  const isConfirmed = row.profileConfirmedAt !== null;

  return (
    <ShellLayout
      nav={nav}
      currentPath="/me"
      viewerTier={viewer.tier}
      viewerName={viewer.shortName ?? viewer.fullName}
    >
      <PageHead
        title="My details"
        sub={
          isConfirmed
            ? "These are your details as they appear to the rest of the network. Edit your phone number any time."
            : "Please confirm your details below before continuing. David will be notified of any later edits."
        }
      />

      <section className="grid grid-cols-1 md:grid-cols-4 auto-rows-[minmax(120px,auto)] gap-4 mb-6">
        {/* Hero: the phone-edit form (the action) */}
        <div className="md:col-span-2 md:row-span-2 ghost-frost p-5 md:p-6 flex flex-col">
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-accent">
            Phone number
          </div>
          <p className="text-[12px] text-ink-soft mt-1 mb-3">
            The only field you can change yourself. {isConfirmed ? "David is notified each time you save." : "Confirm to release the rest of the portal."}
          </p>
          <div className="flex-1">
            <MyDetailsForm initialPhone={row.phone ?? ""} isConfirmed={isConfirmed} />
          </div>
        </div>

        <BentoTile size="square" tone="frost">
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-ink-soft">
            Name
          </div>
          <div className="mt-2 text-[15px] font-semibold">{row.fullName}</div>
        </BentoTile>

        <BentoTile size="square" tone="frost">
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-ink-soft">
            Relationship
          </div>
          <div className="mt-2 text-[15px]">{row.relationship ?? "Not set"}</div>
        </BentoTile>

        <BentoTile size="square" tone="frost">
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-ink-soft">
            Email
          </div>
          <div className="mt-2 text-[14px] break-words">{row.email}</div>
        </BentoTile>

        <BentoTile size="square" tone="frost">
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold text-ink-soft">
            Access tier
          </div>
          <div className="mt-2"><MemberBadge tier={row.tier} /></div>
        </BentoTile>

        <BentoTile size="wide" tone={isConfirmed ? "calm" : "armed"}>
          <div className="text-[11px] uppercase tracking-[0.14em] font-semibold opacity-80">
            Confirmation
          </div>
          <div className="mt-2 text-[14px]">
            {isConfirmed ? (
              <>You confirmed your details on <strong>{formatAuTime(row.profileConfirmedAt!)}</strong>.</>
            ) : (
              <>You have not yet confirmed your details. Phone edit + confirm releases the rest of the portal.</>
            )}
          </div>
        </BentoTile>
      </section>

      <p className="text-[11.5px] text-ink-soft">
        Name, email, relationship and access tier are set by David. If any of these are wrong, tell David directly and he will update them.
      </p>
    </ShellLayout>
  );
}
