# Database schema

This describes the data model and Row Level Security (RLS) rules defined in
`supabase/migrations/`. See `20260707144814_create_core_schema.sql` for table
definitions and `20260707162819_enable_rls.sql` for the policies referenced
below.

## Entities

```
schools ─┬─< school_admins >─ volunteers
         └─< locations ─< slots ─< slot_instances >─< signups >─ volunteers
                                        ^
                                        │
                                     terms (per school)
```

- **`schools`** — a participating school. `active` retires a school without
  deleting historical data.
- **`school_admins`** — join table granting a volunteer (`volunteers.id`)
  admin rights over one specific school. Many-to-many: one person can admin
  several schools, one school can have several admins.
- **`locations`** — a physical point at a school needing volunteers (e.g. a
  specific road closure or crossing point). A school can have several.
- **`slots`** — a recurring weekly template at a location: day of week,
  time, a label (e.g. "AM drop-off"), and a `capacity` (suggested number of
  volunteers, not a hard cap).
- **`terms`** — a date range belonging to one school (e.g. "Autumn 1 2026").
  Starts as `draft`; only once `published` does it generate real dates.
  Modelled as UK-style half-terms (Autumn 1/2, Spring 1/2, Summer 1/2) so
  half-term breaks are just the gaps between term rows, not an exception
  inside one.
- **`slot_instances`** — a `slot` expanded onto one concrete `date` within a
  `term`. `start_time`, `end_time`, and `capacity` are **snapshotted** from
  the parent `slot` at generation time, so editing a template later doesn't
  rewrite already-generated dates. `status` (`open`/`cancelled`) is how a
  single date gets cancelled (inset day, bad weather) without touching the
  template or any other date.
- **`volunteers`** — a 1:1 profile extending `auth.users`. Deliberately
  minimal: just a self-chosen `display_name`, no phone/email, to keep
  personal-data footprint low.
- **`signups`** — a volunteer claiming a `slot_instance`. No exclusivity
  constraint — any number of volunteers can sign up to the same instance;
  the app compares the count against `slot_instances.capacity` to show
  progress (it's a suggested number, not enforced).

Generating `slot_instances` from a published term (expanding weekly slots
into dated rows, including bank-holiday exclusion) is deliberately **not** a
database function — it happens in application code (Next.js Server Action),
since it depends on an external bank-holiday data source and is triggered by
one specific user action rather than needing to run atomically inside the
database.

## Roles

Three tiers, checked via two helper functions (`is_superuser()`,
`is_school_admin(school_id)`):

- **Superuser** — global, set via `app_metadata.is_superuser` on the user's
  JWT (never `user_metadata`, which users can edit themselves). Can create
  schools and override any school admin check. Granted manually via the
  Supabase dashboard — there's no self-service way to become one.
- **School admin** — scoped to specific school(s) via `school_admins`.
  Manages that school's locations, slots, terms, and can cancel signups for
  their own school's slots.
- **Volunteer / public** — anyone logged in (or not) can read public data;
  a logged-in volunteer manages their own profile and signups.

## RLS summary

| Table | Read | Write |
|---|---|---|
| `schools` | everyone | admin/superuser updates; only superuser creates (bootstrapping — you can't be admin of a school that doesn't exist yet) |
| `locations` | everyone | school admin or superuser, full CRUD |
| `slots` | everyone | school admin or superuser, full CRUD |
| `school_admins` | that school's admins + superuser | school admin manages their own school's admin list (including removing themselves — no "last admin" guard at the DB level; that's a Next.js-level check) |
| `terms` | `published` only, publicly; admins also see their own school's `draft`/`archived` | school admin or superuser, full CRUD |
| `slot_instances` | only if parent term is `published` | school admin or superuser (resolved via `slot → location → school`) |
| `volunteers` | everyone (just `display_name`, intentionally public — see below) | self only |
| `signups` | everyone | volunteer signs up/cancels their own; school admin can also cancel signups for their own school's slots |

Notes on some of the less obvious calls:

- **`volunteers.display_name` is publicly readable.** This only works because
  the table was deliberately minimised to just a self-chosen display name —
  no phone, no email duplicated from `auth.users`. If more fields are added
  later, revisit whether they should stay admin/self-only.
- **Multiple RLS policies on the same command are OR'd together**, not a
  fallback chain. E.g. `terms` has a "published is public" policy and a
  "school admin sees their own school's rows" policy — both apply
  simultaneously, so an admin sees strictly more than the public, not a
  different view.
- **`slots`/`slot_instances` admin checks require a subquery** to resolve
  the owning school, since neither table stores `school_id` directly (they
  only have `location_id` / `slot_id`).
