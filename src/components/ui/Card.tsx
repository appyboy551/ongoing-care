import { ReactNode } from "react";

export function Card(props: { children: ReactNode; className?: string }) {
  return (
    <div
      className={
        "bg-card border border-line rounded-card-lg p-6 md:p-7 mb-4 " + (props.className ?? "")
      }
    >
      {props.children}
    </div>
  );
}

export function SectionTitle(props: { children: ReactNode }) {
  return (
    <div className="text-[13px] font-bold uppercase tracking-wider text-accent mb-3">
      {props.children}
    </div>
  );
}

export function PageHead(props: { title: ReactNode; sub?: ReactNode }) {
  return (
    <header className="mb-6">
      <h1 className="font-bold tracking-tight text-[clamp(1.5rem,1.2rem+1.6vw,2.25rem)] leading-tight">
        {props.title}
      </h1>
      {props.sub ? (
        <p className="text-ink-soft mt-1 text-[clamp(0.875rem,0.8rem+0.3vw,1rem)]">{props.sub}</p>
      ) : null}
    </header>
  );
}

// Bento tile: variable-sized panel for the dashboard grid. Spans default to
// 1x1 on mobile; on md+ they expand based on the `size` prop.
export function BentoTile(props: {
  children: ReactNode;
  size?: "hero" | "wide" | "tall" | "square";
  tone?: "calm" | "armed" | "missed" | "frost";
  href?: string;
  className?: string;
}) {
  const size = props.size ?? "square";
  const tone = props.tone ?? "frost";
  // md grid is 4 columns. Hero = 2x2, wide = 2x1, tall = 1x2, square = 1x1.
  const spans = {
    hero: "md:col-span-2 md:row-span-2",
    wide: "md:col-span-2 md:row-span-1",
    tall: "md:col-span-1 md:row-span-2",
    square: "md:col-span-1 md:row-span-1",
  }[size];
  const toneClass = {
    calm: "mesh-calm border border-line/60",
    armed: "mesh-armed border border-[#e8c986]",
    missed: "mesh-missed border border-[#e7adad]",
    frost: "ghost-frost",
  }[tone];
  const base = `${spans} ${toneClass} rounded-[24px] p-5 md:p-6 tactile flex flex-col min-h-[140px] ${props.className ?? ""}`;
  if (props.href) {
    return (
      <a href={props.href} className={`${base} no-underline text-ink hover:shadow-md`}>
        {props.children}
      </a>
    );
  }
  return <div className={base}>{props.children}</div>;
}

export function Pill(props: {
  tone: "green" | "amber" | "red" | "neutral";
  children: ReactNode;
}) {
  const tone = {
    green: "bg-green-bg text-green",
    amber: "bg-amber-bg text-amber",
    red: "bg-red-bg text-red",
    neutral: "bg-[#e6e9ec] text-ink-soft",
  }[props.tone];
  return (
    <span
      className={"inline-block text-[11.5px] font-semibold px-3 py-1 rounded-full " + tone}
    >
      {props.children}
    </span>
  );
}

export function Metric(props: { label: string; value: ReactNode; sub?: string }) {
  return (
    <div className="bg-card border border-line rounded-card p-5 text-center">
      <div className="text-[12px] uppercase tracking-wider text-ink-soft">{props.label}</div>
      <div className="text-xl font-bold my-2">{props.value}</div>
      {props.sub ? <div className="text-xs text-ink-soft">{props.sub}</div> : null}
    </div>
  );
}

export function Step(props: { number: number; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-4 mb-4 last:mb-0">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent text-white font-bold text-sm flex items-center justify-center">
        {props.number}
      </div>
      <div>
        <h4 className="text-[15px] font-bold mb-1">{props.title}</h4>
        <div className="text-[14px] text-ink">{props.children}</div>
      </div>
    </div>
  );
}

export function Warn(props: { children: ReactNode }) {
  return (
    <div className="bg-red-bg border border-[#f0c4c4] rounded-2xl px-4 py-3 text-[13.5px] font-semibold text-red my-3">
      {props.children}
    </div>
  );
}
