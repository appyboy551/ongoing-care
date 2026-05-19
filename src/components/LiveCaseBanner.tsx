// Persistent banner shown on every signed-in page when a case is open.
// Server component: queries the DB directly, renders nothing when calm.
//
// Why: members won't always go to /cases first. If David is overdue or a
// distressing call has just been flagged, every page should surface that
// clearly. The banner is the portal's safety-net visibility.

import Link from "next/link";
import { formatAuTime } from "@/lib/format";
import { getActiveCase } from "@/lib/active-case";

export default async function LiveCaseBanner() {
  const open = await getActiveCase();
  if (!open) return null;

  const escalated = open.status === "ESCALATED";
  const tone = escalated
    ? {
        bg: "bg-red-bg",
        border: "border-[#f0c4c4]",
        text: "text-red",
        emoji: "🔴",
        label: "Action plan live",
        cta: "Open the case",
      }
    : {
        bg: "bg-amber-bg",
        border: "border-[#f0dca8]",
        text: "text-amber",
        emoji: "🟡",
        label: "A case is open",
        cta: "View the case",
      };

  return (
    <div
      role="status"
      aria-live="polite"
      className={`${tone.bg} ${tone.border} border-b`}
    >
      <Link
        href={`/cases/${open.id}`}
        className="block max-w-[1100px] mx-auto px-4 md:px-10 py-3 flex flex-wrap items-center gap-3"
      >
        <span aria-hidden="true" className="text-[18px]">
          {tone.emoji}
        </span>
        <span className={`text-[12px] font-bold uppercase tracking-wider ${tone.text}`}>
          {tone.label}
        </span>
        <span className="text-[13.5px] text-ink truncate flex-1">
          {open.title}. Last activity {formatAuTime(open.lastActivityAt)}.
        </span>
        <span className={`text-[13px] font-semibold ${tone.text} underline`}>
          {tone.cta}
        </span>
      </Link>
    </div>
  );
}
