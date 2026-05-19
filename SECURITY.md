# Security and privacy notes

## The repo must be private

The codebase contains David's identity, medical context, and contact details for the support network. Several files (the seed script, the action plan, the clinician report, the case-tracker step templates) reference real names and phone numbers in source code.

**Before you push this code anywhere, including to GitHub for Vercel deploy, you must:**

1. Create a private repository. On GitHub, that means selecting "Private" when you create the repo. Do not make it public.
2. Never invite collaborators who are not already in the support network.
3. If you have any doubt the repo is private, do not push. Check the visibility setting twice.

If the repo ever becomes public accidentally, treat it as a leak: rotate any secrets (database password, Resend API key, session secret) and assume the content was scraped.

## What lives in the database

- Member names, emails, phones, relationships, tier.
- Medications (name, dose, notes).
- Care team members (clinicians and contacts).
- Programs.
- Admissions with reason.
- Seroquel logs with stressor and emotion taps, severity, optional reflection note, optional location coordinates.
- Distressing-call flags.
- Cases, case steps, case events (the live tracker).
- Audit log entries (login attempts, content publishes, settings changes, clinician grants, member access changes).
- Session token hashes (never raw tokens).
- OTP code hashes (never raw codes).
- Clinician access grant token hashes (never raw tokens).

Postgres connections are TLS-only by default on Neon and Vercel Postgres. Verify the connection string starts with `postgresql://` and your provider enforces SSL.

## What does NOT live in the database in plaintext

- Passwords (no password auth, email OTP only).
- Raw OTP codes (only SHA-256 hashes).
- Raw session tokens (only SHA-256 hashes).
- Raw clinician grant tokens (only SHA-256 hashes).
- Medicare number, Medicare IRN, Medibank membership number (stored encrypted with AES-256-GCM, see below).

### Encrypted at rest: Medicare and Medibank

The Medicare number, Medicare IRN, and Medibank membership number are encrypted with AES-256-GCM before they are written to the database. The encryption key is `PORTAL_ENCRYPTION_KEY`, stored in your hosting environment (not in the database).

What this protects against:

- An attacker who exfiltrates a database dump but does not have the env var cannot read the numbers.
- Database provider internal staff cannot read plaintext numbers.

What this does NOT protect against:

- An attacker who has both database access and `PORTAL_ENCRYPTION_KEY` (e.g., compromised the running portal process or your Vercel project).
- Loss of the key. If `PORTAL_ENCRYPTION_KEY` is lost, the encrypted values are unrecoverable. Back up the key in Bitwarden the moment you generate it.
- An authorised Full Medical viewer copying the number. Once Bron or Joanna sign in and click Show, the number is on their screen.

Generate the key with `openssl rand -base64 32`. Set it in `.env.local` for development and in your Vercel project's Environment Variables for production. If you ever need to rotate the key, the previously-encrypted values will fail to decrypt. Re-save the numbers through `/admin/secure-numbers` after rotation.

## What lives in git (and what does not)

Gitignored (never committed):

