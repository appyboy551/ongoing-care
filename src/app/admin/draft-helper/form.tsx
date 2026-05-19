"use client";

import { useState } from "react";

const INTENTS = [
  { value: "update-current-state", label: "Current state update" },
  { value: "monthly-update", label: "Monthly review update" },
  { value: "note-to-network", label: "Short note to the network" },
  { value: "police-script-context", label: "Police-script context (strip emotion)" },
  { value: "generic-draft", label: "Generic clean-up" },
] as const;

const AUDIENCES = [
  { value: "SHARED", label: "Shared (everyone in the network)" },
  { value: "FULL_MEDICAL", label: "Full Medical (Bron and Joanna)" },
  { value: "ADMIN", label: "Admin (just me)" },
] as const;

export default function DraftHelperForm() {
  const [rawNotes, setRawNotes] = useState("");
  const [audience, setAudience] = useState<typeof AUDIENCES[number]["value"]>("SHARED");
  const [intent, setIntent] = useState<typeof INTENTS[number]["value"]>("update-current-state");
  const [extraDirection, setExtraDirection] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<string | null>(null);
  const [usage, setUsage] = useState<{ inputTokens: number; outputTokens: number; model: string } | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rawNotes.trim()) return;
    setBusy(true);
    setError(null);
    setDraft(null);
    setUsage(null);
    try {
      const res = await fetch("/api/draft-helper", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          rawNotes,
          audience,
          intent,
          extraDirection: extraDirection.trim() || undefined,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error ?? "Failed.");
      setDraft(body.draft);
      setUsage({
        inputTokens: body.inputTokens,
        outputTokens: body.outputTokens,
        model: body.model,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  function copyDraft() {
    if (!draft) return;
    navigator.clipboard?.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="block text-xs text-ink-soft mb-1">Your rough notes</label>
        <textarea
          value={rawNotes}
          onChange={(e) => setRawNotes(e.target.value)}
          rows={8}
          maxLength={4000}
          className="w-full px-3 py-2 rounded-lg border border-line text-[14px] font-sans"
          placeholder="Type whatever comes to mind. Half-sentences are fine. Claude will clean it up."
        />
        <div className="text-[11px] text-ink-soft mt-1 text-right">
          {rawNotes.length} / 4000
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">Audience</span>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value as typeof audience)}
            className="w-full px-3 py-2 rounded-lg border border-line text-[14px] bg-card"
          >
            {AUDIENCES.map((a) => (
              <option key={a.value} value={a.value}>{a.label}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">Intent</span>
          <select
            value={intent}
            onChange={(e) => setIntent(e.target.value as typeof intent)}
            className="w-full px-3 py-2 rounded-lg border border-line text-[14px] bg-card"
          >
            {INTENTS.map((i) => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <label className="block text-xs text-ink-soft mb-1">
          Extra direction (optional)
        </label>
        <input
          value={extraDirection}
          onChange={(e) => setExtraDirection(e.target.value)}
          maxLength={500}
          className="w-full px-3 py-2 rounded-lg border border-line text-[14px]"
          placeholder="e.g., keep it under three sentences, focus on the medication change"
        />
      </div>

      <button
        disabled={busy || !rawNotes.trim()}
        className="bg-accent text-white font-semibold rounded-xl px-5 py-3 disabled:opacity-50"
      >
        {busy ? "Asking Claude..." : "Shape into a draft"}
      </button>

      {error ? <p role="alert" className="text-red text-sm">{error}</p> : null}

      {draft ? (
        <div className="mt-2">
          <div className="text-xs text-ink-soft uppercase tracking-wider mb-2">Suggested draft</div>
          <div className="rounded-card-lg border border-line bg-bg p-4 whitespace-pre-wrap text-[14px] leading-relaxed">
            {draft}
          </div>
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <button
              type="button"
              onClick={copyDraft}
              className="bg-card border border-line text-ink rounded-lg px-3 py-2 text-[13px] font-semibold"
            >
              {copied ? "Copied" : "Copy draft"}
            </button>
            <a
              href="/admin/content"
              className="text-[13px] text-accent underline"
            >
              Paste into a content section
            </a>
            {usage ? (
              <span className="text-[11px] text-ink-soft ml-auto">
                {usage.model}. {usage.inputTokens} in, {usage.outputTokens} out.
              </span>
            ) : null}
          </div>
          <p className="text-[12px] text-ink-soft mt-3">
            AI generated. Review every line before publishing. If anything is wrong, edit it. If anything is risky, throw it away and write it yourself.
          </p>
        </div>
      ) : null}
    </form>
  );
}
