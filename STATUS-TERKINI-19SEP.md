# SAKALA V3 — Status Terkini vs Master Spec (Koreksi Bagian F)

Diverifikasi langsung ke kode `main` hari ini (bukan dari dokumen). Ini
**mengoreksi** `SAKALA-V3-MASTER-GABUNGAN.txt` Bagian F, yang tertanggal
"18 Sep, diverifikasi ulang 18 Sep" tapi ternyata ditulis **sebelum**
sempat memperhitungkan beberapa batch kerja yang sudah lebih dulu masuk
ke `main` pada tanggal yang sama (race condition antar sesi — ironisnya
persis masalah yang coba dicegah `AI_WORKFLOW.md` yang ditulis di commit
yang sama). Jadi dokumen itu meremehkan progres — bukan melebih-lebihkan.

---

## Koreksi paling signifikan

| Klaim dokumen lama | Kenyataan sekarang |
|---|---|
| "Kemampuan mengisi assignment: [BELUM] — prasyarat semua fitur jadwal" | **[ADA]** — Schedule Engine sudah bisa isi/pindah/hapus pelajaran, sudah diuji langsung ke database |
| "Toast: 0 komponen" | **[ADA]** — `Toast.tsx` ada |
| "ConfirmDialog: [BELUM]" | **[ADA]** — `ConfirmDialog.tsx` ada |
| "backdrop-blur: 0 pemakaian" | **[ADA]** — 7 pemakaian |
| "Identitas warna: [BELUM], butuh keputusan Guru/Mapel" | **[ADA]** — 24 warna jewel-tone, melekat ke Mapel |
| "Motif Mega Mendung: [BELUM]" | **[ADA]** |
| "max-w-2xl di 8 halaman" | **[ADA]** diperbaiki — 0 tersisa, 3 halaman sudah `max-w-7xl` |
| "Ganti Periode->Jam ke-: [BELUM]" | **[ADA]** — 0 sisa kata "Periode" |
| "Deret ikon aksi per baris: [BELUM]" | **[ADA]** — 👁➕✏️🗑 di Guru/Mapel/Kelas/Ruang |
| "Aksi massal: [BELUM]" | **[ADA]** |
| "Duplikat: [BELUM]" | **[ADA]** — di Beban Mengajar |
| "Pencarian Ctrl+K: placeholder visual saja" | **[ADA]** — berfungsi penuh |
| "Cetak & ekspor jadwal: [BELUM]" | **[ADA]** — `/jadwal` & `/laporan` |
| "Dashboard ilustrasi 3D: [BELUM]" | **[ADA]** — isometric di Beranda |
| "RLS/security: belum diaudit sama sekali" | **[ADA]** — diaudit, 13 index diperbaiki, 0 temuan security |
| "Performa query N+1: belum diaudit" | **[ADA]** — diaudit via Supabase Advisor |

## Yang MEMANG masih benar "[BELUM]" — dikonfirmasi ulang hari ini

**Schedule Engine — bagian inti yang masih kurang:**
- Drag & drop (saat ini klik-buka-panel, bukan tarik-lepas)
- Status AUTO/MANUAL/LOCK + indikator kunci (kolom `locked` ada di DB tapi selalu `true`, belum ada UI togglenya)
- Aturan max 3 JP berturut-turut
- Continuity rule (istirahat tidak boleh memutus kontinuitas)
- Slot anatomy penuh + Context Drawer khusus slot (saat ini pakai panel geser sendiri, bukan komponen Context Drawer yang sama dengan Detail Guru)

**Tahap 6 — Session generation/solver/feasibility/generator UX:** belum disentuh sama sekali. **Perlu klarifikasi kamu**: dokumen ini menyebutnya "deterministic scheduling engine" (LOCK 27: "AI bukan solver utama", LOCK 28: "tetap deterministic") — bukan literal AI generatif. Tapi secara fungsi ini sama persis perannya dengan "SAKALA AI/AI Scheduling" yang kamu minta dikecualikan sebelumnya (auto-isi jadwal, kasih beberapa varian, minta konfirmasi). Saya tahan dulu, tidak membangun ini tanpa konfirmasi eksplisit — biar tidak melanggar pengecualian yang sudah kamu tetapkan, walau namanya beda.

**Identitas & polish visual:**
- Human Identity System / avatar premium — kolom `photo_url` ada di DB, UI-nya belum
- Tipografi berhierarki tegas — belum diaudit ulang, kemungkinan masih seragam
- Motion system menyeluruh — naik dari 31% jadi ~45% file (25/56), masih belum "menyeluruh"

**Responsif & aksesibilitas:**
- Mobile transformation (sidebar→sheet, kanvas→day-first) — belum ada sama sekali
- Breakpoint responsif — cuma 8 kemunculan total di seluruh app, masih sangat tipis
- Aksesibilitas — naik dari 4/42 jadi 18/56 file (~32%), masih belum menyeluruh

**Academic Context lanjutan:** readiness indicator per tahun ajaran, Copy Governance, impact preview sebelum switch tahun — semua belum ada.

**Output:** Export PDF/Excel untuk Laporan (beda dari cetak — belum ada file download terformat), Import tingkat validasi V2 (masih CSV sederhana, belum template Excel 3-sheet dengan error forensic).

**Impact Engine / Repair Panel penuh:** belum ada.

---

## Ringkasan berapa persen

Dari **46 item** di daftar Bagian F asli: **~24 sudah ada** (termasuk yang salah ditandai [BELUM]), **~22 masih genuinely belum**. Yang paling besar bobotnya dari sisa itu adalah Tahap 6 (solver/generator, ambigu soal pengecualian AI) dan mobile transformation — dua-duanya scope besar, bukan quick win.

**Rekomendasi urutan lanjutan** (di luar Tahap 6 yang perlu klarifikasi dulu):
1. Drag & drop + LOCK indicator + max-3-berturut + continuity rule — melengkapi Schedule Engine ke tingkat "genuinely usable", bukan cuma bisa isi manual
2. Mobile transformation — sekarang situsnya publik, kemungkinan diakses dari HP jauh lebih tinggi
3. Human Identity System (avatar) — kolom DB sudah siap, tinggal UI
4. Export Excel/PDF Laporan + Import tingkat V2

Mau saya lanjut ke salah satu ini, atau klarifikasi dulu soal Tahap 6 (solver/generator) — apakah itu termasuk yang kamu maksud "SAKALA AI" yang dikecualikan, atau beda karena determinstic bukan generatif?
