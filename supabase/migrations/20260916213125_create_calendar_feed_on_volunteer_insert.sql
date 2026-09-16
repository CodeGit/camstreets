-- Auto-provisions a volunteer_calendar_feeds row the moment a volunteer
-- is created, so calendarFeedLink.tsx no longer has to lazily insert one
-- itself on first render - a database write during a Server Component's
-- render was a real correctness smell (GET-like rendering with a side
-- effect), not just a style preference. Same "provision on insert" idiom
-- handle_new_user() already uses for public.volunteers itself.
create or replace function public.create_calendar_feed_for_new_volunteer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.volunteer_calendar_feeds (volunteer_id) values (new.id);
  return new;
end;
$$;

create trigger on_volunteer_created
  after insert on public.volunteers
  for each row execute function public.create_calendar_feed_for_new_volunteer();

-- Backfill: any volunteer created before this migration existed won't
-- have a feed row yet - a one-time catch-up so calendarFeedLink.tsx can
-- drop its lazy-insert fallback entirely rather than keeping it "just in
-- case" for pre-existing volunteers.
insert into public.volunteer_calendar_feeds (volunteer_id)
select id from public.volunteers
on conflict (volunteer_id) do nothing;
