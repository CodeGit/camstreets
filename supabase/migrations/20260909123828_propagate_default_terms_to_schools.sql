-- Schools no longer create their own terms manually - they're populated
-- automatically from default_terms, with the school able to edit the
-- resulting dates afterward if they need to diverge. Two directions:
--   1. A new default_terms year is added -> back-fill it onto every
--      existing school.
--   2. A new school is added -> back-fill every existing default_terms
--      year onto it.
-- Plain SECURITY INVOKER (the default): both triggers only ever fire from
-- an already-superuser-only insert (default_terms/schools RLS both
-- restrict INSERT to is_superuser()), and terms' own RLS already lets a
-- superuser write for any school, so there's no privilege gap to bridge
-- with SECURITY DEFINER.
create or replace function public.propagate_default_term_to_schools()
returns trigger
language plpgsql
as $$
declare
  season text := split_part(new.name, ' ', 1);
  year text := split_part(new.name, ' ', 2);
  s record;
begin
  for s in select id from public.schools loop
    insert into public.terms (school_id, name, start_date, end_date) values
      (s.id, season || ' 1 ' || year, new.start_date, new.half_term_start),
      (s.id, season || ' 2 ' || year, new.half_term_end, new.end_date)
    on conflict (school_id, name) do nothing;
  end loop;
  return new;
end;
$$;

create trigger on_default_term_created
  after insert on public.default_terms
  for each row execute function public.propagate_default_term_to_schools();

create or replace function public.seed_new_school_terms_from_defaults()
returns trigger
language plpgsql
as $$
declare
  dt record;
  season text;
  year text;
begin
  for dt in select * from public.default_terms loop
    season := split_part(dt.name, ' ', 1);
    year := split_part(dt.name, ' ', 2);
    insert into public.terms (school_id, name, start_date, end_date) values
      (new.id, season || ' 1 ' || year, dt.start_date, dt.half_term_start),
      (new.id, season || ' 2 ' || year, dt.half_term_end, dt.end_date)
    on conflict (school_id, name) do nothing;
  end loop;
  return new;
end;
$$;

create trigger on_school_created
  after insert on public.schools
  for each row execute function public.seed_new_school_terms_from_defaults();
