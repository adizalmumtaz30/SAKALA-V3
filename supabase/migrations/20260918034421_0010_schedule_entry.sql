-- SAKALA V3 — Schedule Engine: schedule_entry
--
-- CATATAN: tabel ini sudah diterapkan LANGSUNG ke database sebelum file ini
-- dibuat (migration terpisah bernama sama "0010_schedule_entry", timestamp
-- 20260918034421, sumbernya bukan repo ini). File ini adalah SNAPSHOT dari
-- skema yang sudah live, ditulis ulang di sini supaya repo dan database
-- akhirnya sinkron (Bagian F.3/IV.3 — pelajaran dari V2: migration yang
-- tidak ter-commit adalah resiko, bukan cuma kerapian).
--
-- Kalau dijalankan di database yang SUDAH punya tabel ini, seluruh isi file
-- ini no-op (semua pakai IF NOT EXISTS / DROP...CREATE) — aman diulang.
--
-- Desain (lebih kuat dari rancangan awal saya): hari + jam ke- dan
-- teacher_id/subject_id/class_id disimpan LANGSUNG di baris ini (bukan FK
-- ke time_structure/teaching_assignment saja), sehingga bentrok guru/kelas
-- pada jam yang sama ditegakkan sebagai UNIQUE CONSTRAINT oleh database
-- sendiri — lapisan pertahanan yang tidak bisa dilewati aplikasi mana pun,
-- di atas pengecekan di lapisan aplikasi yang memberi pesan bahasa
-- operator sebelum constraint ini sempat tersentuh.
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
  -- penjadwal otomatis di masa depan, TIDAK dipakai/dibangun di sini
  -- (SAKALA AI/AI Scheduling sengaja dikecualikan dari pekerjaan ini).
  source text not null default 'manual' check (source in ('auto','manual')),
  -- true = tidak boleh ditimpa proses otomatis apa pun nanti. Penempatan
  -- manual selalu locked sejak dibuat — operator yang menaruhnya di situ,
  -- jadi harus tetap di situ sampai operator sendiri yang memindah/hapus.
  locked boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint no_teacher_clash unique (academic_year_id, day, period_number, teacher_id),
  constraint no_class_clash unique (academic_year_id, day, period_number, class_id)
);

alter table schedule_entry enable row level security;

drop policy if exists "TEMP_anon_schedule_entry_all" on schedule_entry;
create policy "TEMP_anon_schedule_entry_all"
  on schedule_entry for all to anon using (true) with check (true);
