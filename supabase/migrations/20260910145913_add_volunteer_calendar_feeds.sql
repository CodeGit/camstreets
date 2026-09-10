-- One row per volunteer, holding the opaque token their phone/Google/
-- Outlook calendar subscribes with (see src/app/calendar/[token]/feed.ics
-- and TODO.md's "calendar integration" item). Kept in its own table,
-- rather than a column on volunteers, because "volunteer display names
-- are publicly readable" already grants anon/authenticated select on
-- every column of that table - a token column there would leak everyone's
-- feed token to anyone hitting the REST API directly. `last_fetched_at`
-- is a lightweight per-token rate limit (see the feed route): calendar
-- clients never need faster than one refresh a minute, so requests inside
-- that window short-circuit before touching signups/slot_instances at all.
create table public.volunteer_calendar_feeds (
  volunteer_id uuid primary key references public.volunteers (id) on delete cascade,
  token uuid not null default gen_random_uuid() unique,
  last_fetched_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.volunteer_calendar_feeds enable row level security;

grant select, insert, update on public.volunteer_calendar_feeds to authenticated;
-- RLS bypass (service_role's BYPASSRLS attribute) only skips row-level
-- policies - it doesn't imply table-level privileges, which are a
-- separate Postgres layer PostgREST still enforces. Without this grant
-- the feed route's service-role lookup fails with "permission denied"
-- even though service_role bypasses every policy below.
grant select, update on public.volunteer_calendar_feeds to service_role;

-- Deliberately no policy lets anyone look a row up *by token* - that
-- lookup (serving the actual feed to an unauthenticated calendar client)
-- goes through the service-role client in the feed route instead, which
-- bypasses RLS entirely. These policies only cover the authenticated,
-- "manage my own feed link" side (My calendar's subscribe UI).
create policy "volunteers can view their own calendar feed"
on public.volunteer_calendar_feeds
for select
to authenticated
using ((select auth.uid()) = volunteer_id);

create policy "volunteers can create their own calendar feed"
on public.volunteer_calendar_feeds
for insert
to authenticated
with check ((select auth.uid()) = volunteer_id);

-- Powers "regenerate link" - overwriting `token` immediately invalidates
-- whatever URL was subscribed before, since the feed route looks rows up
-- by token and will 404 once the old value stops matching.
create policy "volunteers can regenerate their own calendar feed token"
on public.volunteer_calendar_feeds
for update
to authenticated
using ((select auth.uid()) = volunteer_id)
with check ((select auth.uid()) = volunteer_id);
