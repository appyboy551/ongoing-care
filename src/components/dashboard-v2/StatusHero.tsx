"use client";

import Pill from "./Pill";

export type StatusState = "calm" | "armed" | "missed";

interface StatusHeroProps {
  state: StatusState;
  eyebrow?: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaHref?: string;
}

// Safety colour mappings
const stateStyles: Record<StatusState, {
  bgGradient: string;
  borderColor: string;
  pillTone: "safe" | "attention" | "critical";
  pillIcon: string;
  pillLabel: string;
}> = {
  calm: {
    bgGradient: "linear-gradient(135deg, rgba(31, 122, 77, 0.08) 0%, rgba(31, 122, 77, 0.02) 100%)",
    borderColor: "rgba(31, 122, 77, 0.2)",
    pillTone: "safe",
    pillIcon: "✓",
    pillLabel: "Checked in",
  },
  armed: {
    bgGradient: "linear-gradient(135deg, rgba(181, 118, 10, 0.12) 0%, rgba(181, 118, 10, 0.04) 100%)",
    borderColor: "rgba(181, 118, 10, 0.25)",
    pillTone: "attention",
    pillIcon: "⏱",
    pillLabel: "Timer running",
  },
  missed: {
    bgGradient: "linear-gradient(135deg, rgba(168, 37, 43, 0.12) 0%, rgba(168, 37, 43, 0.04) 100%)",
    borderColor: "rgba(168, 37, 43, 0.25)",
    pillTone: "critical",
    pillIcon: "!",
    pillLabel: "Overdue",
  },
};

export default function StatusHero({ state, eyebrow, title, body, ctaLabel, ctaHref }: StatusHeroProps) {
  const style = stateStyles[state];

  const content = (
    <>
      {/* Status pill */}
      <Pill tone={style.pillTone}>
        <span aria-hidden="true">{style.pillIcon}</span>
        {style.pillLabel}
      </Pill>

      {/* Eyebrow */}
      {eyebrow && (
        <div
          className="mt-4 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: "#5C594F" }}
        >
          {eyebrow}
        </div>
      )}

      {/* Title - Bodoni Moda serif */}
      <h2
        className="mt-2 font-serif text-[clamp(1.75rem,1.4rem+1.8vw,2.5rem)] leading-[1.15] tracking-[-0.01em]"
        style={{ color: "#1A1612" }}
      >
        {title}
      </h2>

      {/* Body - monospace status text */}
      <p
        className="mt-3 font-mono text-[13px] leading-relaxed flex-1"
        style={{ color: "#5C594F" }}
      >
        {body}
      </p>

      {/* CTA link */}
      {ctaLabel && ctaHref && (
        <span
          className="mt-4 inline-block text-[13px] font-semibold underline underline-offset-2"
          style={{ color: "#BE185D" }}
        >
          {ctaLabel}
        </span>
      )}
    </>
  );

  const baseClass = `
    md:col-span-2 md:row-span-2
    rounded-[20px]
    p-6 md:p-8
    flex flex-col
    min-h-[280px]
    transition-all duration-150 ease-out
  `.trim().replace(/\s+/g, " ");

  const containerStyle = {
    background: style.bgGradient,
    border: `1px solid ${style.borderColor}`,
  };

  if (ctaHref) {
    return (
      <a
        href={ctaHref}
        className={`${baseClass} no-underline hover:shadow-[0_14px_44px_rgba(26,22,18,0.12)] hover:-translate-y-0.5 active:translate-y-0`}
        style={containerStyle}
      >
        {content}
      </a>
    );
  }

  return (
    <div className={baseClass} style={containerStyle}>
      {content}
    </div>
  );
}
