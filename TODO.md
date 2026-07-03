# Timetable / calendar service — setup tasks

Task list for building the core feature: volunteers signing up to cover school street time slots. Assumptions below (mark/adjust as needed): each school has one or more recurring weekly slots (e.g. AM drop-off, PM pickup on school days); volunteers claim specific dated slots rather than just submitting general availability; a coordinator/admin role can see coverage and gaps.

## 1. Data model (Supabase)
- [ ] `schools` — name, address/location, active flag
- [ ] `slots` — recurring template per school: day of week, start time, end time, label (e.g. "AM drop-off")
- [ ] `slot_instances` — a concrete date derived from a slot (or generate on the fly for a date range instead of storing)
- [ ] `volunteers` — profile linked 1:1 to a Supabase Auth user (name, phone/email, school(s) they're associated with)
- [ ] `signups` — volunteer x slot_instance, with status (confirmed/cancelled)
- [ ] Decide: recurring slots generated ahead of time (materialized rows) vs. computed on read from a recurrence rule

## 2. Backend / Supabase
- [ ] Write SQL migrations for the tables above
- [ ] Row Level Security: volunteers can read all open slots, but only insert/delete their own signups; admins can read/write everything
- [ ] Supabase Auth: email/magic-link sign-in for volunteers
- [ ] Seed script with a real school + a week of slots for local/dev testing

## 3. Frontend (Next.js)
- [ ] Auth pages: sign in / sign up (volunteer)
- [ ] Calendar/timetable view: week grid of slots per school, showing open vs. covered
- [ ] Slot detail: list of who's signed up, button to claim/cancel a slot
- [ ] "My signups" view for a logged-in volunteer
- [ ] Admin view: coverage overview across schools/weeks, flag empty slots
- [ ] Mobile-friendly layout (volunteers likely check this on their phone)

## 4. Nice-to-have / later
- [ ] Email/SMS reminder before a covered slot
- [ ] Waitlist or swap mechanism when a volunteer cancels
- [ ] Recurring "I'm usually free every Tuesday" default availability, separate from one-off signups

## 5. Rollout
- [ ] Validate end-to-end on `dev` (dev.camstreets.org) with a small group of real volunteers
- [ ] Merge to `main` for production once validated
