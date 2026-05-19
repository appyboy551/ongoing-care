"use client";

// Per-page error boundary so a DB hiccup doesn't take down the whole shell.

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="ghost-frost w-full max-w-[480px] p-7 text-center">
        <div className="text-xs uppercase tracking-wider text-red mb-2">Dashboard error</div>
        <h1 className="text-xl font-bold mb-2">Couldn&apos;t load the current state</h1>
        <p className="text-[14px] text-ink-soft mb-2">
          The portal couldn&apos;t reach its data store. The action plan and live cases are unaffected; try again in a moment.
        </p>
        {error.digest ? (
          <p className="text-[11px] text-ink-soft mb-6 font-mono">Reference: {error.digest}</p>
        ) : (
          <p className="mb-6" />
        )}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={reset}
            className="tactile bg-accent text-white font-semibold rounded-lg px-5 py-3"
          >
            Try again
          </button>
          <a
            href="/cases"
            className="tactile bg-card border border-line text-ink font-semibold rounded-lg px-5 py-3 no-underline"
          >
            Go to live cases
          </a>
        </div>
      </div>
    </div>
  );
}
