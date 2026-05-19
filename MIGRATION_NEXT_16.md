# Next.js 16 migration plan

Generated 18 May 2026 during the build session. Hand this to whoever runs the migration.

## Why

Next 14.2.35 (currently installed) has 5 unpatched audit findings that **only clear with a major bump to Next 15+ or 16**. The one most relevant to us is **App Router XSS via CSP nonces** (GHSA-ffhc-5mcf-pf4q) because we use App Router throughout.

Other findings, in rough order of relevance to this portal:
- App Router XSS via CSP nonces ← we use App Router
- Cache poisoning in RSC responses ← we use RSC
- Cache poisoning via RSC cache-busting collisions ← we use RSC
- Server Components DoS ← we use Server Components
- Middleware/Proxy cache poisoning ← we use middleware
- DoS in Image Optimization API ← not used heavily
- SSRF in WebSocket upgrades ← not used
- Middleware bypass with i18n ← we don't use i18n
- PostCSS XSS (transitive) ← needs the Next bump to pull the fix

Before clinicians have grant URLs in the wild, this matters.

## Scope of the breaking changes

The big one is **async dynamic APIs** introduced in Next 15:

- `cookies()` now returns a Promise. Every call site needs `await`.
- `headers()` now returns a Promise. (We have 0 call sites currently.)
- `params` in pages and route handlers is now a Promise, typed `Promise<{ id: string }>`.
- `searchParams` in pages is now a Promise.
- `draftMode()` is async now (we don't use this).

## Touchpoints in our codebase

Counted automatically:

- **21** call sites of `cookies()` — all need `await` added
- **11** files that destructure `params` — type signature changes from `{ params: { id: string } }` to `{ params: Promise<{ id: string }> }`, and the body needs `const { id } = await params;` (or similar)
- **0** call sites of `headers()` — nothing to do here

### Files needing changes

The `cookies()` work centres on these files:

```
src/lib/auth.ts                                  # 15+ call sites, the auth core
src/middleware.ts                                # uses req.cookies (different API, NO change)
src/app/api/me/route.ts                          # 1 call site (clearConfirmationGateCookie)
src/app/api/admin/impersonate/route.ts           # 5 call sites
src/app/api/admin/view-mode/route.ts             # via setViewMode
src/app/api/onboarding/complete/route.ts         # via clearOnboardingGateCookie
src/app/api/auth/logout/route.ts                 # via destroyCurrentSession
```

The `params` work centres on these files (dynamic routes):

```
src/app/cases/[id]/page.tsx
src/app/cases/[id]/police-script/page.tsx
src/app/api/cases/[id]/note/route.ts
src/app/api/cases/[id]/close/route.ts
src/app/api/cases/[id]/step/route.ts
src/app/api/cases/[id]/police-script/pdf/route.ts
src/app/api/admin/care-team/[id]/route.ts
src/app/api/admin/programs/[id]/route.ts
src/app/clinician/grant/[token]/page.tsx
src/app/api/clinician/grant/[token]/route.ts   # if it exists
```

## Other changes between Next 14 and 16

- **Caching defaults flipped in Next 15.** `fetch()`, GET route handlers, and client navigations are no longer cached by default. We use `dynamic = "force-dynamic"` in many places so this should be a no-op, but worth a sweep.
- **React 19 required** for Next 15+. We're on React 18.3.1, so React + ReactDOM also need upgrading. That brings its own subset of breaks (new compiler, stricter ref handling). Most relevant for us: the `useFormState` hook moved to `useActionState`.
- **`@react-pdf/renderer`** version we just installed may or may not be compatible with React 19. Need to verify.
- **next/font** API tweaks.
- **eslint-config-next** also bumps to match the Next major.
- **Tailwind 3 still works** under Next 16, but Tailwind 4 also released (different config style). Stay on 3 for this migration.

## Migration steps (recommended order)

1. **New branch, do not work on main.** Verify rollback is `git reset --hard origin/main`.
2. `npm install next@latest react@latest react-dom@latest eslint-config-next@latest`
3. Run the official codemod: `npx @next/codemod@latest next-async-request-api .` — this handles most `cookies()` and `params` async refactors automatically. Review every diff before accepting.
4. Manually fix anything the codemod missed.
5. Address React 19 breaks (likely small: any `useFormState` → `useActionState`).
6. `npm run build` — fix any type errors and runtime errors at build time.
7. `npm run dev` — manually walk every flow:
   - Login + OTP
   - Admin dashboard
   - Log Seroquel → case opens
   - Check in → case closes
   - Open case detail + police script (HTML + PDF download)
   - Clinician grant page (with a real grant)
   - Network impersonation toggle
   - Onboarding flow (test as Bron via impersonation)
   - `/me` confirm + edit
   - Care team and programs admin
8. Run the smoke-test cycle from the original handover doc.
9. `npm audit` to confirm all 5 vulnerabilities clear.

## Estimated effort

- **Codemod-assisted refactor:** 2 to 3 hours
- **Manual fixes the codemod missed:** 1 to 2 hours
- **End-to-end testing:** 1 to 2 hours
- **Total:** 4 to 7 hours, single focused session

## Risks

- React 19 introduces subtle ref behaviour changes that can break custom components. We mostly use plain elements, so risk is low.
- `@react-pdf/renderer` may not yet support React 19. If so, options: pin React 18, downgrade to a PDF library that does, or wait for renderer to ship support.
- Caching default flip can cause unexpected stale data on pages without `dynamic = "force-dynamic"`. Sweep for this.
- The cookie patch in `setViewMode` and similar helpers — if the codemod misses one of these synchronous-to-async conversions, runtime errors will surface as "Property 'set' does not exist on type 'Promise<ReadonlyRequestCookies>'".

## Rollback plan

Branch-based. If anything in step 7 breaks badly, `git reset --hard` to before the bump and start the deploy without the migration. The 5 vulnerabilities remain but the portal works.

## What to do NOT do

- Do not bump to Tailwind 4 in the same session. Defer.
- Do not bump Prisma to 7 in the same session. Defer.
- Do not upgrade `@types/node`, `@types/react`, `typescript` to majors. Patch updates only.
