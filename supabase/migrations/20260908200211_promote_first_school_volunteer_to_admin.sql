-- A school gets its first admin automatically: whoever is the first
-- volunteer to join it (via volunteer_schools) is granted school_admins
-- for it. Chosen over a superuser manually assigning admins one-by-one, or
-- an email-invite flow at school-creation time (which turned out to need
-- the service-role key just to learn the invited user's id back) — this
-- needs no new schema, no privileged key, and admin status can always be
-- transferred/added to afterward via the existing school_admins RLS
-- (an admin manages their own school's admin list).
create or replace function public.promote_first_school_volunteer_to_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.volunteer_schools
    where school_id = new.school_id and volunteer_id <> new.volunteer_id
  ) then
    insert into public.school_admins (school_id, volunteer_id)
    values (new.school_id, new.volunteer_id)
    on conflict (school_id, volunteer_id) do nothing;
  end if;
  return new;
end;
$$;

create trigger on_volunteer_school_joined
  after insert on public.volunteer_schools
  for each row execute function public.promote_first_school_volunteer_to_admin();
