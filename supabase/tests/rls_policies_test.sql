begin;
select plan(8);

-- fixtures: two schools, one admin each, plus an unaffiliated volunteer
insert into public.schools (name) values ('School A'), ('School B');

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'admin-a@test.com'),
  ('22222222-2222-2222-2222-222222222222', 'admin-b@test.com'),
  ('33333333-3333-3333-3333-333333333333', 'volunteer-1@test.com');

insert into public.school_admins (school_id, user_id) values
  ((select id from public.schools where name = 'School A'), '11111111-1111-1111-1111-111111111111'),
  ((select id from public.schools where name = 'School B'), '22222222-2222-2222-2222-222222222222');

insert into public.terms (school_id, name, start_date, end_date, status) values
  ((select id from public.schools where name = 'School A'), 'Published Term', '2026-09-01', '2026-10-23', 'published'),
  ((select id from public.schools where name = 'School A'), 'Draft Term', '2027-01-05', '2027-02-12', 'draft');

-- Test 1: anonymous users only see published terms
set local role anon;
select results_eq(
  $$ select name from public.terms order by name $$,
  ARRAY['Published Term'],
  'anon only sees published terms'
);
reset role;

-- Test 2: School A's own admin sees both their draft and published terms
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';
select results_eq(
  $$ select name from public.terms order by name $$,
  ARRAY['Draft Term', 'Published Term'],
  'school A admin sees both their draft and published terms'
);

-- Test 3: School B's admin does not see School A's draft term
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';
select results_eq(
  $$ select name from public.terms order by name $$,
  ARRAY['Published Term'],
  'school B admin does not see school A''s draft term'
);

-- Test 4: a superuser sees everything regardless of school
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333", "app_metadata": {"is_superuser": true}}';
select results_eq(
  $$ select name from public.terms order by name $$,
  ARRAY['Draft Term', 'Published Term'],
  'superuser sees all terms regardless of school'
);

-- Test 5: School B's admin cannot publish School A's draft term
set local request.jwt.claims to '{"sub": "22222222-2222-2222-2222-222222222222"}';
update public.terms set status = 'published' where name = 'Draft Term';
reset role;
select is(
  (select status from public.terms where name = 'Draft Term'),
  'draft',
  'school B admin''s update to school A''s term has no effect'
);

-- Test 6: School A's admin can publish their own draft term
set local role authenticated;
set local request.jwt.claims to '{"sub": "11111111-1111-1111-1111-111111111111"}';
update public.terms set status = 'published' where name = 'Draft Term';
reset role;
select is(
  (select status from public.terms where name = 'Draft Term'),
  'published',
  'school A admin can publish their own draft term'
);

-- Test 7: a user can create their own volunteer profile
set local role authenticated;
set local request.jwt.claims to '{"sub": "33333333-3333-3333-3333-333333333333"}';
select lives_ok(
  $$ insert into public.volunteers (id, display_name) values ('33333333-3333-3333-3333-333333333333', 'Vera Volunteer') $$,
  'a user can create their own volunteer profile'
);

-- Test 8: a user cannot create a volunteer profile for someone else
select throws_ok(
  $$ insert into public.volunteers (id, display_name) values ('11111111-1111-1111-1111-111111111111', 'Impersonator') $$,
  '42501',
  null,
  'a user cannot create a volunteer profile for someone else'
);

select * from finish();
rollback;
