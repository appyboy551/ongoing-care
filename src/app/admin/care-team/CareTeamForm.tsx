"use client";

import { useState } from "react";

type Entry = {
  id?: string;
  name: string;
  role: string;
  organisation: string;
  phone: string;
  address: string;
  notes: string;
  isCurrent: boolean;
};

const blank: Entry = {
  name: "",
  role: "",
  organisation: "",
  phone: "",
  address: "",
  notes: "",
  isCurrent: true,
};

export function NewCareTeamForm() {
  return <CareTeamFormInner mode="create" initial={blank} />;
}

export function EditCareTeamForm({ initial }: { initial: Entry }) {
  return <CareTeamFormInner mode="edit" initial={initial} />;
}

function CareTeamFormInner({ mode, initial }: { mode: "create" | "edit"; initial: Entry }) {
  const [entry, setEntry] = useState<Entry>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setMsg(null);
    setErr(null);
    try {
      const url = mode === "create" ? "/api/admin/care-team" : `/api/admin/care-team/${entry.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const payload = {
        name: entry.name,
        role: entry.role,
        organisation: entry.organisation || null,
        phone: entry.phone || null,
        address: entry.address || null,
        notes: entry.notes || null,
        isCurrent: entry.isCurrent,
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
    if (!window.confirm(`Delete ${entry.name} from the care team? This cannot be undone.`)) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/care-team/${entry.id}`, { method: "DELETE" });
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
          <input value={entry.name} onChange={(e) => setEntry({ ...entry, name: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" placeholder="Dr Jaquie Smith" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">Role</span>
          <input value={entry.role} onChange={(e) => setEntry({ ...entry, role: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" placeholder="Psychiatrist" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">Organisation</span>
          <input value={entry.organisation} onChange={(e) => setEntry({ ...entry, organisation: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" placeholder="St Vincent's Darlinghurst PECC" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">Phone</span>
          <input value={entry.phone} onChange={(e) => setEntry({ ...entry, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" placeholder="+61 2 ..." />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs text-ink-soft block mb-1">Address</span>
          <input value={entry.address} onChange={(e) => setEntry({ ...entry, address: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs text-ink-soft block mb-1">Notes</span>
          <textarea value={entry.notes} onChange={(e) => setEntry({ ...entry, notes: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" />
        </label>
        <label className="flex items-center gap-2 md:col-span-2">
          <input type="checkbox" checked={entry.isCurrent} onChange={(e) => setEntry({ ...entry, isCurrent: e.target.checked })} />
          <span className="text-[14px]">Currently treating</span>
        </label>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={save}
          disabled={busy || !entry.name.trim() || !entry.role.trim()}
          className="bg-accent text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {busy ? "Saving..." : mode === "create" ? "Add to care team" : "Save changes"}
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
