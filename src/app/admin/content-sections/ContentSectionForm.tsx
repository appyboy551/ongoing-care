"use client";

import { useState } from "react";

type Entry = {
  id?: string;
  slug: string;
  title: string;
  body: string;
  tier: "ADMIN" | "FULL_MEDICAL" | "SHARED";
  isPublished: boolean;
};

const blank: Entry = { slug: "", title: "", body: "", tier: "SHARED", isPublished: false };

export function NewContentSectionForm() { return <Inner mode="create" initial={blank} />; }
export function EditContentSectionForm({ initial }: { initial: Entry }) { return <Inner mode="edit" initial={initial} />; }

function Inner({ mode, initial }: { mode: "create" | "edit"; initial: Entry }) {
  const [entry, setEntry] = useState<Entry>(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const url = mode === "create" ? "/api/admin/content-sections" : `/api/admin/content-sections/${entry.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const payload = mode === "create"
        ? { slug: entry.slug, title: entry.title, body: entry.body, tier: entry.tier, isPublished: entry.isPublished }
        : { title: entry.title, body: entry.body, tier: entry.tier, isPublished: entry.isPublished };
      const res = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
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
    if (!window.confirm(`Delete the section "${entry.title}"? This cannot be undone.`)) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/content-sections/${entry.id}`, { method: "DELETE" });
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
          <span className="text-xs text-ink-soft block mb-1">Slug {mode === "edit" ? "(read-only after create)" : ""}</span>
          <input
            value={entry.slug}
            onChange={(e) => setEntry({ ...entry, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
            disabled={mode === "edit"}
            className="w-full px-3 py-2 rounded-lg border border-line text-[14px] font-mono disabled:bg-bg disabled:text-ink-soft"
            placeholder="statement-of-wishes"
          />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">Title</span>
          <input value={entry.title} onChange={(e) => setEntry({ ...entry, title: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">Visible to tier</span>
          <select value={entry.tier} onChange={(e) => setEntry({ ...entry, tier: e.target.value as Entry["tier"] })} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]">
            <option value="SHARED">SHARED (everyone)</option>
            <option value="FULL_MEDICAL">FULL_MEDICAL (Bron, Joanna)</option>
            <option value="ADMIN">ADMIN only</option>
          </select>
        </label>
        <label className="flex items-center gap-2 mt-6">
          <input type="checkbox" checked={entry.isPublished} onChange={(e) => setEntry({ ...entry, isPublished: e.target.checked })} />
          <span className="text-[14px]">Published (visible to readers)</span>
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs text-ink-soft block mb-1">Body (markdown)</span>
          <textarea value={entry.body} onChange={(e) => setEntry({ ...entry, body: e.target.value })} rows={10} className="w-full px-3 py-2 rounded-lg border border-line text-[14px] font-mono" />
        </label>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button onClick={save} disabled={busy || !entry.slug.trim() || !entry.title.trim() || !entry.body.trim()} className="bg-accent text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50">
          {busy ? "Saving..." : mode === "create" ? "Add section" : "Save changes"}
        </button>
        {mode === "edit" ? (
          <button onClick={remove} disabled={busy} className="bg-red text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50">Delete</button>
        ) : null}
      </div>
      {err ? <p role="alert" className="text-[13px] text-red">{err}</p> : null}
    </div>
  );
}
