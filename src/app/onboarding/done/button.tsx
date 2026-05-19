"use client";

import { useState } from "react";

export default function OnboardingDoneButton() {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  async function finish() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/onboarding/complete", { method: "POST" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error ?? "Failed to finish onboarding.");
      }
      window.location.href = "/dashboard";
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed.");
      setBusy(false);
    }
  }
  return (
    <>
      <button
        onClick={finish}
        disabled={busy}
        className="inline-block bg-accent text-white font-semibold rounded-lg px-5 py-3 disabled:opacity-50"
      >
        {busy ? "Finishing..." : "Continue to the portal"}
      </button>
      {err ? <p role="alert" className="text-[13px] text-red mt-3">{err}</p> : null}
    </>
  );
}
