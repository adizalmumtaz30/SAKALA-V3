-- SAKALA V3 — Sistem Identitas Warna Tunggal (Bagian E.1.2)
-- Warna melekat ke MATA PELAJARAN (keputusan tingkat sistem).
-- Menyimpan KEY (mis. 'deep-teal'), bukan hex, supaya palet bisa
-- disesuaikan untuk dark/light mode tanpa migrasi data.
alter table subject add column if not exists color_key text;
