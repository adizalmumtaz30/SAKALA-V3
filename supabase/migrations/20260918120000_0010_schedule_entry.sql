-- SAKALA V3 — Schedule Engine: schedule_entry
--
-- Satu baris = satu Beban Mengajar yang ditempatkan pada satu slot waktu.
-- Kelas TIDAK disimpan ulang di sini: kelas sudah melekat pada
-- teaching_assignment, menyimpannya dua kali membuka peluang data yang
-- saling bertentangan (Bagian 20 — target JP hanya dibaca, tidak pernah
-- ditulis balik oleh penjadwalan).
create table if not exists schedule_entry (
  id uuid primary key default gen_random_uuid(),
  academic_year_id uuid not null references academic_year(id) on delete cascade,
  time_slot_id uuid not null references time_structure(id) on delete cascade,
  teaching_assignment_id uuid not null references teaching_assignment(id) on delete cascade,
  room_id uuid references room(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Satu Beban Mengajar tidak boleh ditempatkan dua kali di slot yang sama.
  -- Bentrok ANTAR beban mengajar (guru/kelas/ruang bertabrakan) sengaja
  -- TIDAK dijadikan constraint DB: aturannya butuh join lintas baris dan
  -- pesannya harus bisa menyebut nama entitas dalam bahasa operator, jadi
  -- ditegakkan di lapisan aplikasi (lib/application/schedule-conflict.ts)
  -- supaya operator dapat penjelasan, bukan error constraint mentah.
  unique (time_slot_id, teaching_assignment_id)
);

create index if not exists schedule_entry_year_idx
  on schedule_entry (academic_year_id);
create index if not exists schedule_entry_slot_idx
  on schedule_entry (time_slot_id);
create index if not exists schedule_entry_assignment_idx
  on schedule_entry (teaching_assignment_id);

alter table schedule_entry enable row level security;

drop policy if exists "TEMP_anon_schedule_entry_all" on schedule_entry;
create policy "TEMP_anon_schedule_entry_all"
  on schedule_entry for all to anon using (true) with check (true);
