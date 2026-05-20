# Ongoing Care - Safety Gaps: Agent Handover Document

> **THIS IS A MENTAL HEALTH SAFETY SYSTEM. EVERY GAP BELOW IS A REAL RISK TO DAVID'S SAFETY.
> READ THIS DOCUMENT IN FULL BEFORE TOUCHING ANY FILE.**

---

## SECTION 1: PROJECT CONTEXT

**Live URL:** https://davidcareplan.online
**Repo:** https://github.com/appyboy551/ongoing-care (private)
**Working directory:** /Users/davidwalker/Documents/Claude/Projects/Ongoing Care/portal
**Stack:** Next.js 14 App Router, TypeScript, Tailwind 3, Prisma 5, Postgres (Neon ap-southeast-2 Sydney), Resend (email), ClickSend (SMS), date-fns, Vitest 4
**DB:** Neon pooled connection, ap-southeast-2 (same region as Vercel functions)

### Member Tiers

| Tier | Who | Access |
|---|---|---|
| ADMIN | David Walker (patient) | Full control |
| FULL_MEDICAL | Bron (Bronwyn Nethercott), Joanna | First-alert, SMS, medical page, financial detail |
| SHARED | Shannon, Jackson, Robyn, Rose, Stephen | Basic portal, case visibility |

**Front-door key holders** (`isFrontDoorKeyHolder = true`): Shannon, Jackson

### Files the next agent MUST READ before any change

- `prisma/schema.prisma` - all data models
- `src/lib/escalate.ts` - escalation worker (CRITICAL - do not break)
- `src/lib/timer.ts` - action plan state machine
- `src/lib/cases.ts` - case and step management
- `src/app/api/seroquel/log/route.ts` - Seroquel log trigger
- `src/app/api/action-plan/flag-call/route.ts` - distressing call flag trigger
- `src/app/api/cron/missed-check-in/route.ts` - cron endpoint
- `src/lib/sms.ts` - ClickSend wrapper
- `src/lib/email.ts` - Resend wrapper
- `src/lib/audit.ts` - append-only audit writer
- `SECURITY.md` - security constraints (must not be violated)
- `DESIGN_HANDOVER.md` - constraints, do-not-touch list

### Non-negotiable constraints

- No em dashes. Use hyphens or commas.
- Australian English. Emergency number is 000.
- No new Prisma enum values without a migration.
- No changes to `src/middleware.ts`.
- No changes to escalate.ts notification recipients or timing without David's explicit approval.
- Medicare/Medibank numbers must never appear in plaintext outside the encrypted field.
- Audit log is append-only. No delete operations.

---

## SECTION 2: WHAT CURRENTLY WORKS (DO NOT BREAK)

### 2.1 Seroquel log trigger (`src/app/api/seroquel/log/route.ts`)
- David logs a dose (25mg or 50mg), stressors, emotions, context, severity, optional note, optional geolocation
- `SeroquelLog` row created. `expectedCheckInBy = takenAt + timerHours` (default 14h, admin-configurable at `/admin/settings` via Setting key `"seroquel.timer.hours"`)
- Case opened via `openCaseForSeroquelLog()` in `src/lib/cases.ts`. Eight case steps created (trigger DONE, wait-checkin ACTIVE, rest PENDING)
- Email to Bron and Joanna (FULL_MEDICAL only) immediately

### 2.2 Check-in (`src/app/api/seroquel/checkin/route.ts`)
- David posts `logId` and optional geolocation
- `SeroquelLog.checkedInAt = now`, `closedAt = now`
- Case closed (status RESOLVED). `DistressingCallFlag` rows resolved
- Email to Bron and Joanna confirming safe

### 2.3 Escalation cron (`src/lib/escalate.ts`)
- Runs every 5 minutes via GitHub Actions (`.github/workflows/missed-check-in.yml`)
- Queries `SeroquelLog` where `expectedCheckInBy < now AND checkedInAt IS NULL AND closedAt IS NULL AND escalatedAt IS NULL`
- Per overdue log: sets `escalatedAt` first (idempotency guard), updates case to ESCALATED, emails ADMIN+FULL_MEDICAL with full detail, emails all SHARED with summarised detail (key-holders get directive paragraph), sends SMS to non-admin FULL_MEDICAL and key-holders via ClickSend sender `DavidAlert`
- SMS failure is non-fatal - error logged, email chain continues
- Each log escalated exactly once. Cron is idempotent.

