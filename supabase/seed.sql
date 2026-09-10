-- Sample data for local development. Not applied to hosted projects.

insert into public.schools (name, street, town) values
  ('Newnham Croft Primary', 'Fen Causeway', 'Cambridge');

-- 2026/27 academic year default term dates. Inserted here, right after the
-- school, because on_default_term_created (see
-- 20260909123828_propagate_default_terms_to_schools.sql) fires on each of
-- these inserts and automatically creates the matching pair of half-term
-- terms rows (e.g. "Autumn 1 2026" / "Autumn 2 2026") for every existing
-- school - Newnham Croft Primary gets its terms this way, not from a
-- manual terms insert.
insert into public.default_terms (name, start_date, half_term_start, half_term_end, end_date) values
  ('Autumn 2026', '2026-09-01', '2026-10-27', '2026-10-31', '2026-12-22'),
  ('Spring 2027', '2027-01-05', '2027-02-16', '2027-02-20', '2027-03-27'),
  ('Summer 2027', '2027-04-13', '2027-05-25', '2027-05-29', '2027-07-20');

-- England & Wales bank holidays for the 2026/27 academic year, pulled from
-- gov.uk/bank-holidays.json on 2026-09-09 (see the "Refresh from gov.uk"
-- button, src/components/terms/actions.ts, for keeping these current -
-- this is just a starting point, not synced automatically).
insert into public.off_days (type, date, label) values
  ('bank_holiday', '2026-12-25', 'Christmas Day'),
  ('bank_holiday', '2026-12-28', 'Boxing Day'),
  ('bank_holiday', '2027-01-01', 'New Year''s Day'),
  ('bank_holiday', '2027-03-26', 'Good Friday'),
  ('bank_holiday', '2027-03-29', 'Easter Monday'),
  ('bank_holiday', '2027-05-03', 'Early May bank holiday'),
  ('bank_holiday', '2027-05-31', 'Spring bank holiday'),
  ('bank_holiday', '2027-08-30', 'Summer bank holiday');

-- Two locations, matching a typical school's real shape better than a
-- single crossing point - most have more than one road/gate needing
-- cover.
insert into public.locations (school_id, name, address) values
  (
    (select id from public.schools where name = 'Newnham Croft Primary'),
    'Newnham Road crossing point',
    'Newnham Road, Cambridge'
  ),
  (
    (select id from public.schools where name = 'Newnham Croft Primary'),
    'Grantchester Street crossing',
    'Grantchester Street, Cambridge'
  );

-- One row per weekday (Monday=1..Friday=5) per slot - a slot always
-- covers every weekday at the same time (see createSlot,
-- src/components/schools/locationsActions.ts), rather than the admin
-- picking a single day. Each location gets a morning and afternoon slot -
-- 2 locations x 2 slots = 4 timeslots a day, a reasonable average.
insert into public.slots (location_id, day_of_week, start_time, end_time, label, capacity)
select
  (select id from public.locations where name = 'Newnham Road crossing point'),
  weekday, '08:15'::time, '08:45'::time, 'Morning drop-off', 2
from generate_series(1, 5) as weekday
union all
select
  (select id from public.locations where name = 'Newnham Road crossing point'),
  weekday, '15:00'::time, '15:30'::time, 'Afternoon pickup', 2
from generate_series(1, 5) as weekday
union all
select
  (select id from public.locations where name = 'Grantchester Street crossing'),
  weekday, '08:20'::time, '08:50'::time, 'Morning drop-off', 2
from generate_series(1, 5) as weekday
union all
select
  (select id from public.locations where name = 'Grantchester Street crossing'),
  weekday, '15:00'::time, '15:30'::time, 'Afternoon pickup', 2
from generate_series(1, 5) as weekday;

-- slot_instances are generated automatically the moment a slot exists (see
-- generate_instances_after_slot_insert, 20260909193738_generate_slot_instances.sql)
-- - the insert above already produced them across every one of Newnham
-- Croft's existing terms, so there's nothing to hand-insert here.

