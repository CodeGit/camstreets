# Timetable / calendar service - task list

Tasks for the core feature: volunteers signing up to cover school street time slots. Each school has one or more recurring weekly slots (e.g. morning drop-off, afternoon pickup on school days); volunteers claim specific dated slots or commit to a recurring one (flexible availability rules are planned but not built); an admin role can see coverage and gaps.

## 1. Data model (Supabase)
- [x] `schools`, `school_admins`, `locations`, `slots`, `terms`, `slot_instances`, `volunteers`, `signups`
- [x] Decide: recurring slots generated ahead of time (stored as real rows) - chosen over computed-on-read, since it lets a single date be cancelled independently and keeps signup history accurate even if a slot template changes later

## 2. Backend / Supabase
- [x] SQL migrations for the tables above, plus RLS policies (per-school admin scoping via `school_admins`, plus a superuser role) and table grants
- [x] pgTAP tests for constraints and RLS
- [x] Seed script (`supabase/seed.sql`) for local/dev testing
- [x] Supabase Auth: email/magic-link sign-in for volunteers
- [ ] **Recurring drift risk, not a one-off**: the hosted dev/prod projects' Auth email templates (Authentication -> Email Templates in each dashboard) are edited by hand and can silently drift from `supabase/templates/magic_link.html`/`config.toml`'s `[auth.email.template.*]` - found 2026-09-17 when the live magic-link template's heading (`Your sign-in link`) and expiry text didn't match the repo file. `supabase config push` could in principle keep these in sync, but its exact scope (which config.toml sections it actually pushes - just `[auth]`, or also `[api]`/`[db]`/`[storage]`/etc.) isn't documented anywhere checked so far (CLI `--help`, docs site, changelog), so it hasn't been run against either hosted project yet. `[remotes.dev]`/`[remotes.prod]` overrides for `site_url`/`additional_redirect_urls` are already in `config.toml`, ready for whenever `config push`'s scope is confirmed safe. Until then: check both dashboards' templates manually whenever the local template files change.
  - [x] **Prod** (`acchajbsrxirldadwgnn`) confirmed matching the repo file exactly, verified 2026-09-17 via the direct `/auth/templates/magic-link-or-otp` URL.
  - [ ] **Dev** (`snquofgpzpjguluglbif`) still unconfirmed - editing it showed inconsistent results in the same session (once appeared fixed via a direct URL check, then appeared reverted to the original untouched text on a later check, ruling out Supabase's Branching feature as the cause since only one real branch exists on that project). Left unresolved 2026-09-17 rather than chase further - re-check via a fresh incognito window at the direct dev URL next time this comes up, since stale dashboard/browser cache was the leading suspect.
- [x] Session-refresh proxy (`src/proxy.ts`) - refreshes the session on every request via `@supabase/ssr` + `getClaims()`, so it doesn't silently expire ~hourly. Named `proxy.ts` not `middleware.ts`: Next.js 16 renamed the file convention (deprecated `middleware`/`export function middleware`, replaced by `proxy`/`export function proxy`)

## 3. Frontend (Next.js)
- [x] Auth pages: sign in (magic link) + sign out
- [x] shadcn/ui set up as the UI component library
- [x] Calendar/timetable views: day, week, month and term views of a school's slots, coloured by how well covered each is
- [x] Slot detail: who's signed up, and a dialog to sign up for or remove a signup from a slot (one-off, or regular every week or fortnight)
- [x] "My calendar" view for a signed-in volunteer, with a subscribe link for their own calendar app
- [x] Mobile-friendly layout (volunteers likely check this on their phone) - per-day week layout and larger tap targets on small screens

## 4. Admin controls
- [ ] Admin coverage overview across a school's locations and slots. Every calendar already colours slots by coverage (red empty, blue partly covered, green full); what's missing is a summary just for admins
- [x] Manage schools, locations and slots (school admins only, per existing RLS)
- [x] Generate slot instances for a term: expand a term's `slots` into dated `slot_instances` (done in the database by triggers - see `supabase/README.md`), excluding dates in `off_days` (bank holidays with `school_id null`, plus that school's own `inset_day` rows - see `20260909102854_add_off_days.sql`). Superseded the earlier plan to fetch bank holidays live from `gov.uk/bank-holidays.json` at generation time - storing them means this has no external dependency, at the cost of needing manual upkeep (see the maintenance item below). Terms no longer have a manual "publish" gate (`20260909191840_drop_term_publish_status.sql`) - a term's own start/end dates already say whether it's past, current or upcoming, so this generation step no longer needs a status flip alongside it
- [x] Admin UI for viewing/editing terms beyond the current academic year - the Term times tab lists every academic year that has terms or off days
- [ ] **Recurring task, not a one-off**: keep `off_days` bank-holiday rows (`type = 'bank_holiday'`) in sync with gov.uk. Most years this is just adding the next academic year's fixed set ahead of time, but ad-hoc extra bank holidays (a monarch's death, a coronation, a jubilee) are announced with no fixed schedule and won't appear automatically - check https://www.gov.uk/bank-holidays whenever one might plausibly have been announced, not just annually
- [x] Admins do not invite or assign volunteers directly - that's volunteer-initiated (see §5)
- [x] A school's first admin is granted automatically: whoever is the first volunteer to join it (via `volunteer_schools`) becomes an admin (`20260908200211_promote_first_school_volunteer_to_admin.sql`). Superusers don't need to assign an admin manually or invite one by email when creating a school - admin status can still be added/transferred afterward via the existing `school_admins` RLS (an admin manages their own school's admin list)
- [x] Default term dates (`default_terms`) and off days (`off_days`: bank holidays + per-school inset days) - superuser/admin-managed reference tables to pre-populate a school's own `terms`, rather than typing the same UK-wide dates in from scratch each time (`20260909102421_add_default_terms.sql`, `20260909102854_add_off_days.sql`)

## 5. Volunteer commitments
Volunteers log in and see the **current best calendar**, then choose how to help fill gaps. Three ways to commit:
- [x] **One-off** - claim a single specific dated `slot_instance` (this is what `signups` already supports directly)
- [x] **Regular** - commit to the same slot every week or every fortnight for the rest of the academic year. No new schema needed: this just bulk-creates one ordinary `signups` row per matching `slot_instance` (a fortnightly one counts real calendar weeks from the first date, so holiday gaps don't shift the pattern). Cancelling a single occurrence (e.g. "can't make it this one week") is just cancelling that one row, per existing `status: 'cancelled'` - it doesn't touch the rest of the regular commitment
- [ ] **Rule-based** - a flexible constraint: a set of acceptable options plus a count (e.g. "I can do 2 of {Tue AM, Wed AM, Thu AM}"). A solver resolves this into concrete regular commitments (stored the same way as a manually-chosen "regular" commitment above)

## 6. Allocation solver
- [ ] Resolves everyone's rule-based commitments into actual regular signups, honouring each volunteer's options + count
- [ ] **Fairness**: balance the total number of allocations per volunteer (roughly equal load), not just first-come-first-served
- [ ] **Backup/provisional pool**: a volunteer's rule capacity beyond what became a locked regular commitment (e.g. said they could do 2, only needed for 1) stays eligible as backup cover - if a different volunteer's regular slot opens up on a one-off basis, an eligible backup can be offered that single date
- [ ] Open design question: is backup eligibility computed on the fly (rescan original rules whenever a gap appears) or stored explicitly? Not yet decided
- [ ] "Generate one or more valid hypothetical calendars" conforming to all current rules - shown for review before committing volunteers to it

## 7. Testing
- [x] pgTAP tests (schema constraints, RLS)
- [x] Playwright e2e tests for the auth flow (happy path + error states), run against the local Supabase stack + Mailpit
- [x] Playwright tests for the calendar, signup, admin and demo flows
- [x] Deployment smoke test - superseded by scheduled production probes (`e2e-prod/`, `prod-liveness.yml` every 30 minutes and `prod-email-login.yml` four times a day - see `README.md` §8) that check the live site rather than only a post-deploy moment, catching hosted-platform-only issues like the Framework Preset / redirect-URL wildcard differences found during manual testing

## 8. Nice-to-have / later
- [ ] Email/SMS reminder before a covered slot
- [ ] Waitlist or swap mechanism when a volunteer cancels
- [x] Calendar integration - a webcal:// (live-subscribable .ics) feed of a volunteer's own confirmed signups (src/app/calendar/[token]/feed.ics), with a per-volunteer regenerable token (volunteer_calendar_feeds) and a lightweight rate limit

## 9. Release
- [ ] Validate end-to-end on `dev` (dev.camstreets.org) with a small group of real volunteers
- [x] Merge to `main` for production once validated (released as `v1.0`, then `v1.1`)
- [x] Public demo mode for `dev.camstreets.org`: 3 pre-seeded schools (scripts/seed-demo.mjs) and a self-service "become an admin" button (becomeDemoAdmin, gated by ALLOW_SELF_ELEVATE + schools.is_demo - see the plan at the time, sequential-nibbling-journal.md, for the full design), verified locally end-to-end
  - [x] GitHub Actions repo secrets for the nightly reset are added and `.github/workflows/reset-demo.yml` has been run successfully (see `README.md` §8)
  - [x] `SUPABASE_SERVICE_ROLE_KEY` and `ALLOW_SELF_ELEVATE` are set in Vercel's Preview scope (checked 2026-09-25; the former is also used by the calendar-feed route)