### 2.4 Distressing call flag (`src/app/api/action-plan/flag-call/route.ts`)
- Any network member can flag a distressing call
- `DistressingCallFlag` created. Case opened. Email to ADMIN + FULL_MEDICAL only
- **NO independent countdown or SMS from this trigger alone** (this is Gap 1)

### 2.5 Case steps (`src/lib/cases.ts`)
- Steps in order: trigger, wait-checkin, call-david, welfare-check, search-hospitals, located, hospital-handover, closed
- Network members can mark steps DONE/SKIPPED/NA and add notes
- Marking a step DONE activates the next PENDING step
- Only ADMIN can close a case

### 2.6 Police script
- `src/app/cases/[id]/police-script/page.tsx` and `src/app/api/cases/[id]/police-script/pdf/route.ts`
- Print-optimised. PDF via `@react-pdf/renderer`
- Contains: name, address, welfare-check purpose, medication, dose, time taken, time last heard from, last known location with timestamp, Bron and Joanna as next of kin
- **DO NOT REDESIGN.** Deliberately plain. See DESIGN_HANDOVER.md Section 12.

### 2.7 Dose-pattern signal (`src/lib/seroquel-streak.ts`)
- Counts distinct AU-timezone days with at least one dose in the last 7 days
- `WARNING_DOSE_DAYS = 2`, `CRITICAL_DOSE_DAYS = 3` (UNCONFIRMED - see Gap 5)
- Drives `SeroquelTracker` component in admin dashboard

### 2.8 Tests
- 42 unit tests pass across 7 files. Run: `npm test`
- Do not break these.

---

## SECTION 3: SAFETY GAPS - FULL IMPLEMENTATION BRIEF

---

### GAP 1: No countdown for distressing-call-flag-only path

**PRIORITY: CRITICAL**

**The problem:** If a network member flags a distressing call but David takes no Seroquel and goes silent, the escalation cron never fires. The cron only queries `SeroquelLog`. The flag creates a visible case but zero automated SMS or escalation occurs.

**What must happen:** When a distressing call is flagged AND David does not acknowledge within a configurable window, the system must escalate identically to a missed Seroquel check-in.

**Questions for David before implementing (do not guess):**
1. What is the no-contact window for a flag-only situation? (Suggested: same 14h as Seroquel timer - but this is a clinical decision)
2. Should the flag-only escalation SMS the same recipients as a Seroquel escalation? (Suggested: yes)

**Implementation steps (execute after David answers):**

1. Add to `DistressingCallFlag` in `prisma/schema.prisma`:
   ```
   expectedResponseBy  DateTime?
   escalatedAt         DateTime?
   ```

2. Run migration:
   ```
   npx prisma migrate dev --name add_flag_escalation_fields
   npx prisma generate
   ```

3. In `src/app/api/action-plan/flag-call/route.ts`, after creating the flag, compute and write `expectedResponseBy`:
   ```ts
   const timerHours = await getSettingNumber("seroquel.timer.hours", 14);
   await db.distressingCallFlag.update({
     where: { id: flag.id },
     data: { expectedResponseBy: new Date(flag.flaggedAt.getTime() + timerHours * 3_600_000) }
   });
   ```
   Import `getSettingNumber` from `src/lib/settings.ts`.

4. In `src/lib/escalate.ts`, after the existing SeroquelLog escalation block, add a second block:
   - Query: `db.distressingCallFlag.findMany({ where: { expectedResponseBy: { lt: now }, escalatedAt: null, resolvedAt: null } })`
   - Write `escalatedAt` first (idempotency - same pattern as SeroquelLog block)
   - Find linked case via `db.case.findFirst({ where: { originDistressingCallFlagId: flag.id, status: "OPEN" } })`
   - Update case status to ESCALATED
   - Email ADMIN + FULL_MEDICAL with: who flagged it, when flagged, how long since flag, David's phone, key-holder names, case link
   - Email all SHARED with directive version (key-holders get "stay reachable" paragraph)
   - SMS to FULL_MEDICAL (non-admin) + key-holders
   - Write audit entry `kind: "CHECK_IN_MISSED"` with `detail: { flagId, caseId }`
   - Follow the same idempotency and error-handling pattern as the SeroquelLog block exactly