-- Login here is magic-link only (see src/app/login/actions.ts), which means
-- signing in re-uses the auth.users row instead of creating a fresh one -
-- GoTrue only recognizes that as "the same user" if the row looks like a
-- real confirmed signup (instance_id/aud/role/confirmed email) and has a
-- matching auth.identities row for the email provider. A bare
-- (id, email) insert is missing all of that, so signInWithOtp fails trying
-- to re-create a user that (from GoTrue's point of view) doesn't exist yet.
insert into auth.users (
  id, instance_id, aud, role, email,
  raw_app_meta_data, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  (
    'a0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'vera.volunteer@example.com',
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), now(),
    '', '', '', ''
  ),
  (
    'a0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'alex.admin@example.com',
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), now(),
    '', '', '', ''
  );

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at
) values
  (
    gen_random_uuid(), 'a0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001', 'email',
    '{"sub": "a0000000-0000-0000-0000-000000000001", "email": "vera.volunteer@example.com"}',
    now(), now(), now()
  ),
  (
    gen_random_uuid(), 'a0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000002', 'email',
    '{"sub": "a0000000-0000-0000-0000-000000000002", "email": "alex.admin@example.com"}',
    now(), now(), now()
  );

-- The on_auth_user_created trigger already created a volunteers row for
-- Vera (with display_name defaulted to her email prefix) the moment the
-- auth.users insert above ran - this just gives the seed data a nicer name,
-- same as a real user renaming themselves after signup.
update public.volunteers
set display_name = 'Vera'
where id = 'a0000000-0000-0000-0000-000000000001';

insert into public.school_admins (school_id, volunteer_id) values (
  (select id from public.schools where name = 'Newnham Croft Primary'),
  'a0000000-0000-0000-0000-000000000002'
);

-- Vera has to belong to a school before she can sign up for one of its
-- slots (see 20260801122733_add_volunteer_schools.sql).
insert into public.volunteer_schools (volunteer_id, school_id) values (
  'a0000000-0000-0000-0000-000000000001',
  (select id from public.schools where name = 'Newnham Croft Primary')
);

insert into public.signups (slot_instance_id, volunteer_id) values (
  (
    select id from public.slot_instances
    where date = '2026-09-07' and start_time = '08:15'
  ),
  'a0000000-0000-0000-0000-000000000001'
);

-- Role-named test accounts, one per privilege tier, for local login testing
-- (log in as superuser@example.com etc. via the magic-link flow instead of
-- signing up and manually flipping flags each time). Same full column set
-- as vera/alex above, for the same reason.
insert into auth.users (
  id, instance_id, aud, role, email,
  raw_app_meta_data, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  (
    'a0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'superuser@example.com',
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), now(),
    '', '', '', ''
  ),
  (
    'a0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'admin@example.com',
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), now(),
    '', '', '', ''
  ),
  (
    'a0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'volunteer@example.com',
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), now(),
    '', '', '', ''
  );

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at
) values
  (
    gen_random_uuid(), 'a0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000003', 'email',
    '{"sub": "a0000000-0000-0000-0000-000000000003", "email": "superuser@example.com"}',
    now(), now(), now()
  ),
  (
    gen_random_uuid(), 'a0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000004', 'email',
    '{"sub": "a0000000-0000-0000-0000-000000000004", "email": "admin@example.com"}',
    now(), now(), now()
  ),
  (
    gen_random_uuid(), 'a0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000005', 'email',
    '{"sub": "a0000000-0000-0000-0000-000000000005", "email": "volunteer@example.com"}',
    now(), now(), now()
  );

-- As above, on_auth_user_created already gave each of these a volunteers
-- row - this just grants the privileges their email implies.
update public.volunteers
set display_name = 'Superuser', is_superuser = true
where id = 'a0000000-0000-0000-0000-000000000003';

update public.volunteers
set display_name = 'Admin'
where id = 'a0000000-0000-0000-0000-000000000004';

update public.volunteers
set display_name = 'Volunteer'
where id = 'a0000000-0000-0000-0000-000000000005';

insert into public.volunteer_schools (volunteer_id, school_id) values (
  'a0000000-0000-0000-0000-000000000005',
  (select id from public.schools where name = 'Newnham Croft Primary')
);

insert into public.school_admins (school_id, volunteer_id) values (
  (select id from public.schools where name = 'Newnham Croft Primary'),
  'a0000000-0000-0000-0000-000000000004'
);

-- Without this, admin@example.com administers Newnham Croft (via
-- school_admins above) without ever showing up in its own "Your schools"
-- list, which reads from volunteer_schools, not school_admins.
insert into public.volunteer_schools (volunteer_id, school_id) values (
  'a0000000-0000-0000-0000-000000000004',
  (select id from public.schools where name = 'Newnham Croft Primary')
);

