-- Purely a UX default (e.g. pre-selecting a school in the calendar view) -
-- no enforcement, unrelated to signups/double-booking. Self-service, same
-- as display_name.
alter table public.volunteers
  add column preferred_school_id bigint references public.schools (id);

grant update (display_name, preferred_school_id) on public.volunteers to authenticated;
