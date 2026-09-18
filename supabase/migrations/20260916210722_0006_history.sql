-- SAKALA V3 — Riwayat (History)
-- Audit trail, modul sendiri bukan bagian Settings (LOCK 29)
create table if not exists history_entry (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid references academic_year(id) on delete cascade,
  entity_type text not null,
  entity_id uuid,
  action text not null,
  summary text not null,
  actor text not null default 'Admin',
  created_at timestamptz not null default now()
);

create index if not exists history_entry_year_idx on history_entry (academic_year_id, created_at desc);

alter table history_entry enable row level security;
create policy "TEMP_anon_history_entry_all" on history_entry for all to anon using (true) with check (true);
