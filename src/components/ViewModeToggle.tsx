"use client";

import { useState } from "react";

type Mode = "admin" | "network";

export default function ViewModeToggle({ current }: { current: Mode }) {
  const [busy, setBusy] = useState(false);
  async function setMode(mode: Mode) {
    if (mode === current || busy) return;
    setBusy(true);
    try {
      await fetch("/api/admin/view-mode", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ mode }),
      });
      window.location.href = mode === "admin" ? "/admin" : "/dashboard";
    } catch {
      setBusy(false);
    }
  }
  function onKey(e: React.KeyboardEvent<HTMLDivElement>) {
    // Left/Right + Home/End move selection between the two radio pills.
    if (e.key === "ArrowLeft" || e.key === "ArrowUp" || e.key === "Home") {
      e.preventDefault();
      setMode("admin");
    } else if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === "End") {
      e.preventDefault();
      setMode("network");
    }
  }
  return (
    <div
      role="radiogroup"
      aria-label="Switch view"
      onKeyDown={onKey}
      className="inline-flex w-full mt-3 rounded-lg border border-line bg-bg p-1"
    >
      <button
        role="radio"
        aria-checked={current === "admin"}
        tabIndex={current === "admin" ? 0 : -1}
        onClick={() => setMode("admin")}
        disabled={busy}
        className={
          "flex-1 text-[12px] font-semibold rounded-md py-1.5 transition-colors " +
          (current === "admin"
            ? "bg-accent text-white"
            : "text-ink-soft hover:text-accent")
        }
      >
        Admin
      </button>
      <button
        role="radio"
        aria-checked={current === "network"}
        tabIndex={current === "network" ? 0 : -1}
        onClick={() => setMode("network")}
        disabled={busy}
        className={
          "flex-1 text-[12px] font-semibold rounded-md py-1.5 transition-colors " +
          (current === "network"
            ? "bg-accent text-white"
            : "text-ink-soft hover:text-accent")
        }
      >
        Network
      </button>
    </div>
  );
}
