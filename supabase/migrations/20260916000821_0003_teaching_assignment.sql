-- SAKALA V3 — Beban Mengajar (Teaching Assignment)
-- Internal engine object; operator-facing sebagai "Beban Mengajar" (LOCK 03/04)
create table if not exists teaching_assignment (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_year(id) on delete cascade,
  teacher_id uuid not null references teacher(id) on delete restrict,
  subject_id uuid not null references subject(id) on delete restrict,
  class_id uuid not null references class(id) on delete restrict,
  target_jp int not null check (target_jp > 0),
  status text not null default 'active' check (status in ('active','inactive')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (academic_year_id, teacher_id, subject_id, class_id)
);

alter table teaching_assignment enable row level security;
create policy "TEMP_anon_teaching_assignment_all" on teaching_assignment for all to anon using (true) with check (true);