5. Add an acknowledgement mechanism for David when a flag exists. Options:
   - New endpoint `POST /api/action-plan/resolve-flag` that sets `resolvedAt` and `resolution` on the flag and closes the case
   - Or extend the existing check-in page to show a flag-only acknowledgement button when no SeroquelLog is active but a flag is open

---

### GAP 2: No second-tier escalation after initial alert

**PRIORITY: HIGH**

**The problem:** After escalation fires, if none of the notified members respond or update the case, the system does nothing further. There is no automated follow-up.

**What must happen:** If no case activity occurs within a second window after escalation, a second more urgent notification fires with a direct link to the police script.

**Questions for David before implementing:**
1. What is the second-tier window? (E.g., 1 hour after first escalation with no case response)
2. Who receives the second-tier notification? (Suggested: same recipients, more urgent copy)
3. Should the second-tier email include a direct link to the police script page?

**Implementation steps:**

1. Add to `SeroquelLog` in `prisma/schema.prisma`:
   ```
   escalatedTwiceAt  DateTime?
   ```

2. Run migration:
   ```
   npx prisma migrate dev --name add_escalated_twice_at
   ```

3. Add a Setting key `"escalation.second-tier.hours"` (default: 1) to control the window. Add an admin UI field at `/admin/settings`.

4. In `src/lib/escalate.ts`, add a third query block:
   - Query: logs where `escalatedAt IS NOT NULL AND escalatedTwiceAt IS NULL AND escalatedAt < (now - secondTierHours * 3600000)`
   - For each, check the linked case for any `CaseEvent` created after `escalatedAt` with kinds: `RESPONSE_REACHED`, `RESPONSE_NO_ANSWER`, `RESPONSE_CALLING_000`, `NOTE_ADDED`, `STEP_UPDATED`
   - If NO such event exists: fire second-tier notification
   - Write `escalatedTwiceAt` before sending (idempotency)
   - Email copy must be more urgent: "X hours have passed with no response. If you have not already done so, please attempt contact now. [Police script link]"

5. **The respond page** (`src/app/cases/[id]/respond/`) which writes `CaseEvent` rows with kinds `RESPONSE_REACHED`, `RESPONSE_NO_ANSWER`, `RESPONSE_CALLING_000` was built in Phase 2 of the previous session but was lost in a `git reset --hard`. It must be rebuilt. Full source is in the session transcript. Files needed:
   - `src/app/cases/[id]/respond/page.tsx` - server page
   - `src/app/cases/[id]/respond/ResponseButtons.tsx` - client buttons ("I have spoken to David", "I tried, no answer", "I am calling 000 now")
   - `src/app/api/cases/[id]/respond/route.ts` - POST handler
   - The escalate.ts deep-link was changed to `/cases/[id]/respond` in Phase 2 - check if this is in the current code; if not, restore it

   **Verify current state:** Run `ls "src/app/cases/[id]/respond"`. If the directory does not exist, rebuild from session transcript.

---

### GAP 3: Jackson's hospital transport - narrative only

**PRIORITY: MEDIUM**

**The problem:** When case step "hospital-handover" activates, Jackson has no automated notification with transport-specific information. The action plan page mentions his role in text only.

**Questions for David before implementing:**
1. What information should Jackson receive when hospital-handover activates?
2. Email only, or email + SMS?
3. Should the police script PDF be linked or attached?

**Implementation steps:**

1. In `src/lib/cases.ts`, function `updateCaseStep()`, after the existing step-advance logic, add:

