-- Guarantees every non-superuser auth.users row has a matching volunteers
-- row, so the rest of the app can treat "logged in" and "has a volunteer
-- profile" as the same thing. display_name is pre-populated from the
-- email prefix; users can rename themselves later via their own update
-- policy on volunteers.
--
-- security definer (not invoker): this runs as part of the internal
-- auth-user-creation process, not as the new user's own authenticated
-- session, so the ordinary "volunteers can create their own profile"
-- RLS policy (with check (auth.uid() = id)) wouldn't apply/match here.
-- Safe as definer because the insert is hardcoded to new.id - there's no
-- parameter to direct it at anyone else's profile.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not coalesce((new.raw_app_meta_data ->> 'is_superuser')::boolean, false) then
    insert into public.volunteers (id, display_name)
    values (new.id, split_part(new.email, '@', 1));
  end if;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
