create or replace function public.is_superuser()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'is_superuser')::boolean, false);
$$;

-- security definer (not invoker): school_admins has its own RLS policy that
-- calls this function, so an invoker-rights query here would recurse into
-- that policy forever. Safe as definer because the check is hardcoded to
-- the caller's own auth.uid() - there's no parameter to inspect anyone else.
create or replace function public.is_school_admin(p_school_id bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.school_admins sa
    where sa.school_id = p_school_id
      and sa.user_id = (select auth.uid())
  );
$$;

alter table public.schools enable row level security;
alter table public.school_admins enable row level security;
alter table public.locations enable row level security;
alter table public.slots enable row level security;
alter table public.terms enable row level security;
alter table public.slot_instances enable row level security;
alter table public.volunteers enable row level security;
alter table public.signups enable row level security;

create policy "schools are publicly readable"
on public.schools
for select
to anon, authenticated
using (true);

create policy "school admins can update their school"
on public.schools
for update
to authenticated
using (is_school_admin(id) or is_superuser())
with check (is_school_admin(id) or is_superuser());

create policy "superusers can create schools"
on public.schools
for insert
to authenticated
with check (is_superuser());

create policy "locations are publicly readable"
on public.locations
for select
to anon, authenticated
using (true);

create policy "school admins can manage their locations"
on public.locations
for all
to authenticated
using (is_school_admin(school_id) or is_superuser())
with check (is_school_admin(school_id) or is_superuser());

create policy "slots are publicly readable"
on public.slots
for select
to anon, authenticated
using (true);

create policy "school admins can manage their slots"
on public.slots
for all
to authenticated
using (
  is_superuser()
  or is_school_admin((select l.school_id from public.locations l where l.id = location_id))
)
with check (
  is_superuser()
  or is_school_admin((select l.school_id from public.locations l where l.id = location_id))
);

create policy "school admins can see who administers their school"
on public.school_admins
for select
to authenticated
using (is_school_admin(school_id) or is_superuser());

create policy "school admins can manage their school's admin list"
on public.school_admins
for all
to authenticated
using (is_school_admin(school_id) or is_superuser())
with check (is_school_admin(school_id) or is_superuser());

create policy "published terms are publicly readable"
on public.terms
for select
to anon, authenticated
using (status = 'published');

create policy "school admins can manage their terms"
on public.terms
for all
to authenticated
using (is_school_admin(school_id) or is_superuser())
with check (is_school_admin(school_id) or is_superuser());

create policy "slot instances in published terms are publicly readable"
on public.slot_instances
for select
to anon, authenticated
using (
  exists (
    select 1 from public.terms t
    where t.id = term_id and t.status = 'published'
  )
);

create policy "school admins can manage their slot instances"
on public.slot_instances
for all
to authenticated
using (
  is_superuser()
  or is_school_admin((
    select l.school_id
    from public.slots s
    join public.locations l on l.id = s.location_id
    where s.id = slot_id
  ))
)
with check (
  is_superuser()
  or is_school_admin((
    select l.school_id
    from public.slots s
    join public.locations l on l.id = s.location_id
    where s.id = slot_id
  ))
);

create policy "volunteer display names are publicly readable"
on public.volunteers
for select
to anon, authenticated
using (true);

create policy "volunteers can create their own profile"
on public.volunteers
for insert
to authenticated
with check ((select auth.uid()) = id);

create policy "volunteers can update their own profile"
on public.volunteers
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "signups are publicly readable"
on public.signups
for select
to anon, authenticated
using (true);

create policy "volunteers can sign themselves up"
on public.signups
for insert
to authenticated
with check ((select auth.uid()) = volunteer_id);

create policy "volunteers can cancel their own signups"
on public.signups
for update
to authenticated
using ((select auth.uid()) = volunteer_id)
with check ((select auth.uid()) = volunteer_id);

create policy "school admins can cancel signups for their slots"
on public.signups
for update
to authenticated
using (
  is_superuser()
  or is_school_admin((
    select l.school_id
    from public.slot_instances si
    join public.slots s on s.id = si.slot_id
    join public.locations l on l.id = s.location_id
    where si.id = slot_instance_id
  ))
)
with check (
  is_superuser()
  or is_school_admin((
    select l.school_id
    from public.slot_instances si
    join public.slots s on s.id = si.slot_id
    join public.locations l on l.id = s.location_id
    where si.id = slot_instance_id
  ))
);
