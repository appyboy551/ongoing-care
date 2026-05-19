// Access tier guards. Server-side only.

import { Tier } from "@prisma/client";
import { getCurrentMember, CurrentMember } from "./auth";

export function canView(viewerTier: Tier, requiredTier: Tier): boolean {
  // Tier hierarchy: ADMIN > FULL_MEDICAL > SHARED
  const rank: Record<Tier, number> = {
    SHARED: 1,
    FULL_MEDICAL: 2,
    ADMIN: 3,
  };
  return rank[viewerTier] >= rank[requiredTier];
}

export async function requireMember(): Promise<CurrentMember> {
  const m = await getCurrentMember();
  if (!m) {
    throw new Response("Unauthorized", { status: 401 });
  }
  return m;
}

export async function requireTier(required: Tier): Promise<CurrentMember> {
  const m = await requireMember();
  if (!canView(m.tier, required)) {
    throw new Response("Forbidden", { status: 403 });
  }
  return m;
}

export async function requireAdmin(): Promise<CurrentMember> {
  return requireTier("ADMIN");
}
