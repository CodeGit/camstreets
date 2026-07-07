create table public.schools (
  id bigint generated always as identity primary key,
  name text not null,
  address text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.school_admins (
  school_id bigint not null references public.schools (id),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (school_id, user_id)
);

create table public.locations (
  id bigint generated always as identity primary key,
  school_id bigint not null references public.schools (id),
  name text not null,
  address text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.slots (
  id bigint generated always as identity primary key,
  location_id bigint not null references public.locations (id),
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  end_time time not null check (end_time > start_time),
  label text not null,
  capacity smallint not null default 1 check (capacity > 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.terms (
  id bigint generated always as identity primary key,
  school_id bigint not null references public.schools (id),
  name text not null,
  start_date date not null,
  end_date date not null check (end_date > start_date),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  unique (school_id, name)
);

create table public.slot_instances (
  id bigint generated always as identity primary key,
  slot_id bigint not null references public.slots (id),
  term_id bigint not null references public.terms (id),
  date date not null,
  start_time time not null,
  end_time time not null check (end_time > start_time),
  capacity smallint not null check (capacity > 0),
  status text not null default 'open' check (status in ('open', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (slot_id, term_id, date)
);

create table public.volunteers (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table public.signups (
  id bigint generated always as identity primary key,
  slot_instance_id bigint not null references public.slot_instances (id),
  volunteer_id uuid not null references public.volunteers (id),
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
  created_at timestamptz not null default now(),
  unique (slot_instance_id, volunteer_id)
);
