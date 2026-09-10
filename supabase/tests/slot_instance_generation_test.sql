begin;
select plan(6);

-- fixtures: a school with one location, scoped dates chosen to avoid
-- colliding with the auto-created default_terms years from seed.sql
insert into public.schools (name) values ('Generation Test School');
insert into public.locations (school_id, name)
values (
  (select id from public.schools where name = 'Generation Test School'),
  'Generation Test Location'
);

-- a bank holiday inside the term below, on a Monday (matching the slot's
-- day_of_week), to prove exclusion actually removes a would-be instance
insert into public.off_days (type, school_id, date, label)
values ('bank_holiday', null, '2030-09-09', 'Test Bank Holiday');

-- Test 1: creating a slot after a term already exists generates instances
-- across that term's date range (order: term first, then slot)
insert into public.terms (school_id, name, start_date, end_date)
values (
  (select id from public.schools where name = 'Generation Test School'),
  'Gen Test Term A', '2030-09-01', '2030-09-11'
);
insert into public.slots (location_id, day_of_week, start_time, end_time, label, capacity)
values (
  (select id from public.locations where name = 'Generation Test Location'),
  1, '08:00', '08:30', 'Monday slot', 2
);

select is(
  (
    select count(*)::int from public.slot_instances si
    join public.terms t on t.id = si.term_id
    where t.name = 'Gen Test Term A'
  ),
  1,
  'creating a slot after the term exists generates one instance (a single Monday in range, excluding the bank holiday Monday)'
);

select is(
  (
    select si.date::text from public.slot_instances si
    join public.terms t on t.id = si.term_id
    where t.name = 'Gen Test Term A'
  ),
  '2030-09-02',
  'the generated instance is the Monday not on the bank holiday'
);

-- Test 2: the bank holiday Monday itself got no instance
select is(
  (
    select count(*)::int from public.slot_instances
    where date = '2030-09-09'
  ),
  0,
  'a bank holiday date gets no generated instance'
);

-- Test 3: creating a term after a slot already exists also generates
-- instances (reverse order: slot first, already inserted above, then term)
insert into public.terms (school_id, name, start_date, end_date)
values (
  (select id from public.schools where name = 'Generation Test School'),
  'Gen Test Term B', '2030-09-15', '2030-09-22'
);

select is(
  (
    select count(*)::int from public.slot_instances si
    join public.terms t on t.id = si.term_id
    where t.name = 'Gen Test Term B'
  ),
  1,
  'creating a term after the slot exists also generates its instance (order-independent)'
);

-- Test 4: generated fields are snapshotted from the slot template
select is(
  (
    select (si.start_time::text, si.end_time::text, si.capacity)
    from public.slot_instances si
    join public.terms t on t.id = si.term_id
    where t.name = 'Gen Test Term B'
  )::text,
  '(08:00:00,08:30:00,2)',
  'generated instance snapshots the slot''s time and capacity'
);

-- Test 5: re-running generation (e.g. a second slot insert touching the
-- same school) is idempotent, not duplicating existing instances
select public.generate_slot_instances_for_school_term(
  (select id from public.schools where name = 'Generation Test School'),
  (select id from public.terms where name = 'Gen Test Term A')
);
select is(
  (
    select count(*)::int from public.slot_instances si
    join public.terms t on t.id = si.term_id
    where t.name = 'Gen Test Term A'
  ),
  1,
  're-running generation for the same term does not duplicate instances'
);

select * from finish();
rollback;
