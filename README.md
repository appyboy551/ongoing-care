# Ongoing Care, Support Network Portal

A small Next.js + Postgres web app that gives David's support network a calm, clear, secure place to see his current state, action plan, and key care information. David has an admin dashboard to log, check in, manage members, edit content, and issue time-limited access to clinicians.

This README walks through getting the portal running on your own machine. It is written so non-developers can follow it step by step.

## Before anything else: privacy

**This repo must be private on any host where you push it.** It references real names, contact details and medical context for David and the support network. If you push to GitHub for a Vercel deploy, choose Private. Read `SECURITY.md` for the full security and privacy posture, including what does and does not live in git, in the database, and in the workspace folder.

## What's in the box

- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Prisma + Postgres
- Email-only auth via per-person email OTP (no shared passwords)
- Per-clinician, time-limited, audited access grants (no shared healthcare passcode)
- Audit log on logins, content publishes, Seroquel logs, check-ins, distressing call flags, settings changes, and clinician grant issue/use/revoke

Things that are scaffolded but not active until you configure them:

- Email sending (Resend). Until `RESEND_API_KEY` is set, emails are queued only.
- SMS sending (Twilio). Stub only. Email is the channel in this first pass.
- A real production database. Configure `DATABASE_URL` against Vercel Postgres or Neon when you deploy.

## Prerequisites

- Node 20 or newer. Check with `node --version`.
- A Postgres database. Three easy options:
  - Local: install Postgres via Postgres.app on Mac or Docker.
  - Cloud: a free Neon project at https://neon.tech is the simplest path.
  - Vercel: a Vercel Postgres database when you deploy.
- A Resend account at https://resend.com (free tier covers MVP). You don't need this until you want emails to actually send.

## First run

