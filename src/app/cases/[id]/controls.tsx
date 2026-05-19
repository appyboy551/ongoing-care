"use client";

import { useState } from "react";

function StepControls({ caseId, stepId }: { caseId: string; stepId: string }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);

  async function update(status: "DONE" | "SKIPPED" | "NA") {
    setBusy(status);
    try {
      const res = await fetch(`/api/cases/${caseId}/step`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stepId, status, note: note.trim() || undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed.");
      setBusy(null);
    }
  }

  return (
    <div className="mt-3 pl-9 space-y-2">
      {showNote ? (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={2}
          maxLength={500}
          className="w-full px-3 py-2 rounded-lg border border-line text-[13px]"
          placeholder="Add a short note (who did it, what happened, what next)."
        />
      ) : null}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => update("DONE")}
          disabled={busy !== null}
          className="bg-green text-white text-[13px] font-semibold rounded-lg px-3 py-2 disabled:opacity-50"
        >
          <span aria-hidden="true">✅ </span>
          {busy === "DONE" ? "Saving..." : "Mark done"}
        </button>
        <button
          onClick={() => update("SKIPPED")}
          disabled={busy !== null}
          className="bg-card text-ink-soft text-[13px] font-semibold rounded-lg px-3 py-2 border border-line disabled:opacity-50"
        >
          Skip
        </button>
        <button
          onClick={() => update("NA")}
          disabled={busy !== null}
          className="bg-card text-ink-soft text-[13px] font-semibold rounded-lg px-3 py-2 border border-line disabled:opacity-50"
        >
          Not applicable
        </button>
        <button
          onClick={() => setShowNote((v) => !v)}
          className="text-[13px] text-accent underline"
        >
          {showNote ? "Hide note" : "Add a note"}
        </button>
      </div>
    </div>
  );
}

function NoteAndClose({ caseId, canClose }: { caseId: string; canClose: boolean }) {
  const [note, setNote] = useState("");
  const [resolution, setResolution] = useState("David is safe. Plan closed.");
  const [busy, setBusy] = useState<string | null>(null);

  async function addNote() {
    if (!note.trim()) return;
    setBusy("note");
    try {
      const res = await fetch(`/api/cases/${caseId}/note`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ note: note.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed.");
      setBusy(null);
    }
  }

  async function close(kind: "RESOLVED" | "ESCALATED") {
    if (!resolution.trim()) return;
    if (!window.confirm(`Close this case as ${kind.toLowerCase()}? This signals the network that the case is over.`)) return;
    setBusy(kind);
    try {
      const res = await fetch(`/api/cases/${caseId}/close`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ resolution: resolution.trim(), status: kind }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.reload();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed.");
      setBusy(null);
    }
  }

  return (
    <section className="mb-6">
      <div className="text-[13px] font-bold uppercase tracking-wider text-accent mb-3">
        Add a quick note for the whole network
      </div>
      <div className="bg-card border border-line rounded-card-lg p-5 mb-5">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={800}
          className="w-full px-3 py-2 rounded-lg border border-line text-[14px]"
          placeholder="Tried him on his mobile, no answer. Heading to the apartment now."
        />
        <button
          onClick={addNote}
          disabled={busy !== null || !note.trim()}
          className="mt-3 bg-accent text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {busy === "note" ? "Posting..." : "Post note"}
        </button>
      </div>

      {canClose ? (
        <>
          <div className="text-[13px] font-bold uppercase tracking-wider text-accent mb-3">
            Close this case (admin only)
          </div>
          <div className="bg-card border border-line rounded-card-lg p-5">
            <label className="text-xs text-ink-soft block mb-1">
              How is it closing? One line.
            </label>
            <input
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              maxLength={500}
              className="w-full px-3 py-2 rounded-lg border border-line text-[14px] mb-3"
            />
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => close("RESOLVED")}
                disabled={busy !== null}
                className="bg-green text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
              >
                <span aria-hidden="true">✅ </span>
                {busy === "RESOLVED" ? "Closing..." : "Close as resolved"}
              </button>
              <button
                onClick={() => close("ESCALATED")}
                disabled={busy !== null}
                className="bg-red text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
              >
                <span aria-hidden="true">🚑 </span>
                {busy === "ESCALATED" ? "Closing..." : "Close as escalated to hospital"}
              </button>
            </div>
          </div>
        </>
      ) : (
        <p className="text-[12px] text-ink-soft">
          Only David can formally close a case. The case will close automatically when David checks in.
        </p>
      )}
    </section>
  );
}

export { StepControls, NoteAndClose };
