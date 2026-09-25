# camstreets
Cambridge school streets volunteer availability calendar

## Setup: Supabase, Vercel and GitHub

This project uses two environments - production (`main` branch) and dev/staging (`dev` branch) - each backed by its own Supabase project. Set these up before running the app locally or deploying.

### 1. GitHub repo and branches

1. Create (or confirm) the GitHub repo, e.g. `github.com/<org>/camstreets`.
2. Ensure two branches exist:
   - `main` - production
   - `dev` - staging/development
3. Push both branches to `origin`.

### 2. Supabase projects

Create two separate Supabase projects so prod and dev data never mix:

1. Sign in at [supabase.com](https://supabase.com) and create a project for **production** (e.g. "Cam school street planner").
2. Create a second project for **dev/staging** (e.g. "Cam school street planner Dev").
3. For each project, go to **Project Settings → API** and note down:
   - Project URL (`https://<ref>.supabase.co`)
   - `anon` `public` key
   (Leave the `service_role` key alone for now - it's only needed later for privileged server-side operations.)

### 3. Vercel project

1. Sign in at [vercel.com](https://vercel.com) and click **Add New → Project**.
2. Import the GitHub repo from step 1.
3. **Verify Project Settings → General → Framework Preset is set to `Next.js`, not `Other`.** This can end up as `Other` (for example if the framework wasn't detected correctly during import), and it fails silently: `next build` still runs and reports success either way, but with `Other` selected Vercel deploys the project as a plain static site - serving only what's in `public/` - and ignores the Next.js server build entirely. The symptom is every route returning 404 (even ones that should always work, like `favicon.ico`), straight after a deployment that looks successful. If you see that, check this setting first.
4. In **Project Settings → Git**, confirm the **Production Branch** is set to `main`.
5. Add domains under **Project Settings → Domains**:
   - Add `www.camstreets.org` - this serves the Production branch (`main`) by default.
   - Add `dev.camstreets.org`, then edit it and set its **Git Branch** to `dev` so it always serves the latest `dev` deployment instead of Production.
   - If the domain isn't already on Vercel's nameservers, add the DNS records Vercel provides at your domain registrar. Note that a domain can also work without full nameserver delegation (e.g. specific A/CNAME records at your existing registrar) - `vercel domains inspect <domain>` showing a nameserver mismatch doesn't necessarily mean the domain isn't reaching Vercel; test the actual URL to be sure.
6. Decide on **Project Settings → Deployment Protection**. By default Vercel protects non-Production deployments (which includes the `dev` branch) with a Vercel-account login ("Vercel Authentication"). Turn it off if `dev.camstreets.org` should be reachable without a Vercel login; leave it on if it should stay private to the team.

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
   The install script appends the following to `~/.bashrc` automatically - check it's there (or add it yourself if using a non-standard shell setup):
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

Schema changes live as SQL migration files in `supabase/migrations/` - see
[`supabase/README.md`](supabase/README.md) for what the schema actually
contains (entities and RLS policies). This section is about the tooling to
work on them.

**Dependencies:**
- The Supabase CLI is already included via `pnpm install` (step 2 above) -
  it's a `devDependency` in `package.json`, no separate install needed. Run
  it as `pnpm supabase <command>`.
- [Docker](https://docs.docker.com/get-docker/) must be installed and
  running - the local Supabase stack (Postgres, Auth, Studio, Realtime,
  Storage) runs as Docker containers on your machine.

**Running the local stack:**
```bash
pnpm supabase start
```
First run pulls the Docker images (a minute or two); subsequent runs are
fast. This also applies every migration in `supabase/migrations/` against a
fresh local database, so it's the first real check that they're valid SQL.
On success it prints local URLs and keys, including a **Studio URL**
(`http://127.0.0.1:54323` by default) - a local copy of the Supabase
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
`supabase/migrations/` - write the change into it, then reapply all
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
creates a pgTAP test file in `supabase/tests/`. Run all of them with:
```bash
pnpm supabase test db --local
```

**Note:** everything above only touches the local Docker stack, not the
hosted dev/prod Supabase projects from step 2.

**Pushing migrations to a hosted project:**

First authenticate the CLI - `supabase login` opens a browser OAuth flow; if
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
password, set when it was created - not the access token) and will prompt
for it. `supabase/seed.sql` is **not** applied by `db push` - it's
local-only by design (see [`supabase/README.md`](supabase/README.md)).

### 7. Creating a superuser

A superuser is a distinct role from an ordinary volunteer or school admin -
it's marked by `is_superuser = true` on that person's row in
**`public.volunteers`** (not `auth.users`/`app_metadata` - an earlier
approach, moved away from in
`20260731170107_superuser_from_volunteers_table.sql` specifically because
syncing a JWT claim was awkward and easy to forget), checked via the
`public.is_superuser()` function used throughout the RLS policies. Column-
level grants (`20260730210606_add_admin_superuser_flags.sql`) already stop
an authenticated user from writing their own `is_superuser` - it can only be
set with the project's `service_role` key (via SQL Editor or Table Editor),
never through the public sign-in flow. There is intentionally no in-app UI
for this.

Since `is_superuser()` reads `public.volunteers` live on every request
(not from the JWT), a page refresh picks up the change - no sign-out/in
needed.

**Local development:**

1. Sign up as normal via `/login` first (locally, `enable_confirmations` is
   off and no real SMTP is configured - see `local_smtp` in
   `supabase/config.toml` - so the magic-link email never leaves the
   machine; view it via the local email-testing UI on port `54324`,
   `http://127.0.0.1:54324`, instead of a real inbox). This creates your
   `public.volunteers` row.
2. With the local stack running (`pnpm supabase start`), open the local
   Studio URL it printed (`http://127.0.0.1:54323` by default) → **SQL
   Editor**, and run:
   ```sql
   update public.volunteers set is_superuser = true where id = '<your user id>';
   ```
   (find `<your user id>` under Authentication → Users, or
   `select id from auth.users where email = '...'`).
3. Refresh the app - no need to sign out/in.

**Hosted projects (dev/prod):** same idea, from that project's own **SQL
Editor** page in the Supabase dashboard (or via a trusted server-side
context using the project's `service_role` key - never expose that key to
the client). Prefer testing against the **dev** project for this, same
caution as pushing migrations above.

**Testing multiple roles without multiple real inboxes:** on a hosted
project (which does send real email), Gmail's `+` aliasing works well -
`you+volunteer@gmail.com`, `you+admin@gmail.com`, `you+superuser@gmail.com`
all deliver to the same real inbox but are distinct addresses as far as
Supabase's `auth.users` is concerned, so you get isolated test accounts per
role without juggling separate email accounts or mixing test data into your
real one.

### 8. Automated workflows (GitHub Actions)

Four workflows live in `.github/workflows/`. Each has a header comment
describing exactly what it does and which repository secrets it needs - that
comment is the full list of secrets, so it isn't repeated here.
Secrets are added under the repo's **Settings → Secrets and variables →
Actions**; none of the workflows will do anything useful until the ones
they list exist.

| Workflow | When it runs | What it does |
|---|---|---|
| `ci.yml` | Every push to `dev` or `main` | Runs the Playwright e2e suite (`e2e/`) against a fresh local Supabase stack. |
| `reset-demo.yml` | Nightly | Wipes and reseeds the three public demo schools on the **dev** project (`scripts/seed-demo.mjs --reset`), so `dev.camstreets.org`'s self-service demo resets itself. The script refuses to run against anything except the local stack or the dev project. |
| `prod-liveness.yml` | Every 30 minutes | Email-free health probe of the live site (`e2e-prod/liveness.spec.ts`): public pages render, the school list loads from the database, and a signed-in session is accepted by the server. |
| `prod-email-login.yml` | Four times a day | The full real magic-link sign-in (`e2e-prod/email-login.spec.ts`), including the email arriving in a monitor inbox, the emailed link, and the resulting session. It also checks the email's sender, subject and wording, which catches the hosted email template drifting from the repo. |

Any of them can also be started by hand: **Actions** tab → pick the workflow →
**Run workflow**. A failed scheduled run emails whoever last edited that
workflow's schedule (GitHub's default); check your Actions notification
settings if that isn't reaching you.

**Setting up the production probes** (one-off):

1. **A dedicated monitor user.** Pick an address only the probes will use.
   The first successful run creates it as an ordinary volunteer (an
   `auth.users` row plus its `volunteers` and calendar-feed rows). It never
   joins a school, so it doesn't appear in any volunteer list.
2. **A dedicated inbox for it** - use a throwaway account, not a personal one:
   the credential the email probe uses can read the *whole* mailbox. For Gmail,
   turn on 2-Step Verification for that account first, then create an app
   password (a normal password won't work over IMAP).
3. **A dedicated API key for the liveness probe** on the production Supabase
   project (Project Settings → API Keys → a new secret key), rather than
   reusing the one the site itself uses, so it can be revoked on its own.
4. **Add the repository secrets** each workflow's header comment lists.
   The email probe never receives the privileged key - only what a real user
   would have (the site and an inbox).
5. **Run each workflow once by hand** to confirm. Until the email probe's
   secrets exist it skips itself with a warning annotation rather than failing.

Run the same probes locally with `pnpm test:prod` (needs the same values as
environment variables; see the two spec files and `e2e-prod/support.ts`).
Probes are deliberately separate from `e2e/`: they must be safe to repeat
against real data, and only ever act as the monitor user.

**Setting up the demo reset** (one-off): add the secrets `reset-demo.yml`
lists, then run it by hand once. The account it makes superuser must be the
address you actually sign in with on `dev.camstreets.org`, otherwise it
creates a second, separate account and yours isn't promoted.
