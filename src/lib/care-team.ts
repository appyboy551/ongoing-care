// Resolver for the Seroquel alert CTA.
//
// Phase 0 safety fix. The previous alert modal pointed at /appointments/new,
// which does not exist. This helper returns a real destination: a tel: link
// to a current GP or psychiatrist where one is on file with a phone, falling
// back to /help-now which already lists Lifeline, the NSW Mental Health
// Line, and 000.

import { db } from "./db";

export type AlertCtaInfo = {
  href: string;
  label: string;
  // True when the helper could not find a usable care-team contact and fell
  // back to /help-now. Surfacing this lets callers (or the report) decide
  // whether to prompt the admin to populate the care team.
  isFallback: boolean;
};

const FALLBACK: AlertCtaInfo = {
  href: "/help-now",
  label: "See who to call",
  isFallback: true,
};

export async function getAlertCtaInfo(): Promise<AlertCtaInfo> {
  // Current care-team members with a phone on file.
  const candidates = await db.careTeamMember.findMany({
    where: { isCurrent: true, phone: { not: null } },
    select: { name: true, role: true, phone: true },
  });
  if (candidates.length === 0) return FALLBACK;

  // Prefer psychiatrist because dose-pattern alerts are a psychiatric review
  // prompt rather than a primary-care prompt. Fall back to GP otherwise.
  const matches = candidates.filter((c) => {
    const role = (c.role ?? "").toLowerCase();
    return (
      role.includes("psychiatr") ||
      role.includes("gp") ||
      role.includes("general practitioner")
    );
  });
  if (matches.length === 0) return FALLBACK;

  const preferred =
    matches.find((c) => (c.role ?? "").toLowerCase().includes("psychiatr")) ??
    matches[0];
  if (!preferred.phone) return FALLBACK;

  return {
    href: `tel:${preferred.phone.replace(/\s+/g, "")}`,
    label: `Call ${preferred.name}`,
    isFallback: false,
  };
}
