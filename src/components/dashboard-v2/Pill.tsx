"use client";

import { ReactNode } from "react";

export type PillTone = "safe" | "attention" | "critical" | "neutral" | "magenta" | "purple" | "teal";

interface PillProps {
  tone?: PillTone;
  children: ReactNode;
  className?: string;
}

export default function Pill({ tone = "neutral", children, className = "" }: PillProps) {
  // Colour mappings using exact hex values from brief
  const tones: Record<PillTone, { bg: string; text: string }> = {
    safe: { bg: "#E7F3EC", text: "#1F7A4D" },
    attention: { bg: "#FBF0D9", text: "#92600E" }, // Dark text on amber
    critical: { bg: "#FBE6E6", text: "#A8252B" },
    neutral: { bg: "#F0EDE6", text: "#5C594F" },
    magenta: { bg: "#FBEAF3", text: "#BE185D" },
    purple: { bg: "#EDE9FE", text: "#6D28A8" },
    teal: { bg: "#E0F7FA", text: "#0E7490" },
  };

  const { bg, text } = tones[tone];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.08em] px-3 py-1.5 rounded-full ${className}`}
      style={{ background: bg, color: text }}
    >
      {children}
    </span>
  );
}
