"use client";

import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  emoji?: string;
}

interface NavGroup {
  name: string;
  items: NavItem[];
}

interface SidebarProps {
  viewerName: string;
  viewerRole: "NETWORK" | "ADMIN" | "MEDICAL" | "SHARED";
  currentPath?: string;
  navGroups: NavGroup[];
  isAdmin?: boolean;
  currentMode?: "admin" | "network";
  onModeChange?: (mode: "admin" | "network") => void;
}

export default function Sidebar({
  viewerName,
  viewerRole,
  currentPath = "/dashboard",
  navGroups,
  isAdmin = false,
  currentMode = "network",
  onModeChange,
}: SidebarProps) {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    // Auto-expand the group containing the current path
    const result: Record<string, boolean> = {};
    navGroups.forEach((group) => {
      const hasActiveItem = group.items.some((item) => item.href === currentPath);
      result[group.name] = hasActiveItem;
    });
    // If no group has active item, expand first
    if (!Object.values(result).some(Boolean) && navGroups.length > 0) {
      result[navGroups[0].name] = true;
    }
    return result;
  });

  const toggleGroup = (name: string) => {
    setExpandedGroups((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const roleBadgeColors: Record<string, { bg: string; text: string }> = {
    NETWORK: { bg: "#EDE9FE", text: "#6D28A8" },
    ADMIN: { bg: "#FBEAF3", text: "#BE185D" },
    MEDICAL: { bg: "#E0F7FA", text: "#0E7490" },
    SHARED: { bg: "#F0EDE6", text: "#5C594F" },
  };

  const badge = roleBadgeColors[viewerRole] || roleBadgeColors.NETWORK;

  return (
    <aside
      className="hidden md:flex flex-col w-[268px] fixed h-screen overflow-y-auto p-6"
      style={{
        background: "rgba(255, 255, 255, 0.72)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRight: "1px solid #E4E0D6",
      }}
    >
      {/* Brand */}
      <div className="pb-5 border-b border-[#E4E0D6] mb-4">
        <div className="font-serif text-[18px] tracking-[-0.01em]" style={{ color: "#1A1612" }}>
          David Care Plan
        </div>
        <div className="text-[12px] mt-2" style={{ color: "#5C594F" }}>
          Signed in as
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[14px] font-semibold" style={{ color: "#1A1612" }}>
            {viewerName}
          </span>
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.06em] px-2 py-0.5 rounded-full"
            style={{ background: badge.bg, color: badge.text }}
          >
            {viewerRole}
          </span>
        </div>
      </div>

      {/* Admin/Network toggle */}
      {isAdmin && onModeChange && (
        <div className="mb-4 pb-4 border-b border-[#E4E0D6]">
          <div className="flex rounded-full p-1" style={{ background: "#F0EDE6" }}>
            <button
              onClick={() => onModeChange("network")}
              className={`flex-1 text-[12px] font-semibold py-2 px-4 rounded-full transition-all duration-150 ${
                currentMode === "network" ? "" : "hover:opacity-70"
              }`}
              style={{
                background: currentMode === "network" ? "#FFFFFF" : "transparent",
                color: currentMode === "network" ? "#1A1612" : "#5C594F",
                boxShadow: currentMode === "network" ? "0 2px 8px rgba(26,22,18,0.08)" : "none",
              }}
            >
              Network view
            </button>
            <button
              onClick={() => onModeChange("admin")}
              className={`flex-1 text-[12px] font-semibold py-2 px-4 rounded-full transition-all duration-150 ${
                currentMode === "admin" ? "" : "hover:opacity-70"
              }`}
              style={{
                background: currentMode === "admin" ? "#FFFFFF" : "transparent",
                color: currentMode === "admin" ? "#1A1612" : "#5C594F",
                boxShadow: currentMode === "admin" ? "0 2px 8px rgba(26,22,18,0.08)" : "none",
              }}
            >
              Admin view
            </button>
          </div>
        </div>
      )}

      {/* Navigation groups */}
      <nav className="flex-1 flex flex-col gap-1" aria-label="Primary">
        {navGroups.map((group) => (
          <div key={group.name} className="mb-2">
            <button
              onClick={() => toggleGroup(group.name)}
              className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.1em] cursor-pointer select-none transition-colors hover:opacity-70"
              style={{ color: "#5C594F" }}
              aria-expanded={expandedGroups[group.name]}
            >
              {group.name}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-150 ${expandedGroups[group.name] ? "rotate-180" : ""}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {expandedGroups[group.name] && (
              <div className="mt-1 flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const isActive = currentPath === item.href;
                  return (
                    <a
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-[12px] text-[14px] font-medium no-underline transition-all duration-150"
                      style={{
                        background: isActive ? "#BE185D" : "transparent",
                        color: isActive ? "#FFFFFF" : "#5C594F",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "rgba(190, 24, 93, 0.08)";
                          e.currentTarget.style.color = "#BE185D";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "#5C594F";
                        }
                      }}
                    >
                      {item.emoji && <span aria-hidden="true">{item.emoji}</span>}
                      {item.label}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Sign out */}
      <div className="pt-4 mt-auto border-t border-[#E4E0D6]">
        <button
          className="text-[13px] font-medium px-3 py-2 transition-colors"
          style={{ color: "#5C594F" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#A8252B")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#5C594F")}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
