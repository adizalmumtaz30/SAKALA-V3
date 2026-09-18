-- SAKALA V3 — Foundation: School + Academic Year
create extension if not exists "pgcrypto";

create table if not exists school (
  id uuid primary key default gen_random_uuid(),
  school_name text not null,
  short_name text,
  address text,
  school_code text,
  logo_url text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists academic_year (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references school(id) on delete cascade,
  start_year int not null,
  end_year int not null,
  label text not null,
  start_date date,
  end_date date,
  lifecycle text not null default 'draft' check (lifecycle in ('draft','active','archived')),
  is_workspace_selected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Bagian B.4 LAW 01: hanya satu tahun ajaran per sekolah boleh jadi workspace context
create unique index if not exists one_selected_year_per_school
  on academic_year (school_id)
  where is_workspace_selected;

alter table school enable row level security;
alter table academic_year enable row level security;

create policy "TEMP_anon_school_all" on school for all to anon using (true) with check (true);
create policy "TEMP_anon_academic_year_all" on academic_year for all to anon using (true) with check (true);
