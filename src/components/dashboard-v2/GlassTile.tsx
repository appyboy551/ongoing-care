"use client";

import { ReactNode } from "react";

export type GlassTileSize = "hero" | "wide" | "tall" | "square" | "full";

interface GlassTileProps {
  children: ReactNode;
  size?: GlassTileSize;
  className?: string;
  href?: string;
}

export default function GlassTile({ children, size = "square", className = "", href }: GlassTileProps) {
  // Grid spans for md+ (4-column grid)
  const spans: Record<GlassTileSize, string> = {
    hero: "md:col-span-2 md:row-span-2",
    wide: "md:col-span-2 md:row-span-1",
    tall: "md:col-span-1 md:row-span-2",
    square: "md:col-span-1 md:row-span-1",
    full: "md:col-span-4 md:row-span-1",
  };

  const base = `
    ${spans[size]}
    rounded-[24px]
    p-5 md:p-6
    flex flex-col
    min-h-[140px]
    transition-all duration-200 ease-out
    ${className}
  `.trim().replace(/\s+/g, " ");

  // Premium frosted glass style with deeper shadows
  const glassStyle = {
    background: "rgba(255, 255, 255, 0.65)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    border: "1px solid rgba(255, 255, 255, 0.7)",
    borderTop: "1px solid rgba(255, 255, 255, 0.9)",
    boxShadow: "0 8px 32px rgba(26, 22, 18, 0.08), 0 2px 8px rgba(26, 22, 18, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.5)",
  };

  const hoverStyle = {
    ...glassStyle,
    background: "rgba(255, 255, 255, 0.75)",
    boxShadow: "0 16px 48px rgba(26, 22, 18, 0.12), 0 4px 12px rgba(26, 22, 18, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.6)",
    transform: "translateY(-2px)",
  };

  if (href) {
    return (
      <a
        href={href}
        className={`${base} no-underline text-[#1A1612] hover:shadow-lg`}
        style={glassStyle}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, hoverStyle);
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, { ...glassStyle, transform: "translateY(0)" });
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <div className={base} style={glassStyle}>
      {children}
    </div>
  );
}
