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
      bg: "linear-gradient(135deg, rgba(168, 37, 43, 0.06) 0%, rgba(168, 37, 43, 0.02) 100%)",
      border: "rgba(168, 37, 43, 0.15)",
      iconBg: "#A8252B",
      numberColor: "#A8252B",
    },
    support: {
      bg: "linear-gradient(135deg, rgba(190, 24, 93, 0.06) 0%, rgba(190, 24, 93, 0.02) 100%)",
      border: "rgba(190, 24, 93, 0.15)",
      iconBg: "#BE185D",
      numberColor: "#BE185D",
    },
  };

  const s = styles[tone];

  return (
    <a
      href={`tel:${number.replace(/\s/g, "")}`}
      className="flex items-center gap-4 p-4 rounded-[16px] transition-all duration-150 ease-out hover:shadow-[0_6px_16px_rgba(26,22,18,0.08)] hover:-translate-y-0.5 active:translate-y-0 no-underline"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
      }}
    >
      {/* Phone icon */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: s.iconBg }}
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
        <div className="text-[12px] font-semibold mt-0.5" style={{ color: "#1A1612" }}>
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
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="#5C594F"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="flex-shrink-0"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </a>
  );
}
