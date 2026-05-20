"use client";

// Shown on the check-in page when an open DistressingCallFlag exists. Lets
// David silence the no-contact backstop without logging Seroquel. Posts to
// /api/action-plan/resolve-flag which is ADMIN-only.

import { useState } from "react";

export default function ClearFlagButton() {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");

  async function clearFlag() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/action-plan/resolve-flag", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note: note.trim() || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.href = "/admin?flagcleared=1";
    } catch (e) {
      setSubmitting(false);
      setError(e instanceof Error ? e.message : "Could not clear the flag.");
    }
  }

  return (
    <div>
      <label className="block text-[12px] text-ink-soft mb-1">
        Optional note (e.g., what helped)
      </label>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional"
        className="w-full px-3 py-2 rounded-lg border border-line mb-3"
        maxLength={500}
      />
      <button
        onClick={clearFlag}
        disabled={submitting}
        className="bg-green text-white font-semibold rounded-xl px-6 py-3 disabled:opacity-50"
        aria-label="Clear flag and tell the network I am okay"
      >
        <span aria-hidden="true">✅ </span>
        {submitting ? "Saving..." : "I'm okay, clear the flag"}
      </button>
      <p className="text-xs text-ink-soft mt-2">
        Tapping this resolves any open distressing-call flag, closes the linked
        case, and emails Bron and Joanna that you are safe.
      </p>
      {error ? <p className="text-red text-sm mt-2">{error}</p> : null}
    </div>
  );
}
