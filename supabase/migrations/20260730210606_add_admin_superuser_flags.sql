-- Stored, denormalized copies of admin/superuser status on volunteers, for
-- cheap display purposes (e.g. the navbar showing role). The dynamic checks
-- (is_superuser(), is_school_admin()) remain the source of truth for RLS —
-- this migration doesn't touch authorization, only adds a synced copy.
alter table public.volunteers
  add column is_admin boolean not null default false,
  add column is_superuser boolean not null default false;

-- Without this, RLS's "volunteers can create/update their own profile"
-- policies (with check (auth.uid() = id)) restrict *which row*, not *which
-- columns*, a volunteer can write — combined with the table-wide grants in
-- grant_table_privileges.sql, that would let any volunteer set their own
-- is_admin/is_superuser to true. Column-level grants close that off:
-- authenticated users can only ever touch display_name themselves;
-- is_admin/is_superuser can only be written by the security definer
-- functions below, which run with their owner's privileges, not the
-- caller's.
revoke insert, update on public.volunteers from authenticated;
grant insert (id, display_name) on public.volunteers to authenticated;
grant update (display_name) on public.volunteers to authenticated;

-- Superusers now get a volunteers row too (previously excluded) — in
-- practice a superuser is likely also a parent who wants to claim slots
-- like any other volunteer, so they need a volunteers row for
-- signups.volunteer_id to reference. The flag now lives on the row instead
-- of being used to skip creating one.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.volunteers (id, display_name, is_superuser)
  values (
    new.id,
    split_part(new.email, '@', 1),
    coalesce((new.raw_app_meta_data ->> 'is_superuser')::boolean, false)
  );
  return new;
end;
$$;

-- Keeps volunteers.is_admin in sync whenever school_admins changes.
create or replace function public.sync_volunteer_is_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_user_id uuid := coalesce(new.user_id, old.user_id);
begin
  update public.volunteers
  set is_admin = exists (
    select 1 from public.school_admins where user_id = affected_user_id
  )
  where id = affected_user_id;
  return null;
end;
$$;

create trigger on_school_admins_changed
  after insert or delete on public.school_admins
  for each row execute function public.sync_volunteer_is_admin();

-- Backfill for rows that already exist. Superusers created before this
-- migration never got a volunteers row under the old exclusion logic, so
-- one needs creating now; existing school admins (e.g. seed.sql's
-- alex.admin) need is_admin flipped on; anyone already flagged superuser
-- in their auth metadata needs that reflected in the new column.
insert into public.volunteers (id, display_name, is_superuser)
select
  u.id,
  split_part(u.email, '@', 1),
  coalesce((u.raw_app_meta_data ->> 'is_superuser')::boolean, false)
from auth.users u
left join public.volunteers v on v.id = u.id
where v.id is null;

update public.volunteers v
set is_superuser = coalesce((u.raw_app_meta_data ->> 'is_superuser')::boolean, false)
from auth.users u
where u.id = v.id;

update public.volunteers v
set is_admin = true
where exists (
  select 1 from public.school_admins sa where sa.user_id = v.id
);
