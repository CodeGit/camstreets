-- Superuser-authored default term dates (e.g. matching the county
-- council's published term dates), used to pre-populate a school's own
-- term when it's created, rather than an admin typing the same UK-wide
-- dates in from scratch for every school each time. Deliberately has no
-- school_id - these are shared templates, not tied to any one school - and
-- pre-populating doesn't lock a school in: `terms` rows are copies, so a
-- school can still adjust its own dates afterward if it needs to diverge
-- (different half-term, different inset days, etc).
create table public.default_terms (
  id bigint generated always as identity primary key,
  name text not null unique,
  start_date date not null,
  end_date date not null check (end_date > start_date),
  created_at timestamptz not null default now()
);

alter table public.default_terms enable row level security;

-- Not "everyone" like schools/locations/slots - this is internal admin
-- tooling (a source for pre-populating the term-creation form), not
-- public-facing info a volunteer needs, so it's scoped to signed-in users
-- rather than anon, closer to how school_admins is treated.
grant select, insert, update, delete on public.default_terms to authenticated, service_role;

create policy "signed-in users can view default terms"
on public.default_terms
for select
to authenticated
using (true);

create policy "superusers manage default terms"
on public.default_terms
for all
to authenticated
using (is_superuser())
with check (is_superuser());
