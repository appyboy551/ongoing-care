import { ReactNode } from "react";
import Link from "next/link";
import { NavItem, ADMIN_NAV, NETWORK_NAV } from "@/content/navigation";
import { canView } from "@/lib/tier";
import { Tier } from "@prisma/client";
import LiveCaseBanner from "@/components/LiveCaseBanner";
import CrisisTakeover from "@/components/CrisisTakeover";
import { getCurrentMember, getViewMode, getRealAdminFromSession } from "@/lib/auth";
import { getActiveCase } from "@/lib/active-case";
import StopImpersonationButton from "@/components/StopImpersonationButton";
import ViewModeToggle from "@/components/ViewModeToggle";

export type ShellProps = {
  children: ReactNode;
  nav: NavItem[];
  currentPath?: string;
  brandLine?: string;
  brandSub?: string;
  viewerTier: Tier;
  viewerName?: string | null;
};

function groupNavItems(items: NavItem[]) {
  return items.reduce((acc, item) => {
    const groupName = item.group || "Menu";
    if (!acc[groupName]) acc[groupName] = [];
    acc[groupName].push(item);
    return acc;
  }, {} as Record<string, NavItem[]>);
}

export default async function ShellLayout(props: ShellProps) {
  const viewer = await getCurrentMember();
  const isImpersonating = viewer?.isImpersonating === true;

  const realAdmin = await getRealAdminFromSession();
  const viewMode = realAdmin ? getViewMode() : null;
  let effectiveNav = props.nav;

  if (realAdmin && !isImpersonating) {
    if (viewMode === "network") effectiveNav = NETWORK_NAV;
    else if (viewMode === "admin") effectiveNav = ADMIN_NAV;
  }

  const items = effectiveNav.filter((i) => canView(props.viewerTier, i.requires));
  const groupedItems = groupNavItems(items);

  // Smart disclosure: only the group containing the current path expands by
  // default. Other groups stay collapsed so the sidebar stays scannable.
  // If no path matches (e.g. on a deep route), open the first group as fallback.
  const activeGroup =
    items.find((i) => i.href === props.currentPath)?.group ??
    Object.keys(groupedItems)[0];

  const isAdminView = effectiveNav[0]?.href === "/admin";
  const showViewToggle = realAdmin !== null && !isImpersonating;
  const currentMode: "admin" | "network" = isAdminView ? "admin" : "network";

  const activeCase = await getActiveCase();
  // CrisisTakeover now fires for both OPEN (ARMED) and ESCALATED cases.
  // Copy and tint inside the overlay adapt to which one is live.

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-bg text-ink">
      <aside className="hidden md:block w-[268px] bg-card border-r border-line p-7 fixed h-screen overflow-y-auto">
        <div className="pb-5 border-b border-line mb-4">
          <div className="text-base font-bold">{props.brandLine ?? "Ongoing Care"}</div>
          <div className="text-sm text-ink-soft mt-1">{props.brandSub ?? "Support network portal"}</div>
          {props.viewerName && <div className="text-xs text-ink-soft mt-2">Signed in as {props.viewerName}</div>}
          {showViewToggle && <ViewModeToggle current={currentMode} />}
        </div>

        <nav aria-label="Primary" className="flex flex-col gap-2">
          {Object.entries(groupedItems).map(([groupName, groupItems]) => (
            <details key={groupName} open={groupName === activeGroup} className="group">
              <summary className="text-[11px] uppercase tracking-wider font-bold text-ink-soft px-4 py-2 cursor-pointer list-none select-none hover:text-ink transition-colors outline-none">
                {groupName}
              </summary>
              <div className="flex flex-col mt-1">
                {groupItems.map((it) => {
                  const active = props.currentPath === it.href;
                  return (
                    <Link
                      key={it.href}
                      href={it.href}
                      className={"block px-4 py-2.5 rounded-xl text-[14.5px] font-medium mb-1 transition-colors " + (active ? "bg-accent text-white" : "text-ink-soft hover:bg-accent-soft hover:text-accent")}
                    >
                      {it.emoji && <span aria-hidden="true" className="mr-2">{it.emoji}</span>}
                      {it.label}
                      {it.badge && <span className="ml-2 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-bg text-amber">{it.badge}</span>}
                    </Link>
                  );
                })}
              </div>
            </details>
          ))}
          <form action="/api/auth/logout" method="post" className="mt-4 pt-4 border-t border-line">
            <button className="text-sm font-medium text-ink-soft hover:text-red px-4 py-2">Sign out</button>
          </form>
        </nav>
      </aside>

      <MobileTopBar groupedItems={groupedItems} currentPath={props.currentPath} viewerName={props.viewerName ?? null} showViewToggle={showViewToggle} currentMode={currentMode} />

      <main id="main-content" className="md:ml-[268px] flex-1 max-w-[1100px] relative">
        <CrisisTakeover
          caseStatus={activeCase?.status ?? null}
          caseId={activeCase?.id ?? ""}
          logId={activeCase?.originSeroquelLogId ?? null}
        />
        {isImpersonating && viewer && (
          <div role="status" aria-live="polite" className="bg-amber-bg border-b border-[#f0dca8] px-4 md:px-10 py-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-3">
              <div className="text-[13px] text-amber">
                <strong>Impersonating {viewer.shortName ?? viewer.fullName} ({viewer.tier})</strong>
                <span className="block md:inline md:ml-2 text-ink-soft mt-1 md:mt-0">Read-only.</span>
              </div>
              <StopImpersonationButton />
            </div>
          </div>
        )}
        <LiveCaseBanner />
        <div className="px-4 md:px-10 py-6 md:py-9">{props.children}</div>
      </main>
    </div>
  );
}

function MobileTopBar(props: { groupedItems: Record<string, NavItem[]>; currentPath?: string; viewerName: string | null; showViewToggle: boolean; currentMode: "admin" | "network" }) {
  return (
    <div className="md:hidden sticky top-0 z-50 bg-card border-b border-line">
      <details className="group">
        <summary className="flex items-center justify-between px-4 py-3 cursor-pointer list-none outline-none">
          <div>
            <div className="text-[15px] font-bold">Ongoing Care</div>
            <div className="text-xs text-ink-soft">{props.viewerName ? `Signed in as ${props.viewerName}` : "Support network portal"}</div>
          </div>
          <span className="bg-accent text-white rounded-lg px-3 py-2 text-[13px] font-semibold">Menu</span>
        </summary>
        <nav className="border-t border-line max-h-[calc(100dvh-72px)] overflow-y-auto" aria-label="Primary">
          {props.showViewToggle && (
            <div className="px-5 py-3 border-b border-line bg-bg">
              <ViewModeToggle current={props.currentMode} />
            </div>
          )}
          {Object.entries(props.groupedItems).map(([groupName, groupItems]) => (
            <div key={groupName} className="py-2 border-b border-line last:border-b-0">
              <div className="px-5 py-2 text-[11px] font-bold uppercase tracking-wider text-ink-soft">{groupName}</div>
              {groupItems.map((it) => {
                const active = props.currentPath === it.href;
                return (
                  <Link key={it.href} href={it.href} className={"block px-5 py-3 text-[14.5px] font-medium " + (active ? "bg-accent-soft text-accent" : "text-ink")}>
                    {it.emoji && <span aria-hidden="true" className="mr-2">{it.emoji}</span>}
                    {it.label}
                  </Link>
                );
              })}
            </div>
          ))}
          <form action="/api/auth/logout" method="post" className="px-5 py-4 border-t border-line bg-bg">
            <button className="text-sm font-medium text-red">Sign out</button>
          </form>
        </nav>
      </details>
    </div>
  );
}
