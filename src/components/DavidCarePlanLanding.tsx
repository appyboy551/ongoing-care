"use client";

import { useState } from "react";

// Check icon for the status pill
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M11.667 3.5L5.25 9.917L2.333 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Arrow icon for buttons
function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3.333 8h9.334M8.667 4L12.667 8l-4 4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Users icon for "Who's on call"
function UsersIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M11.333 14v-1.333A2.667 2.667 0 008.667 10H4a2.667 2.667 0 00-2.667 2.667V14M6.333 7.333A2.667 2.667 0 106.333 2a2.667 2.667 0 000 5.333zM14.667 14v-1.333a2.667 2.667 0 00-2-2.58M10 2.113a2.667 2.667 0 010 5.167"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function DavidCarePlanLanding() {
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  // CSS for reduced motion preference
  const transitionClass = "motion-safe:transition-all motion-safe:duration-[140ms]";
  const hoverLiftClass = "motion-safe:hover:-translate-y-0.5";

  return (
    <div className="min-h-screen bg-cream relative overflow-hidden">
      {/* Abstract background blooms for glassmorphism effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {/* Magenta bloom - top right */}
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[120px] opacity-40"
          style={{
            background: "radial-gradient(circle, #DB2777 0%, transparent 70%)",
            top: "-100px",
            right: "-50px",
          }}
        />
        {/* Purple bloom - center */}
        <div
          className="absolute w-[600px] h-[600px] rounded-full blur-[140px] opacity-35"
          style={{
            background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)",
            top: "100px",
            left: "20%",
          }}
        />
        {/* Teal bloom - bottom left */}
        <div
          className="absolute w-[450px] h-[450px] rounded-full blur-[100px] opacity-30"
          style={{
            background: "radial-gradient(circle, #06B6D4 0%, transparent 70%)",
            bottom: "50px",
            left: "-100px",
          }}
        />

        {/* Translucent glass shapes */}
        <div
          className="absolute w-[300px] h-[200px] rounded-[48px] backdrop-blur-sm"
          style={{
            background: "rgba(255, 255, 255, 0.15)",
            border: "1px solid rgba(255, 255, 255, 0.25)",
            top: "180px",
            right: "15%",
            transform: "rotate(-12deg)",
          }}
        />
        <div
          className="absolute w-[200px] h-[280px] rounded-[40px] backdrop-blur-sm"
          style={{
            background: "rgba(255, 255, 255, 0.12)",
            border: "1px solid rgba(255, 255, 255, 0.2)",
            top: "300px",
            right: "25%",
            transform: "rotate(8deg)",
          }}
        />
        <div
          className="absolute w-[180px] h-[180px] rounded-[36px] backdrop-blur-sm"
          style={{
            background: "rgba(255, 255, 255, 0.18)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            bottom: "200px",
            right: "10%",
            transform: "rotate(-5deg)",
          }}
        />
      </div>

      {/* Navigation bar */}
      <nav className="relative z-50 pt-4 px-4">
        <div
          className={`mx-auto max-w-[980px] rounded-full px-6 py-3 flex items-center justify-between ${transitionClass}`}
          style={{
            background: "rgba(255, 255, 255, 0.65)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(255, 255, 255, 0.8)",
            boxShadow: "0 8px 32px rgba(26, 22, 18, 0.08)",
          }}
        >
          {/* Wordmark */}
          <span className="font-serif text-lg font-medium text-primary-ink tracking-tight">
            David Care Plan
          </span>

          {/* Navigation links */}
          <div className="hidden sm:flex items-center gap-1">
            {["Today", "Network", "Plan", "Help now"].map((link) => (
              <a
                key={link}
                href="#"
                className={`px-4 py-2 text-sm font-medium text-secondary-ink rounded-full ${transitionClass} hover:text-primary-ink hover:bg-black/[0.04]`}
              >
                {link}
              </a>
            ))}
          </div>

          {/* Sign in button - soft purple to complement the hero blooms */}
          <button
            className={`px-5 py-2.5 rounded-full text-sm font-semibold text-white ${transitionClass} ${hoverLiftClass} active:scale-[0.98]`}
            onMouseEnter={() => setHoveredButton("signin")}
            onMouseLeave={() => setHoveredButton(null)}
            style={{
              background:
                hoveredButton === "signin"
                  ? "#7C3AED"
                  : "#8B5CF6",
              boxShadow:
                hoveredButton === "signin"
                  ? "0 8px 20px rgba(139, 92, 246, 0.35)"
                  : "0 4px 12px rgba(139, 92, 246, 0.25)",
            }}
          >
            Sign in
          </button>
        </div>
      </nav>

      {/* Hero section */}
      <main id="main-content" className="relative z-10 px-4 pt-16 sm:pt-24 pb-12">
        <div className="mx-auto max-w-[980px]">
          {/* Content positioned over the lower-left of the hero area */}
          <div className="max-w-xl">
            {/* Status pill */}
            <div
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-white text-xs font-semibold mb-6 ${transitionClass}`}
              style={{ backgroundColor: "#1F7A4D" }}
              role="status"
              aria-label="Status: Checked in"
            >
              <CheckIcon className="w-3.5 h-3.5" />
              <span>Checked in</span>
            </div>

            {/* Main greeting */}
            <h1
              className="font-serif text-5xl sm:text-6xl lg:text-7xl font-normal leading-[1.05] tracking-tight text-primary-ink mb-4"
              style={{ textWrap: "balance" }}
            >
              {"Everything's calm."}
            </h1>

            {/* Status line */}
            <p className="font-mono text-sm text-secondary-ink mb-10 tracking-tight">
              Last check-in 6:14pm. Next by 8:15pm. Seven people on call.
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Primary CTA */}
              <button
                className={`inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-lime-cta text-lime-ink text-base font-semibold ${transitionClass} ${hoverLiftClass} active:scale-[0.98]`}
                onMouseEnter={() => setHoveredButton("primary")}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  boxShadow:
                    hoveredButton === "primary"
                      ? "0 12px 32px rgba(26, 22, 18, 0.14)"
                      : "0 8px 24px rgba(26, 22, 18, 0.08)",
                }}
              >
                {"Open today's plan"}
                <ArrowRightIcon className="w-4 h-4" />
              </button>

              {/* Secondary frosted button */}
              <button
                className={`inline-flex items-center gap-2 px-5 py-3.5 rounded-full text-secondary-ink text-base font-medium ${transitionClass} ${hoverLiftClass} hover:text-primary-ink active:scale-[0.98]`}
                onMouseEnter={() => setHoveredButton("secondary")}
                onMouseLeave={() => setHoveredButton(null)}
                style={{
                  background:
                    hoveredButton === "secondary"
                      ? "rgba(255, 255, 255, 0.8)"
                      : "rgba(255, 255, 255, 0.55)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid rgba(255, 255, 255, 0.6)",
                  boxShadow:
                    hoveredButton === "secondary"
                      ? "0 10px 28px rgba(26, 22, 18, 0.1)"
                      : "0 6px 20px rgba(26, 22, 18, 0.06)",
                }}
              >
                <UsersIcon className="w-4 h-4" />
                {"Who's on call"}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Ensure the hero fills most of the viewport */}
      <div className="min-h-[40vh]" aria-hidden="true" />
    </div>
  );
}
