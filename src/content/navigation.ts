import { Tier } from "@prisma/client";

export type NavItem = {
  label: string;
  href: string;
  // Minimum tier required to see the item.
  requires: Tier;
  // Optional decorative emoji rendered before the label.
  emoji?: string;
  // Optional badge text rendered after the label.
  badge?: string;
  // Optional structural grouping for sidebar disclosure panels. Items with the
  // same `group` render together under a collapsible heading. Items without a
  // group render flat (typically at the top of the sidebar above any groups).
  group?: string;
};

// Network-side sidebar. Light grouping: a "Now" cluster of action surfaces,
// an info cluster for people and records, a personal cluster at the bottom.
export const NETWORK_NAV: NavItem[] = [
  { label: "Current state", href: "/dashboard", requires: "SHARED", emoji: "🏠", group: "Now" },
  { label: "Live case", href: "/cases", requires: "SHARED", emoji: "🟢", group: "Now" },
  { label: "Action plan", href: "/action-plan", requires: "SHARED", emoji: "📋", group: "Now" },
  { label: "I need help now", href: "/help-now", requires: "SHARED", emoji: "🚑", group: "Now" },

  { label: "Support network", href: "/network", requires: "SHARED", emoji: "👥", group: "People & info" },
  { label: "Medical", href: "/medical", requires: "FULL_MEDICAL", emoji: "🩺", group: "People & info" },
  { label: "Financial detail", href: "/financial-detail", requires: "FULL_MEDICAL", emoji: "💰", group: "People & info" },

  { label: "My details", href: "/me", requires: "SHARED", emoji: "👤", group: "Personal" },
  { label: "Settings", href: "/settings", requires: "SHARED", emoji: "⚙️", group: "Personal" },
];

// Admin-side sidebar. Grouped so the long list of data-management pages
// collapses into disclosure panels. Keep the most-used items first.
export const ADMIN_NAV: NavItem[] = [
  // Day to day: the surfaces David touches every visit.
  { label: "Admin dashboard", href: "/admin", requires: "ADMIN", emoji: "🛠️", group: "Day to day" },
  { label: "Log Seroquel", href: "/admin/log-seroquel", requires: "ADMIN", emoji: "💊", group: "Day to day" },
  { label: "Check in", href: "/admin/check-in", requires: "ADMIN", emoji: "✅", group: "Day to day" },
  { label: "Live case", href: "/cases", requires: "ADMIN", emoji: "🟢", group: "Day to day" },

  // Care plan content: published copy and content authoring tools.
  { label: "Content", href: "/admin/content", requires: "ADMIN", emoji: "📝", group: "Care plan content" },
  { label: "Content sections", href: "/admin/content-sections", requires: "ADMIN", emoji: "📄", group: "Care plan content" },
  { label: "Brain-dump to draft", href: "/admin/draft-helper", requires: "ADMIN", emoji: "🧠", group: "Care plan content" },
  { label: "Programs", href: "/admin/programs", requires: "ADMIN", emoji: "🤝", group: "Care plan content" },

  // People: the network and the care team.
  { label: "Network", href: "/admin/network", requires: "ADMIN", emoji: "👥", group: "People" },
  { label: "Care team", href: "/admin/care-team", requires: "ADMIN", emoji: "🧑‍⚕️", group: "People" },
  { label: "Clinician access", href: "/admin/clinician", requires: "ADMIN", emoji: "🩺", group: "People" },

  // Health record: clinical-side data the network and clinicians draw from.
  { label: "Medications", href: "/admin/medications", requires: "ADMIN", emoji: "💊", group: "Health record" },
  { label: "Pharmacist reviews", href: "/admin/pharmacist-reviews", requires: "ADMIN", emoji: "🧪", group: "Health record" },
  { label: "Admissions", href: "/admin/admissions", requires: "ADMIN", emoji: "🏥", group: "Health record" },
  { label: "Medicare and Medibank", href: "/admin/secure-numbers", requires: "ADMIN", emoji: "🔐", group: "Health record" },

  // Admin: settings + audit (rarely visited day-to-day).
  { label: "Settings", href: "/admin/settings", requires: "ADMIN", emoji: "⚙️", group: "Admin" },
  { label: "Audit log", href: "/admin/audit", requires: "ADMIN", emoji: "📜", group: "Admin" },

  // Personal: David's own profile.
  { label: "My details", href: "/me", requires: "ADMIN", emoji: "👤", group: "Personal" },
];

// Canonical group order for renderers. Items whose group isn't in this list
// fall to the end; ungrouped items render before any groups (flat).
export const NAV_GROUP_ORDER = [
  "Now",
  "Day to day",
  "People & info",
  "Care plan content",
  "People",
  "Health record",
  "Admin",
  "Personal",
];