-- A second school for testing multi-school scenarios (an admin managing
-- more than one school, a volunteer choosing between schools in "My
-- calendar", etc.) - Manchester rather than Cambridge, so nothing
-- accidentally assumes every school is in the same town. Terms are
-- backfilled automatically from default_terms (see on_school_created,
-- 20260909123828_propagate_default_terms_to_schools.sql), so there's
-- nothing to insert for those here.
insert into public.schools (name, street, town) values
  ('Meadowside Primary School', 'Burnage Lane', 'Manchester');

insert into public.locations (school_id, name, address) values
  (
    (select id from public.schools where name = 'Meadowside Primary School'),
    'Burnage Lane',
    'Burnage Lane, Manchester'
  ),
  (
    (select id from public.schools where name = 'Meadowside Primary School'),
    'Wilmslow Road',
    'Wilmslow Road, Manchester'
  );

-- admin@example.com administers both schools. Joining via volunteer_schools
-- is what makes it appear in "Your schools" at all - and since admin@ is
-- the first (and only) volunteer here, on_volunteer_school_joined
-- (20260908200211_promote_first_school_volunteer_to_admin.sql) grants
-- school_admins for it automatically, same as a real admin creating a
-- school and signing up as its first volunteer. No explicit school_admins
-- insert needed (Newnham Croft's above predates that trigger, which is
-- why it's still done by hand there).
insert into public.volunteer_schools (volunteer_id, school_id) values (
  'a0000000-0000-0000-0000-000000000004',
  (select id from public.schools where name = 'Meadowside Primary School')
);

-- Same morning-drop-off/afternoon-pickup shape as Newnham Croft's slots
-- above, so Meadowside actually has something to sign up for.
insert into public.slots (location_id, day_of_week, start_time, end_time, label, capacity)
select
  (select id from public.locations where name = 'Burnage Lane'),
  weekday, '08:15'::time, '08:45'::time, 'Morning drop-off', 2
from generate_series(1, 5) as weekday
union all
select
  (select id from public.locations where name = 'Burnage Lane'),
  weekday, '15:00'::time, '15:30'::time, 'Afternoon pickup', 2
from generate_series(1, 5) as weekday
union all
select
  (select id from public.locations where name = 'Wilmslow Road'),
  weekday, '08:15'::time, '08:45'::time, 'Morning drop-off', 2
from generate_series(1, 5) as weekday
union all
select
  (select id from public.locations where name = 'Wilmslow Road'),
  weekday, '15:00'::time, '15:30'::time, 'Afternoon pickup', 2
from generate_series(1, 5) as weekday;

-- Six more volunteers, name-diverse (a realistic Manchester catchment
-- rather than a monoculture) and gender-balanced, for Meadowside - same
-- full-column auth.users/auth.identities shape as the other seeded users
-- above, for the same magic-link-reuses-existing-row reason.
insert into auth.users (
  id, instance_id, aud, role, email,
  raw_app_meta_data, raw_user_meta_data,
  email_confirmed_at, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
) values
  (
    'a0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'oliver.bennett@example.com',
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), now(),
    '', '', '', ''
  ),
  (
    'a0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'emily.clarke@example.com',
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), now(),
    '', '', '', ''
  ),
  (
    'a0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'thomas.wright@example.com',
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), now(),
    '', '', '', ''
  ),
  (
    'a0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'priya.sharma@example.com',
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), now(),
    '', '', '', ''
  ),
  (
    'a0000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'yusuf.rahman@example.com',
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), now(),
    '', '', '', ''
  ),
  (
    'a0000000-0000-0000-0000-00000000000b', '00000000-0000-0000-0000-000000000000',
    'authenticated', 'authenticated', 'mei.chen@example.com',
    '{"provider": "email", "providers": ["email"]}', '{}', now(), now(), now(),
    '', '', '', ''
  );

