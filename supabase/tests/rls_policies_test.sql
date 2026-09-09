begin;
select plan(6);

-- fixtures: two schools, one admin each, plus an unaffiliated volunteer
insert into public.schools (name) values ('School A'), ('School B');

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin-a@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'admin-b@test.com'),
  ('33333333-3333-3333-3333-333333333333', 'volunteer-1@test.com'),
  ('44444444-4444-4444-4444-444444444444', 'super-s@test.com');

update public.volunteers set is_superuser = true
where id = '44444444-4444-4444-4444-444444444444';

insert into public.school_admins (school_id, volunteer_id) values
  ((select id from public.schools where name = 'School A'), '11111111-1111-1111-1111-111111111111'),
  ((select id from public.schools where name = 'School B'), '22222222-2222-2222-2222-222222222222');

-- on_default_term_created (20260909123828) also auto-creates terms for
-- School A/B from seed.sql's default_terms rows the moment they're
-- inserted above — the queries below filter by name to isolate this
-- fixture row from that automatic set rather than assert on both.
insert into public.terms (school_id, name, start_date, end_date) values
  ((select id from public.schools where name = 'School A'), 'RLS Test Term', '2026-09-01', '2026-10-23');

-- Test 1: terms are publicly readable regardless of which school owns them —
-- a term's dates alone say whether it's past/current/upcoming, there's no
-- more "not ready to show yet" state to gate (20260909191840).
set local role anon;
select results_eq(
  $$ select name from public.terms
    where school_id in (select id from public.schools where name in ('School A', 'School B'))
      and name = 'RLS Test Term'
    order by name $$,
  ARRAY['RLS Test Term'],
  'terms are publicly readable regardless of school'
);
reset role;

-- Test 2: School B's admin cannot edit School A's term
set local role authenticated;
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';
update public.terms set end_date = '2026-11-01' where name = 'RLS Test Term';
reset role;
select is(
  (select end_date::text from public.terms where name = 'RLS Test Term'),
  '2026-10-23',
  'school B admin''s update to school A''s term has no effect'
);

-- Test 3: School A's admin can edit their own term
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';
update public.terms set end_date = '2026-11-01' where name = 'RLS Test Term';
reset role;
select is(
  (select end_date::text from public.terms where name = 'RLS Test Term'),
  '2026-11-01',
  'school A admin can edit their own term'
);

-- Test 4: a superuser can edit any school's term
set local role authenticated;
set local request.jwt.claims to '{"sub": "44444444-4444-4444-4444-444444444444"}';
update public.terms set end_date = '2026-11-08' where name = 'RLS Test Term';
reset role;
select is(
  (select end_date::text from public.terms where name = 'RLS Test Term'),
  '2026-11-08',
  'superuser can edit any school''s term'
);

-- Test 5: a user can create their own volunteer profile
-- (the on_auth_user_created trigger already gave this user a row when they
-- were inserted into auth.users above; delete it first so this actually
-- exercises the insert policy instead of colliding with it)
delete from public.volunteers where id = '33333333-3333-3333-3333-333333333333';
set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333"}';
select lives_ok(
  $$ insert into public.volunteers (id, display_name) values ('33333333-3333-3333-3333-333333333333', 'Vera Volunteer') $$,
  'a user can create their own volunteer profile'
);

-- Test 6: a user cannot create a volunteer profile for someone else
select throws_ok(
  $$ insert into public.volunteers (id, display_name) values ('11111111-1111-1111-1111-111111111111', 'Impersonator') $$,
  '42501',
  null,
  'a user cannot create a volunteer profile for someone else'
);

select * from finish();
rollback;
