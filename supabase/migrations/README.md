# Supabase Migrations — SAKALA V3

Setiap perubahan skema WAJIB di-commit di sini, bukan cuma dijalankan
langsung ke database.

**Alasan (Bagian E.2.3):** V2 pernah kena masalah persis ini — migration
sempat tidak sinkron dan harus direkonsiliasi manual. Kalau project
Supabase reset/hilang, skema harus bisa dibangun ulang dari repo ini saja.

## Aturan
- Nama file: `<version>_<nama>.sql`, version = timestamp `YYYYMMDDHHMMSS`
- Isi file harus SAMA PERSIS dengan yang dijalankan ke database
- Jangan pernah mengedit migration yang sudah dijalankan — buat yang baru

## Catatan keamanan
Semua tabel saat ini memakai policy `TEMP_anon_*` yang mengizinkan akses
penuh tanpa autentikasi. Ini disengaja selama tahap pengembangan internal,
tapi **wajib ditangani sebelum aplikasi dipakai luas** (Bagian G, Tahap 8
item 45).
