"use client";

import { useState } from "react";

type Entry = {
  id?: string;
  hospital: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD or "" for ongoing
  reason: string;
  voluntary: boolean;
  notes: string;
};

const blank: Entry = {
  hospital: "",
  startDate: "",
  endDate: "",
  reason: "",
  voluntary: true,
  notes: "",
};

export function NewAdmissionForm() { return <Inner mode="create" initial={blank} />; }
export function EditAdmissionForm({ initial }: { initial: Entry }) { return <Inner mode="edit" initial={initial} />; }

function Inner({ mode, initial }: { mode: "create" | "edit"; initial: Entry }) {
  const [entry, setEntry] = useState<Entry>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const url = mode === "create" ? "/api/admin/admissions" : `/api/admin/admissions/${entry.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          hospital: entry.hospital,
          startDate: entry.startDate,
          endDate: entry.endDate || null,
          reason: entry.reason || null,
          voluntary: entry.voluntary,
          notes: entry.notes || null,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Save failed.");
      window.location.reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed.");
      setBusy(false);
    }
  }

  async function remove() {
    if (!entry.id) return;
    if (!window.confirm(`Delete the admission to ${entry.hospital}? This cannot be undone.`)) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/admissions/${entry.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Delete failed.");
      }
      window.location.reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Delete failed.");
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <label className="block md:col-span-2">
          <span className="text-xs text-ink-soft block mb-1">Hospital</span>
          <input value={entry.hospital} onChange={(e) => setEntry({ ...entry, hospital: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" placeholder="St Vincent's Darlinghurst PECC" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">Start date</span>
          <input type="date" value={entry.startDate} onChange={(e) => setEntry({ ...entry, startDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">End date (blank for ongoing)</span>
          <input type="date" value={entry.endDate} onChange={(e) => setEntry({ ...entry, endDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs text-ink-soft block mb-1">Reason / context</span>
          <textarea value={entry.reason} onChange={(e) => setEntry({ ...entry, reason: e.target.value })} rows={3} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" />
        </label>
        <label className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" checked={entry.voluntary} onChange={(e) => setEntry({ ...entry, voluntary: e.target.checked })} />
          <span className="text-[14px]">Voluntary admission</span>
        </label>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={save} disabled={busy || !entry.hospital.trim() || !entry.startDate} className="bg-accent text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50">
          {busy ? "Saving..." : mode === "create" ? "Add admission" : "Save changes"}
        </button>
        {mode === "edit" ? (
          <button onClick={remove} disabled={busy} className="bg-red text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50">Delete</button>
        ) : null}
      </div>
      {err ? <p role="alert" className="text-[13px] text-red">{err}</p> : null}
    </div>
  );
}
