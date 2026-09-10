# Setup reference: local dev, dev/staging, production

This is a companion to [`README.md`](README.md) (the step-by-step first-time
setup) and [`supabase/README.md`](supabase/README.md) (schema/RLS reference).
This file is a quick-lookup summary of how the three environments are
actually configured today, checked directly against the Vercel and Supabase
projects on 2026-09-08.

## The three environments

| | Branch | Vercel | Supabase project | Domain |
|---|---|---|---|---|
| **Local** | any | - (`pnpm dev`, localhost:3000) | local Docker stack (`pnpm supabase start`) | http://localhost:3000 |
| **Dev/staging** | `dev` | Preview deployments | "Cam School Street Planner Dev" (`snquofgpzpjguluglbif`, eu-west-2) - **ACTIVE** | `dev.camstreets.org` (intended, see caveat below) |
| **Production** | `main` | Production deployment | "Cam School Street Planner" (`acchajbsrxirldadwgnn`, eu-west-2) - **currently INACTIVE (paused)** | `www.camstreets.org` (intended, see caveat below); fallback `camstreets.vercel.app` |

Vercel project: **camstreets**, under the `code-git-vercel` team/org
(shown as "CodeGit Vercel").

## Local development

1. `pnpm install` (Node via nvm, pnpm via corepack - see `README.md` §5 for
   first-time machine setup).
2. `vercel link` once, then `vercel env pull .env.local` to get the
   Development-scoped env vars (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
   - In practice `.env.local` here currently points at the **local** Supabase
     stack (`http://127.0.0.1:54321`), not the hosted dev project - i.e. it's
     been hand-edited after the `env pull`. Point it back at the hosted dev
     project's URL/anon key if you want to run the app against real dev data
     instead of your local stack.
3. Local Supabase stack (Postgres/Auth/Studio/Storage/Realtime in Docker):
   ```bash
   pnpm run db:start   # first run pulls images; applies all migrations fresh
   pnpm run db:stop    # when done
   ```
   Requires Docker running. Prefer `pnpm run db:start`/`db:reset` over the
   raw `pnpm exec supabase start`/`db reset` - they wrap the same commands
   but also run `scripts/kong-fix.sh` afterward (see the known quirk below).
   Use the raw `pnpm exec supabase <command>` form for anything else
   (`status`, `migration new`, etc).
4. Run the app: `pnpm dev` → http://localhost:3000

   **Known quirk (now automated around): `supabase db reset`/`stop`/`start`
   restart the `auth` container, and Kong (the API gateway in front of the
   local stack) doesn't always reconnect to it afterward** - symptom is
   every login attempt failing (magic-link send errors, or
   `POST /auth/v1/otp` returning `502 Bad Gateway` with `"An invalid
   response was received from the upstream server"`), even though the
   `auth` container itself reports healthy (Docker's own healthcheck isn't
   reliable here - it's said "healthy" while still 502ing). `pnpm run
   db:start`/`db:reset` fix this automatically by running
   `scripts/kong-fix.sh` afterward, which restarts Kong and polls a real
   `POST /auth/v1/otp` request until it actually succeeds, not just until
   the container looks up. If you used the raw `supabase` commands instead
   and login breaks, run `pnpm run kong:fix` directly.
5. Other scripts (`package.json`):
   - `pnpm build` / `pnpm start` - production build/serve
   - `pnpm lint` - ESLint
   - `pnpm storybook` - Storybook on port 6006 (component-level dev/preview)

### Running tests

- **pgTAP (database/RLS tests)** - needs the local stack running:
  ```bash
  pnpm supabase test db --local
  ```
  Scaffold a new one with `pnpm supabase test new <name> --template pgtap`.
- **Playwright e2e** (`e2e/login.spec.ts` - magic-link login flow, happy
  path + error states):
  ```bash
  pnpm test:e2e
  ```
  This auto-starts `pnpm dev` via `webServer` in `playwright.config.ts` if
  nothing's already running on :3000, and runs against Mailpit for magic
  links (see `README.md` §7 for the local email-testing UI on :54324).
- **Storybook** component tests are wired via `@storybook/addon-vitest`
  (Vitest); no separate test command was confirmed in this pass beyond the
  scripts above - check `.storybook/` config if you need to run those
  headlessly.

### Schema changes

```bash
pnpm supabase migration new <name>   # new empty migration file
pnpm supabase db reset               # replay all migrations from scratch locally
```
See `supabase/README.md` for the actual schema/entities and
`README.md` §6–7 for the full CLI walkthrough (linking to a hosted project,
pushing migrations, creating a superuser).

## Dev/staging (Vercel Preview + Supabase Dev)

- Vercel: the `dev` branch deploys as a **Preview** deployment (confirmed via
  `vercel list` - recent deployments for this project are tagged `Preview`,
  not `Production`).
- Supabase project **"Cam School Street Planner Dev"**
  (`snquofgpzpjguluglbif`, `eu-west-2`) - status `ACTIVE_HEALTHY`. This is
  also the project the local Supabase CLI is currently `link`ed to
  (`supabase/.temp/project-ref`), so `pnpm supabase db push` from this
  machine pushes here by default.
- Vercel env vars scoped to **Development** and **Preview** currently only
  include `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` -
  no service-role key at this scope, matching `README.md`'s guidance to keep
  privileged keys out of preview/dev.
- **`dev.camstreets.org` is live** (confirmed 2026-09-08: `200 OK`, served by
  Vercel, correct app content) - the CNAME record for it has been added at
  the registrar and is working.

## Production (Vercel Production + Supabase prod)

- Vercel: `main` is the Production branch. Fallback URL
  `https://camstreets.vercel.app` (works regardless of custom-domain status).
- Supabase project **"Cam School Street Planner"** (`acchajbsrxirldadwgnn`,
  `eu-west-2`) - status **`INACTIVE`** as of this check. Supabase free-tier
  projects auto-pause after a period of inactivity; this needs restoring
  from the Supabase dashboard before the production site can actually serve
  real data.
- Vercel env vars scoped to **Production** include the full privileged set:
  `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`,
  `SUPABASE_SECRET_KEY`/`SUPABASE_PUBLISHABLE_KEY`, direct
  `POSTGRES_*` connection strings, plus the public URL/anon key - these
  should never be pulled into a local `.env.local` or a Preview/Development
  scope.
- **`www.camstreets.org` DNS/domain config is correct** (`server: Vercel`,
  routes to Production as expected) - it 404s because **Production has never
  received real app code**. `main`'s only commit is the repo's original
  "Initial commit" (`.gitignore`, `LICENSE`, `README.md` - no `package.json`,
  no `src/`), so the one Production deployment on record (67d old, 1s build)
  built essentially nothing. This is expected at the current stage, not a
  misconfiguration: per `TODO.md` §9, `main` is meant to receive everything
  only once it's been validated on `dev`, which hasn't happened yet.

## Known gaps (as of this check)

- Production Supabase project is paused - needs unpausing before prod is
  actually usable.
- `www.camstreets.org` 404s because `main` has never been updated past the
  repo's initial commit - there's no app for Production to serve yet. Fix is
  to merge `dev` → `main` per `TODO.md` §9's rollout plan, once validated;
  `dev.` is already live and correct.
- Local Docker Supabase stack was stopped at the time of this check; start
  it with `pnpm supabase start` before working on anything DB-backed
  locally.
