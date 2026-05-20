"use client";

// Three single-tap actions for a network member who has been paged. Posts to
// /api/cases/[id]/respond which writes a CaseEvent the cron treats as
// "engagement" and uses to suppress second-tier escalation.

import { useState } from "react";

type Action = "REACHED" | "NO_ANSWER" | "CALLING_000";

export default function ResponseButtons({ caseId }: { caseId: string }) {
  const [busy, setBusy] = useState<Action | null>(null);
  const [done, setDone] = useState<Action | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function submit(action: Action) {
    if (action === "CALLING_000") {
      if (!window.confirm("Confirm you are calling 000 right now. The portal will mark the case as escalated.")) return;
    }
    setBusy(action);
    setError(null);
    try {
      const res = await fetch(`/api/cases/${caseId}/respond`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, note: note.trim() || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      setDone(action);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record your response.");
    } finally {
      setBusy(null);
    }
  }

  if (done) {
    const message =
      done === "REACHED" ? "Thank you. The network knows David is reached." :
      done === "NO_ANSWER" ? "Noted. The case will stay live and others will see no answer was received." :
      "Noted. The case is marked escalated. Help is on the way.";
    return (
      <div className="bg-green/10 border border-green/40 rounded-card-lg p-5">
        <div className="text-[14.5px] font-semibold mb-2">
          <span aria-hidden="true">✅ </span>Response recorded
        </div>
        <p className="text-[13.5px] text-ink mb-3">{message}</p>
        <a
          href={`/cases/${caseId}`}
          className="inline-block bg-accent text-white font-semibold rounded-lg px-4 py-2 text-[13px]"
        >
          Open the full case
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label className="block text-[12px] text-ink-soft">
        Optional note (e.g., "David said he is okay, going to bed")
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        maxLength={500}
        className="w-full px-3 py-2 rounded-lg border border-line text-[14px]"
        placeholder="Optional"
      />
      <div className="space-y-2">
        <button
          onClick={() => submit("REACHED")}
          disabled={busy !== null}
          className="w-full bg-green text-white font-semibold rounded-xl px-4 py-4 text-[15px] disabled:opacity-50"
        >
          <span aria-hidden="true">✅ </span>
          {busy === "REACHED" ? "Saving..." : "I have spoken to David"}
        </button>
        <button
          onClick={() => submit("NO_ANSWER")}
          disabled={busy !== null}
          className="w-full bg-amber-100 text-amber-900 border border-amber-300 font-semibold rounded-xl px-4 py-4 text-[15px] disabled:opacity-50"
        >
          <span aria-hidden="true">📞 </span>
          {busy === "NO_ANSWER" ? "Saving..." : "I tried, no answer"}
        </button>
        <button
          onClick={() => submit("CALLING_000")}
          disabled={busy !== null}
          className="w-full bg-red text-white font-semibold rounded-xl px-4 py-4 text-[15px] disabled:opacity-50"
        >
          <span aria-hidden="true">🚑 </span>
          {busy === "CALLING_000" ? "Saving..." : "I am calling 000 now"}
        </button>
      </div>
      {error ? <p className="text-red text-sm">{error}</p> : null}
    </div>
  );
}
