"use client";

// Full-screen overlay shown when a case is ESCALATED. Bypass-and-stay-bypassed
// pattern via sessionStorage so page navigations within the session don't
// re-pop the overlay.
//
// Check-in is a proper client-side POST (replaces the broken form action that
// pointed at a non-existent /api/cases/check-in route). If the linked
// SeroquelLog id is missing (e.g. distressing-call origin case), the
// "I'm okay" button is hidden because there's no log to check in against.
//
// Action surfaces use the .liquid-glass-on-color utility for an Apple-style
// glassy specular highlight. The 000 link is a native tel: action.

import { useState, useEffect } from "react";

type CrisisTakeoverProps = {
  /** Active case status. OPEN = armed, ESCALATED = overdue. Null = no
   *  active case; the overlay does not render. */
  caseStatus: "OPEN" | "ESCALATED" | null;
  caseId: string;
  /** SeroquelLog id linked to the case, when the case originated from a
   *  Seroquel log. Null when the case originated from a distressing-call flag. */
  logId?: string | null;
};

export default function CrisisTakeover({ caseStatus, caseId, logId }: CrisisTakeoverProps) {
  const [isBypassed, setIsBypassed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const bypassedSession = sessionStorage.getItem(`crisis_bypass_${caseId}`);
    if (bypassedSession === "true") setIsBypassed(true);
  }, [caseId]);

  const handleBypass = () => {
    sessionStorage.setItem(`crisis_bypass_${caseId}`, "true");
    setIsBypassed(true);
  };

  const handleRestore = () => {
    sessionStorage.removeItem(`crisis_bypass_${caseId}`);
    setIsBypassed(false);
  };

  function getLocation(): Promise<GeolocationPosition | null> {
    if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null);
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 }
      );
    });
  }

  async function checkIn() {
    if (!logId) return;
    setSubmitting(true);
    setError(null);
    const loc = await getLocation();
    try {
      const res = await fetch("/api/seroquel/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          logId,
          location: loc
            ? { lat: loc.coords.latitude, lng: loc.coords.longitude, accuracyM: loc.coords.accuracy }
            : null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.href = "/admin?checkedin=1";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not check in.");
      setSubmitting(false);
    }
  }

  if (!caseStatus) return null;

  const isEscalated = caseStatus === "ESCALATED";

  if (isBypassed) {
    return (
      <div className="fixed bottom-6 right-6 z-50 animate-fade-in">
        <button
          onClick={handleRestore}
          className={`flex items-center gap-2 px-4 py-3 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg hover:bg-opacity-95 transition-transform active:scale-95 ${
            isEscalated ? "bg-red" : "bg-amber"
          }`}
        >
          <span className="animate-ping w-2 h-2 rounded-full bg-white block" />
          {isEscalated ? "Return to Crisis View" : "Return to Action Plan"}
        </button>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center p-6 ${isEscalated ? "mesh-missed" : "mesh-armed"}`}>
      <div className="w-full max-w-md flex flex-col gap-5">
        <div className="text-center mb-2">
          <div className={`inline-flex p-3 rounded-full text-2xl mb-3 ${
            isEscalated ? "bg-red-bg text-red animate-pulse" : "bg-amber-bg text-amber"
          }`}>
            {isEscalated ? "🚨" : "⏳"}
          </div>
          <h1 className="text-3xl font-black text-ink tracking-tight">
            {isEscalated ? "System Escalated" : "Action Plan Armed"}
          </h1>
          <p className="text-ink-soft text-sm mt-1">
            {isEscalated
              ? "An active check-in timeframe has been missed."
              : "A Seroquel dose has been logged. Check in when you can."}
          </p>
        </div>

        {logId ? (
          <>
            <button
              onClick={checkIn}
              disabled={submitting}
              className="liquid-glass-on-color tactile w-full bg-[#2f7d4f] hover:bg-opacity-95 text-white py-6 px-6 rounded-[24px] font-bold text-left flex items-center justify-between disabled:opacity-50"
            >
              <div>
                <div className="text-lg">{submitting ? "Checking in..." : "I am okay right now"}</div>
                <div className="text-xs opacity-80 font-normal mt-0.5">Resolves the alert state across network</div>
              </div>
              <span className="text-xl">✅</span>
            </button>
            <p className="text-[12px] text-ink-soft text-center leading-snug">
              Sharing your location is optional. It helps the network reach you if needed. Check-in works without it.
            </p>
          </>
        ) : null}

        <a
          href="tel:000"
          className="liquid-glass-on-color tactile w-full bg-red hover:bg-opacity-95 text-white py-6 px-6 rounded-[24px] font-bold text-left flex items-center justify-between no-underline"
        >
          <div>
            <div className="text-lg">Call Emergency (000)</div>
            <div className="text-xs opacity-80 font-normal mt-0.5">Direct link to outside assistance services</div>
          </div>
          <span className="text-xl">🚑</span>
        </a>

        {error ? <p role="alert" className="text-[13px] text-red text-center">{error}</p> : null}

        <button onClick={handleBypass} className="text-xs font-bold uppercase tracking-wider text-ink-soft hover:text-ink transition-colors mt-4 text-center block w-full py-2">
          Acknowledge & Access Dashboard
        </button>
      </div>
    </div>
  );
}
