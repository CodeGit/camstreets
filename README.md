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
3. **Verify Project Settings → General → Framework Preset is set to `Next.js`, not `Other`.** This can end up as `Other` (e.g. if the framework wasn't auto-detected correctly during import), and it's a nasty silent failure: `next build` still runs fine and reports success either way, but with `Other` selected Vercel deploys the project as a plain static site — serving only whatever's literally in `public/` — and ignores the actual Next.js server build entirely. The symptom is every route 404ing (including ones that should always work, like the framework-served `favicon.ico`), even immediately after a fresh, successful-looking deployment. If you ever see that, this setting is the first thing to check.
4. In **Project Settings → Git**, confirm the **Production Branch** is set to `main`.
5. Add domains under **Project Settings → Domains**:
   - Add `www.camstreets.org` — this serves the Production branch (`main`) by default.
   - Add `dev.camstreets.org`, then edit it and set its **Git Branch** to `dev` so it always serves the latest `dev` deployment instead of Production.
   - If the domain isn't already on Vercel's nameservers, add the DNS records Vercel provides at your domain registrar. Note that a domain can also work without full nameserver delegation (e.g. specific A/CNAME records at your existing registrar) — `vercel domains inspect <domain>` showing a nameserver mismatch doesn't necessarily mean the domain isn't reaching Vercel; test the actual URL to be sure.
6. Decide on **Project Settings → Deployment Protection**. By default Vercel gates non-Production deployments (which includes the `dev` branch) behind a Vercel-account login (its "Vercel Authentication" / SSO feature). Turn it off if `dev.camstreets.org` should be reachable without a Vercel login; leave it on if it should stay private to the team.

### 4. Environment variables

In **Project Settings → Environment Variables**, add the Supabase credentials from step 2, scoped per environment:

| Variable | Production | Preview + Development |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | prod project URL | dev project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | prod anon key | dev anon key |

This means the `main` branch (Production) always talks to the prod Supabase project, while the `dev` branch, all PR previews, and local development all talk to the dev Supabase project.

### 5. Local development

This project uses [pnpm](https://pnpm.io) as its package manager. We recommend managing Node.js itself with [nvm](https://github.com/nvm-sh/nvm) rather than a system install, so you can match versions across machines and switch easily.

1. Install Node.js via nvm, then pnpm via corepack:
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
   ```
   The install script appends the following to `~/.bashrc` automatically — check it's there (or add it yourself if using a non-standard shell setup):
   ```bash
   export NVM_DIR="$HOME/.nvm"
   [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
   [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
   ```
   Reload your shell, then install Node and enable pnpm through corepack (bundled with Node.js):
   ```bash
   source ~/.bashrc
   nvm install --lts
   nvm use --lts
   corepack enable
   corepack prepare pnpm@latest --activate
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
   If you see `[ERR_PNPM_IGNORED_BUILDS]` (pnpm blocks native build scripts by default), approve the required packages and reinstall:
   ```bash
   pnpm approve-builds
   pnpm install
   ```
   This project already allow-lists `sharp` and `unrs-resolver` in `pnpm-workspace.yaml`.
3. Install the Vercel CLI and log in:
   ```bash
   pnpm add -g vercel
   vercel login
   ```
4. Link the local repo to the Vercel project and pull the Development-scoped env vars:
   ```bash
   vercel link
   vercel env pull .env.local
   ```
5. Start the dev server:
   ```bash
   pnpm dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

### 6. Database development (Supabase CLI + local stack)

Schema changes live as SQL migration files in `supabase/migrations/` — see
[`supabase/README.md`](supabase/README.md) for what the schema actually
contains (entities and RLS policies). This section is about the tooling to
work on them.

**Dependencies:**
- The Supabase CLI is already included via `pnpm install` (step 2 above) —
  it's a `devDependency` in `package.json`, no separate install needed. Run
  it as `pnpm supabase <command>`.
- [Docker](https://docs.docker.com/get-docker/) must be installed and
  running — the local Supabase stack (Postgres, Auth, Studio, Realtime,
  Storage) runs as Docker containers on your machine.

**Running the local stack:**
```bash
pnpm supabase start
```
First run pulls the Docker images (a minute or two); subsequent runs are
fast. This also applies every migration in `supabase/migrations/` against a
fresh local database, so it's the first real check that they're valid SQL.
On success it prints local URLs and keys, including a **Studio URL**
(`http://127.0.0.1:54323` by default) — a local copy of the Supabase
dashboard for browsing tables and running queries by hand.

When you're done:
```bash
pnpm supabase stop
```

**Making a schema change:**
```bash
pnpm supabase migration new <descriptive_name>
```
This creates an empty, correctly-timestamped `.sql` file in
`supabase/migrations/` — write the change into it, then reapply all
migrations from scratch against the local database:
```bash
pnpm supabase db reset
```
`db reset` wipes the local database and replays every migration file in
order, so it's also how you catch ordering mistakes or SQL errors as you
iterate.

**Running tests:**
```bash
pnpm supabase test new <name> --template pgtap
```
scaffolds a pgTAP test file in `supabase/tests/`. Run all of them with:
```bash
pnpm supabase test db --local
```

**Note:** everything above only touches the local Docker stack, not the
hosted dev/prod Supabase projects from step 2.

**Pushing migrations to a hosted project:**

First authenticate the CLI — `supabase login` opens a browser OAuth flow; if
that's not available (e.g. a non-interactive shell), generate a personal
access token at
[supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
and set it as `SUPABASE_ACCESS_TOKEN`. Then link to the specific hosted
project you want to push to:
```bash
pnpm supabase link --project-ref <project-ref>
```
**Always double-check which `--project-ref` you're using.** Linking to the
production ref by mistake and pushing means applying untested migrations
straight to production. Find each environment's ref under Project Settings →
General in the Supabase dashboard, or via `pnpm supabase projects list`. In
day-to-day development you should almost always be linked to the **dev**
project, not prod.

Once linked, push local migrations to that hosted project:
```bash
pnpm supabase db push
```
Unlike `link`, this requires your database password (the project's Postgres
password, set when it was created — not the access token) and will prompt
for it. `supabase/seed.sql` is **not** applied by `db push` — it's
local-only by design (see [`supabase/README.md`](supabase/README.md)).

### 7. Creating a superuser

A superuser is a distinct role from an ordinary volunteer or school admin —
it's marked by `app_metadata.is_superuser = true` on the `auth.users` row,
checked via the `public.is_superuser()` function used throughout the RLS
policies. This flag can **only** be set through Supabase's Admin API or
dashboard, using the project's `service_role` key — never through the
public sign-in flow (`signInWithOtp`), since a volunteer must never be able
to grant this to themselves. There is intentionally no in-app UI for this.

**Local development:**

1. With the local stack running (`pnpm supabase start`), open the local
   Studio URL it printed (`http://127.0.0.1:54323` by default).
2. Go to **Authentication → Users → Add user → Create new user**.
3. Enter an email (a fake one is fine — see below) and, under the user's
   raw app metadata, set:
   ```json
   { "is_superuser": true }
   ```
4. Sign in as that user via `/login` as normal. Since `enable_confirmations`
   is off locally and no real SMTP is configured (see `local_smtp` in
   `supabase/config.toml`), the magic-link email never leaves the machine —
   view it via the local email-testing UI, also on port `54324`
   (`http://127.0.0.1:54324`), instead of a real inbox.

**Hosted projects (dev/prod):** the equivalent is done from that project's
own **Authentication → Users** page in the Supabase dashboard (or via the
Admin API with the project's `service_role` key from a trusted server-side
context — never expose that key to the client). Prefer testing against the
**dev** project for this, same caution as pushing migrations above.

**Testing multiple roles without multiple real inboxes:** on a hosted
project (which does send real email), Gmail's `+` aliasing works well —
`you+volunteer@gmail.com`, `you+admin@gmail.com`, `you+superuser@gmail.com`
all deliver to the same real inbox but are distinct addresses as far as
Supabase's `auth.users` is concerned, so you get isolated test accounts per
role without juggling separate email accounts or mixing test data into your
real one.
