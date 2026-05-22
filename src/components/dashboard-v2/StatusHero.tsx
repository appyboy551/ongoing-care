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

// Safety colour mappings with premium glass treatment
const stateStyles: Record<StatusState, {
  bgGradient: string;
  glassOverlay: string;
  borderColor: string;
  shadowColor: string;
  pillTone: "safe" | "attention" | "critical";
  pillIcon: string;
  pillLabel: string;
}> = {
  calm: {
    bgGradient: "linear-gradient(145deg, rgba(31, 122, 77, 0.12) 0%, rgba(31, 122, 77, 0.04) 50%, rgba(255, 255, 255, 0.6) 100%)",
    glassOverlay: "rgba(255, 255, 255, 0.4)",
    borderColor: "rgba(31, 122, 77, 0.15)",
    shadowColor: "rgba(31, 122, 77, 0.08)",
    pillTone: "safe",
    pillIcon: "✓",
    pillLabel: "Checked in",
  },
  armed: {
    bgGradient: "linear-gradient(145deg, rgba(181, 118, 10, 0.14) 0%, rgba(181, 118, 10, 0.05) 50%, rgba(255, 255, 255, 0.6) 100%)",
    glassOverlay: "rgba(255, 255, 255, 0.35)",
    borderColor: "rgba(181, 118, 10, 0.2)",
    shadowColor: "rgba(181, 118, 10, 0.1)",
    pillTone: "attention",
    pillIcon: "⏱",
    pillLabel: "Timer running",
  },
  missed: {
    bgGradient: "linear-gradient(145deg, rgba(168, 37, 43, 0.14) 0%, rgba(168, 37, 43, 0.05) 50%, rgba(255, 255, 255, 0.6) 100%)",
    glassOverlay: "rgba(255, 255, 255, 0.35)",
    borderColor: "rgba(168, 37, 43, 0.2)",
    shadowColor: "rgba(168, 37, 43, 0.1)",
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
          className="mt-5 text-[11px] font-semibold uppercase tracking-[0.12em]"
          style={{ color: "#5C594F" }}
        >
          {eyebrow}
        </div>
      )}

      {/* Title - Bodoni Moda serif */}
      <h2
        className="mt-2 font-serif text-[clamp(1.875rem,1.5rem+2vw,2.75rem)] leading-[1.1] tracking-[-0.02em]"
        style={{ color: "#1A1612", textWrap: "balance" } as React.CSSProperties}
      >
        {title}
      </h2>

      {/* Body - monospace status text */}
      <p
        className="mt-4 font-mono text-[13px] leading-relaxed flex-1"
        style={{ color: "#5C594F" }}
      >
        {body}
      </p>

      {/* CTA link */}
      {ctaLabel && ctaHref && (
        <span
          className="mt-5 inline-flex items-center gap-2 text-[14px] font-semibold"
          style={{ color: "#BE185D" }}
        >
          {ctaLabel}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M3.333 8h9.334M8.667 4L12.667 8l-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      )}
    </>
  );

  const baseClass = `
    md:col-span-2 md:row-span-2
    rounded-[24px]
    p-6 md:p-8
    flex flex-col
    min-h-[300px]
    transition-all duration-200 ease-out
    relative overflow-hidden
  `.trim().replace(/\s+/g, " ");

  const containerStyle = {
    background: style.bgGradient,
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${style.borderColor}`,
    borderTop: `1px solid rgba(255, 255, 255, 0.6)`,
    boxShadow: `0 12px 40px ${style.shadowColor}, 0 4px 12px rgba(26, 22, 18, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.4)`,
  };

  const hoverStyle = {
    ...containerStyle,
    boxShadow: `0 20px 56px ${style.shadowColor}, 0 8px 20px rgba(26, 22, 18, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.5)`,
    transform: "translateY(-3px)",
  };

  if (ctaHref) {
    return (
      <a
        href={ctaHref}
        className={`${baseClass} no-underline`}
        style={containerStyle}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, hoverStyle);
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, { ...containerStyle, transform: "translateY(0)" });
        }}
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
