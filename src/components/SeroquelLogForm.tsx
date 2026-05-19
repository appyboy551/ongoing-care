"use client";

// Three mandatory categories: Trigger, Context, Reflection.
// Dose chosen first. Two buttons: one pill = 25mg, two pills = 50mg.

import { useState } from "react";
import {
  STRESSORS,
  EMOTIONS,
  FACILITY_OPTIONS,
  DRIVING_THIS,
  WHAT_WOULD_HELP,
} from "@/lib/seroquel-options";

export default function SeroquelLogForm() {
  const [doseMg, setDoseMg] = useState<25 | 50 | null>(null);
  const [stressors, setStressors] = useState<string[]>([]);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [inFacility, setInFacility] = useState<boolean | null>(null);
  const [facility, setFacility] = useState<string>("");
  const [facilityOther, setFacilityOther] = useState<string>("");
  const [severity, setSeverity] = useState<number | null>(null);
  const [drivingThis, setDrivingThis] = useState<string>("");
  const [whatWouldHelp, setWhatWouldHelp] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [shareLocation, setShareLocation] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (list: string[], setList: (l: string[]) => void, slug: string) => {
    setList(list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]);
  };

  function getLocationOrNull(): Promise<GeolocationPosition | null> {
    if (!shareLocation || typeof navigator === "undefined" || !navigator.geolocation) {
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

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!doseMg) return setError("Choose 25mg or 50mg.");
    if (inFacility == null) return setError("Tell us whether you're in a facility.");
    if (inFacility && !facility) return setError("Select which facility, or pick Other.");
    if (severity == null) return setError("Tap a severity from 1 to 5.");

    setSubmitting(true);
    const loc = await getLocationOrNull();
    const payload = {
      doseMg,
      stressors,
      emotions,
      inFacility,
      facilityName:
        facility === "other" ? facilityOther.trim() : FACILITY_OPTIONS.find((f) => f.slug === facility)?.label,
      severity,
      drivingThis: drivingThis || null,
      whatWouldHelp: whatWouldHelp || null,
      reflectionNote: note.trim() || null,
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
    } catch (err) {
      setSubmitting(false);
      setError(err instanceof Error ? err.message : "Could not save the log.");
    }
  }

  return (
    <form onSubmit={submit} className="space-y-8">
      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wider text-accent mb-3">
          1. Dose
        </legend>
        <div className="grid grid-cols-2 gap-3">
          <DoseButton selected={doseMg === 25} onClick={() => setDoseMg(25)} pills={1} label="25 mg" hint="A difficult call" />
          <DoseButton selected={doseMg === 50} onClick={() => setDoseMg(50)} pills={2} label="50 mg" hint="Particularly stressful" />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wider text-accent mb-3">
          2. What's going on? Trigger (tap any that apply)
        </legend>
        <div className="text-xs text-ink-soft mb-2">Stressors</div>
        <div className="flex flex-wrap gap-2 mb-4">
          {STRESSORS.map((s) => (
            <TagButton
              key={s.slug}
              selected={stressors.includes(s.slug)}
              onClick={() => toggle(stressors, setStressors, s.slug)}
              label={`${s.emoji} ${s.label}`}
            />
          ))}
        </div>
        <div className="text-xs text-ink-soft mb-2">Emotions</div>
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.map((e) => (
            <TagButton
              key={e.slug}
              selected={emotions.includes(e.slug)}
              onClick={() => toggle(emotions, setEmotions, e.slug)}
              label={`${e.emoji} ${e.label}`}
            />
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wider text-accent mb-3">
          3. Context
        </legend>
        <div className="flex gap-2 mb-3">
          <TagButton selected={inFacility === false} onClick={() => setInFacility(false)} label="At home / outside" />
          <TagButton selected={inFacility === true} onClick={() => setInFacility(true)} label="In a facility" />
        </div>
        {inFacility ? (
          <div className="space-y-2">
            <div className="flex flex-wrap gap-2">
              {FACILITY_OPTIONS.map((f) => (
                <TagButton
                  key={f.slug}
                  selected={facility === f.slug}
                  onClick={() => setFacility(f.slug)}
                  label={f.label}
                />
              ))}
            </div>
            {facility === "other" ? (
              <input
                value={facilityOther}
                onChange={(e) => setFacilityOther(e.target.value)}
                placeholder="Which facility"
                className="w-full px-3 py-2 rounded-lg border border-line"
              />
            ) : null}
          </div>
        ) : null}
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wider text-accent mb-3">
          4. Reflection
        </legend>
        <div className="mb-3">
          <div className="text-xs text-ink-soft mb-2">Severity (1 calm, 5 worst)</div>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <TagButton key={n} selected={severity === n} onClick={() => setSeverity(n)} label={String(n)} />
            ))}
          </div>
        </div>
        <div className="mb-3">
          <div className="text-xs text-ink-soft mb-2">What's driving this</div>
          <div className="flex flex-wrap gap-2">
            {DRIVING_THIS.map((d) => (
              <TagButton key={d.slug} selected={drivingThis === d.slug} onClick={() => setDrivingThis(d.slug)} label={d.label} />
            ))}
          </div>
        </div>
        <div className="mb-3">
          <div className="text-xs text-ink-soft mb-2">What would help</div>
          <div className="flex flex-wrap gap-2">
            {WHAT_WOULD_HELP.map((d) => (
              <TagButton key={d.slug} selected={whatWouldHelp === d.slug} onClick={() => setWhatWouldHelp(d.slug)} label={d.label} />
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-ink-soft block mb-2">
            Optional. One line to Bron and Joanna.
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            maxLength={280}
            className="w-full px-3 py-2 rounded-lg border border-line"
            placeholder=""
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold uppercase tracking-wider text-accent mb-3">
          5. Location
        </legend>
        <label className="inline-flex items-center gap-2 text-[14px]">
          <input
            type="checkbox"
            checked={shareLocation}
            onChange={(e) => setShareLocation(e.target.checked)}
          />
          Share my location now (only captured at this moment)
        </label>
      </fieldset>

      {error ? (
        <div className="rounded-card-lg bg-red-bg border border-[#f0c4c4] text-red px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}

      <button
        disabled={submitting}
        className="w-full bg-accent hover:bg-[#23586e] text-white font-semibold rounded-xl py-3 disabled:opacity-50"
      >
        {submitting ? "Saving..." : "Log this dose"}
      </button>
    </form>
  );
}

function DoseButton(props: {
  selected: boolean;
  onClick: () => void;
  pills: number;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={
        "rounded-card-lg border p-4 text-left transition " +
        (props.selected
          ? "border-accent bg-accent-soft"
          : "border-line bg-card hover:bg-bg")
      }
      aria-pressed={props.selected}
    >
      <div className="text-2xl mb-1" aria-hidden>
        {"💊".repeat(props.pills)}
      </div>
      <div className="font-bold">{props.label}</div>
      <div className="text-xs text-ink-soft">{props.hint}</div>
    </button>
  );
}

function TagButton(props: { selected: boolean; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={props.onClick}
      className={
        "rounded-full border px-3 py-2 text-[13px] " +
        (props.selected
          ? "border-accent bg-accent-soft text-accent font-semibold"
          : "border-line bg-card text-ink hover:bg-bg")
      }
      aria-pressed={props.selected}
    >
      {props.label}
    </button>
  );
}
