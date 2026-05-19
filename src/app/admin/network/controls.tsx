"use client";

import { useState } from "react";

export default function NetworkAdminControls(props: {
  id: string;
  isActive: boolean;
  tier: "FULL_MEDICAL" | "SHARED" | "ADMIN";
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  async function invite() {
    const ok = window.confirm(
      "Send the invite email now? This emails the member with the portal link and a short explanation."
    );
    if (!ok) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/network/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: props.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Invite failed.");
      setMsg(data?.emailSent === false ? "Audit recorded but email failed. Check Resend." : "Invite sent.");
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Invite failed.");
    } finally {
      setBusy(false);
    }
  }
  async function toggle() {
    const verb = props.isActive ? "revoke" : "reactivate";
    const ok = window.confirm(
      props.isActive
        ? "Revoke this member's access? They will be signed out and stop receiving notifications. You can reactivate later."
        : "Reactivate this member's access? They will be able to sign in again."
    );
    if (!ok) return;
    setBusy(true);
    try {
      const res = await fetch("/api/network/toggle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ id: props.id, active: !props.isActive }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.reload();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : `Failed to ${verb}.`);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="mt-3 flex gap-2 items-center flex-wrap">
      {props.isActive ? (
        <button
          onClick={invite}
          disabled={busy}
          className="bg-accent text-white text-sm font-semibold rounded-lg px-3 py-2 disabled:opacity-50"
        >
          {busy ? "Working..." : "Send invite"}
        </button>
      ) : null}
      <button
        onClick={toggle}
        disabled={busy}
        className={
          (props.isActive ? "bg-red" : "bg-green") +
          " text-white text-sm font-semibold rounded-lg px-3 py-2 disabled:opacity-50"
        }
      >
        {busy ? "Saving..." : props.isActive ? "Revoke access" : "Reactivate"}
      </button>
      {msg ? <span role="status" aria-live="polite" className="text-xs text-ink-soft">{msg}</span> : null}
    </div>
  );
}
