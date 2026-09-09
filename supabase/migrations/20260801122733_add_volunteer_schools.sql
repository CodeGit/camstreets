-- Which school(s) a volunteer has chosen to help at. Previously there was no
-- such concept — any volunteer could sign up for a slot at any school — this
-- both scopes the navbar's school switcher to a volunteer's own schools and
-- (below) restricts sign-ups to them, cutting down on picking the wrong
-- school by accident.
create table public.volunteer_schools (
  volunteer_id uuid not null references public.volunteers (id) on delete cascade,
  school_id bigint not null references public.schools (id),
  created_at timestamptz not null default now(),
  primary key (volunteer_id, school_id)
);

alter table public.volunteer_schools enable row level security;

grant select, insert, delete on public.volunteer_schools to authenticated, service_role;

create policy "volunteers can view their own school list"
on public.volunteer_schools
for select
to authenticated
using ((select auth.uid()) = volunteer_id);

create policy "volunteers can add themselves to a school"
on public.volunteer_schools
for insert
to authenticated
with check ((select auth.uid()) = volunteer_id);

create policy "volunteers can remove themselves from a school"
on public.volunteer_schools
for delete
to authenticated
using ((select auth.uid()) = volunteer_id);

-- Tightened: signing up now also requires having selected the slot's school
-- in volunteer_schools, not just being logged in as yourself.
drop policy "volunteers can sign themselves up" on public.signups;

create policy "volunteers can sign themselves up"
on public.signups
for insert
to authenticated
with check (
  (select auth.uid()) = volunteer_id
  and exists (
    select 1
    from public.volunteer_schools vs
    join public.slot_instances si on si.id = slot_instance_id
    join public.slots s on s.id = si.slot_id
    join public.locations l on l.id = s.location_id
    where vs.volunteer_id = (select auth.uid())
      and vs.school_id = l.school_id
  )
);
