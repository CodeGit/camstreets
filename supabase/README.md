# Database schema

This describes the data model and Row Level Security (RLS) rules defined in
`supabase/migrations/`. Start with `20260707144814_create_core_schema.sql`
(the first tables) and `20260707162819_enable_rls.sql` (the first policies);
later migrations add to both. To see what's actually in the database right
now, run `pnpm supabase db reset` locally and inspect it in Studio - the
migrations are the definitive record, this file is a summary.

## Entities

```
schools ─┬─< locations ─< slots ─< slot_instances >─< signups >─ volunteers
         ├─< terms ─────────────────^  (each instance belongs to one term)
         ├─< school_admins >─ volunteers
         ├─< volunteer_schools >─ volunteers
         └─< off_days   (inset days; bank holidays have no school)

default_terms              (yearly template, copied into every school's terms)
volunteer_calendar_feeds   (one per volunteer, for their calendar subscription)
```

- **`schools`** - a participating school. `active` retires a school without
  deleting historical data. `is_demo` marks the public demo schools on the dev
  site; the self-service "become an admin" button only ever picks from those.
- **`locations`** - a physical point at a school needing volunteers (e.g. a
  crossing point or road closure). A school can have several.
- **`slots`** - a recurring weekly template at a location: day of week
  (1 = Monday to 5 = Friday in practice), start and end time, a label (e.g.
  "Morning drop-off"), and a `capacity` (the number of volunteers wanted, not a
  hard limit).
- **`terms`** - a date range belonging to one school (e.g. "Autumn 1 2026").
  Modelled as UK-style half-terms (Autumn 1/2, Spring 1/2, Summer 1/2), so a
  half-term break is just the gap between two term rows. A term has no
  "published" state: its own `start_date` and `end_date` already say whether it
  is past, current or upcoming.
- **`default_terms`** - a year's dates, entered once by a superuser. When one is
  added, `on_default_term_created` copies it into every school's `terms`, and
  `on_school_created` fills a new school's terms from the existing defaults.
- **`off_days`** - dates with no slots: bank holidays (`school_id` is null, so
  they apply to every school) and a school's own inset days.
- **`slot_instances`** - a `slot` on one real `date` within a `term`.
  `start_time`, `end_time` and `capacity` are **copied** from the slot when the
  instance is generated, so editing a slot later doesn't rewrite dates that
  already exist. `status` (`open` / `cancelled`) is how a single date is
  cancelled (inset day, bad weather) without touching the slot or any other
  date.
- **`volunteers`** - a 1:1 profile extending `auth.users`, created
  automatically by `on_auth_user_created`. Deliberately minimal: a
  self-chosen `display_name` and a few flags (`is_admin`, `is_superuser`,
  `preferred_school_id`) - no phone or email, to keep the amount of personal
  data held low.
- **`volunteer_schools`** - which schools a volunteer belongs to. Signing up
  for a slot adds the volunteer to that slot's school automatically, and the
  signup policy requires it. The first volunteer to join a school is made its
  admin (`promote_first_school_volunteer_to_admin`).
- **`school_admins`** - which volunteers administer which school. Many-to-many:
  one person can admin several schools and one school can have several admins.
  `volunteers.is_admin` is a copy of "has any row here", kept up to date by the
  `on_school_admins_changed` trigger so the app can check it cheaply.
- **`signups`** - a volunteer claiming a `slot_instance`, with a `status` of
  `confirmed` or `cancelled`. Cancelling only changes the status - signups are
  never deleted, so history stays accurate. No limit on how many volunteers can
  sign up to one instance; the app compares the count with
  `slot_instances.capacity` to show how covered it is.
- **`volunteer_calendar_feeds`** - a volunteer's private, regenerable `token`
  used in their calendar subscription link. Created automatically for every new
  volunteer (`on_volunteer_created`).

### How slot instances get created

Generating `slot_instances` happens **inside the database**, in
`generate_slot_instances_for_school_term`. It runs when a term is added
(`generate_instances_after_term_insert`) and when a slot is added
(`generate_instances_after_slot_insert`). For each active slot it creates one
instance per matching weekday in the term, skipping any date in `off_days`
(bank holidays and that school's inset days). Existing instances are left
alone (`on conflict do nothing`).

## Roles

Three levels, checked through two helper functions, `is_superuser()` and
`is_school_admin(school_id)`:

- **Superuser** - has `is_superuser = true` on their row in `public.volunteers`.
  The function reads that row live on every request, so a change takes effect
  without signing out and in. Can create schools and pass any school-admin
  check. It can only be set with the project's `service_role` key (SQL Editor),
  never through the app - see `README.md` §7.
- **School admin** - has a row in `school_admins` for a specific school. Manages
  that school's locations, slots, terms and volunteers, and can cancel signups
  for its slots.
- **Volunteer / public** - anyone, signed in or not, can read the public data;
  a signed-in volunteer manages their own profile, school list and signups.

## RLS summary

A superuser can do everything a school admin can, on every school, so it isn't
repeated in the table.

| Table | Read | Write |
|---|---|---|
| `schools` | everyone | school admin updates their own; only a superuser creates (you can't be admin of a school that doesn't exist yet) |
| `locations`, `slots`, `terms`, `slot_instances` | everyone | school admin, full control (`slots` and `slot_instances` find their school through `location`) |
| `default_terms` | signed-in users | superuser only |
| `off_days` | signed-in users | school admin (their inset days) or superuser (bank holidays) |
| `school_admins` | that school's admins | school admin manages their own school's list, including removing themselves (there is no "last admin" guard in the database; the app checks that) |
| `volunteer_schools` | the volunteer, and that school's admins | a volunteer adds or removes themselves; a school admin can remove a volunteer from their school |
| `volunteers` | everyone (only `display_name` is meant to be public - see below) | the volunteer, for their own row |
| `signups` | everyone | a volunteer signs themselves up (only at a school they belong to) and cancels their own; a school admin can cancel signups for their school's slots |
| `volunteer_calendar_feeds` | the volunteer | the volunteer, for their own row |

Notes on some of the less obvious choices:

- **`volunteers` is publicly readable.** That is only safe because the table
  holds no phone number or email - just a display name and a few flags. If more
  personal fields are added later, decide whether they should be readable by
  the volunteer and admins only.
- **Users can't grant themselves roles.** Column-level permissions stop a
  signed-in user writing `is_admin` or `is_superuser` on their own row.
- **When a table has several policies for the same action, they are combined
  with OR** - it isn't a fallback chain. For example, reads of `terms` and
  `slot_instances` are open to everyone (`using (true)`), while writes are
  governed by a separate "school admin or superuser" policy on the same table.
- **`slots` and `slot_instances` admin checks need a subquery** to find the
  owning school, because neither table stores `school_id` directly (they only
  have `location_id` / `slot_id`).
