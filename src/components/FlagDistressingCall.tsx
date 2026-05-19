"use client";

import { useState } from "react";

export default function FlagDistressingCall() {
  const [open, setOpen] = useState(false);
  const [context, setContext] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/action-plan/flag-call", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ context: context.trim() || null }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDone(true);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not flag the call.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div role="status" aria-live="polite" className="rounded-card-lg bg-green-bg border border-[#c5e2cf] text-green px-4 py-3 text-sm">
        <span aria-hidden="true">✅ </span>
        Flagged. The no-contact backstop is armed. David, Bron and Joanna have been notified.
      </div>
    );
  }

  const charsLeft = 500 - context.length;

  return (
    <div>
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="bg-amber text-white font-semibold rounded-xl px-5 py-3 w-full md:w-auto"
        >
          <span aria-hidden="true">⚠️ </span>
          Flag a distressing call with David
        </button>
      ) : (
        <form onSubmit={submit} className="rounded-card-lg border border-amber-bg bg-card p-4">
          <label className="block text-xs text-ink-soft mb-2">
            Optional. A sentence about what happened. David, Bron and Joanna will see it.
          </label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="He sounded distressed, struggling to make sense, mentioned feeling unsafe."
            aria-describedby="flag-call-charcount"
            className="w-full px-3 py-2 rounded-lg border border-line mb-1"
          />
          <div id="flag-call-charcount" className="text-[11px] text-ink-soft text-right mb-3">
            {charsLeft} characters left
          </div>
          {error ? <p role="alert" className="text-red text-sm mb-2">{error}</p> : null}
          <div className="flex gap-2 flex-wrap">
            <button
              type="submit"
              disabled={submitting}
              className="bg-amber text-white font-semibold rounded-xl px-4 py-2 disabled:opacity-50"
            >
              {submitting ? "Flagging..." : "Flag it"}
            </button>
            <button
              type="button"
              onClick={() => { setOpen(false); setError(null); }}
              className="bg-card border border-line text-ink-soft hover:text-ink font-semibold rounded-xl px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
