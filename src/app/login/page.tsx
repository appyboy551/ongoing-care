"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { COPY } from "@/content/static-copy";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(await res.text());
      router.push(`/login/verify?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send a code.");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="bg-card border border-line rounded-card-lg p-7 w-full max-w-md">
        <h1 className="text-xl font-bold mb-1">{COPY.appName}</h1>
        <p className="text-ink-soft text-sm mb-5">{COPY.appTagline}</p>
        <p className="text-[14px] mb-5">{COPY.loginIntro}</p>
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="text-xs text-ink-soft block mb-1">Your email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-3 rounded-xl border border-line"
            />
          </label>
          {error ? <p role="alert" className="text-red text-sm">{error}</p> : null}
          <button
            disabled={submitting}
            className="w-full bg-accent text-white font-semibold rounded-xl py-3 disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Send me a code"}
          </button>
        </form>
        <p className="text-xs text-ink-soft mt-5">
          Codes go to the email David added you under. If you have not been added, contact David.
        </p>
      </div>
    </div>
  );
}
