# Ongoing Care — design handover for Claude Design

For the agent picking up the next round of UX work. This document is the
brief: project context, brand, data model, interaction map, what already
exists, what to refactor, what to consider, and what is off-limits.

---

## 1. Project context

Ongoing Care is a private web portal that coordinates one person's
(David's) support network during mental health episodes and afterwards. It
is currently a functional Next.js + Postgres app, locally hosted, used by
the patient and an eight-person network. The portal supports a future
extension into a white-label product (see Section 11).

It is **not** a clinical system. It does not replace clinicians, ambulance,
or emergency services. It complements them.

The current build is feature-complete for first launch. Authentication,
case lifecycle, audit log, encryption-at-rest for PII, onboarding,
impersonation testing, PDF generation, SMS alerts via ClickSend, and admin
CRUD across all data are all live. What follows is the design work that
remains, plus an opportunity to lift the whole experience.

---

## 2. Tone and voice (non-negotiable)

Apply everywhere. These come from the patient himself.

- **No em dashes.** Anywhere. Source, copy, generated content. Use commas,
  full stops, or hyphens for surgical splits. There is a defensive scrubber
  in `src/lib/claude.ts` for AI-generated content.
- **Australian English.** Spelling and idiom. "Organise", "behaviour",
  "centre". 000, not 911.
- **No corporate waffle.** No "we're here for you", no "your wellness
  journey", no "empowering". Direct, calm, specific.
- **No completion language unless verified.** Avoid "done", "all set",
  "complete", unless the action has actually finished. The portal lives in
  high-stakes moments; false reassurance is dangerous.
- **No fake medical authority.** The portal is not a clinician. It does
  not diagnose, prescribe, or override real treatment. The statement of
  wishes is not legally binding.
- **Bite-sized.** One decision per screen for users in crisis. Especially
  on the Log Seroquel form and check-in.
- **Honest about limits.** Where something isn't legally enforceable
  (e.g. ECT consent), the copy says so plainly.

Character: calm, clinical, quietly competent. Hospital signage done well,
not a wellness app. Magenta accent is warmth without saccharine.

---

## 3. Brand

**Name:** Ongoing Care
**Wordmark on app icon:** DW
**App icon:** pink rounded square, smiling brain with a band-aid plaster,
sparkles on a magenta gradient. Lives at `src/app/icon.png` and
`src/app/apple-icon.png`. Used by browser favicon, iOS Add to Home Screen,
Android PWA manifest.

### Colour palette (Tailwind tokens, defined in `tailwind.config.ts`)

| Token | Hex | Usage |
|---|---|---|
| `bg` | `#f4f6f8` | Page background |
| `card` | `#ffffff` | Card and panel surfaces |
| `ink` | `#1f2933` | Primary text |
| `ink-soft` | `#6b7785` | Secondary text |
| `line` | `#e3e8ed` | Borders, dividers |
| `accent` | `#a82e7e` | Primary action, focus, highlights (magenta, ~5.8:1 contrast on white) |
| `accent-soft` | `#fbeaf3` | Selected pill, hover backgrounds |
| `green` / `green-bg` | `#2f7d4f` / `#e7f3ec` | Success, "calm" |
| `amber` / `amber-bg` | `#9a6a16` / `#fbf0d9` | Warning, "armed" |
| `red` / `red-bg` | `#b23b3b` / `#fbe6e6` | Error, "missed", "escalated" |

### Type

- **Font stack:** `Segoe UI, Helvetica Neue, Helvetica, Arial, sans-serif`
- No custom web fonts. Performance and reliability matter; the portal must
  render fast on a phone in a hospital waiting room.

### Radii & spacing

- `card`: 20px
- `card-lg`: 24px
- All forms and pages use generous spacing (Tailwind defaults).

### Theme colour for browser chrome

`#a82e7e` (set in `src/app/layout.tsx` viewport metadata)

---

## 4. Component library (what exists)

These live in `src/components/ui/Card.tsx` and a few sibling files. Reuse
them or refine them; do not rip and replace.

- `<Card>`: white panel, 24px radius, 1px line border, 20px padding.
- `<PageHead>`: page title + subtitle. Renders an `<h1>` for the title.
- `<SectionTitle>`: small uppercase magenta eyebrow label.
- `<Pill>`: rounded badge with `tone` prop (`green`, `amber`, `red`,
  `neutral`).
- `<Metric>`: large value with small label and optional sub-text. Used on
  the network dashboard for the snapshot.
- `<Step>`: numbered step with title and body, for action plans.
- `<Warn>`: amber-bordered alert panel for important inline messages.
- `<ShellLayout>`: the layout shell. Server component. Async. Reads the
  view-mode cookie. Renders sidebar nav (desktop), top-bar menu (mobile),
  the impersonation banner if active, the live-case banner if active, and
  the page content. Receives `nav`, `currentPath`, `viewerTier`,
  `viewerName` from the page.
- `<LiveCaseBanner>`: server component, queries DB for open cases, renders
  amber/red sticky bar across every page when a case is open.
- `<FirstCaseBanner>`: dismissible orientation card on case detail.
- `<ImpersonationBanner>`: amber bar shown to admin while impersonating
  another member.
- `<ViewModeToggle>`: segmented control in the sidebar to switch between
  admin and network views (admin-only, cookie-backed).

### Navigation

Two distinct sidebars defined in `src/content/navigation.ts`:

- **`NETWORK_NAV`**: for non-admin members. Items: Current state, Live
  case, Action plan, I need help now, Support network, Medical (FULL_MEDICAL
  only), Financial detail (FULL_MEDICAL only), My details, Settings.
- **`ADMIN_NAV`**: for the patient (admin). Items: Admin dashboard, Log
  Seroquel, Check in, Live case, Content, Brain-dump to draft, Settings,
  Network, Care team, Medications, Pharmacist reviews, Admissions, Content
  sections, Programs, Clinician access, Medicare and Medibank, Audit log,
  My details.

ADMIN can switch sidebars via the view-mode toggle. Cookie persists across
pages. Per-page rendering still respects the actual viewer tier.

---

## 5. Data model

Source of truth: `prisma/schema.prisma`. Key models in plain English:

- **`Member`** — one row per person in the network. Fields: id, fullName,
  shortName, email (unique), phone, relationship, tier
  (`ADMIN | FULL_MEDICAL | SHARED`), isActive, isFrontDoorKeyHolder,
  profileConfirmedAt, onboardingCompletedAt, invitedAt, timestamps.
- **`Session`** — issued on OTP verify. tokenHash, memberId, expiresAt,
  revokedAt.
- **`OtpRequest`** — codeHash, memberId, expiresAt, consumedAt.
- **`ContentSection`** — slug (unique), title, body (markdown), tier
  (visibility), isPublished. Some slugs are referenced by hardcoded pages
  (`statement-of-wishes`, `financial-status-detail`) and are protected from
  deletion at the API level.
- **`Medication`** — name, dose, schedule, notes, tier, isActive.
- **`PharmacistReview`** — reviewerName, reviewDate, outcome, notes,
  optional medicationId.
- **`CareTeamMember`** — name, role, organisation, phone, address, notes,
  isCurrent.
- **`Program`** — name, runBy, contactName, contactEmail, contactPhone,
  isActive.
- **`Admission`** — hospital, startDate, endDate (null = ongoing), reason,
  voluntary, notes.
- **`SeroquelLog`** — doseMg, stressors (string[]), emotions (string[]),
  inFacility, facilityName, severity, drivingThis, whatWouldHelp,
  reflectionNote, expectedCheckInBy, takenAt, checkedInAt, closedAt,
  closedNote, escalatedAt, location fields.
- **`DistressingCallFlag`** — flaggedByMemberId, flaggedAt, context,
  resolvedAt, resolution.
- **`Case`** — title, status (`OPEN | RESOLVED | ESCALATED`), origin
  (`SEROQUEL_LOG | DISTRESSING_CALL_FLAG`), originSeroquelLogId or
  originDistressingCallFlagId, openedAt, closedAt, closedById,
  closedReason, lastActivityAt.
- **`CaseStep`** — caseId, order, stepKey, title, description, status
  (`PENDING | ACTIVE | DONE | SKIPPED | NA`), completedAt, completedById,
  note. Cascades on case delete.
- **`CaseEvent`** — caseId, kind, actorId/Label, message, detail,
  createdAt. Cascades on case delete.
- **`ClinicianAccessGrant`** — tokenHash, clinicianName, clinicianEmail,
  clinicianRole, organisation, reason, expiresAt, revokedAt, lastUsedAt.
- **`Notification`** — kind, toEmail, toName, subject, bodyText, bodyHtml,
  status (`QUEUED | SENT | FAILED`), sentAt, errorText, metadata.
- **`Setting`** — key (unique), value. Used for everything from
  `seroquel.timer.hours` to identity fields to encrypted Medicare numbers.
- **`AuditEntry`** — kind (`AuditKind` enum), actorId, actorLabel,
  ipAddress, userAgent, detail (JSON), createdAt. Append-only.

### Sample JSON of a fully populated Member

```json
{
  "id": "cmpaf4q1p0000e3tdk0t0mhcy",
  "fullName": "Bronwyn Nethercott",
  "shortName": "Bron",
  "email": "bronwynwalker01@gmail.com",
  "phone": "+61404352527",
  "relationship": "Sister",
  "tier": "FULL_MEDICAL",
  "isActive": true,
  "isFrontDoorKeyHolder": false,
  "profileConfirmedAt": null,
  "onboardingCompletedAt": null,
  "invitedAt": "2026-05-18T11:21:00.000Z",
  "createdAt": "2026-05-17T14:00:00.000Z",
  "updatedAt": "2026-05-18T11:21:00.000Z"
}
```

### Sample JSON of an open Case with steps

```json
{
  "id": "cmpamdea8000g8c5ptkzdldv9",
  "title": "Seroquel 25mg logged",
  "status": "OPEN",
  "origin": "SEROQUEL_LOG",
  "originSeroquelLogId": "cmpamde5p000f8c5putpyn7se",
  "openedAt": "2026-05-18T13:03:00.000Z",
  "closedAt": null,
  "closedById": null,
  "closedReason": null,
  "lastActivityAt": "2026-05-18T13:03:00.000Z",
  "steps": [
    {
      "stepKey": "trigger",
      "title": "Seroquel logged",
      "description": "David has logged Seroquel after a distressing call. Bron and Joanna have been emailed.",
      "status": "DONE",
      "order": 1
    },
    {
      "stepKey": "wait-checkin",
      "title": "Wait for David to check in",
      "description": "Default timer is 14 hours from trigger. If David checks in, the plan closes here.",
      "status": "ACTIVE",
      "order": 2
    },
    {
      "stepKey": "call-david",
      "title": "Call David on +61439684998",
      "description": "If he answers and is okay, close the case. If he doesn't answer, move to the welfare check.",
      "status": "PENDING",
      "order": 3
    }
  ]
}
```

---

## 6. User interaction map

### Authentication

- Land on `/` → redirect to `/login` if no session, else `/dashboard` or
  `/admin`.
- `/login` → email field, POST to `/api/auth/request-otp`, redirect to
  `/login/verify?email=...`.
- `/login/verify` → 6-digit code field, POST to `/api/auth/verify-otp`,
  creates session cookie.

### Gates (middleware-driven)

For non-ADMIN members:
1. If `profileConfirmedAt` is null → redirect to `/me` (phone confirm).
2. Once confirmed → redirect to `/onboarding/welcome` and walk a 6-screen
   flow.
3. Once `onboardingCompletedAt` is set → released to `/dashboard`.

For ADMIN: bypasses both gates.

For impersonating admin: cookie mirroring means the impersonator also
walks the gate flow of the impersonated user (for testing).

### Per-tier page access (server-side enforced in each page)

| Page | ADMIN | FULL_MEDICAL | SHARED |
|---|---|---|---|
| `/dashboard` | ✓ | ✓ | ✓ |
| `/cases`, `/cases/[id]` | ✓ | ✓ | ✓ |
| `/action-plan` | ✓ | ✓ | ✓ |
| `/help-now` | ✓ | ✓ | ✓ |
| `/network` | ✓ | ✓ | ✓ |
| `/me`, `/settings` | ✓ | ✓ | ✓ |
| `/medical` | ✓ | ✓ | — |
| `/financial-detail` | ✓ | ✓ | — |
| `/admin/*` | ✓ | — | — |

### Key actions and what they trigger

- **Log Seroquel (admin)** → creates SeroquelLog, opens a Case, emails all
  active members.
- **Check in (admin)** → updates SeroquelLog, closes the Case, emails
  FULL_MEDICAL. Idempotent.
- **Flag distressing call (any member)** → creates DistressingCallFlag,
  opens a Case, emails admin + FULL_MEDICAL.
- **Case missed-check-in escalation (cron or admin button)** → updates
  Case to ESCALATED, emails everyone, sends SMS to FULL_MEDICAL +
  key-holders.
- **Send invite (admin button on `/admin/network`)** → emails the chosen
  member with the portal URL and stamps `invitedAt`.
- **Stop impersonation (banner button)** → clears cookies, returns admin
  to `/admin`.

### Things that need to be clickable that aren't always obvious

- Pills (`<Pill>`) are display-only; do not make them buttons.
- Snapshot metrics on `/dashboard` are display-only.
- Sidebar nav items navigate.
- Step rows on a Case are partly interactive (Mark done, Skip, Not
  applicable, Add a note).

### Live-case banner

Renders on every page when a Case is OPEN or ESCALATED. Click takes you to
the case. Currently amber/red sticky strip at the top of `<main>`. Auto
queries the DB on every page render.

---

## 7. Current code to refactor

These are the files most worth a redesign pass. Refactor in place, do not
rename routes.

- **`src/app/dashboard/page.tsx`** — the home page for network members.
  Currently a Snapshot grid + Help Now buttons + Flag Distressing Call.
  Functional but visually flat. Candidate for a hero-style design that
  conveys "is everything okay right now" instantly.
- **`src/app/cases/[id]/page.tsx`** — case timeline. The step-by-step is
  good information architecture; visually could be more "operational
  centre" feel. Auto-refreshes every 20s.
- **`src/components/SeroquelLogForm.tsx`** — five-section log form. Has a
  Quick Log shortcut above it now. The long form is dense; could be
  presented as a wizard with progress.
- **`src/app/admin/page.tsx`** — admin dashboard. Currently four metrics
  + quick actions + recent logs + admin tools. Functional but cluttered as
  new admin tools accumulate.
- **`src/app/medical/page.tsx`** — Medicare/Medibank, medications,
  pharmacist reviews, care team, programs, admissions. Long single page.
  Could be tabs or accordions.
- **`src/components/Layout/ShellLayout.tsx`** — the shell. Long admin
  sidebar getting cluttered (17 items now). Worth a redesign with grouping
  (e.g. collapsible sections: "Day to day", "Data", "Network", "Audit").
- **`src/app/onboarding/*`** — six screens. Currently simple cards.
  Probably good as-is; consider adding a progress dot indicator.

For each, refactor to the new design system. Preserve all behaviour and
routes. Add tests if you change a public interface.

---

## 8. Five quick UX improvements (low risk, high impact)

For each, the file path to touch is shown so they can be done in isolation.

### 8.1 Collapsible admin nav groups

The admin sidebar has 17 items and is getting unwieldy. Group them
logically with collapsible disclosure sections:

- **Day to day:** Admin dashboard, Log Seroquel, Check in, Live case
- **Care plan content:** Content sections, Programs
- **People:** Network, Care team, Clinician access
- **Health record:** Medications, Pharmacist reviews, Admissions, Medicare
  and Medibank
- **Admin:** Settings, Audit log, Brain-dump to draft
- **Personal:** My details

File: `src/content/navigation.ts` (add a `group?: string` field to
NavItem) and `src/components/Layout/ShellLayout.tsx` (render groups with
`<details>` disclosures).

### 8.2 Live case banner shows time-remaining or overdue, not just title

Currently the banner says "A case is open: Seroquel 25mg logged. Last
activity Mon, 18 May, 13:03." That's information, not urgency. Add:

- For OPEN: time until expected check-in ("3h 12m remaining")
- For ESCALATED: time overdue ("Overdue by 2h 04m")
- For RESOLVED: not shown (already filtered out)

File: `src/components/LiveCaseBanner.tsx`. Pull the linked SeroquelLog and
compute against `expectedCheckInBy`.

### 8.3 Confirm-on-leave for unsaved Seroquel log

The five-section log is the highest-stakes form. Accidentally navigating
away loses everything. Add a `beforeunload` listener that warns if the
user has touched any field without submitting.

File: `src/components/SeroquelLogForm.tsx`. Add a `useEffect` that tracks
"dirty" state and registers/removes the listener.

### 8.4 Member name links to their profile from anywhere it appears

Currently member names appear as plain text on `/network`, case
timelines, audit log, etc. Make them links to a small profile drawer or
modal: "Bron, Sister, FULL_MEDICAL, [phone if FULL_MEDICAL viewer]" plus
"View their /me as them" link if you're admin (uses impersonation).

Files: a new `<MemberLink>` component plus updates wherever names render.

### 8.5 Visual diff on the "What's on file" sections

On `/me` and `/medical`, the "what's on file" panels show data without
indicating when it was last updated. Add a small "Last updated 3 days
ago" line per field. Helps the user trust the data, prompts updates when
something looks stale.

Files: `/me/page.tsx`, `/medical/page.tsx`. Use existing `updatedAt`
fields from Prisma models.

---

## 9. Three large UX changes for review

These are bigger and more opinionated. Discuss with the patient (David)
before committing.

### 9.1 Replace 20-second meta-refresh on case page with Server-Sent Events

Today, `/cases/[id]` reloads itself every 20 seconds via
`<meta http-equiv="refresh" content="20" />`. This is crude:

- Every refresh re-renders the whole page; if the user is mid-typing in a
  note, they lose their place.
- A meaningful change can take up to 20 seconds to appear, which feels
  slow in a live situation.
- Re-querying the whole case + steps + events every 20s is wasteful.

Proposal: replace with SSE (Server-Sent Events) for incremental updates.
A small Next.js route handler at `/api/cases/[id]/stream` would emit
events for new CaseEvent rows. The client would update timeline entries
in place.

Effort: 6-8 hours. Risk: requires careful connection lifecycle, retry,
and graceful fallback to meta-refresh for clients that don't support SSE.

### 9.2 PWA with offline-first for the network member view

The network members (Bron, Joanna, Shannon, Jackson, Robyn, Rose,
Stephen) will mostly use this on their phones, often in transit or in
patchy reception. Today the portal is online-only.

Proposal: add a service worker, manifest update, and offline cache for:

- Read-only access to the last seen Case state
- Read-only access to identity, action plan, key-holder info
- A "queued action" mechanism for posting a note while offline (replays
  when connection returns)

The portal manifest exists already (`src/app/manifest.ts`) but there's no
service worker yet. The action plan in particular needs to be accessible
even when the carrier signal is poor.

Effort: 1-2 days. Risk: service-worker logic is famously delicate; needs
careful versioning and a clear "kill switch" if a bad SW gets cached.

### 9.3 A radically simplified "in crisis" mode for the patient

Today the admin dashboard is functional but information-dense. In actual
crisis, the patient (David) doesn't need 17 nav items and a snapshot of
admissions. He needs:

- "I'm okay" big green button (if a case is open)
- "I need help" big red button (calls 000 / NSW Mental Health Line)
- "Log Seroquel" big amber button
- Nothing else

Proposal: a "crisis mode" full-screen layout, optionally auto-triggered
when a Case is open and ESCALATED, or available manually via a button on
the main dashboard. Three big buttons, no nav, no sidebar, no other UI.
The full admin view is one tap away ("Show all") but defaults to hidden.

This is a significant UX inversion that needs the patient's buy-in.

Effort: 1-2 days. Risk: removing affordances always upsets some users;
needs to be opt-in OR auto-engaged with clear visual hierarchy.

---

## 10. Constraints (non-negotiable)

These are hard rules from the patient and from the project's intent. Do
not break them in pursuit of a "nicer" UI.

- **Per-tier visibility rules.** A SHARED-tier member must never see a
  Medicare number, a financial detail, or another member's contact info
  beyond what's already public in the network list.
- **No shared healthcare passcode.** Clinician access is per-clinician,
  time-limited, audited. Do not introduce a "team password".
- **No reframing of "ice grounding".** It is a sensory anchor and a
  reflection on impermanence. Do not present it as a "cold jolt" technique
  or anything that reinforces physical-discomfort coping.
- **No invented medication doses or sedation figures.** Numbers come from
  the database or settings, never from the agent's training data.
- **Do not present as an official NSW Health system.** It is not.
- **No Medicare/Medibank in source code or in chat.** Encrypted in the DB,
  also in Bitwarden, never in code defaults or in committed files.
- **No auto-publish.** Content goes draft → sign-off → publish, manually.
- **Drop-in dark mode is fine, but high-contrast and large-text modes
  are higher priority.** Some users have visual impairments.
- **Mobile-first.** Many network members will only ever use this on a
  phone, often in poor signal.
- **Australian English everywhere.** No "ER" for "ED", no "favorite"
  for "favourite", etc.

---

## 11. Parking lot — white-label opportunity

This is genuinely a parking lot, not a commitment. Worth thinking about
because the underlying coordination problem is widespread.

### Why white-label has legs

The portal solves a real coordination problem for people with chronic
mental health conditions, but the pattern generalises far beyond David:

- People with bipolar disorder, schizophrenia, complex PTSD, severe
  anxiety, treatment-resistant depression all benefit from delegated
  coordination during episodes.
- People on the autism spectrum (especially with high masking) often
  experience executive function collapse during distress. A pre-built,
  structured action plan they walk through on autopilot is the right
  affordance.
- People with ADHD often need a "system thinks for me" mechanism when
  they're dysregulated. Quick-log presets, automatic escalation timers,
  and clear "what happens next" steps are exactly that.
- People with chronic illness (long COVID, ME/CFS, dysautonomia,
  fibromyalgia) need to coordinate care with networks of family and
  clinicians without re-explaining themselves every time.
- Carers of elderly relatives, parents of children with disabilities,
  guardians of adults with intellectual disabilities — all have the same
  "who needs to know what, when something happens" coordination problem.

### What the product looks like

- **Multi-tenant Next.js.** Each patient is a tenant with their own DB
  schema (or row-level isolation in a shared schema). Their network, care
  team, content sections, secure numbers live within that tenant.
- **Per-tenant branding.** Patient name, photo, network composition, tier
  labels, the "About me" content section. The product itself uses neutral
  Ongoing Care branding by default but can be skinned.
- **Subscription model.** Pricing tiered by network size:
  - Free: 3 network members, no SMS, no clinician grants
  - $5/month (AUD): up to 8 members, SMS via ClickSend (pay your own SMS
    credits), unlimited clinician grants
  - $15/month: unlimited members, included SMS pool, priority support
- **Compliance pathway.** NDIS provider registration; ISO 27001
  certification; alignment with the Australian Privacy Principles and the
  Aged Care Quality Standards where relevant.
- **Onboarding.** A guided "set up your support portal" flow that walks a
  new patient through: name themselves, add their network with tiers, add
  their care team, set their action plan template (we ship 3 templates:
  mental health crisis, chronic illness flare, post-hospital recovery),
  set their identity and insurer details.
- **Sharing model that respects autonomy.** The patient is always the
  ADMIN. Other members can only see what the patient has chosen to share
  with them. The "tier" concept stays.

### Engagement angles especially for neurodivergent users

The portal already does a lot of "remove cognitive load during distress"
well. Lean into it:

- **Decision-free flows.** When dysregulated, the user needs zero choices.
  Quick Log Seroquel is the model. Extend it to: "I'm not okay" one-tap
  that auto-logs + auto-flags + auto-opens a case.
- **Sensory accessibility.** Light theme, reduced motion, optional
  high-contrast, optional dyslexia-friendly font (OpenDyslexic or similar
  toggle).
- **Predictability.** Every screen the user sees during a flow follows the
  same pattern. No surprise modals. No animations on critical paths.
- **Co-piloting.** A SHARED member can flag on behalf of the patient
  ("Patient just told me they're not coping"). Adds a member-initiated
  trigger.
- **Body-doubling.** A "anyone present" indicator showing which network
  members are currently signed in to the portal. Helps the patient feel
  not-alone during a quiet moment.
- **Routines and rituals.** Beyond crisis, daily/weekly check-ins:
  "Tap here once today to tell the network you're okay" with a streak.
  Routine builds trust in the tool before it's needed.

### What would be needed to ship a white-label v1

- Multi-tenancy refactor (~2 weeks)
- Stripe or similar billing integration (~1 week)
- Tenant onboarding flow (~1 week)
- Three action plan templates (~3 days)
- Marketing site + signup flow (~1 week)
- Compliance documentation + privacy policy + terms of service (~1 week
  with legal review)
- Customer support process (zero hours, but a real obligation)

Realistic time to a launchable beta: **8 to 10 weeks of focused work** plus
the legal/compliance review.

### Honest caveats

- Healthcare-adjacent products attract liability. If a patient dies and
  the portal "should have" alerted the network, that's a question worth
  legal advice before any white-label launch.
- Mental health users are a vulnerable population. Marketing must not
  promise outcomes the product cannot deliver.
- The patient (David) is the founder-customer. His lived experience is
  the moat. Any pivot toward white-label should keep him close to the
  product, not just as a name on the marketing.

---

## 12. What is explicitly NOT to redesign

- The clinician grant page (`/clinician/grant/[token]/page.tsx`). It is
  optimised for medical records readability and is the right shape for
  the audience (clinicians, often older, often viewing once).
- The police-script page (`/cases/[id]/police-script/page.tsx`) and its
  PDF generator. Print-optimised, factual, minimal. Do not make it
  prettier.
- The audit log (`/admin/audit/page.tsx`). Functional, table-driven, fast
  to scan. Do not add charts or visualisations.
- The current colour palette beyond the magenta accent. Greens, ambers,
  reds are calibrated for status tones.
- The middleware gates. Do not change the redirect flow.
- The Tier hierarchy. Do not introduce new tiers.

---

## 13. Pointers for getting started

- The codebase: Next.js 14 App Router, TypeScript, Tailwind 3, Prisma 5,
  Postgres (Neon). 42 unit tests. Vitest config at `vitest.config.ts`.
- The patient communicates directly with the agent via Claude Code or
  Cowork. He's bite-sized, decisive, allergic to corporate language.
- Read `SECURITY.md`, `README.md`, and the existing `MIGRATION_NEXT_16.md`
  before making any architectural change.
- Run `npm run dev` to start (port 3001), `npm test` to verify (~400ms),
  `npx prisma studio` to inspect data.
- The portal is private. Do not push to a public GitHub repo. Do not
  share live URLs.

End of brief.
