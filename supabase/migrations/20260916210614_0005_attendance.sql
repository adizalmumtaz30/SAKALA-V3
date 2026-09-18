-- SAKALA V3 — Absensi (Attendance)
-- Independen dari Scheduling Engine (LOCK 21/22/23): tanpa schedule_id,
-- tanpa assignment, tanpa target JP.
create table if not exists attendance (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_year(id) on delete cascade,
  teacher_id uuid not null references teacher(id) on delete restrict,
  date date not null,
  status text not null check (status in ('hadir','izin','sakit','alpha','dinas')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (academic_year_id, teacher_id, date)
);

alter table attendance enable row level security;
create policy "TEMP_anon_attendance_all" on attendance for all to anon using (true) with check (true);
