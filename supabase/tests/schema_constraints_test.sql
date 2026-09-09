begin;
select plan(6);

-- fixtures
insert into public.schools (name) values ('Test School'), ('Another School');
insert into public.locations (school_id, name)
values (
  (select id from public.schools where name = 'Test School'),
  'Test Location'
);

-- slots.day_of_week must be between 0 and 6
select throws_ok(
  $$
    insert into public.slots (location_id, day_of_week, start_time, end_time, label)
    values (
      (select id from public.locations where name = 'Test Location'),
      7, '08:00', '08:30', 'Bad day'
    )
  $$,
  '23514',
  null,
  'day_of_week outside 0-6 is rejected'
);

select lives_ok(
  $$
    insert into public.slots (location_id, day_of_week, start_time, end_time, label)
    values (
      (select id from public.locations where name = 'Test Location'),
      1, '08:00', '08:30', 'Monday AM'
    )
  $$,
  'day_of_week within 0-6 is accepted'
);

-- slots.end_time must be after start_time
select throws_ok(
  $$
    insert into public.slots (location_id, day_of_week, start_time, end_time, label)
    values (
      (select id from public.locations where name = 'Test Location'),
      2, '09:00', '08:00', 'Backwards slot'
    )
  $$,
  '23514',
  null,
  'end_time before start_time is rejected'
);

-- terms.end_date must be after start_date
select throws_ok(
  $$
    insert into public.terms (school_id, name, start_date, end_date)
    values (
      (select id from public.schools where name = 'Test School'),
      'Backwards Term', '2026-09-01', '2026-08-01'
    )
  $$,
  '23514',
  null,
  'term end_date before start_date is rejected'
);

-- terms (school_id, name) must be unique. Named to avoid colliding with
-- on_default_term_created (20260909123828), which auto-creates "Autumn 1
-- 2026" etc. for every school the moment it's inserted, from seed.sql's
-- default_terms rows.
insert into public.terms (school_id, name, start_date, end_date)
values (
  (select id from public.schools where name = 'Test School'),
  'Uniqueness Test Term', '2026-09-01', '2026-10-23'
);

select throws_ok(
  $$
    insert into public.terms (school_id, name, start_date, end_date)
    values (
      (select id from public.schools where name = 'Test School'),
      'Uniqueness Test Term', '2026-11-01', '2026-12-01'
    )
  $$,
  '23505',
  null,
  'duplicate term name within the same school is rejected'
);

-- but the same term name is fine for a different school
select lives_ok(
  $$
    insert into public.terms (school_id, name, start_date, end_date)
    values (
      (select id from public.schools where name = 'Another School'),
      'Uniqueness Test Term', '2026-09-01', '2026-10-23'
    )
  $$,
  'same term name is fine for a different school'
);

select * from finish();
rollback;
