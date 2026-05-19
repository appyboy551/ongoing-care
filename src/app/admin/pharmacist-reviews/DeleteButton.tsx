"use client";

import { useState } from "react";

export default function DeleteButton({ id, label }: { id: string; label: string }) {
  const [busy, setBusy] = useState(false);
  async function go() {
    if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/pharmacist-reviews/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      window.location.reload();
    } catch {
      setBusy(false);
    }
  }
  return (
    <button onClick={go} disabled={busy} className="text-[12px] text-red hover:underline disabled:opacity-50">
      {busy ? "Deleting..." : "Delete"}
    </button>
  );
}
