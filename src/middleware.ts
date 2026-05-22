// Route protection. Lightweight: only checks the presence of the session cookie.
// Real tier checks happen in server components / route handlers via lib/tier.ts.

import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/", // landing redirects to login if needed
  "/login",
  "/login/verify",
  "/api/auth/request-otp",
  "/api/auth/verify-otp",
  "/clinician", // clinician grant landing (uses its own token)
  "/dashboard-preview", // visual design preview (no auth)
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow Next.js internals and static assets.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icons") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/apple-icon") ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/manifest.json" ||
    pathname.startsWith("/api/webhooks") ||
    pathname.startsWith("/api/cron") // protected by CRON_SECRET inside the route
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/clinician/");
  const hasSession = req.cookies.has("ocp_session");

  if (isPublic) return NextResponse.next();

  if (!hasSession) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  // Confirmation gate: members who haven't confirmed their phone are pinned to /me.
  const needsConfirm = req.cookies.has("ocp_needs_confirm");
  if (needsConfirm) {
    const gateAllowed =
      pathname === "/me" ||
      pathname === "/api/me" ||
      pathname === "/api/auth/logout";
    if (!gateAllowed) {
      const url = req.nextUrl.clone();
      url.pathname = "/me";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Onboarding gate: after confirming phone, members walk through the onboarding screens.
  const needsOnboarding = req.cookies.has("ocp_needs_onboarding");
  if (needsOnboarding) {
    const gateAllowed =
      pathname.startsWith("/onboarding") ||
      pathname === "/api/onboarding/complete" ||
      pathname === "/api/auth/logout";
    if (!gateAllowed) {
      const url = req.nextUrl.clone();
      url.pathname = "/onboarding";
      url.search = "";
      return NextResponse.redirect(url);
    }
  }

  // Impersonation write-protection: while the admin is impersonating, block
  // write requests so they cannot accidentally mutate the impersonated user's
  // records (set their phone, complete their onboarding, etc.). Allow only the
  // stop-impersonation, view-mode switch, and logout endpoints.
  const isImpersonating = req.cookies.has("ocp_impersonating");
  const isWrite = ["POST", "PATCH", "PUT", "DELETE"].includes(req.method);
  if (isImpersonating && isWrite) {
    const writeAllowed =
      pathname === "/api/admin/impersonate" ||
      pathname === "/api/admin/view-mode" ||
      pathname === "/api/auth/logout";
    if (!writeAllowed) {
      return NextResponse.json(
        {
          error:
            "Impersonation is read-only. Stop impersonating first if you want to take this action as yourself.",
        },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
