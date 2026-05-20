# Ongoing Care - Performance Work: Handover

Companion to `SAFETY_GAPS_HANDOVER.md`. Read that first - every constraint in it
(no recipient-list changes, no enum additions without migration, no middleware
edits, idempotency-first writes) applies here too.

---

## 1. What is already done

### 1.1 Region pinning (commit `b8a1050`)
- `vercel.json` pins all serverless functions to `syd1` to co-locate compute
  with the Neon Postgres instance in `ap-southeast-2`. Saves ~150-200 ms per
  query on cold paths.

### 1.2 Per-request session memoization (commit `afebc03`)
- `getCurrentMember` and `getRealAdminFromSession` in `src/lib/auth.ts` are
  wrapped in `React.cache(...)`. Multiple components in a single request share
  one DB hit instead of N. Falls back to identity wrapper outside the React
  runtime so Vitest does not crash.

### 1.3 Tag-based admin caches (commit `afebc03`)
- `src/app/admin/medications/page.tsx`, `src/app/admin/programs/page.tsx`,
  `src/app/admin/care-team/page.tsx` wrap their list reads in
  `unstable_cache(..., { tags: [...], revalidate: 300 })`.
- All write routes (POST/PATCH/DELETE under `src/app/api/admin/*`) call
  `revalidateTag(...)` so changes appear immediately. The 5 min TTL is a
  backstop, not the typical refresh interval.
- **Audited:** these three pages cache reference data only - medications,
  programs, care team list. No escalation state, no `escalatedAt`, no case
  status. Safe to cache.

### 1.4 `caseStep.createMany` for case open (this commit)
- `openCaseForSeroquelLog` and `openCaseForCallFlag` in `src/lib/cases.ts`
  previously fired 8 sequential `db.caseStep.create` calls. Now one
  `createMany`. ~7 round-trips saved per case open. Step IDs are never read
  back, so `createMany`'s lack of returned rows is irrelevant here. If a
  future change needs the IDs, switch back to `$transaction([...create])` -
  do NOT add a follow-up `findMany` since that re-introduces the round trip.

### 1.5 Per-row fanout parallelism in `escalate.ts` (this commit)
- All four blocks (Seroquel first-tier, flag-only first-tier, Seroquel
  second-tier, flag-only second-tier) now use `Promise.all` over the
  recipient list within a single overdue row.
- **The outer loop over overdue rows stays serial.** Do not parallelize
  across rows: per-row writes to `escalatedAt` / `escalatedTwiceAt` are the
  idempotency guard, and concurrent `caseEvent` writes would scramble the
  audit timeline. The parallelism is strictly "fan out the emails for one
  row in parallel."
- `sendEmail` catches its own errors and returns `{ok}` without throwing.
  `sendSms` does the same. `Promise.all` is therefore safe; we keep the
  result shape and tally counters after the fan-out resolves.

---

## 2. Bug fixed alongside the perf work

### 2.1 Phantom second-tier escalation when admin closes a case
- `closeCase` in `src/lib/cases.ts` does **not** clear
  `SeroquelLog.checkedInAt/closedAt` or `DistressingCallFlag.resolvedAt`.
  Those are the idempotency fields the second-tier queries in `escalate.ts`
  filter on.
- Before the fix, an admin closing a case via `/api/cases/[id]/close` after
  first-tier fired would still trigger the URGENT second-tier email and SMS
  storm an hour later, because:
  - The origin row idempotency fields were still null, and
  - The `CASE_CLOSED` event was not in `RESPONSE_EVENT_KINDS`, so the
    second-tier suppression check did not match it.
- **Fix:** `CASE_CLOSED` added to `RESPONSE_EVENT_KINDS` in
  `src/lib/escalate.ts`. One line, defense-in-depth, can't drift.
- If a future change introduces a new close path that should suppress
  second-tier, prefer writing a `CASE_CLOSED` event from that path rather
  than touching the kinds list again.

---

## 3. What remains - opportunities, NOT must-dos

These are documented for the next agent. **Do not pick any of them up unless
David has explicitly asked.** Every safety-critical change must be
end-to-end smoke-tested before merge (`seroquel.timer.hours = 0.05`, watch
the SMS/email arrive).

### 3.1 Parallel reads in hot pages
- `src/app/admin/page.tsx` has 6-7 sequential `await db.*` reads at the top
  of the component (viewer, plan state, settings, last 4 logs, flag count,
  impersonatable members). Most are independent. Wrapping in
  `Promise.all([...])` would cut wall-clock by ~150 ms × N round-trips.
- `src/app/dashboard/page.tsx` has the same pattern. Same fix applies.
- Risk: zero behavior change if reads are genuinely independent. Verify by
  grepping for cross-dependencies before changing.

### 3.2 Resend domain verification
- Currently `EMAIL_FROM` falls back to `onboarding@resend.dev` (sandbox
  sender) when `EMAIL_FROM` is unset. Safety emails from a sandbox sender
  land in spam or are rejected by recipient mail servers. **This is the
  highest-priority operational follow-up.**
- Action: verify `davidcareplan.online` in Resend dashboard, then set
  `EMAIL_FROM="David Care Plan <alerts@davidcareplan.online>"` (or similar)
  in Vercel project env.

### 3.3 ClickSend SMS rate window
- The fan-out now sends up to ~7 SMS in parallel per overdue row. ClickSend
  free-tier rate caps are well above that, but if the cron ever processes
  >5 rows in one tick with high recipient counts, monitor for 429s. Block
  caps at `take: 20` already.

### 3.4 Cache the escalation worker's recipient lookup
- `escalate.ts` reads `fullMedical` and `shared` once per cron tick (good).
  If that ever becomes hot, `unstable_cache` with a short TTL plus
  `revalidateTag("members")` from the care-team write routes would work.
  Today it's not hot - leave it.

---

## 4. Things NOT to do

- **Do not parallelize across overdue rows in `escalate.ts`.** Per-row
  idempotency writes are sequential by design. See section 1.5.
- **Do not cache anything that displays case state, escalation state,
  Seroquel-log state, or distressing-call-flag state.** The current cached
  pages (medications, programs, care team) are reference data and were
  chosen specifically because they are not safety-critical to refresh.
- **Do not change `RESPONSE_EVENT_KINDS` to remove `CASE_CLOSED`.** That
  re-opens the phantom-escalation bug.
- **Do not switch `Promise.all` to `Promise.allSettled` in the email/SMS
  fan-out unless the underlying senders start throwing.** Today both
  catch internally and return `{ok}`. `allSettled` would silently mask a
  future regression where one of them starts throwing.
- **Do not move the outer escalation loop to `Promise.all`.** See
  section 1.5.
