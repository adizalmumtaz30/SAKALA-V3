-- SAKALA V3 — Struktur Waktu (Time Structure)
-- Fondasi yang dibaca Scheduling Engine sebelum solving (LOCK 13)
-- TYPE = KEGIATAN + LABEL, bukan type-per-aktivitas (LOCK 12)
create table if not exists time_structure (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_year(id) on delete cascade,
  day text not null check (day in ('senin','selasa','rabu','kamis','jumat','sabtu')),
  period_number int not null check (period_number > 0),
  start_time time not null,
  end_time time not null,
  type text not null default 'mengajar' check (type in ('mengajar','kegiatan','istirahat','nonaktif')),
  activity_label text,
  status text not null default 'active' check (status in ('active','inactive')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (academic_year_id, day, period_number)
);

alter table time_structure enable row level security;
create policy "TEMP_anon_time_structure_all" on time_structure for all to anon using (true) with check (true);
