"use client";

import { useState } from "react";

export default function RunEscalationButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run() {
    if (!window.confirm(
      "Run the missed-check-in escalation now? This will fire real emails to the network for any Seroquel log past its timer."
    )) return;
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/admin/run-escalation", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Failed.");
      setMsg(
        `Done. ${data.processedLogs ?? 0} log(s) processed, ${data.escalatedLogs ?? 0} escalated, ${data.emailsSent ?? 0} email(s) sent, ${data.smsSent ?? 0}/${data.smsAttempted ?? 0} SMS sent.`
      );
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={run}
        disabled={busy}
        className="bg-card border border-line text-ink-soft hover:text-accent font-semibold text-[13px] rounded-lg px-3 py-2 disabled:opacity-50"
      >
        {busy ? "Running..." : "Run missed-check-in escalation now"}
      </button>
      {msg ? <p role="status" aria-live="polite" className="text-[12px] text-green mt-2">{msg}</p> : null}
      {err ? <p role="alert" className="text-[12px] text-red mt-2">{err}</p> : null}
    </div>
  );
}
