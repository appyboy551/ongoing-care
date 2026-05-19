"use client";

import { useState } from "react";

export default function TestSmsButton() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const res = await fetch("/api/admin/test-sms", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Failed.");
      setMsg("Sent. Check your phone within ~10 seconds.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        onClick={send}
        disabled={busy}
        className="bg-card border border-line text-ink-soft hover:text-accent font-semibold text-[13px] rounded-lg px-3 py-2 disabled:opacity-50"
      >
        {busy ? "Sending..." : "Send test SMS to my phone"}
      </button>
      {msg ? <p role="status" aria-live="polite" className="text-[12px] text-green mt-2">{msg}</p> : null}
      {err ? <p role="alert" className="text-[12px] text-red mt-2">{err}</p> : null}
    </div>
  );
}
