# Setup reference: local, dev and production

This is a companion to [`README.md`](README.md) (the step-by-step first-time
setup) and [`supabase/README.md`](supabase/README.md) (schema and RLS
reference). This file is a short reference for how the three environments are
set up, checked against the Vercel and Supabase projects on 2026-09-25.

## The three environments

| | Branch | Vercel | Supabase project | Domain |
|---|---|---|---|---|
| **Local** | any | - (`pnpm dev`) | local Docker stack (`pnpm run db:start`) | http://localhost:3000 |
| **Dev/staging** | `dev` | Preview deployments | "Cam School Street Planner Dev" (`snquofgpzpjguluglbif`, eu-west-2) | `dev.camstreets.org` |
| **Production** | `main` | Production deployment | "Cam School Street Planner" (`acchajbsrxirldadwgnn`, eu-west-2) | `www.camstreets.org` and `camstreets.org` |

Both hosted Supabase projects are active. The Vercel project is **camstreets**,
under the `code-git-vercel` team. DNS for `camstreets.org` is managed at the
domain registrar, not by Vercel.

Releases are made by merging `dev` into `main`; the first two were tagged
`v1.0` and `v1.1`.

## Environment variables

The app reads only these four. Set them in Vercel under **Project Settings →
Environment Variables**:

| Variable | Production | Preview | Development |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | prod project | dev project | dev project |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | prod key | dev key | dev key |
| `SUPABASE_SERVICE_ROLE_KEY` | prod key | dev key | - |
| `ALLOW_SELF_ELEVATE` | **never set** | `true` | - |

- `SUPABASE_SERVICE_ROLE_KEY` can bypass every access rule. It is used only on
  the server (the calendar feed route and the demo "become an admin" action),
  and must never be given a `NEXT_PUBLIC_` name.
- `ALLOW_SELF_ELEVATE` turns on the demo "become an admin" button, so it must
  stay out of Production. A second check (`schools.is_demo`) means the button
  can only ever act on demo schools, but don't rely on that alone.
- Create the `NEXT_PUBLIC_` variables as ordinary variables, **not** as
  "Sensitive". Next.js reads them at build time, and Vercel can't read a
  Sensitive variable back - a production build broke this way once.
- The Production scope also has older variables added by the Vercel-Supabase
  integration (Postgres connection strings, a JWT secret, older key names).
  The code doesn't read any of them.

## Local development

1. `pnpm install` (Node via nvm, pnpm via corepack - see `README.md` §5 for
   first-time machine setup).
2. `vercel link` once, then `vercel env pull .env.local` to fetch the
   Development-scope variables.
   - In practice `.env.local` here points at the **local** Supabase stack
     (`http://127.0.0.1:54321`), not the hosted dev project - it was edited by
     hand after the pull. Point it back at the hosted dev project's URL and key
     if you want to run the app against real dev data.
3. Start the local Supabase stack (Postgres, Auth, Studio, Storage, Realtime
   in Docker):
   ```bash
   pnpm run db:start   # first run pulls images and applies every migration
   pnpm run db:reset   # wipe and rebuild the local database from the migrations and seed.sql
   pnpm run db:stop    # when done
   ```
   Docker must be running. Use these scripts rather than the raw
   `pnpm exec supabase start` / `db reset`: they run the same commands and then
   `scripts/kong-fix.sh` (see the known quirk below). Use the raw
   `pnpm exec supabase <command>` form for anything else (`status`,
   `migration new`, and so on).
4. Run the app: `pnpm dev` → http://localhost:3000
5. Other scripts (`package.json`):
   - `pnpm build` / `pnpm start` - production build and server
   - `pnpm lint` - ESLint
   - `pnpm storybook` - Storybook on port 6006 (component preview)

**Known quirk (handled automatically):** `supabase db reset`, `stop` and
`start` restart the `auth` container, and Kong (the gateway in front of the
local stack) doesn't always reconnect to it. The symptom is every login
attempt failing - the magic-link send errors, or `POST /auth/v1/otp` returns
`502 Bad Gateway` with `"An invalid response was received from the upstream
server"` - even though Docker reports `auth` as healthy (its health check says
"healthy" while it is still returning 502). `pnpm run db:start` and
`db:reset` fix this by running `scripts/kong-fix.sh`, which restarts Kong and
retries a real `POST /auth/v1/otp` until it succeeds. If you used the raw
`supabase` commands and login breaks, run `pnpm run kong:fix`.

### Running tests

- **pgTAP (database and RLS tests)** - needs the local stack running:
  ```bash
  pnpm supabase test db --local
  ```
  Create a new one with `pnpm supabase test new <name> --template pgtap`.
