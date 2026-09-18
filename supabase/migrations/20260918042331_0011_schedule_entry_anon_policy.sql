-- schedule_entry punya RLS aktif tapi belum ada policy sama sekali —
-- artinya tabel ini terkunci total dari anon key sampai baris ini
-- dijalankan. Menyamakan pola TEMP_anon yang sudah dipakai tabel lain.
--
-- CATATAN: migration ini ditemukan sudah berjalan di Supabase tanpa
-- pernah di-commit ke repo dari sesi Claude ini — indikasi sesi lain
-- ("SAKALA Sync") sempat aktif di project yang sama. Efeknya no-op
-- (drop+recreate policy yang identik), tidak mengubah apa pun secara
-- fungsional, tapi dicatat di sini demi jejak audit yang jujur.
drop policy if exists "TEMP_anon_schedule_entry_all" on schedule_entry;
create policy "TEMP_anon_schedule_entry_all"
  on schedule_entry for all to anon using (true) with check (true);
