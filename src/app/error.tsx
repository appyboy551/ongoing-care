"use client";

// Branded uncaught-error boundary. Honest about the failure, gives one action.

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console for the next session to investigate. Production logging would route here.
    console.error("Portal uncaught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-card border border-line rounded-card-lg w-full max-w-[480px] p-7 md:p-9 text-center">
        <div className="text-xs uppercase tracking-wider text-red mb-2">Something went wrong</div>
        <h1 className="text-xl font-bold mb-3">The portal hit an unexpected error</h1>
        <p className="text-[14px] text-ink-soft mb-2">
          Try once more. If it keeps happening, tell David and the audit log will help track it down.
        </p>
        {error.digest ? (
          <p className="text-[11px] text-ink-soft mb-6 font-mono">Reference: {error.digest}</p>
        ) : (
          <p className="mb-6" />
        )}
        <div className="flex gap-2 justify-center flex-wrap">
          <button
            onClick={reset}
            className="inline-block bg-accent text-white font-semibold rounded-lg px-5 py-3"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="inline-block bg-card border border-line text-ink font-semibold rounded-lg px-5 py-3"
          >
            Back to the portal
          </a>
        </div>
      </div>
    </div>
  );
}
