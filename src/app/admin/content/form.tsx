"use client";

import { useState } from "react";

export default function ContentDraftForm(props: { id: string; initial: string }) {
  const [body, setBody] = useState(props.initial);
  const [busy, setBusy] = useState<null | "save" | "publish">(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function save(publish: boolean) {
    setBusy(publish ? "publish" : "save");
    setMsg(null);
    try {
      const res = await fetch("/api/content/publish", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: props.id, body, publish }),
      });
      if (!res.ok) throw new Error(await res.text());
      setMsg(publish ? "Published. Network notified." : "Draft saved.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={8}
        className="w-full px-3 py-2 rounded-lg border border-line font-sans text-[14px]"
      />
      <div className="mt-3 flex gap-2 items-center">
        <button
          onClick={() => save(false)}
          disabled={busy !== null}
          className="bg-ink-soft text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {busy === "save" ? "Saving..." : "Save draft"}
        </button>
        <button
          onClick={() => save(true)}
          disabled={busy !== null}
          className="bg-accent text-white font-semibold rounded-lg px-4 py-2 disabled:opacity-50"
        >
          {busy === "publish" ? "Publishing..." : "Sign off and publish"}
        </button>
        {msg ? <span className="text-sm text-ink-soft">{msg}</span> : null}
      </div>
    </div>
  );
}