1. Open Terminal and change into this folder:

   ```bash
   cd "/Users/davidwalker/Documents/Claude/Projects/Ongoing Care/portal"
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy the env template and fill it in:

   ```bash
   cp .env.example .env.local
   ```

   At minimum, set `DATABASE_URL` and `SESSION_SECRET`. Generate a secret with:

   ```bash
   openssl rand -base64 32
   ```

4. Create the database tables:

   ```bash
   npm run db:migrate
   ```

   Prisma will prompt to name the migration. Use something like `init`.

5. Create your local seed file from the template and fill in real data:

   ```bash
   cp scripts/seed.example.ts scripts/seed.ts
   ```

   `scripts/seed.ts` is gitignored. Open it and replace every TODO_* placeholder with real values for the eight network members, medications, care team, programs and admissions. The template is intentionally empty so nothing personal ever lands in version control. Then run:

   ```bash
   npm run db:seed
   ```

6. Start the dev server:

   ```bash
   npm run dev
   ```

   Open http://localhost:3001 (port 3001 keeps the portal out of the way if you already have something else on 3000).

7. Sign in as David. Use `david.jwalker5@gmail.com`. The OTP will appear in the terminal as a queued notification if Resend is not configured. With Resend configured, it will arrive in your inbox.

## Where things live

- `prisma/schema.prisma`: every table.
- `scripts/seed.ts`: the network and content seed.
- `src/app/`: pages and API routes (App Router).
- `src/components/`: shared UI.
- `src/lib/`: server-side helpers (auth, OTP, email, audit, settings, timer, cases).
- `src/content/`: static copy and navigation.

## How auth works

1. A network member visits `/login` and types their email.
2. The portal looks them up by email. If they are an active member, it generates a six-digit OTP, hashes it, stores the hash, and emails the raw code.
3. They visit `/login/verify`, enter the code, and the portal verifies the hash. On success, a long-lived HTTP-only session cookie is set. Only the hash of the session token is stored on disk.
4. David has tier `ADMIN`. Bron and Joanna have `FULL_MEDICAL`. Everyone else has `SHARED`.
5. `src/middleware.ts` enforces that protected routes require a session. `src/lib/tier.ts` enforces tier checks in pages and API handlers.

## How the Seroquel log works

1. David goes to `/admin/log-seroquel`.
2. He picks 25mg or 50mg, taps stressor and emotion chips, picks context (in facility or not), picks a severity, optionally adds a reflection.
3. On submit, the portal saves the log, captures location if allowed, computes the expected check-in time using the admin-configurable timer (default 14 hours), and emails Bron and Joanna with the dose stated in words and the expected check-in time.
4. Until David checks in, `getActionPlanState()` reports the plan as `ARMED` until the timer expires, then `MISSED`.
5. David checks in at `/admin/check-in`. The plan closes. Bron and Joanna are emailed that he is okay. Any active distressing-call flags are resolved.

## How clinician access works

1. David goes to `/admin/clinician`, enters the clinician's name, email, role, organisation, reason, and an expiry in hours (up to 14 days).
2. The portal generates a random token, stores only its hash, and emails the clinician a unique URL: `/clinician/grant/<token>`.
3. When the clinician opens the URL, the portal verifies the token, audits the visit, and renders a clean read-only medical report.
4. Every grant issue, use, and revoke is in the audit log. No shared passcode exists.

## How content publishing works

1. David edits a section at `/admin/content`, picking either "Save draft" or "Sign off and publish".
2. Drafts are not visible to readers. Publishing flips the section's `isPublished` flag, snapshots the body in `ContentPublish`, and emails members at or above the section's tier that the section has changed.
3. The audit log records every save and publish.

## Deploying to Vercel (when you're ready)

1. Push this folder to a GitHub repo.
2. Import the repo in Vercel.
3. In the Vercel project's Environment Variables, copy the values from your `.env.local`. Use Vercel Postgres or Neon for `DATABASE_URL`.
4. Add a Vercel build step: `npm run db:migrate:deploy && npm run build` if you want migrations to run on deploy. Otherwise run `npx prisma migrate deploy` from your machine before deploying.
5. After deploy, open the live URL. Sign in as David. Test logging and check-in. The first time you publish content, the network gets emails.

## Security notes

- Sessions are HTTP-only, SameSite=lax, Secure in production. Token hash on disk, not the token.
- OTPs are hashed with SHA-256. Single-use, ten-minute expiry, throttled per member.
- Audit log is append-only. The schema does not expose delete operations from the app code.
- Medicare and Medibank numbers are intentionally not stored. Pages reference David's Bitwarden vault instead.
- No shared healthcare passcode. Clinician access is per-clinician, time-limited, audited.
- `Strict-Transport-Security` and other security headers are set in `next.config.mjs`. Tighten Content Security Policy further when a domain is in place.
- Email is the sign-in factor. Members should turn on two-step verification on their own email accounts. There is a note on `/settings` about this.

## What this first pass does NOT do

- Actually send emails until `RESEND_API_KEY` is set.
- SMS at all (Twilio is stubbed).
- Provision a database for you.
- Deploy to Vercel for you.
- Send the monthly review email automatically (the checklist exists; the scheduled job is a later pass).
- Generate the police script PDF on demand (the inputs exist; the renderer is a later pass).
- Track web push notifications. Add-to-home-screen guidance only.

## Missed check-in escalation (cron)

When deployed to Vercel, `vercel.json` registers a Vercel Cron that hits `/api/cron/missed-check-in` every 5 minutes. The endpoint finds any Seroquel log whose check-in window expired without a check-in, marks the linked case ESCALATED, advances the action plan to "Call David", and emails Bron, Joanna, Shannon, Jackson, Robyn, Rose and Stephen. The job is idempotent: each log gets escalated once. Set `CRON_SECRET` in your Vercel environment so the endpoint refuses random callers. The cron only runs on deployed Vercel (Pro and Hobby tiers include cron). Locally, the route is callable manually with the right Bearer token if you want to test.

If you ask, the next pass can wire each of those.

## Known things to double check before launch

- `scripts/seed.ts` uses placeholder emails for everyone except David. Replace them before issuing access codes.
- `EMAIL_FROM` in `.env.local` defaults to `onboarding@resend.dev`, which works for testing but not for production. Verify a real domain in Resend.
- Confirm the Seroquel timer default with the prescriber and adjust at `/admin/settings`.
- Confirm Bron and Joanna's preferred email addresses for the FULL_MEDICAL tier.
