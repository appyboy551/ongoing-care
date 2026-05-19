"use client";

import { useState } from "react";

type Entry = {
  id?: string;
  name: string;
  runBy: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  isActive: boolean;
};

const blank: Entry = {
  name: "",
  runBy: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
  isActive: true,
};

export function NewProgramForm() {
  return <ProgramFormInner mode="create" initial={blank} />;
}

export function EditProgramForm({ initial }: { initial: Entry }) {
  return <ProgramFormInner mode="edit" initial={initial} />;
}

function ProgramFormInner({ mode, initial }: { mode: "create" | "edit"; initial: Entry }) {
  const [entry, setEntry] = useState<Entry>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const url = mode === "create" ? "/api/admin/programs" : `/api/admin/programs/${entry.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const payload = {
        name: entry.name,
        runBy: entry.runBy,
        contactName: entry.contactName || null,
        contactEmail: entry.contactEmail || null,
        contactPhone: entry.contactPhone || null,
        isActive: entry.isActive,
      };
      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Save failed.");
      setMsg("Saved.");
      window.location.reload();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed.");
      setBusy(false);
    }
  }

  async function remove() {
    if (!entry.id) return;
    if (!window.confirm(`Delete ${entry.name} (${entry.runBy})? This cannot be undone.`)) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/programs/${entry.id}`, { method: "DELETE" });
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
          <span className="text-xs text-ink-soft block mb-1">Program name</span>
          <input value={entry.name} onChange={(e) => setEntry({ ...entry, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" placeholder="Peer Support" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">Run by</span>
          <input value={entry.runBy} onChange={(e) => setEntry({ ...entry, runBy: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" placeholder="ACON" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">Contact name</span>
          <input value={entry.contactName} onChange={(e) => setEntry({ ...entry, contactName: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">Contact email</span>
          <input type="email" value={entry.contactEmail} onChange={(e) => setEntry({ ...entry, contactEmail: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">Contact phone</span>
          <input value={entry.contactPhone} onChange={(e) => setEntry({ ...entry, contactPhone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" />
        </label>
        <label className="flex items-center gap-2 mt-6">
          <input type="checkbox" checked={entry.isActive} onChange={(e) => setEntry({ ...entry, isActive: e.target.checked })} />
          <span className="text-[14px]">Active</span>
        </label>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={save}
          disabled={busy || !entry.name.trim() || !entry.runBy.trim()}
          className="bg-accent text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {busy ? "Saving..." : mode === "create" ? "Add program" : "Save changes"}
        </button>
        {mode === "edit" ? (
          <button
            onClick={remove}
            disabled={busy}
            className="bg-red text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
          >
            Delete
          </button>
        ) : null}
      </div>
      {msg ? <p role="status" aria-live="polite" className="text-[13px] text-green">{msg}</p> : null}
      {err ? <p role="alert" className="text-[13px] text-red">{err}</p> : null}
    </div>
  );
}
