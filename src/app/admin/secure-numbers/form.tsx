"use client";

import { useState } from "react";

type Field = {
  kind:
    | "medicare-number"
    | "medicare-irn"
    | "medicare-valid-to"
    | "medibank-membership"
    | "medibank-plan"
    | "medibank-excess";
  label: string;
  encrypted: boolean;
  placeholder: string;
};

const FIELDS: Field[] = [
  { kind: "medicare-number", label: "Medicare number", encrypted: true, placeholder: "XXXX XXXXX X" },
  { kind: "medicare-irn", label: "Medicare IRN (position on card)", encrypted: true, placeholder: "1 to 9" },
  { kind: "medicare-valid-to", label: "Medicare valid to", encrypted: false, placeholder: "MMM YYYY" },
  { kind: "medibank-membership", label: "Medibank membership number", encrypted: true, placeholder: "XXXXXXXX" },
  { kind: "medibank-plan", label: "Medibank plan", encrypted: false, placeholder: "Bronze Plus Value Hospital + Healthy Start Extras" },
  { kind: "medibank-excess", label: "Medibank excess", encrypted: false, placeholder: "$750" },
];

export default function SecureNumbersForm() {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [show, setShow] = useState<Record<string, boolean>>({});

  async function save(kind: Field["kind"]) {
    const value = values[kind] ?? "";
    if (!value.trim()) {
      setMsg("Type a value first.");
      return;
    }
    setBusy(kind);
    setMsg(null);
    try {
      const res = await fetch("/api/secure-numbers", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, value: value.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Save failed.");
      }
      setMsg(`Saved ${kind}.`);
      setValues((v) => ({ ...v, [kind]: "" }));
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4">
      {FIELDS.map((f) => (
        <div key={f.kind}>
          <label className="block text-xs text-ink-soft mb-1">
            {f.label}
            {f.encrypted ? (
              <span className="ml-2 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent-soft text-accent">
                Encrypted
              </span>
            ) : null}
          </label>
          <div className="flex gap-2">
            <input
              type={f.encrypted && !show[f.kind] ? "password" : "text"}
              value={values[f.kind] ?? ""}
              onChange={(e) => setValues((v) => ({ ...v, [f.kind]: e.target.value }))}
              placeholder={f.placeholder}
              autoComplete="off"
              className="flex-1 px-3 py-2 rounded-lg border border-line font-mono text-[14px]"
            />
            {f.encrypted ? (
              <button
                type="button"
                onClick={() => setShow((s) => ({ ...s, [f.kind]: !s[f.kind] }))}
                className="bg-card border border-line text-ink-soft px-3 rounded-lg text-[13px]"
                aria-label={show[f.kind] ? "Hide" : "Show"}
              >
                {show[f.kind] ? "Hide" : "Show"}
              </button>
            ) : null}
            <button
              disabled={busy !== null}
              onClick={() => save(f.kind)}
              className="bg-accent text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
            >
              {busy === f.kind ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      ))}
      {msg ? <p className="text-xs text-ink-soft">{msg}</p> : null}
    </div>
  );
}
