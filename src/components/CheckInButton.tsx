"use client";

import { useState } from "react";

export default function CheckInButton(props: { logId: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function getLocation(): Promise<GeolocationPosition | null> {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return Promise.resolve(null);
    }
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(pos),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30_000 }
      );
    });
  }

  async function check() {
    setSubmitting(true);
    setError(null);
    const loc = await getLocation();
    try {
      const res = await fetch("/api/seroquel/checkin", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          logId: props.logId,
          location: loc
            ? { lat: loc.coords.latitude, lng: loc.coords.longitude, accuracyM: loc.coords.accuracy }
            : null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.href = "/admin?checkedin=1";
    } catch (e) {
      setSubmitting(false);
      setError(e instanceof Error ? e.message : "Could not check in.");
    }
  }

  return (
    <div>
      <button
        onClick={check}
        disabled={submitting}
        className="bg-green text-white font-semibold rounded-xl px-6 py-3 disabled:opacity-50"
        aria-label="Check in as okay"
      >
        <span aria-hidden="true">✅ </span>
        {submitting ? "Saving..." : "I'm okay, check me in"}
      </button>
      <p className="text-xs text-ink-soft mt-2">
        Tapping this captures your location right now and tells the network you are safe. The plan closes.
      </p>
      {error ? <p className="text-red text-sm mt-2">{error}</p> : null}
    </div>
  );
}