- `.env`, `.env.local`, `.env.*.local`
- `scripts/seed.ts` (David's local copy with real values)
- `.private/` directory if used
- `src/data/*.local.ts`
- `node_modules`, `.next`, `*.log`, `.DS_Store`, `.vercel`, IDE settings, `tmp/`

Committed:

- `scripts/seed.example.ts` (template with no personal data)
- Source code, schema, README, this file
- `.env.example` (template only, no secrets)

If you ever see real personal data in a committed file other than the four runtime files known to embed it (`src/app/clinician/grant/[token]/page.tsx` for David's identity in the report, `src/app/action-plan/page.tsx` and `src/lib/cases.ts` for welfare-check contacts, plus any wording inside published content sections), treat it as a leak and remove it.

## Secrets you must rotate at first sign of trouble

- `DATABASE_URL` (revoke and regenerate in Neon / Vercel)
- `RESEND_API_KEY` (revoke and regenerate in Resend)
- `SESSION_SECRET` (generate a fresh one with `openssl rand -base64 32`. Rotating this signs everyone out, which is what you want.)
- `PORTAL_ENCRYPTION_KEY` is more subtle: rotating it invalidates all encrypted Medicare and Medibank numbers in the database. After rotation, the admin must re-enter the numbers through `/admin/secure-numbers`. Keep a backup of the key in Bitwarden.
- `TWILIO_*` once those are set up

If `SESSION_SECRET` is ever exposed, rotate it and everyone re-signs in on next visit. Cookies signed with the old secret stop validating.

## Auth and session hardening already in place

- Email OTP, hashed with SHA-256, single use, ten-minute expiry, throttled per member (max 5 active codes per member).
- Rate limit on `/api/auth/request-otp`: 10 per IP per 10 minutes.
- Rate limit on `/api/auth/verify-otp`: 6 per IP+email per 10 minutes, returns HTTP 429 with Retry-After when exceeded.
- Session cookies are HTTP-only, SameSite=Lax, Secure in production. Only the token hash sits on disk.
- Login `next` parameter is sanitised. Only same-origin relative paths are allowed. Stops open-redirect tricks.
- Clinician access uses a one-time issued token (32 random bytes). Token hash on disk, raw token in the email link. Every use is audited.
- Append-only audit log. The app code has no delete operations on the audit table.

## Auth and session hardening NOT yet in place

- No CSRF tokens. Cookies are SameSite=Lax which mitigates most cross-site POSTs; an attacker on a same-site subdomain could still attempt to forge requests. Acceptable risk for a small private portal. Add CSRF tokens before opening this to any larger audience.
- No webauthn / passkey support. Email is the only sign-in factor.
- No multi-factor on David's admin account beyond email OTP. The Workplace Alchemy recommendation stands: turn on two-step verification on every member's email account.
- No alerting if an unusual login happens (new IP, new user agent). Login events are in the audit log but no notification is sent.

## Workspace folder note

The workspace folder at `/Users/davidwalker/Documents/Claude/Projects/Ongoing Care/` contains the safety care plan, the audits, the Medicare screenshot (in `_admin_only/`), and the Medibank quote. Treat that folder like the database: it has identifying information. How that folder is backed up or synced is outside the portal's control. If it syncs to iCloud, Google Drive, or another service, that service now holds copies of David's medical information.

Recommendations:

- Keep the workspace folder on local disk, not in a synced cloud folder, unless the cloud provider is acceptable to you.
- Move the Medicare card image into Bitwarden and delete it from `_admin_only/`.
- Move the Medibank quote into Bitwarden or shred it if no longer needed.

## Claude API (brain-dump to draft)

The portal has an admin-only feature at `/admin/draft-helper` that calls Anthropic's Claude API. David types rough notes, Claude returns a suggested draft. The output never auto-publishes; it is treated as a starting point David reviews and edits.

What data leaves your infrastructure:

- The raw notes David types into the form.
- The audience tier and intent metadata.
- Optional extra direction text.

What does NOT leave:

- Database content, audit log, member emails, Medicare or Medibank numbers, Seroquel logs.

Anthropic's data retention and privacy policy apply to the inputs and outputs. Before sending anything sensitive, confirm in the Anthropic Console that training-data opt-out is enabled on the project the key belongs to.

The feature is off by default. If `ANTHROPIC_API_KEY` is unset, the page renders but the API route returns an error explaining the key is missing. To disable the feature entirely, leave the key blank and remove the nav item from `src/content/navigation.ts`.

Every call is audited (kind `SETTING_CHANGED` with `action: "draft-helper"` metadata).

## Email content

Emails sent through Resend include:

- Login OTPs (six digits and a generic reminder).
- Seroquel log notifications to Bron and Joanna (dose in words, expected check-in time, severity number, location info if shared, optional note).
- Check-in confirmations to Bron and Joanna.
- Distressing-call-flag notifications to David, Bron, Joanna.
- Content publish notifications (the section title, not the body).
- Clinician access grant links.

Resend processes these emails. Resend's privacy policy and retention apply to whatever passes through their systems. If that is unacceptable, swap Resend for self-hosted SMTP or a privacy-preferred provider.

## Vercel deploy notes

- Use environment variables in the Vercel dashboard. Do not commit `.env`.
- Use a separate Postgres database for production. Do not point production at your local Neon project unless you intend to.
- Confirm `next.config.mjs` security headers are active in production. They are set there by default.
- Turn on Vercel's "Password Protection" or "Vercel Authentication" until you are ready for public access. This sits in front of the whole deployment and makes the URL un-browseable to anyone without the password.

## If something goes wrong

1. Rotate `SESSION_SECRET` to sign everyone out.
2. Rotate `RESEND_API_KEY`.
3. Rotate `DATABASE_URL` (this requires creating a new connection string in your DB provider and updating Vercel).
4. Review `/admin/audit` for unexpected logins.
5. Revoke any active clinician access grants.
6. Consider revoking active sessions on the Member table by setting `Session.revokedAt` for everything.
