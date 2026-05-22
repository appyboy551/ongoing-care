"use client";

interface CallCardProps {
  number: string;
  label: string;
  sublabel?: string;
  tone: "emergency" | "support";
}

export default function CallCard({ number, label, sublabel, tone }: CallCardProps) {
  const styles = {
    emergency: {
      bg: "linear-gradient(145deg, rgba(168, 37, 43, 0.08) 0%, rgba(168, 37, 43, 0.02) 50%, rgba(255, 255, 255, 0.5) 100%)",
      border: "rgba(168, 37, 43, 0.12)",
      shadow: "0 6px 20px rgba(168, 37, 43, 0.08)",
      hoverShadow: "0 12px 32px rgba(168, 37, 43, 0.12)",
      iconBg: "linear-gradient(135deg, #A8252B 0%, #8B1F24 100%)",
      numberColor: "#A8252B",
    },
    support: {
      bg: "linear-gradient(145deg, rgba(190, 24, 93, 0.08) 0%, rgba(190, 24, 93, 0.02) 50%, rgba(255, 255, 255, 0.5) 100%)",
      border: "rgba(190, 24, 93, 0.12)",
      shadow: "0 6px 20px rgba(190, 24, 93, 0.08)",
      hoverShadow: "0 12px 32px rgba(190, 24, 93, 0.12)",
      iconBg: "linear-gradient(135deg, #BE185D 0%, #9D174D 100%)",
      numberColor: "#BE185D",
    },
  };

  const s = styles[tone];

  return (
    <a
      href={`tel:${number.replace(/\s/g, "")}`}
      className="flex items-center gap-4 p-4 rounded-[16px] transition-all duration-200 ease-out no-underline group"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        borderTop: "1px solid rgba(255, 255, 255, 0.5)",
        boxShadow: s.shadow,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = s.hoverShadow;
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = s.shadow;
        e.currentTarget.style.transform = "translateY(0)";
      }}
    >
      {/* Phone icon */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: s.iconBg,
          boxShadow: "0 4px 12px rgba(26, 22, 18, 0.15)",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
        </svg>
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <div
          className="font-mono text-[18px] font-bold tracking-wide"
          style={{ color: s.numberColor }}
        >
          {number}
        </div>
        <div className="text-[13px] font-semibold mt-0.5" style={{ color: "#1A1612" }}>
          {label}
        </div>
        {sublabel && (
          <div className="text-[11px] mt-0.5" style={{ color: "#5C594F" }}>
            {sublabel}
          </div>
        )}
      </div>

      {/* Arrow */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#5C594F"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </a>
  );
}
