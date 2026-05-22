"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import StatusHero, { StatusState } from "./StatusHero";
import GlassTile from "./GlassTile";
import Pill from "./Pill";
import CallCard from "./CallCard";

// Mock navigation structure matching the brief
const NETWORK_NAV = [
  {
    name: "Now",
    items: [
      { label: "Current state", href: "/dashboard", emoji: "🏠" },
      { label: "Action plan", href: "/action-plan", emoji: "📋" },
    ],
  },
  {
    name: "People & info",
    items: [
      { label: "Support network", href: "/network", emoji: "👥" },
      { label: "Medical", href: "/medical", emoji: "💊" },
      { label: "Safe numbers", href: "/safe-numbers", emoji: "📞" },
    ],
  },
  {
    name: "Personal",
    items: [
      { label: "Your details", href: "/me", emoji: "👤" },
    ],
  },
];

// Mock network members
const NETWORK_MEMBERS = [
  { id: "1", name: "Sarah", relationship: "Sister", tier: "NETWORK" },
  { id: "2", name: "Michael", relationship: "Brother-in-law", tier: "NETWORK" },
  { id: "3", name: "Emma", relationship: "Friend", tier: "NETWORK" },
  { id: "4", name: "Dr. Chen", relationship: "GP", tier: "MEDICAL" },
];

// Status configurations for each state
const STATUS_CONFIGS: Record<StatusState, { eyebrow: string; title: string; body: string; ctaLabel?: string; ctaHref?: string }> = {
  calm: {
    eyebrow: "All calm",
    title: "Nothing live right now",
    body: "The portal will tell you when something changes. You can use the side nav any time.",
  },
  armed: {
    eyebrow: "Action plan armed",
    title: "David logged Seroquel",
    body: "Logged at 10:45 PM. Check-in expected by 7:45 AM (9 hours from now).",
    ctaLabel: "View the case",
    ctaHref: "/cases",
  },
  missed: {
    eyebrow: "Action plan live",
    title: "David is overdue checking in",
    body: "Logged at 10:45 PM. Expected by 7:45 AM. Overdue by 2 hours 15 minutes.",
    ctaLabel: "Open the live case",
    ctaHref: "/cases",
  },
};

// Self-state options for the tracking tile
const SELF_STATES = ["Low", "Medium", "High", "Extreme"] as const;

