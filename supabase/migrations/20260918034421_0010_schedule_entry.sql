-- SAKALA V3 — Kemampuan Assignment di Kanvas Jadwal (Tahap 5, PRASYARAT)
-- Bagian C.3 (Hard Constraint) ditegakkan LANGSUNG oleh database lewat unique
-- constraint -- bukan cuma dicek di application layer. Ini yang membuat
-- "Scheduling Engine tetap deterministic" (LOCK 28) benar-benar berlaku
-- sejak baris pertama, bukan janji di kemudian hari.
--
-- CATATAN REKONSILIASI: dua sesi Claude berbeda sempat merancang tabel ini
-- secara independen dengan nama migration sama (0010_schedule_entry, commit
-- terpisah). Isi file ini SUDAH DICOCOKKAN ke skema yang benar-benar live
-- di Supabase (diverifikasi lewat information_schema + pg_indexes), bukan
-- ditulis dari rancangan mana pun secara membabi buta — pelajaran dari V2:
-- migration yang tidak sinkron dengan database adalah resiko nyata, bukan
-- cuma soal kerapian.
--
-- Desain: hari + jam ke- dan teacher_id/subject_id/class_id disimpan
-- LANGSUNG di baris ini (denormalisasi dari teaching_assignment), sehingga
-- bentrok guru/kelas/ruang pada jam yang sama ditegakkan sebagai UNIQUE
-- CONSTRAINT oleh database sendiri — lapisan pertahanan yang tidak bisa
-- dilewati aplikasi mana pun, di atas pengecekan lapisan aplikasi yang
-- memberi pesan bahasa operator sebelum constraint ini sempat tersentuh.

create table if not exists schedule_entry (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_year(id) on delete cascade,
  teaching_assignment_id uuid not null references teaching_assignment(id) on delete cascade,
  teacher_id uuid not null references teacher(id) on delete restrict,
  subject_id uuid not null references subject(id) on delete restrict,
  class_id uuid not null references class(id) on delete restrict,
  room_id uuid references room(id) on delete set null,
  day text not null check (day in ('senin','selasa','rabu','kamis','jumat','sabtu')),
  period_number int not null check (period_number > 0),
  -- 'manual' = operator menempatkan langsung. 'auto' disediakan untuk
  -- penjadwal otomatis di masa depan (belum dibangun; AI Scheduling
  -- sengaja dikecualikan dari pekerjaan ini).
  source text not null default 'manual' check (source in ('auto','manual')),
  locked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- HARD CONSTRAINT (Bagian C.3, LOCKED) — ditegakkan database, bukan janji:
  constraint no_class_clash unique (academic_year_id, day, period_number, class_id),
  constraint no_teacher_clash unique (academic_year_id, day, period_number, teacher_id)
);

-- Room clash: hanya berlaku kalau room_id diisi (room bersifat opsional).
create unique index if not exists no_room_clash
  on schedule_entry (academic_year_id, day, period_number, room_id)
  where room_id is not null;

create index if not exists schedule_entry_year_idx on schedule_entry (academic_year_id);

alter table schedule_entry enable row level security;

drop policy if exists "TEMP_anon_schedule_entry_all" on schedule_entry;
create policy "TEMP_anon_schedule_entry_all"
  on schedule_entry for all to anon using (true) with check (true);
