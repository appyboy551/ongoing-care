"use client";

// One-time orientation banner shown the first time a member opens a live
// case detail page. Dismissed by tapping the close button; preference
// persists in localStorage per browser. Members never see it again.

import { useEffect, useState } from "react";

const STORAGE_KEY = "ocp_dismissed_first_case_banner";

export default function FirstCaseBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      const dismissed = window.localStorage.getItem(STORAGE_KEY);
      if (!dismissed) setShow(true);
    } catch {
      // localStorage unavailable (private mode etc). Skip the banner.
    }
  }, []);

  if (!show) return null;

  function dismiss() {
    setShow(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // ignore
    }
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-card-lg bg-accent-soft border border-accent text-ink p-4 mb-5 flex items-start gap-3"
    >
      <div className="flex-1">
        <div className="text-[12px] uppercase tracking-wider text-accent font-semibold mb-1">
          What this page does
        </div>
        <p className="text-[14px] mb-1">
          This is a live case. The steps below tell you what to do next. The page auto-refreshes every 20 seconds so the network stays in sync.
        </p>
        <p className="text-[13px] text-ink-soft">
          You can mark a step done, post a note, or print a police-script if needed. Closing the case is admin-only; David can do it once he's safe.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss this orientation"
        className="text-ink-soft hover:text-accent text-[18px] font-bold leading-none px-2 py-1"
      >
        ×
      </button>
    </div>
  );
}
