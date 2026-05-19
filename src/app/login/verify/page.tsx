"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { COPY } from "@/content/static-copy";

// Only allow same-origin relative paths as a post-login destination.
// Prevents an attacker handing out links like /login/verify?next=https://evil.example.
function sanitiseNext(raw: string | null): string {
  if (!raw) return "/";
  // Must start with a single slash and not be a protocol-relative URL (//).
  if (!raw.startsWith("/") || raw.startsWith("//")) return "/";
  // Reject anything containing control characters or whitespace.
  for (let i = 0; i < raw.length; i++) {
    const code = raw.charCodeAt(i);
    if (code < 0x21 || code === 0x7f) return "/";
  }
  return raw;
}

export default function VerifyPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const next = sanitiseNext(params.get("next"));
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Invalid code.");
      }
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid code.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-card border border-line rounded-card-lg p-7 w-full max-w-md">
        <h1 className="text-xl font-bold mb-1">Enter your code</h1>
        <p className="text-ink-soft text-sm mb-5">{COPY.loginCodeIntro}</p>
        <form onSubmit={submit} className="space-y-3">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6}"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full px-3 py-3 rounded-xl border border-line text-center text-xl tracking-widest"
            aria-label="Six digit code"
          />
          {error ? <p role="alert" className="text-red text-sm">{error}</p> : null}
          <button
            disabled={submitting || code.length !== 6}
            className="w-full bg-accent text-white font-semibold rounded-xl py-3 disabled:opacity-50"
          >
            {submitting ? "Checking..." : "Sign in"}
          </button>
        </form>
        <p className="text-xs text-ink-soft mt-5">
          Email: {email || "(not provided)"}.{" "}
          <a className="underline" href="/login">
            Send a new code
          </a>
          .
        </p>
        <p className="text-xs text-ink-soft mt-2">
          If you don't see the email after a few minutes, check spam. If still nothing, ask David which email you're registered under.
        </p>
      </div>
    </div>
  );
}
