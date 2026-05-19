// Two clearly labelled buttons. Not a chain.
// 000 is the first button. NSW Mental Health Line is the second.

import { COPY } from "@/content/static-copy";

export default function HelpNowButtons() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <a
        href={`tel:${COPY.helpNow.emergencyNumber}`}
        className="block rounded-card-lg p-6 bg-red-bg border border-[#f0c4c4] text-ink"
        aria-label="Call triple zero for immediate danger"
      >
        <div className="text-[11px] font-bold uppercase tracking-wider text-red">
          <span aria-hidden="true">🚨 </span>{COPY.helpNow.emergencyTitle}
        </div>
        <div className="text-3xl font-bold my-2 select-all">{COPY.helpNow.emergencyNumber}</div>
        <p className="text-[14px] text-ink-soft">{COPY.helpNow.emergencyBody}</p>
        <p className="text-[12px] text-ink-soft mt-2">Tap to dial on mobile, or dial manually.</p>
      </a>
      <a
        href={`tel:${COPY.helpNow.supportNumber.replace(/\s/g, "")}`}
        className="block rounded-card-lg p-6 bg-accent-soft border border-[#cfe2ea] text-ink"
        aria-label="Call NSW Mental Health Line for support"
      >
        <div className="text-[11px] font-bold uppercase tracking-wider text-accent">
          <span aria-hidden="true">💬 </span>{COPY.helpNow.supportTitle}
        </div>
        <div className="text-3xl font-bold my-2 select-all">{COPY.helpNow.supportNumber}</div>
        <p className="text-[14px] text-ink-soft">{COPY.helpNow.supportBody}</p>
        <p className="text-[12px] text-ink-soft mt-2">Tap to dial on mobile, or dial manually.</p>
      </a>
    </div>
  );
}
