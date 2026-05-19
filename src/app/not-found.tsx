// Branded 404. Calm, on-tone, never alarming.

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-card border border-line rounded-card-lg w-full max-w-[480px] p-7 md:p-9 text-center">
        <div className="text-xs uppercase tracking-wider text-accent mb-2">Not found</div>
        <h1 className="text-xl font-bold mb-3">This page does not exist</h1>
        <p className="text-[14px] text-ink-soft mb-6">
          The link may be stale, the case may have been deleted, or the URL is mistyped.
          Nothing is broken.
        </p>
        <Link
          href="/dashboard"
          className="inline-block bg-accent text-white font-semibold rounded-lg px-5 py-3"
        >
          Back to the portal
        </Link>
      </div>
    </div>
  );
}
