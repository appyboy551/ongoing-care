import { Tier } from "@prisma/client";

export default function MemberBadge({ tier }: { tier: Tier }) {
  if (tier === "ADMIN") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-accent text-white rounded-full text-xs font-bold shadow-sm">
        <span aria-hidden="true" className="text-[10px]">🔑</span>
        ADMIN
      </span>
    );
  }
  if (tier === "FULL_MEDICAL") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 border-2 border-accent text-accent bg-transparent rounded-full text-xs font-bold">
        <span aria-hidden="true" className="text-[10px]">🩺</span>
        MEDICAL
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-bg text-ink-soft border border-line rounded-full text-xs font-bold">
      <span aria-hidden="true" className="text-[10px]">👥</span>
      SHARED
    </span>
  );
}
