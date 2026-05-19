"use client";

// Renders a decrypted number with masking by default. The viewer clicks Show
// to reveal. Useful for Medicare and Medibank numbers on /medical.

import { useState } from "react";

function mask(value: string): string {
  const clean = value.replace(/\s+/g, "");
  if (clean.length <= 4) return "•".repeat(clean.length);
  return "•".repeat(clean.length - 4) + " " + clean.slice(-4);
}

export default function SecureReveal({ value }: { value: string | null }) {
  const [shown, setShown] = useState(false);
  if (!value) return <span className="text-ink-soft">Not set</span>;
  if (value === "[ENCRYPTED, KEY MISMATCH]") {
    return (
      <span className="text-red text-[13px]">
        Encrypted with a different key. Update PORTAL_ENCRYPTION_KEY or re-save.
      </span>
    );
  }
  return (
    <div className="flex items-center gap-2">
      <span className="font-mono text-[14px] tracking-wide">
        {shown ? value : mask(value)}
      </span>
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        className="text-[12px] text-accent underline"
        aria-label={shown ? "Hide" : "Show"}
      >
        {shown ? "Hide" : "Show"}
      </button>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(value);
        }}
        className="text-[12px] text-ink-soft underline"
        aria-label="Copy"
      >
        Copy
      </button>
    </div>
  );
}
