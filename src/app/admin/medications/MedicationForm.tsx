"use client";

import { useState } from "react";

type Entry = {
  id?: string;
  name: string;
  dose: string;
  schedule: string;
  notes: string;
  tier: "ADMIN" | "FULL_MEDICAL" | "SHARED";
  isActive: boolean;
};

const blank: Entry = {
  name: "",
  dose: "",
  schedule: "",
  notes: "",
  tier: "FULL_MEDICAL",
  isActive: true,
};

export function NewMedicationForm() {
  return <Inner mode="create" initial={blank} />;
}

export function EditMedicationForm({ initial }: { initial: Entry }) {
  return <Inner mode="edit" initial={initial} />;
}

function Inner({ mode, initial }: { mode: "create" | "edit"; initial: Entry }) {
  const [entry, setEntry] = useState<Entry>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const url = mode === "create" ? "/api/admin/medications" : `/api/admin/medications/${entry.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: entry.name,
          dose: entry.dose,
          schedule: entry.schedule || null,
          notes: entry.notes || null,
          tier: entry.tier,
          isActive: entry.isActive,
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
    if (!window.confirm(`Delete ${entry.name}? Pharmacist reviews linked to it will be unlinked, not deleted.`)) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/medications/${entry.id}`, { method: "DELETE" });
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
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">Name</span>
          <input value={entry.name} onChange={(e) => setEntry({ ...entry, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" placeholder="Lamotrigine" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">Dose</span>
          <input value={entry.dose} onChange={(e) => setEntry({ ...entry, dose: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" placeholder="125mg" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">Schedule</span>
          <input value={entry.schedule} onChange={(e) => setEntry({ ...entry, schedule: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" placeholder="Daily" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">Visible to tier</span>
          <select value={entry.tier} onChange={(e) => setEntry({ ...entry, tier: e.target.value as Entry["tier"] })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]">
            <option value="FULL_MEDICAL">FULL_MEDICAL (Bron, Joanna)</option>
            <option value="SHARED">SHARED (everyone)</option>
            <option value="ADMIN">ADMIN only</option>
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs text-ink-soft block mb-1">Notes</span>
          <textarea value={entry.notes} onChange={(e) => setEntry({ ...entry, notes: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" />
        </label>
        <label className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" checked={entry.isActive} onChange={(e) => setEntry({ ...entry, isActive: e.target.checked })} />
          <span className="text-[14px]">Currently taking</span>
        </label>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={save} disabled={busy || !entry.name.trim() || !entry.dose.trim()} className="bg-accent text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50">
          {busy ? "Saving..." : mode === "create" ? "Add medication" : "Save changes"}
        </button>
        {mode === "edit" ? (
          <button onClick={remove} disabled={busy} className="bg-red text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50">Delete</button>
        ) : null}
      </div>
      {err ? <p role="alert" className="text-[13px] text-red">{err}</p> : null}
    </div>
  );
}
