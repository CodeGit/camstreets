-- Consistency: school_admins was the odd one out, calling its member column
-- user_id while signups/volunteer_schools both call theirs volunteer_id.
-- Renaming it also repoints the FK from auth.users to public.volunteers -
-- safe, since handle_new_user() already gives every auth.users row a
-- volunteers row - so it matches signups.volunteer_id and
-- volunteer_schools.volunteer_id in both name and target.
alter table public.school_admins rename column user_id to volunteer_id;

alter table public.school_admins drop constraint school_admins_user_id_fkey;

alter table public.school_admins
  add constraint school_admins_volunteer_id_fkey
  foreign key (volunteer_id) references public.volunteers (id) on delete cascade;

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
      and sa.volunteer_id = (select auth.uid())
  );
$$;

create or replace function public.sync_volunteer_is_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  affected_volunteer_id uuid := coalesce(new.volunteer_id, old.volunteer_id);
begin
  update public.volunteers
  set is_admin = exists (
    select 1 from public.school_admins where volunteer_id = affected_volunteer_id
  )
  where id = affected_volunteer_id;
  return null;
end;
$$;
