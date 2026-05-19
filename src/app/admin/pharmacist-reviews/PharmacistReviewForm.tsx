"use client";

import { useState } from "react";

type MedOption = { id: string; name: string };

export default function PharmacistReviewForm({ medications }: { medications: MedOption[] }) {
  const today = new Date().toISOString().slice(0, 10);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewDate, setReviewDate] = useState(today);
  const [medicationId, setMedicationId] = useState("");
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/admin/pharmacist-reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          reviewerName,
          reviewDate,
          outcome,
          medicationId: medicationId || null,
          notes: notes || null,
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

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">Pharmacist name</span>
          <input value={reviewerName} onChange={(e) => setReviewerName(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" />
        </label>
        <label className="block">
          <span className="text-xs text-ink-soft block mb-1">Review date</span>
          <input type="date" value={reviewDate} onChange={(e) => setReviewDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs text-ink-soft block mb-1">Specific medication (optional, leave blank for full-combination review)</span>
          <select value={medicationId} onChange={(e) => setMedicationId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]">
            <option value="">Whole combination</option>
            {medications.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs text-ink-soft block mb-1">Outcome (one line summary)</span>
          <input value={outcome} onChange={(e) => setOutcome(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" placeholder="No interactions of concern; continue current regime." />
        </label>
        <label className="block md:col-span-2">
          <span className="text-xs text-ink-soft block mb-1">Notes (optional, longer detail)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} className="w-full px-3 py-2 rounded-lg border border-line text-[14px]" />
        </label>
      </div>
      <div className="flex gap-2">
        <button
          onClick={save}
          disabled={busy || !reviewerName.trim() || !reviewDate || !outcome.trim()}
          className="bg-accent text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {busy ? "Saving..." : "Record review"}
        </button>
      </div>
      {err ? <p role="alert" className="text-[13px] text-red">{err}</p> : null}
    </div>
  );
}