export default function DashboardV2() {
  // State selector for demo - shows all three status states
  const [activeStatus, setActiveStatus] = useState<StatusState>("calm");
  const [selfState] = useState<typeof SELF_STATES[number]>("Medium");

  const status = STATUS_CONFIGS[activeStatus];

  return (
    <div className="min-h-screen" style={{ background: "#F6F4EE" }}>
      {/* Sidebar */}
      <Sidebar
        viewerName="Sarah"
        viewerRole="NETWORK"
        currentPath="/dashboard"
        navGroups={NETWORK_NAV}
        isAdmin={false}
      />

      {/* Mobile header */}
      <div
        className="md:hidden sticky top-0 z-50 px-4 py-3"
        style={{
          background: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid #E4E0D6",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-serif text-[16px]" style={{ color: "#1A1612" }}>
              David Care Plan
            </div>
            <div className="text-[11px]" style={{ color: "#5C594F" }}>
              Signed in as Sarah
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-full text-[13px] font-semibold"
            style={{ background: "#BE185D", color: "#FFFFFF" }}
          >
            Menu
          </button>
        </div>
      </div>

      {/* Main content */}
      <main id="main-content" className="md:ml-[268px] px-4 md:px-10 py-6 md:py-9 max-w-[1100px]">
        {/* Page header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 flex-wrap">
            <h1
              className="font-serif text-[clamp(1.75rem,1.4rem+1.8vw,2.5rem)] leading-[1.1] tracking-[-0.01em]"
              style={{ color: "#1A1612" }}
            >
              Hi, Sarah
            </h1>
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.06em] px-2.5 py-1 rounded-full"
              style={{ background: "#EDE9FE", color: "#6D28A8" }}
            >
              Network
            </span>
          </div>
          <p className="mt-2 text-[14px]" style={{ color: "#5C594F" }}>
            {"A quick read of where David is right now."}
          </p>
        </header>

        {/* Status state selector (for demo) */}
        <div className="mb-6 p-4 rounded-[16px] border border-dashed border-[#E4E0D6]" style={{ background: "rgba(255,255,255,0.5)" }}>
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: "#5C594F" }}>
            Demo: Select status state
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["calm", "armed", "missed"] as const).map((state) => (
              <button
                key={state}
                onClick={() => setActiveStatus(state)}
                className="px-4 py-2 rounded-full text-[13px] font-semibold transition-all duration-150"
                style={{
                  background: activeStatus === state ? "#1A1612" : "transparent",
                  color: activeStatus === state ? "#FFFFFF" : "#5C594F",
                  border: `1px solid ${activeStatus === state ? "#1A1612" : "#E4E0D6"}`,
                }}
              >
                {state.charAt(0).toUpperCase() + state.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Bento grid */}
        <section className="grid grid-cols-1 md:grid-cols-4 auto-rows-[minmax(140px,auto)] gap-4 mb-6">
          {/* Status Hero - 2x2 */}
          <StatusHero
            state={activeStatus}
            eyebrow={status.eyebrow}
            title={status.title}
            body={status.body}
            ctaLabel={status.ctaLabel}
            ctaHref={status.ctaHref}
          />

          {/* Distressing call tile - 2x1 */}
          <GlassTile size="wide">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#BE185D" }}>
              If you have just had a distressing call with David
            </div>
            <p className="text-[13px] mt-2 mb-4 flex-1" style={{ color: "#5C594F" }}>
              Flagging arms the no-contact backstop. If David then goes silent past the timer, the action plan triggers automatically.
            </p>
            <button
              className="self-start px-5 py-2.5 rounded-full text-[13px] font-semibold transition-all duration-150 hover:shadow-[0_6px_16px_rgba(181,118,10,0.2)] hover:-translate-y-0.5 active:translate-y-0"
              style={{
                background: "linear-gradient(135deg, #B5760A 0%, #92600E 100%)",
                color: "#FFFFFF",
              }}
            >
              Flag a distressing call
            </button>
          </GlassTile>

          {/* Emergency contacts tile - 2x1 */}
          <GlassTile size="wide">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-3" style={{ color: "#BE185D" }}>
              I need help now
            </div>
            <div className="flex flex-col gap-2 flex-1">
              <CallCard
                number="000"
                label="Emergency Services"
                sublabel="Immediate danger only"
                tone="emergency"
              />
              <CallCard
                number="1800 011 511"
                label="Mental Health Line"
                sublabel="24/7 crisis support"
                tone="support"
              />
            </div>
          </GlassTile>

          {/* Insurer tile - 1x1 */}
          <GlassTile size="square">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#5C594F" }}>
              Insurer
            </div>
            <div className="text-[15px] font-semibold mt-2" style={{ color: "#1A1612" }}>
              Medibank Private
            </div>
            <div className="text-[12px] mt-1" style={{ color: "#5C594F" }}>
              Hospital + Extras
            </div>
          </GlassTile>

          {/* Guardianship tile - 1x1 */}
          <GlassTile size="square">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#5C594F" }}>
              Guardianship
            </div>
            <div className="mt-3">
              <Pill tone="safe">In place</Pill>
            </div>
            <div className="text-[12px] mt-2" style={{ color: "#5C594F" }}>
              Sarah Walker (sister)
            </div>
          </GlassTile>

          {/* Financial tile - 1x1 */}
          <GlassTile size="square">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#5C594F" }}>
              Financial
            </div>
            <div className="mt-3">
              <Pill tone="safe">Stable</Pill>
            </div>
          </GlassTile>

          {/* Your details tile - 1x1 */}
          <GlassTile size="square" href="/me" className="justify-center items-center text-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#5C594F" }}>
              Your details
            </div>
            <div className="text-[14px] font-semibold mt-2 underline underline-offset-2" style={{ color: "#BE185D" }}>
              View / edit
            </div>
          </GlassTile>

          {/* How David is tracking tile - 2x1 (static placeholder) */}
          <GlassTile size="wide">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#5C594F" }}>
                How David is tracking
              </div>
              <Pill tone="purple">{selfState}</Pill>
            </div>
            <div className="flex-1 flex flex-col justify-center">
              {/* Self-state scale */}
              <div className="flex items-center gap-1 mb-3">
                {SELF_STATES.map((state, i) => (
                  <div
                    key={state}
                    className="flex-1 h-2 rounded-full transition-all"
                    style={{
                      background: SELF_STATES.indexOf(selfState) >= i
                        ? i < 2 ? "#8B5CF6" : i === 2 ? "#DB2777" : "#A8252B"
                        : "#E4E0D6",
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px]" style={{ color: "#5C594F" }}>
                {SELF_STATES.map((state) => (
                  <span key={state} className={selfState === state ? "font-semibold" : ""}>
                    {state}
                  </span>
                ))}
              </div>
              {/* Placeholder trend line area */}
              <div
                className="mt-4 h-12 rounded-[8px] flex items-center justify-center text-[11px]"
                style={{ background: "#F0EDE6", color: "#5C594F" }}
              >
                Trend line placeholder
              </div>
            </div>
          </GlassTile>

          {/* Network tile - full width */}
          <GlassTile size="full">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.1em]" style={{ color: "#5C594F" }}>
                Network
              </div>
              <a
                href="/network"
                className="text-[12px] font-semibold no-underline transition-colors"
                style={{ color: "#BE185D" }}
              >
                See all
              </a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {NETWORK_MEMBERS.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-[12px] transition-all duration-150"
                  style={{
                    background: "rgba(246, 244, 238, 0.6)",
                    border: "1px solid #E4E0D6",
                  }}
                >
                  <div className="min-w-0">
                    <div className="text-[14px] font-semibold truncate" style={{ color: "#1A1612" }}>
                      {member.name}
                    </div>
                    <div className="text-[11px] truncate" style={{ color: "#5C594F" }}>
                      {member.relationship}
                    </div>
                  </div>
                  <span
                    className="text-[9px] font-semibold uppercase tracking-[0.04em] px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{
                      background: member.tier === "MEDICAL" ? "#E0F7FA" : "#EDE9FE",
                      color: member.tier === "MEDICAL" ? "#0E7490" : "#6D28A8",
                    }}
                  >
                    {member.tier}
                  </span>
                </div>
              ))}
            </div>
          </GlassTile>
        </section>

        {/* Footer tip */}
        <p className="text-[11px]" style={{ color: "#5C594F" }}>
          Tip: the side nav has everything else. The action plan, support network, medical info, and your own details all live there.
        </p>
      </main>
    </div>
  );
}
