-- Expands a school's weekly slot templates into dated slot_instances rows -
-- the piece flagged as not-yet-built in TODO.md §4 and supabase/README.md.
-- Triggered from both directions so creation order never matters: adding a
-- slot generates instances for that slot across every existing term, and a
-- new term (including ones auto-backfilled by on_default_term_created/
-- on_school_created, 20260909123828) generates instances for every existing
-- slot across that term's date range. Both funnel through the same
-- generate_slot_instances_for_school_term() to stay a single source of
-- truth, and rely on the existing (slot_id, term_id, date) unique
-- constraint + `on conflict do nothing` so re-running is always safe.
--
-- start_time/end_time/capacity are snapshotted from the slot at generation
-- time, per the existing design note in supabase/README.md - editing a slot
-- template later doesn't rewrite already-generated dates.
--
-- Known limitation (left as a follow-up, not built here): adding an
-- off_days row (inset day/bank holiday) *after* instances already exist for
-- that date doesn't retroactively remove them - exclusion only happens at
-- generation time.
create or replace function public.generate_slot_instances_for_school_term(p_school_id bigint, p_term_id bigint)
returns void
language sql
security invoker
set search_path = ''
as $$
  insert into public.slot_instances (slot_id, term_id, date, start_time, end_time, capacity)
  select
    s.id,
    p_term_id,
    d::date,
    s.start_time,
    s.end_time,
    s.capacity
  from public.slots s
  join public.locations l on l.id = s.location_id
  join public.terms t on t.id = p_term_id
  cross join generate_series(t.start_date, t.end_date, interval '1 day') as d
  where l.school_id = p_school_id
    and s.active
    and l.active
    and extract(isodow from d) = s.day_of_week
    and not exists (
      select 1 from public.off_days o
      where o.date = d::date
        and (o.school_id = p_school_id or o.school_id is null)
    )
  on conflict (slot_id, term_id, date) do nothing;
$$;

create or replace function public.on_term_created_generate_instances()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  perform public.generate_slot_instances_for_school_term(new.school_id, new.id);
  return new;
end;
$$;

create trigger generate_instances_after_term_insert
after insert on public.terms
for each row execute function public.on_term_created_generate_instances();

create or replace function public.on_slot_created_generate_instances()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_school_id bigint;
  v_term_id bigint;
begin
  select l.school_id into v_school_id
  from public.locations l
  where l.id = new.location_id;

  for v_term_id in
    select t.id from public.terms t where t.school_id = v_school_id
  loop
    perform public.generate_slot_instances_for_school_term(v_school_id, v_term_id);
  end loop;

  return new;
end;
$$;

create trigger generate_instances_after_slot_insert
after insert on public.slots
for each row execute function public.on_slot_created_generate_instances();
