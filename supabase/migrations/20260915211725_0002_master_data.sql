-- SAKALA V3 — Master Data: Guru, Mapel, Kelas, Ruang
-- Teacher & Subject reusable lintas tahun; Class year-specific (Bagian B.4)
create table if not exists teacher (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references school(id) on delete cascade,
  teacher_code text,
  employee_number text,
  name text not null,
  short_name text,
  gender text check (gender in ('L','P') or gender is null),
  phone text,
  email text,
  status text not null default 'active' check (status in ('active','inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists subject (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references school(id) on delete cascade,
  code text,
  name text not null,
  short_name text,
  category text,
  status text not null default 'active' check (status in ('active','inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists class (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_year(id) on delete cascade,
  grade text,
  name text not null,
  code text,
  capacity int,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists room (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references school(id) on delete cascade,
  code text,
  name text not null,
  room_type text,
  capacity int,
  status text not null default 'active' check (status in ('active','inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table teacher enable row level security;
alter table subject enable row level security;
alter table class enable row level security;
alter table room enable row level security;

create policy "TEMP_anon_teacher_all" on teacher for all to anon using (true) with check (true);
create policy "TEMP_anon_subject_all" on subject for all to anon using (true) with check (true);
create policy "TEMP_anon_class_all" on class for all to anon using (true) with check (true);
create policy "TEMP_anon_room_all" on room for all to anon using (true) with check (true);