- **Playwright e2e** (`e2e/`) - the whole app against the local stack:
  ```bash
  pnpm run db:reset    # the tests rely on the seeded accounts and data
  pnpm test:e2e
  ```
  This starts `pnpm dev` if nothing is already running on port 3000, and reads
  magic links from Mailpit (local email inbox, port 54324 - see `README.md` §7).
  The tests share one database, so they run one at a time. After a run, reset
  the database again before running any single test on its own, because earlier
  tests leave signups behind.
- **Production probes** (`e2e-prod/`) - checks of the live site rather than a
  local stack, described in `README.md` §8:
  ```bash
  pnpm test:prod
  ```
  They need the monitor-user values as environment variables, so in practice
  they run from GitHub Actions (`prod-liveness.yml`, `prod-email-login.yml`).
- **Storybook** component tests use `@storybook/addon-vitest`. No separate test
  command has been confirmed beyond the scripts above - check `.storybook/`
  if you need to run them without the browser.

### Schema changes

```bash
pnpm supabase migration new <name>   # new empty migration file
pnpm supabase db reset               # replay every migration locally
```
See `supabase/README.md` for the schema and `README.md` §6-7 for the CLI
walkthrough (linking to a hosted project, pushing migrations, creating a
superuser).

### Automated workflows

Four GitHub Actions workflows (e2e tests on every push, a nightly demo reset,
and two production probes) are described in `README.md` §8, including how
they're set up.

## Dev/staging (Vercel Preview + Supabase dev)

- The `dev` branch deploys as a **Preview** deployment, served at
  `dev.camstreets.org`.
- The local Supabase CLI is normally linked to the dev project, so
  `pnpm supabase db push` from a machine set up this way pushes migrations
  there by default. Check with `pnpm supabase projects list` (the linked project
  is marked) before pushing.
- `dev.camstreets.org` is also the public demo: three demo schools with
  generated volunteers and signups, plus a "become an admin" button so visitors
  can try the admin side. The demo data is wiped and re-created every night by
  `reset-demo.yml`. The seed script refuses to run against anything except the
  local stack or the dev project.

## Production (Vercel Production + Supabase prod)

- `main` is the Production branch, served at `www.camstreets.org` and
  `camstreets.org`. `camstreets.vercel.app` also works as a fallback.
- Every migration in `supabase/migrations/` has been applied to the prod
  project. New ones are pushed by hand (`README.md` §6) - **check which project
  you're linked to first**.
- The first superuser is created by hand in the prod project's SQL Editor - see
  `README.md` §7.
- The Production scope of Vercel holds the privileged variables listed above;
  never pull those into a local `.env.local` or a Preview/Development scope.

### Email sign-in settings

Sign-in is by magic link only. These are set in each hosted project's
Supabase dashboard, not in code:
- Custom SMTP (SMTP2GO) under **Authentication → SMTP**, sending as
  `login@camstreets.org`.
- Magic links stay valid for 24 hours (the most Supabase allows), and sessions
  have no time limit.
- The magic-link email template (**Authentication → Email Templates**) was
  pasted in by hand and must match `supabase/templates/magic_link.html`.
  Nothing keeps them in step automatically, so check both projects' templates
  whenever that file changes. The `[remotes.*]` sections in
  `supabase/config.toml` are ready for `supabase config push`, but it hasn't
  been run against either hosted project because its exact scope isn't
  documented - see `TODO.md` §2.

### Sign-in error messages

A failed sign-in returns to `/login` with a specific message and, underneath,
the technical code (Supabase's own error code) to quote when emailing
`help@camstreets.org`. The mapping lives in `src/lib/authErrors.ts`; the full
error is also written to the server log (Vercel → Logs), without the email
address.

| Message says | Usual cause | Code |
|---|---|---|
| valid email address | Typo or malformed address | `validation_failed` |
| Too many sign-in emails | Supabase or SMTP rate limit hit | `over_email_send_rate_limit` |
| couldn't send the sign-in email | Mail server (SMTP2GO) or Supabase failing | `unexpected_failure` |
| couldn't reach the sign-in service | Network problem or outage | `AuthRetryableFetchError` |
| expired or already used | Link older than 24 hours, or clicked twice | `otp_expired`, `flow_state_expired`, `flow_state_not_found` |
| different browser or device | Link opened somewhere other than where it was requested (often an email app's built-in browser) | `pkce_code_verifier_not_found` |
| didn't work (generic) | Any other failure opening the link | varies |

## Known gaps

- The dev project's email template hasn't been confirmed to match the repo
  (`TODO.md` §2).
- Some users on Safari report being signed out despite sessions having no time
  limit; the cause hasn't been found.