```ts
// When welfare-check is marked DONE, hospital-handover becomes ACTIVE.
// Notify key-holders with transport-specific info.
if (args.newStatus === "DONE" && step.stepKey === "welfare-check") {
  const keyHolders = await db.member.findMany({
    where: { isFrontDoorKeyHolder: true, isActive: true }
  });
  const meds = await db.medication.findMany({
    where: { isActive: true, tier: "FULL_MEDICAL" },
    select: { name: true, dose: true, schedule: true }
  });
  for (const kh of keyHolders) {
    await sendEmail({
      kind: "CHECK_IN_MISSED", // reuse existing kind
      to: kh.email,
      toName: kh.shortName ?? kh.fullName,
      subject: "Hospital handover step is now active",
      bodyText: [
        `Hi ${kh.shortName ?? kh.fullName},`,
        "",
        "The welfare check step is complete. The hospital handover step is now active.",
        "",
        "If David needs to go to hospital, take this information with you:",
        `Medications: ${meds.map(m => `${m.name} ${m.dose}`).join(", ")}`,
        "",
        `Police script and full case details: ${process.env.APP_URL}/cases/${args.caseId}/police-script`,
        "",
        "St Vincent's Hospital (nearest PECC): emergency department or mental health unit.",
        "Bron and Joanna are next of kin and can speak to the clinical team.",
      ].join("\n"),
      metadata: { caseId: args.caseId }
    });
  }
}
```

2. Add SMS to key-holders with the case URL (same pattern as escalate.ts SMS block).

---

### GAP 4: "Portal notifies group when David is located" - not implemented

**PRIORITY: HIGH**

**The problem:** Action plan page Step 6 says "The portal sends an automatic update to the whole group with David's status." This does not exist. No code fires when the "located" step is marked DONE.

**Implementation steps:**

1. In `src/lib/cases.ts`, function `updateCaseStep()`, add:

```ts
if (args.newStatus === "DONE" && step.stepKey === "located") {
  const allMembers = await db.member.findMany({ where: { isActive: true } });
  const caseRow = await db.case.findUnique({ where: { id: args.caseId } });
  for (const m of allMembers) {
    await sendEmail({
      kind: "PLAN_CLOSED",
      to: m.email,
      toName: m.shortName ?? m.fullName,
      subject: "David has been located",
      bodyText: [
        `Hi ${m.shortName ?? m.fullName},`,
        "",
        `${args.actor.name} has marked David as located at ${formatAuTime(new Date())}.`,
        "",
        `Open the case for details and next steps: ${process.env.APP_URL}/cases/${args.caseId}`,
      ].join("\n"),
      metadata: { caseId: args.caseId }
    });
  }
  // CaseEvent is already written by updateCaseStep - no duplicate needed
}
```

2. Import `formatAuTime` from `src/lib/format.ts` if not already imported in `cases.ts`.

3. Do NOT add a new `NotificationKind` unless required - reusing `PLAN_CLOSED` is close enough in intent. If David wants a distinct audit trail, add `MEMBER_LOCATED` to the enum and migrate.

---

### GAP 5: Dose-day thresholds are UNCONFIRMED

**PRIORITY: HIGH - DO NOT CHANGE WITHOUT DAVID'S PRESCRIBER CONFIRMATION**

**File:** `src/lib/seroquel-streak.ts`
**Current values:**
```ts
export const WARNING_DOSE_DAYS = 2;   // amber state
export const CRITICAL_DOSE_DAYS = 3;  // red state, modal fires
```

These are guesses from a previous agent. They are explicitly marked UNCONFIRMED in code comments.

**Action:** Ask David in first message: "What are the prescriber-confirmed thresholds for warning and critical dose-day counts?" Update only after receiving a confirmed answer.

---

### GAP 6: Police script accessible to SHARED tier

**PRIORITY: VERIFY ONLY**

Jackson (SHARED tier) needs to be able to access the police script from the case detail page in an emergency without needing admin access.

**Check:** Read `src/app/cases/[id]/police-script/page.tsx`. Confirm the auth guard uses `requireMember()` (any authenticated user) not `requireAdmin()`. If it uses `requireAdmin()`, change to `requireMember()` - SHARED tier must be able to access this.

---

