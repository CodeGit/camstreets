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
- [ ] Session-refresh middleware (`@supabase/ssr` needs this so sessions don't silently expire ~hourly — flagged, not yet built)

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
- [ ] Publish a term: expand a term's `slots` into dated `slot_instances`, excluding UK bank holidays. This is Next.js application code (a Server Action), not a SQL function — see reasoning in past design discussion: needs an external bank-holiday data source (`https://www.gov.uk/bank-holidays.json`), which doesn't fit cleanly inside a DB transaction
- [ ] Admins do not invite/assign volunteers directly — that's volunteer-initiated (see §5)

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
