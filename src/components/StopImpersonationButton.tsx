"use client";

import { useState } from "react";

export default function StopImpersonationButton() {
  const [busy, setBusy] = useState(false);
  async function stop() {
    setBusy(true);
    try {
      await fetch("/api/admin/impersonate", { method: "DELETE" });
      window.location.href = "/admin";
    } catch {
      setBusy(false);
    }
  }
  return (
    <button
      onClick={stop}
      disabled={busy}
      className="bg-white text-amber font-semibold text-[13px] rounded-lg px-3 py-1.5 disabled:opacity-50"
    >
      {busy ? "Stopping..." : "Stop impersonating"}
    </button>
  );
}
