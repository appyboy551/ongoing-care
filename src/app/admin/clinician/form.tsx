"use client";

import { useState } from "react";

export default function ClinicianGrantForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [org, setOrg] = useState("");
  const [reason, setReason] = useState("");
  const [hours, setHours] = useState(48);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/clinician/grant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          clinicianName: name,
          clinicianEmail: email,
          clinicianRole: role || null,
          organisation: org || null,
          reason,
          expiresHours: hours,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg("Grant issued. Email sent.");
      setName(""); setEmail(""); setRole(""); setOrg(""); setReason(""); setHours(48);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-ink-soft">Clinician name</span>
          <input required value={name} onChange={(e) => setName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-line" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft">Clinician email</span>
          <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-line" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft">Role (e.g. Psychiatrist)</span>
          <input value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-line" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft">Organisation</span>
          <input value={org} onChange={(e) => setOrg(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-line" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs text-ink-soft">Reason for grant</span>
          <input required value={reason} onChange={(e) => setReason(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-line" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft">Expires in (hours, max 336 = 14 days)</span>
          <input type="number" min={1} max={336} value={hours} onChange={(e) => setHours(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-line" />
        </label>
      </div>
      <button disabled={busy} className="bg-accent text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50">
        {busy ? "Issuing..." : "Issue grant and email clinician"}
      </button>
      {msg ? <p role="status" aria-live="polite" className="text-sm text-ink-soft">{msg}</p> : null}
    </form>
  );
}
