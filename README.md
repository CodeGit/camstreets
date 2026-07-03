# camstreets
Cambridge school streets volunteer availability calendar

## Prerequisites setup (Supabase + Vercel + GitHub)

This project uses two environments — production (`main` branch) and dev/staging (`dev` branch) — each backed by its own Supabase project. Set these up before running the app locally or deploying.

### 1. GitHub repo and branches

1. Create (or confirm) the GitHub repo, e.g. `github.com/<org>/camstreets`.
2. Ensure two branches exist:
   - `main` — production
   - `dev` — staging/development
3. Push both branches to `origin`.

### 2. Supabase projects

Create two separate Supabase projects so prod and dev data never mix:

1. Sign in at [supabase.com](https://supabase.com) and create a project for **production** (e.g. "Cam school street planner").
2. Create a second project for **dev/staging** (e.g. "Cam school street planner Dev").
3. For each project, go to **Project Settings → API** and note down:
   - Project URL (`https://<ref>.supabase.co`)
   - `anon` `public` key
   (Leave the `service_role` key alone for now — it's only needed later for privileged server-side operations.)

### 3. Vercel project

1. Sign in at [vercel.com](https://vercel.com) and click **Add New → Project**.
2. Import the GitHub repo from step 1.
3. In **Project Settings → Git**, confirm the **Production Branch** is set to `main`.
4. Add domains under **Project Settings → Domains**:
   - Add `www.camstreets.org` — this serves the Production branch (`main`) by default.
   - Add `dev.camstreets.org`, then edit it and set its **Git Branch** to `dev` so it always serves the latest `dev` deployment instead of Production.
   - If the domain isn't already on Vercel's nameservers, add the DNS records Vercel provides at your domain registrar.

### 4. Environment variables

In **Project Settings → Environment Variables**, add the Supabase credentials from step 2, scoped per environment:

| Variable | Production | Preview + Development |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | prod project URL | dev project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | prod anon key | dev anon key |

This means the `main` branch (Production) always talks to the prod Supabase project, while the `dev` branch, all PR previews, and local development all talk to the dev Supabase project.

### 5. Local development

1. Install the Vercel CLI (e.g. via `pnpm`/`npm`) and log in: `vercel login`.
2. Link the local repo to the Vercel project: `vercel link`.
3. Pull the Development-scoped env vars: `vercel env pull .env.local`.
4. Install dependencies and start the dev server.
