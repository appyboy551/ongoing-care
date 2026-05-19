"use client";

// Crisis-mode quick log: a single tap, one confirm prompt, done. Submits the
// minimum required payload (dose + at-home context + severity) so the user does
// not have to navigate the five-section form when they are unwell.
//
// Stressors, emotions, reflection text remain in the full form below for when
// more detail is wanted.

import { useState } from "react";

export default function QuickLogSeroquel() {
  const [busy, setBusy] = useState<25 | 50 | null>(null);
  const [err, setErr] = useState<string | null>(null);

  function getLocationOrNull(): Promise<GeolocationPosition | null> {
    if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 6000, maximumAge: 30_000 }
      );
    });
  }

  async function quickLog(doseMg: 25 | 50) {
    const presetSeverity = doseMg === 25 ? 3 : 4;
    const ok = window.confirm(
      `Quick log ${doseMg}mg, at home, severity ${presetSeverity}. This emails Bron and Joanna and starts the check-in timer. Continue?`
    );
    if (!ok) return;
    setBusy(doseMg);
    setErr(null);
    const loc = await getLocationOrNull();
    const payload = {
      doseMg,
      stressors: [],
      emotions: [],
      inFacility: false,
      facilityName: undefined,
      severity: presetSeverity,
      drivingThis: null,
      whatWouldHelp: null,
      reflectionNote: null,
      location: loc
        ? {
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
            accuracyM: loc.coords.accuracy,
            takenAt: new Date().toISOString(),
          }
        : null,
    };
    try {
      const res = await fetch("/api/seroquel/log", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Could not save the log.");
      }
      window.location.href = "/admin?logged=1";
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save the log.");
      setBusy(null);
    }
  }

  return (
    <div className="bg-amber-bg border border-[#f0dca8] rounded-card-lg p-4 md:p-5 mb-6">
      <div className="text-xs uppercase tracking-wider text-amber font-semibold mb-1">
        Quick log
      </div>
      <p className="text-[13px] text-ink mb-3">
        One tap, one confirm. Use this when you do not have the focus for the full form. You can add detail later by opening the case.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => quickLog(25)}
          disabled={busy !== null}
          className="rounded-xl border border-amber bg-card hover:bg-amber-bg text-left p-4 disabled:opacity-50"
        >
          <div className="text-2xl mb-1" aria-hidden="true">💊</div>
          <div className="font-bold text-[15px]">
            {busy === 25 ? "Logging..." : "Quick 25mg"}
          </div>
          <div className="text-[12px] text-ink-soft">
            One tablet. At home. Severity 3.
          </div>
        </button>
        <button
          type="button"
          onClick={() => quickLog(50)}
          disabled={busy !== null}
          className="rounded-xl border border-amber bg-card hover:bg-amber-bg text-left p-4 disabled:opacity-50"
        >
          <div className="text-2xl mb-1" aria-hidden="true">💊💊</div>
          <div className="font-bold text-[15px]">
            {busy === 50 ? "Logging..." : "Quick 50mg"}
          </div>
          <div className="text-[12px] text-ink-soft">
            Two tablets. At home. Severity 4.
          </div>
        </button>
      </div>
      {err ? <p role="alert" className="text-[13px] text-red mt-3">{err}</p> : null}
    </div>
  );
}
