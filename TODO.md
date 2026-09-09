# Timetable / calendar service — setup tasks

Task list for building the core feature: volunteers signing up to cover school street time slots. Assumptions below (mark/adjust as needed): each school has one or more recurring weekly slots (e.g. AM drop-off, PM pickup on school days); volunteers claim specific dated slots, commit to a recurring day, or submit flexible availability rules; a coordinator/admin role can see coverage and gaps.

## 1. Data model (Supabase)
- [x] `schools`, `school_admins`, `locations`, `slots`, `terms`, `slot_instances`, `volunteers`, `signups`
- [x] Decide: recurring slots generated ahead of time (materialized rows) — chosen over computed-on-read, since it lets a single date be cancelled independently and keeps signup history accurate even if a slot template changes later

## 2. Backend / Supabase
- [x] SQL migrations for the tables above, plus RLS policies (per-school admin scoping via `school_admins`, plus a superuser role) and table grants
- [x] pgTAP tests for constraints and RLS
- [x] Seed script (`supabase/seed.sql`) for local/dev testing
- [x] Supabase Auth: email/magic-link sign-in for volunteers
- [x] Session-refresh proxy (`src/proxy.ts`) — refreshes the session on every request via `@supabase/ssr` + `getClaims()`, so it doesn't silently expire ~hourly. Named `proxy.ts` not `middleware.ts`: Next.js 16 renamed the file convention (deprecated `middleware`/`export function middleware`, replaced by `proxy`/`export function proxy`)

## 3. Frontend (Next.js)
- [x] Auth pages: sign in (magic link) + sign out
- [x] shadcn/ui set up as the component/design system
- [ ] Calendar/timetable view: week grid of slots per school, showing open vs. covered
- [ ] Slot detail: list of who's signed up, button to claim/cancel a one-off slot
- [ ] "My signups" view for a logged-in volunteer
- [ ] Mobile-friendly layout (volunteers likely check this on their phone)

## 4. Admin controls
- [ ] Admin dashboard: coverage overview across a school's locations/slots, flag empty (red) and partially-covered (yellow) slot instances
- [ ] Manage schools/locations/slots (school admins only, per existing RLS)
- [ ] Generate slot instances for a term: expand a term's `slots` into dated `slot_instances`, excluding dates in `off_days` (bank holidays with `school_id null`, plus that school's own `inset_day` rows — see `20260909102854_add_off_days.sql`). Superseded the earlier plan to fetch bank holidays live from `gov.uk/bank-holidays.json` at generation time — storing them means this has no external dependency, at the cost of needing manual upkeep (see the maintenance item below). Terms no longer have a manual "publish" gate (`20260909191840_drop_term_publish_status.sql`) — a term's own start/end dates already say whether it's past, current or upcoming, so this generation step no longer needs a status flip alongside it
- [ ] Admin UI for viewing/editing terms beyond the current academic year — `terms` rows for future years already exist as soon as a superuser adds them to `default_terms` (the propagation trigger backfills every school immediately), but the school admin's Term times tab doesn't yet have an obvious way to browse to/edit a future year specifically rather than the current one
- [ ] **Recurring task, not a one-off**: keep `off_days` bank-holiday rows (`type = 'bank_holiday'`) in sync with gov.uk. Most years this is just adding the next academic year's fixed set ahead of time, but ad-hoc extra bank holidays (a monarch's death, a coronation, a jubilee) are announced with no fixed schedule and won't appear automatically — check https://www.gov.uk/bank-holidays whenever one might plausibly have been announced, not just annually
- [ ] Admins do not invite/assign volunteers directly — that's volunteer-initiated (see §5)
- [x] A school's first admin is granted automatically: whoever is the first volunteer to join it (via `volunteer_schools`) becomes an admin (`20260908200211_promote_first_school_volunteer_to_admin.sql`). Superusers don't need to assign an admin manually or invite one by email when creating a school — admin status can still be added/transferred afterward via the existing `school_admins` RLS (an admin manages their own school's admin list)
- [x] Default term dates (`default_terms`) and off days (`off_days`: bank holidays + per-school inset days) — superuser/admin-managed reference tables to pre-populate a school's own `terms`, rather than typing the same UK-wide dates in from scratch each time (`20260909102421_add_default_terms.sql`, `20260909102854_add_off_days.sql`)

## 5. Volunteer commitments
Volunteers log in and see the **current best calendar**, then choose how to help fill gaps. Three ways to commit:
- [ ] **One-off** — claim a single specific dated `slot_instance` (this is what `signups` already supports directly)
- [ ] **Regular** — commit to the same slot every week for the term. No new schema needed: this just bulk-creates one ordinary `signups` row per matching `slot_instance`. Cancelling a single occurrence (e.g. "can't make it this one week") is just cancelling that one row, per existing `status: 'cancelled'` — it doesn't touch the rest of the regular commitment
- [ ] **Rule-based** — a flexible constraint: a set of acceptable options plus a count (e.g. "I can do 2 of {Tue AM, Wed AM, Thu AM}"). A solver resolves this into concrete regular commitments (stored the same way as a manually-chosen "regular" commitment above)

## 6. Allocation solver
- [ ] Resolves everyone's rule-based commitments into actual regular signups, honoring each volunteer's options + count
- [ ] **Fairness**: balance the total number of allocations per volunteer (roughly equal load), not just first-come-first-served
- [ ] **Backup/provisional pool**: a volunteer's rule capacity beyond what became a locked regular commitment (e.g. said they could do 2, only needed for 1) stays eligible as backup cover — if a different volunteer's regular slot opens up on a one-off basis, an eligible backup can be offered that single date
- [ ] Open design question: is backup eligibility computed on the fly (rescan original rules whenever a gap appears) or stored explicitly? Not yet decided
- [ ] "Generate one or more valid hypothetical calendars" conforming to all current rules — surfaced for review before committing volunteers to it

## 7. Testing
- [x] pgTAP tests (schema constraints, RLS)
- [x] Playwright e2e tests for the auth flow (happy path + error states), run against the local Supabase stack + Mailpit
- [ ] Playwright tests for the calendar/signup/admin flows, once built
- [ ] Deployment smoke test (hit the real deployed URL post-deploy, catch hosted-platform-only issues like the Framework Preset / redirect-URL wildcard differences found during manual testing) — not yet built

## 8. Nice-to-have / later
- [ ] Email/SMS reminder before a covered slot
- [ ] Waitlist or swap mechanism when a volunteer cancels

## 9. Rollout
- [ ] Validate end-to-end on `dev` (dev.camstreets.org) with a small group of real volunteers
- [ ] Merge to `main` for production once validated
