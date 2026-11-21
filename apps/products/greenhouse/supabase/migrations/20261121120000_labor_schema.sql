-- Greenhouse Labor Planner: tables (ADR-0026).
--
-- Mirrors libs/products/greenhouse/domain/src/lib/models.ts. Every row
-- belongs to a farm, and every reference between rows carries the farm id
-- in a composite foreign key, so a row can never point into another farm.
-- Row-level security is in the next migration.
--
-- Units: kg, hours, TND (numeric with 3 decimals: millimes).

create type public.member_role as enum ('manager', 'supervisor', 'hr');

create table public.farm (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(btrim(name)) between 1 and 120),
  time_zone text not null default 'Africa/Tunis',
  currency char(3) not null default 'TND',
  created_at timestamptz not null default now()
);

-- Who may use a farm, and as what. A user can belong to several farms.
create table public.member (
  farm_id uuid not null references public.farm (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null,
  full_name text not null check (length(btrim(full_name)) between 1 and 120),
  created_at timestamptz not null default now(),
  primary key (farm_id, user_id)
);
create index member_user_idx on public.member (user_id);

create table public.greenhouse (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farm (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 60),
  area_m2 numeric(10, 2) not null check (area_m2 > 0),
  crop text not null check (
    crop in (
      'tomato',
      'cherry-tomato',
      'pepper',
      'cucumber',
      'melon',
      'strawberry',
      'other'
    )
  ),
  kg_per_crate numeric(6, 2) not null check (kg_per_crate > 0),
  active boolean not null default true,
  unique (farm_id, name),
  unique (farm_id, id)
);

create table public.team (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farm (id) on delete cascade,
  name text not null check (length(btrim(name)) between 1 and 60),
  supervisor_id uuid,
  unique (farm_id, name),
  unique (farm_id, id),
  foreign key (farm_id, supervisor_id)
    references public.member (farm_id, user_id)
    on delete set null (supervisor_id)
);

create table public.worker (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farm (id) on delete cascade,
  full_name text not null check (length(btrim(full_name)) between 1 and 120),
  team_id uuid,
  -- What the badge's QR code holds: upper case, no spaces (normalizeBadge).
  badge_code text not null check (
    badge_code ~ '^[A-Z0-9_-]{1,32}$'
  ),
  active boolean not null default true,
  unique (farm_id, badge_code),
  unique (farm_id, id),
  foreign key (farm_id, team_id)
    references public.team (farm_id, id)
    on delete set null (team_id)
);
create index worker_team_idx on public.worker (team_id);

-- Pay lives apart from the roster so supervisors never load it (RLS).
create table public.worker_pay (
  worker_id uuid primary key,
  farm_id uuid not null,
  hourly_rate numeric(8, 3) not null check (hourly_rate >= 0),
  updated_at timestamptz not null default now(),
  foreign key (farm_id, worker_id)
    references public.worker (farm_id, id)
    on delete cascade
);

create table public.absence (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null,
  worker_id uuid not null,
  from_date date not null,
  to_date date not null,
  reason text check (length(reason) <= 200),
  check (to_date >= from_date),
  foreign key (farm_id, worker_id)
    references public.worker (farm_id, id)
    on delete cascade
);
create index absence_farm_dates_idx on public.absence (farm_id, from_date, to_date);

-- One cell of the weekly plan: a greenhouse, a day, the team that picks it.
create table public.weekly_plan (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null,
  week_start date not null check (extract(isodow from week_start) = 1),
  day smallint not null check (day between 1 and 7),
  plan_date date generated always as (week_start + (day - 1)::integer) stored,
  greenhouse_id uuid not null,
  team_id uuid not null,
  expected_kg numeric(10, 2) not null check (expected_kg >= 0),
  hours_per_day numeric(4, 2) not null check (
    hours_per_day > 0 and hours_per_day <= 12
  ),
  unique (farm_id, week_start, day, greenhouse_id, team_id),
  foreign key (farm_id, greenhouse_id)
    references public.greenhouse (farm_id, id)
    on delete cascade,
  foreign key (farm_id, team_id)
    references public.team (farm_id, id)
    on delete cascade
);

-- One worker, one greenhouse, one day. The id is made on the supervisor's
-- phone, so re-sending an entry after a lost reply is harmless.
create table public.work_log (
  id uuid primary key,
  farm_id uuid not null,
  work_date date not null,
  worker_id uuid not null,
  -- The worker's team when logged; history stays right after a move.
  team_id uuid,
  greenhouse_id uuid not null,
  -- Accepted kg; rejected crates are counted, not weighed in.
  kg numeric(10, 2) not null check (kg >= 0),
  crates integer not null default 0 check (crates >= 0),
  rejected_crates integer not null default 0 check (
    rejected_crates >= 0 and rejected_crates <= crates
  ),
  hours numeric(4, 2) not null check (hours > 0 and hours <= 12),
  -- The phone's clock when saved; the server's when it arrived.
  recorded_at timestamptz not null,
  -- No foreign key: the log outlives the account that wrote it.
  recorded_by uuid not null,
  synced_at timestamptz not null default now(),
  foreign key (farm_id, worker_id)
    references public.worker (farm_id, id)
    on delete restrict,
  foreign key (farm_id, team_id)
    references public.team (farm_id, id)
    on delete set null (team_id),
  foreign key (farm_id, greenhouse_id)
    references public.greenhouse (farm_id, id)
    on delete restrict
);
create index work_log_farm_date_idx on public.work_log (farm_id, work_date);
create index work_log_worker_date_idx on public.work_log (worker_id, work_date);

create table public.hygiene_item (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farm (id) on delete cascade,
  label_ar text not null,
  label_fr text not null,
  label_en text not null,
  photo_required boolean not null default false,
  sort_order integer not null default 0,
  active boolean not null default true
);

create table public.hygiene_check (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null,
  check_date date not null,
  greenhouse_id uuid not null,
  supervisor_id uuid not null,
  -- [{ "itemId", "ok", "note"?, "photoPaths": [...] }]
  answers jsonb not null default '[]'::jsonb check (jsonb_typeof(answers) = 'array'),
  signed_at timestamptz,
  unique (farm_id, check_date, greenhouse_id),
  foreign key (farm_id, greenhouse_id)
    references public.greenhouse (farm_id, id)
    on delete cascade
);

create table public.target (
  id uuid primary key default gen_random_uuid(),
  farm_id uuid not null references public.farm (id) on delete cascade,
  week_start date not null check (extract(isodow from week_start) = 1),
  cost_per_kg_target numeric(8, 3) not null check (cost_per_kg_target > 0),
  kg_target numeric(12, 2) not null check (kg_target >= 0),
  unique (farm_id, week_start)
);
