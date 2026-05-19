# Ship checklist for Ongoing Care

Step-by-step from a clean local repo to a working private Vercel deployment.
Everything here you (David) need to do yourself: GitHub, Vercel and Resend
all require browser logins or CLI auth that you own.

Estimated time: 30 to 45 minutes if everything goes smoothly.

## 0. Prerequisites

- Node 20 (already installed).
- A GitHub account.
- A Vercel account (free tier is fine for personal use).
- A Resend account (free tier).
- A Neon project (already set up; the dev DATABASE_URL points at it).

## 1. Push to a private GitHub repo (5 min)

Two ways. Pick one.

### 1a. Via the GitHub website (no extra tools)

1. Go to https://github.com/new
2. Repository name: `ongoing-care` (or whatever you like)
3. Description: leave blank or "Private support network portal"
4. Visibility: **Private**. Do not pick Public.
5. Do not initialise with README or .gitignore (the repo already has both).
6. Click Create repository.
7. On the new repo page, copy the SSH URL (looks like `git@github.com:<you>/ongoing-care.git`).
8. Back in your terminal in the portal directory:

   ```
   cd "/Users/davidwalker/Documents/Claude/Projects/Ongoing Care/portal"
   git remote add origin git@github.com:<you>/ongoing-care.git
   git branch -M main
   git push -u origin main
   ```

   If SSH is not set up, use HTTPS instead and GitHub will prompt for a Personal Access Token.

### 1b. Via the GitHub CLI (faster if you ever install gh)

```
brew install gh
gh auth login          # follow the prompts
gh repo create ongoing-care --private --source=. --remote=origin --push
```

## 2. Generate production secrets (2 min)

Run each twice. Save one set as production secrets and keep them in Bitwarden.
Generate distinct values for SESSION_SECRET, PORTAL_ENCRYPTION_KEY, CRON_SECRET.

```
openssl rand -base64 32
openssl rand -base64 32
openssl rand -base64 32
```

Save the PORTAL_ENCRYPTION_KEY in Bitwarden immediately. If you lose it,
the encrypted Medicare and Medibank numbers are unrecoverable.

## 3. Verify Resend (5 min, one-time)

1. Sign in at https://resend.com
2. Domains → Add Domain → enter the domain you want to send from (e.g. workplacealchemy.au)
3. Resend gives you DNS records (3 to 4 entries). Add them in your domain registrar's DNS.
4. Wait for the verification to go green (usually 1 to 10 minutes).
5. API Keys → Create API Key, full-access, save the value. This is RESEND_API_KEY.
6. Decide your from-address. Example: `Ongoing Care <care@workplacealchemy.au>`.

If you want to ship without a custom domain for now, you can use
`onboarding@resend.dev` as EMAIL_FROM. Members will see emails coming from
that address. Switch later.

## 4. Create the Vercel project (5 min)

1. Sign in at https://vercel.com
2. Add New → Project → Import the GitHub repo you just created
3. Framework Preset: Next.js (auto-detected)
4. Root Directory: leave as `./`
5. Environment Variables, paste these one at a time. Use the production
   values (not the dev ones from .env.local):

   ```
   DATABASE_URL              = <your production Neon URL, see step 5>
   SESSION_SECRET            = <secret 1 from step 2>
   PORTAL_ENCRYPTION_KEY     = <secret 2 from step 2>
   CRON_SECRET               = <secret 3 from step 2>
   RESEND_API_KEY            = <from step 3>
   EMAIL_FROM                = Ongoing Care <care@yourdomain>
   CLICKSEND_USERNAME        = <your ClickSend username, optional>
   CLICKSEND_API_KEY         = <your ClickSend API key, optional>
   ANTHROPIC_API_KEY         = <only if you want the draft helper, optional>
   APP_URL                   = https://<your-vercel-url>     # update after first deploy
   ADMIN_EMAIL               = david.jwalker5@gmail.com
   ```

6. Click Deploy. First build takes 2 to 4 minutes.

## 5. Production database (5 min if reusing dev Neon; 10 min for separate)

Two options.

### Option A. Use a separate Neon project for production (recommended)

1. https://console.neon.tech → Create new project
2. Name it `ongoing-care-prod`
3. Region: `ap-southeast-2 (Sydney)` so it's close to your users
4. Copy the pooled connection string. That is DATABASE_URL for Vercel.
5. From your local machine, with that URL temporarily in `.env.local`:

   ```
   npx prisma migrate deploy
   npx prisma db seed         # only if you've populated scripts/seed.ts with real values
   ```

6. Then change `.env.local` back to your dev DB.

### Option B. Reuse the existing Neon dev DB (faster, less clean)

Just paste the same DATABASE_URL into Vercel. Your live site shares the dev DB.
Acceptable for first launch with one user (you). Migrate to a separate prod DB
before inviting the network.

## 6. After first deploy (5 min)

1. Vercel gives you a URL like `https://ongoing-care-david.vercel.app`.
2. Update the APP_URL env var in Vercel to that URL.
3. Redeploy (Vercel dashboard → Deployments → top one → ... → Redeploy).
4. Go to https://<your-url>/login and sign in with your admin email.
5. Verify the OTP arrives (check Resend dashboard if it doesn't).
6. Visit `/admin/settings` and confirm the Seroquel timer is correct.
7. Visit `/admin/network` and confirm the eight members are seeded.

## 7. Lock down access during testing (optional, 2 min)

If you don't want anyone hitting the URL while you test:

1. Vercel project → Settings → Deployment Protection → enable "Vercel Authentication" for Production.
2. Now only people you invite to the Vercel project can load the URL at all.
3. Disable this when you're ready to send invites to the network.

## 8. Cron will run automatically

`vercel.json` registers `/api/cron/missed-check-in` to run every 5 minutes.
Vercel sends the CRON_SECRET as a Bearer token. The route checks for it.
No action required.

## 9. Invite the network (1 min each)

1. Sign in as admin → `/admin/network` → click Send Invite next to each member.
2. They receive an email with a link to `/login`. They sign in with email OTP.
3. They walk the confirm-phone and onboarding gates on first visit.

## Things to double-check before you flip the door open

- [ ] Repo is private on GitHub (visibility setting on the repo page)
- [ ] Resend domain is verified (not `onboarding@resend.dev`) if you want emails to look professional
- [ ] PORTAL_ENCRYPTION_KEY is backed up in Bitwarden
- [ ] Production DATABASE_URL is a different Neon project than dev (if you can swing it)
- [ ] Seroquel timer at `/admin/settings` matches what the prescriber says
- [ ] CRON_SECRET is set in Vercel (without it the missed-check-in cron silently fails)
- [ ] ADMIN_EMAIL matches what is seeded in Member.tier=ADMIN

## When things go wrong

- Login OTP not arriving: check Resend dashboard → Logs. Bad API key or unverified domain are the usual culprits.
- Cron not firing: Vercel dashboard → Deployments → top one → Functions → look for `/api/cron/missed-check-in`. If you see 401, CRON_SECRET is wrong.
- Migration mismatch: `npx prisma migrate status` against the production DATABASE_URL will tell you.
- Database can't connect: confirm the Neon connection string ends with `?sslmode=require` and the password is URL-encoded.

## Rolling back a bad deploy

Vercel dashboard → Deployments → pick the last good deployment → ... → Promote to Production.
Takes seconds. No downtime.
