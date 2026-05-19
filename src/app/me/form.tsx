"use client";

import { useState } from "react";

export default function MyDetailsForm({
  initialPhone,
  isConfirmed,
}: {
  initialPhone: string;
  isConfirmed: boolean;
}) {
  const [phone, setPhone] = useState(initialPhone);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const phoneChanged = phone.trim() !== initialPhone.trim();

  async function submit(opts: { confirm: boolean }) {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const body: { phone?: string; confirm?: boolean } = {};
      if (phoneChanged) body.phone = phone.trim();
      if (opts.confirm && !isConfirmed) body.confirm = true;
      if (!body.phone && !body.confirm) {
        setMsg("Nothing to update.");
        setBusy(false);
        return;
      }
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Update failed.");
      if (opts.confirm && !isConfirmed) {
        window.location.reload();
        return;
      }
      setMsg("Saved. David has been notified.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-card border border-line rounded-card-lg p-5">
      <label className="text-xs text-ink-soft uppercase block mb-1">
        Your mobile or contact number
      </label>
      <input
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+61 4XX XXX XXX"
        className="w-full px-3 py-2 rounded-lg border border-line text-[14px]"
        disabled={busy}
        maxLength={30}
      />
      <p className="text-[12px] text-ink-soft mt-2">
        Digits, spaces, +, -, and parentheses only.
      </p>

      <div className="flex gap-2 flex-wrap mt-4">
        {isConfirmed ? (
          <button
            onClick={() => submit({ confirm: false })}
            disabled={busy || !phoneChanged}
            className="bg-accent text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
          >
            {busy ? "Saving..." : "Save changes"}
          </button>
        ) : (
          <button
            onClick={() => submit({ confirm: true })}
            disabled={busy || phone.trim().length < 6}
            className="bg-green text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
          >
            <span aria-hidden="true">✅ </span>
            {busy ? "Confirming..." : "Confirm my details"}
          </button>
        )}
      </div>

      {msg ? <p role="status" aria-live="polite" className="text-[13px] text-green mt-3">{msg}</p> : null}
      {err ? <p role="alert" className="text-[13px] text-red mt-3">{err}</p> : null}
    </div>
  );
}
