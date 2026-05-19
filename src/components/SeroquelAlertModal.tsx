"use client";

// Phase 0 safety fix. Server-backed dismissal keyed on the dose logId, not
// on the day-count in sessionStorage. A new dose creates a new latest-log
// id and re-arms the alert; the old log stays acknowledged. The CTA
// destination is resolved server-side from the current care-team contacts
// (see src/lib/care-team.ts) and passed in as a prop so this client
// component does not need to query the database.

import { useState } from "react";

type Props = {
  logId: string;
  doseDays: number;
  ctaHref: string;
  ctaLabel: string;
};

export default function SeroquelAlertModal({
  logId,
  doseDays,
  ctaHref,
  ctaLabel,
}: Props) {
  const [open, setOpen] = useState(true);
  const [dismissing, setDismissing] = useState(false);

  if (!open) return null;

  const dismiss = async () => {
    if (dismissing) return;
    setDismissing(true);
    // Optimistic: hide locally first. If the POST fails the next page render
    // re-shows the modal because alertAcknowledgedAt remains null on the log.
    // That is the safer failure mode.
    setOpen(false);
    try {
      await fetch("/api/seroquel/ack-alert", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ logId }),
      });
    } catch (e) {
      // Deliberate no-op beyond logging. See note above.
      console.error("Failed to record alert acknowledgement", e);
    }
  };

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="seroquel-alert-title"
    >
      <div className="modal-card">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-3xl mb-4"
          style={{
            background: "var(--alert-red-soft)",
            color: "var(--alert-red)",
          }}
          aria-hidden="true"
        >
          ⚠️
        </div>
        <h2
          id="seroquel-alert-title"
          className="text-[22px] font-extrabold tracking-tight text-main"
        >
          Doses logged on {doseDays} of the last 7 days
        </h2>
        <p className="text-soft text-[14.5px] mt-2 leading-relaxed">
          A pattern of frequent doses has been detected. Talking to your care
          team about how the week has been is recommended.
        </p>
        <p className="text-soft text-[12.5px] mt-3 leading-relaxed">
          This is a personal coordination tool, not medical advice or an
          emergency service. 000 is always available.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          <a href={ctaHref} className="btn-pill-primary flex-1 text-center">
            {ctaLabel}
          </a>
          <button
            onClick={dismiss}
            disabled={dismissing}
            className="btn-pill-ghost"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
