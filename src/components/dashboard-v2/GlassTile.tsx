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
    rounded-[20px]
    p-5 md:p-6
    flex flex-col
    min-h-[140px]
    border border-[#E4E0D6]
    transition-all duration-150 ease-out
    ${className}
  `.trim().replace(/\s+/g, " ");

  // Frosted glass style
  const glassStyle = {
    background: "rgba(255, 255, 255, 0.72)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
  };

  if (href) {
    return (
      <a
        href={href}
        className={`${base} no-underline text-[#1A1612] hover:shadow-[0_8px_24px_rgba(26,22,18,0.08)] hover:-translate-y-0.5 active:translate-y-0`}
        style={glassStyle}
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