## SECTION 4: OTHER ITEMS TO CHECK

### 4.1 GitHub Actions APP_URL secret

The cron workflow at `.github/workflows/missed-check-in.yml` uses `secrets.APP_URL`. After the domain change from `ongoing-care.vercel.app` to `davidcareplan.online`, this GitHub secret may NOT have been updated.

**Check:** https://github.com/appyboy551/ongoing-care/settings/secrets/actions
**Required value:** `https://davidcareplan.online`
**Update now if wrong** - the cron may be hitting the wrong URL.

### 4.2 Resend domain verification

Emails currently send from `onboarding@resend.dev` (sandbox). This is unreliable for production and may be blocked by some mail providers.

**Action:** Verify `davidcareplan.online` in Resend at https://resend.com/domains. Add the DNS records Resend provides to Crazy Domains DNS for `davidcareplan.online`. Once verified, update Vercel env var `EMAIL_FROM` to `Ongoing Care <care@davidcareplan.online>` and redeploy.

### 4.3 PORTAL_ENCRYPTION_KEY backup

**Before any work begins:** Confirm with David that the key `Dm66IbnU8k9F0pzIjVPme+QhIOqW26ajl+59Dc5sQE4=` is saved in Bitwarden as "Ongoing Care - PORTAL_ENCRYPTION_KEY". If lost, Medicare/Medibank fields are permanently unreadable.

### 4.4 Escalate.ts deep-link

In Phase 2, `escalate.ts` was updated to send escalation emails with links to `/cases/[id]/respond` instead of `/cases/[id]`. This was reverted by the `git reset --hard`. Restore this change when rebuilding the respond page (Gap 2) - it makes the escalation email CTA go directly to the response buttons.

---

## SECTION 5: TESTING REQUIREMENTS

After each gap:
- `npm test` must show 42 tests passing
- `npx tsc --noEmit` must pass clean
- Do NOT run `npm run build` while dev server is running (corrupts `.next` cache)
- Any schema change: `npx prisma migrate dev --name [descriptive]` then `npx prisma generate`
- After schema changes in production: `npx prisma migrate deploy`

Manual tests David must perform:
- **Gap 1:** Flag a distressing call, don't log Seroquel, wait for the configured window, confirm SMS + email arrive to all recipients
- **Gap 2:** Trigger escalation via Seroquel log, don't respond via case page, wait for second window, confirm follow-up notification arrives
- **Gap 4:** Open a case, mark "located" step DONE, confirm all network members receive the "David has been located" email
- **Gap 5:** Only after prescriber confirms thresholds

---

## SECTION 6: DO NOT TOUCH LIST

- `src/middleware.ts`
- `src/app/cases/[id]/police-script/` (deliberately plain, print-optimised)
- `src/app/admin/audit/` (table-driven, no visualisations)
- `src/app/clinician/` (clinician grant page)
- `tailwind.config.ts` green/amber/red colour values
- Tier hierarchy in `prisma/schema.prisma` (ADMIN, FULL_MEDICAL, SHARED)
- Stored Prisma enum values (labels can change at render layer only)
- Notification recipients and timing in `escalate.ts` without David's explicit approval

---

## SECTION 7: FIRST MESSAGE THE NEXT AGENT MUST SEND DAVID

The agent must send David this exact checklist before writing a single line of code:

1. "I have read the SAFETY_GAPS_HANDOVER.md document in full."
2. "Is the PORTAL_ENCRYPTION_KEY backed up in Bitwarden? Value: Dm66IbnU8k9F0pzIjVPme+QhIOqW26ajl+59Dc5sQE4="
3. "Gap 5 (dose thresholds): What are your prescriber-confirmed values for WARNING_DOSE_DAYS and CRITICAL_DOSE_DAYS?"
4. "Gap 1 (flag-only escalation): What is the no-contact window after a distressing call flag when no Seroquel is logged? Should it be the same 14 hours as the Seroquel timer?"
5. "Gap 2 (second-tier escalation): How long after the first escalation with no network response should the second notification fire? Suggested: 1 hour."
6. "I will run git log --oneline and git status before making any changes."
