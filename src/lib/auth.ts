// Session creation and reading. Cookie-based, HTTP-only, signed by storing only the hash on disk.

import { cookies } from "next/headers";
import { db } from "./db";
import { randomToken, sha256 } from "./crypto";
import { Tier } from "@prisma/client";

const COOKIE_NAME = "ocp_session";
const GATE_COOKIE = "ocp_needs_confirm";
const ONBOARDING_COOKIE = "ocp_needs_onboarding";
const IMPERSONATE_COOKIE = "ocp_impersonating";
const VIEW_MODE_COOKIE = "ocp_view_mode";
const SESSION_TTL_DAYS = 30;
const IMPERSONATION_TTL_SECONDS = 60 * 60; // 1 hour cap

export type ViewMode = "admin" | "network";

export function getViewMode(): ViewMode | null {
  const v = cookies().get(VIEW_MODE_COOKIE)?.value;
  return v === "admin" || v === "network" ? v : null;
}

export function setViewMode(mode: ViewMode) {
  cookies().set(VIEW_MODE_COOKIE, mode, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export type CurrentMember = {
  id: string;
  fullName: string;
  shortName: string | null;
  email: string;
  tier: Tier;
  // When true, this viewer is the product of an active impersonation by an ADMIN.
  // The real admin's id is in impersonatedBy.
  isImpersonating?: boolean;
  impersonatedBy?: string;
};

export async function createSession(args: {
  memberId: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  const token = randomToken(32);
  const tokenHash = await sha256(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60_000);

  await db.session.create({
    data: {
      memberId: args.memberId,
      tokenHash,
      expiresAt,
      ipAddress: args.ipAddress,
      userAgent: args.userAgent,
    },
  });

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  // Set or clear the two gate cookies (phone confirm + onboarding walkthrough).
  const member = await db.member.findUnique({
    where: { id: args.memberId },
    select: { tier: true, profileConfirmedAt: true, onboardingCompletedAt: true },
  });
  const isNonAdmin = member?.tier !== "ADMIN";
  const needsConfirm = isNonAdmin && !member?.profileConfirmedAt;
  const needsOnboarding = isNonAdmin && !member?.onboardingCompletedAt;
  const baseCookie = {
    httpOnly: false,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
  if (needsConfirm) cookies().set(GATE_COOKIE, "1", baseCookie);
  else cookies().delete(GATE_COOKIE);
  if (needsOnboarding) cookies().set(ONBOARDING_COOKIE, "1", baseCookie);
  else cookies().delete(ONBOARDING_COOKIE);
}

export function clearConfirmationGateCookie() {
  cookies().delete(GATE_COOKIE);
}

export function clearOnboardingGateCookie() {
  cookies().delete(ONBOARDING_COOKIE);
}

export async function getCurrentMember(): Promise<CurrentMember | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const tokenHash = await sha256(token);
  const session = await db.session.findUnique({
    where: { tokenHash },
    include: { member: true },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) {
    return null;
  }
  const realMember = session.member;

  // Impersonation: only ADMIN may impersonate, and we never impersonate self.
  if (realMember.tier === "ADMIN") {
    const targetId = cookies().get(IMPERSONATE_COOKIE)?.value;
    if (targetId && targetId !== realMember.id) {
      const target = await db.member.findUnique({ where: { id: targetId } });
      if (target && target.isActive) {
        return {
          id: target.id,
          fullName: target.fullName,
          shortName: target.shortName,
          email: target.email,
          tier: target.tier,
          isImpersonating: true,
          impersonatedBy: realMember.id,
        };
      }
    }
  }

  return {
    id: realMember.id,
    fullName: realMember.fullName,
    shortName: realMember.shortName,
    email: realMember.email,
    tier: realMember.tier,
  };
}

/**
 * Returns the real admin Member from the session cookie, ignoring any impersonation cookie.
 * Used by the impersonation control endpoints so they cannot be tricked by a stale cookie.
 */
export async function getRealAdminFromSession(): Promise<CurrentMember | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  const tokenHash = await sha256(token);
  const session = await db.session.findUnique({
    where: { tokenHash },
    include: { member: true },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  if (session.member.tier !== "ADMIN") return null;
  return {
    id: session.member.id,
    fullName: session.member.fullName,
    shortName: session.member.shortName,
    email: session.member.email,
    tier: session.member.tier,
  };
}

export function setImpersonationCookie(targetMemberId: string) {
  cookies().set(IMPERSONATE_COOKIE, targetMemberId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: IMPERSONATION_TTL_SECONDS,
  });
}

export function clearImpersonationCookie() {
  cookies().delete(IMPERSONATE_COOKIE);
}

export async function destroyCurrentSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (token) {
    const tokenHash = await sha256(token);
    await db.session.updateMany({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }
  cookies().delete(COOKIE_NAME);
  cookies().delete(GATE_COOKIE);
  cookies().delete(ONBOARDING_COOKIE);
  cookies().delete(IMPERSONATE_COOKIE);
}
