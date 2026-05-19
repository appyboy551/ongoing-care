"use client";

import { useState } from "react";

type Member = {
  id: string;
  fullName: string;
  shortName: string | null;
  tier: "ADMIN" | "FULL_MEDICAL" | "SHARED";
};

export default function ImpersonationPicker({ members }: { members: Member[] }) {
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function start() {
    if (!selected) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ memberId: selected }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to start impersonation.");
      }
      window.location.href = "/dashboard";
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed.");
      setBusy(false);
    }
  }

  return (
    <div className="bg-card border border-line rounded-card-lg p-5">
      <p className="text-[13px] text-ink-soft mb-3">
        See the portal exactly as a network member sees it. Banner stays visible while active. Auto-expires after 1 hour.
      </p>
      <div className="flex gap-2 items-center flex-wrap">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          disabled={busy}
          className="px-3 py-2 rounded-lg border border-line text-[14px] flex-1 min-w-[200px]"
        >
          <option value="">Choose a member...</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.shortName ?? m.fullName} ({m.tier})
            </option>
          ))}
        </select>
        <button
          onClick={start}
          disabled={busy || !selected}
          className="bg-accent text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {busy ? "Starting..." : "View as this member"}
        </button>
      </div>
      {err ? <p role="alert" className="text-[13px] text-red mt-3">{err}</p> : null}
    </div>
  );
}
