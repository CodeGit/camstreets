-- Moves superuser authorization off the JWT and onto public.volunteers.is_superuser.
-- Granting via the dashboard's raw app_metadata editor was awkward and easy to
-- forget to sync; volunteers.is_superuser is now the single place (readable
-- and writable through the ordinary table editor) for both display and RLS.
-- Column-level grants from 20260730210606 already stop authenticated users
-- from writing their own is_superuser, so this doesn't open any new
-- self-escalation path.
create or replace function public.is_superuser()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce(
    (select v.is_superuser from public.volunteers v where v.id = (select auth.uid())),
    false
  );
$$;

-- No longer seeds is_superuser from raw_app_meta_data - every new volunteer
-- starts as false and gets flipped later directly on their volunteers row.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.volunteers (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end;
$$;