insert into auth.identities (
  id, user_id, provider_id, provider, identity_data, created_at, updated_at, last_sign_in_at
) values
  (
    gen_random_uuid(), 'a0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000006', 'email',
    '{"sub": "a0000000-0000-0000-0000-000000000006", "email": "oliver.bennett@example.com"}',
    now(), now(), now()
  ),
  (
    gen_random_uuid(), 'a0000000-0000-0000-0000-000000000007',
    'a0000000-0000-0000-0000-000000000007', 'email',
    '{"sub": "a0000000-0000-0000-0000-000000000007", "email": "emily.clarke@example.com"}',
    now(), now(), now()
  ),
  (
    gen_random_uuid(), 'a0000000-0000-0000-0000-000000000008',
    'a0000000-0000-0000-0000-000000000008', 'email',
    '{"sub": "a0000000-0000-0000-0000-000000000008", "email": "thomas.wright@example.com"}',
    now(), now(), now()
  ),
  (
    gen_random_uuid(), 'a0000000-0000-0000-0000-000000000009',
    'a0000000-0000-0000-0000-000000000009', 'email',
    '{"sub": "a0000000-0000-0000-0000-000000000009", "email": "priya.sharma@example.com"}',
    now(), now(), now()
  ),
  (
    gen_random_uuid(), 'a0000000-0000-0000-0000-00000000000a',
    'a0000000-0000-0000-0000-00000000000a', 'email',
    '{"sub": "a0000000-0000-0000-0000-00000000000a", "email": "yusuf.rahman@example.com"}',
    now(), now(), now()
  ),
  (
    gen_random_uuid(), 'a0000000-0000-0000-0000-00000000000b',
    'a0000000-0000-0000-0000-00000000000b', 'email',
    '{"sub": "a0000000-0000-0000-0000-00000000000b", "email": "mei.chen@example.com"}',
    now(), now(), now()
  );

update public.volunteers set display_name = 'Oliver Bennett' where id = 'a0000000-0000-0000-0000-000000000006';
update public.volunteers set display_name = 'Emily Clarke' where id = 'a0000000-0000-0000-0000-000000000007';
update public.volunteers set display_name = 'Thomas Wright' where id = 'a0000000-0000-0000-0000-000000000008';
update public.volunteers set display_name = 'Priya Sharma' where id = 'a0000000-0000-0000-0000-000000000009';
update public.volunteers set display_name = 'Yusuf Rahman' where id = 'a0000000-0000-0000-0000-00000000000a';
update public.volunteers set display_name = 'Mei Chen' where id = 'a0000000-0000-0000-0000-00000000000b';

-- All six join Meadowside (the first of them triggers
-- on_volunteer_school_joined same as admin@ above, but admin@ already got
-- there first so this batch just joins as ordinary volunteers).
insert into public.volunteer_schools (volunteer_id, school_id)
select id, (select id from public.schools where name = 'Meadowside Primary School')
from (values
  ('a0000000-0000-0000-0000-000000000006'::uuid),
  ('a0000000-0000-0000-0000-000000000007'::uuid),
  ('a0000000-0000-0000-0000-000000000008'::uuid),
  ('a0000000-0000-0000-0000-000000000009'::uuid),
  ('a0000000-0000-0000-0000-00000000000a'::uuid),
  ('a0000000-0000-0000-0000-00000000000b'::uuid)
) as v(id);

-- Sprinkled across both locations, both sessions, and three different
-- days, rather than piled onto one slot - closer to how real cover
-- actually looks (partial, patchy) than fully staffing everything.
insert into public.signups (slot_instance_id, volunteer_id)
select si.id, v.volunteer_id
from (values
  ('Burnage Lane', '2026-09-07'::date, '08:15'::time, 'a0000000-0000-0000-0000-000000000006'::uuid),
  ('Wilmslow Road', '2026-09-07'::date, '15:00'::time, 'a0000000-0000-0000-0000-000000000007'::uuid),
  ('Wilmslow Road', '2026-09-08'::date, '08:15'::time, 'a0000000-0000-0000-0000-000000000008'::uuid),
  ('Burnage Lane', '2026-09-08'::date, '15:00'::time, 'a0000000-0000-0000-0000-000000000009'::uuid),
  ('Burnage Lane', '2026-09-09'::date, '08:15'::time, 'a0000000-0000-0000-0000-00000000000a'::uuid),
  ('Wilmslow Road', '2026-09-09'::date, '15:00'::time, 'a0000000-0000-0000-0000-00000000000b'::uuid)
) as v(location_name, date, start_time, volunteer_id)
join public.locations loc on loc.name = v.location_name
join public.slots sl on sl.location_id = loc.id and sl.start_time = v.start_time
join public.slot_instances si on si.slot_id = sl.id and si.date = v.date;
