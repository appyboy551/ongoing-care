"use client";

import { useState } from "react";

const FIELDS = [
  { key: "seroquel.timer.hours", label: "Seroquel timer (hours)", type: "number" },
  { key: "seroquel.sedation.assumption.hours", label: "Assumed sedation duration (hours)", type: "number" },
  { key: "escalation.second-tier.hours", label: "Second-tier escalation delay (hours, default 1)", type: "number" },
  { key: "financial.status", label: "Financial status", type: "select", options: ["Stable", "Strained", "Unstable", "In crisis"] },
  { key: "insurer.name", label: "Insurer name", type: "text" },
  { key: "insurer.coverage", label: "Insurer coverage description", type: "text" },
  { key: "guardianship.status", label: "Guardianship status", type: "text" },
  { key: "blood.type", label: "Blood type", type: "text" },
] as const;

export default function SettingsForm(props: { initial: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(props.initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(key: string, value: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ key, value }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg(`Saved ${key}.`);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {FIELDS.map((f) => (
        <div key={f.key} className="grid md:grid-cols-[1fr_auto] gap-2 items-end">
          <div>
            <label className="block text-xs text-ink-soft mb-1">{f.label}</label>
            {f.type === "select" ? (
              <select
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-line"
              >
                {(f as { options: readonly string[] }).options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={f.type}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-line"
              />
            )}
          </div>
          <button
            disabled={busy}
            onClick={() => save(f.key, values[f.key] ?? "")}
            className="bg-accent text-white rounded-lg px-4 py-2 disabled:opacity-50"
          >
            Save
          </button>
        </div>
      ))}
      {msg ? <p className="text-xs text-ink-soft">{msg}</p> : null}
    </div>
  );
}
