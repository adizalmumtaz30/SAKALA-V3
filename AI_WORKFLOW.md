# SAKALA V3 — Alur Kerja AI (GitHub → Supabase → Vercel)

Dokumen ini untuk **sesi AI mana pun** (Claude atau lainnya) yang mengerjakan
repo ini. Beberapa sesi paralel pernah aktif bersamaan tanpa saling tahu
("SAKALA Sync") — dokumen ini ada supaya itu tidak lagi menyebabkan konflik
atau kerja dobel. Baca ini SEBELUM mulai kerja, bukan setelah.

## 0. Identitas infrastruktur (isi sekali, jangan tebak)

- GitHub: `adizalmumtaz30/SAKALA-V3`, branch `main`
- Supabase project ref: `byagyrqjhalqsbchqsgm`
- Vercel: team `sakala-webapp`, project `sakala-v3`, project ID `prj_HKh1R3uLRAJzfHBjyDPTlL4X3Et5`
- Production URL: `https://sakala-v3.vercel.app`

## 1. Langkah pertama SETIAP sesi baru — WAJIB, tanpa kecuali

```bash
cd /home/claude/sakala-v3   # atau clone ulang kalau sandbox baru
git fetch origin -q
git log --oneline HEAD..origin/main
```

Kalau ada commit yang muncul: **baca commit message-nya dulu**, lalu
`git pull` (fast-forward, karena kamu belum commit apa pun) sebelum mulai
kerja. Jangan asumsikan status project dari checkpoint/memori sesi
sebelumnya — sesi lain bisa sudah maju jauh tanpa sepengetahuanmu.

Kalau kamu tidak yakin fitur X sudah ada atau belum: **cek kode langsung**
(`grep`, `find`, baca file), jangan tanya ke user atau menebak dari nama
commit saja.

## 2. Membuat perubahan skema database (Supabase)

1. Jalankan `mcp__Supabase__apply_migration` dengan project_id di atas.
   Beri nama migration yang deskriptif (`0012_nama_fitur`, urut dari nomor
   migration terakhir — cek dulu dengan `mcp__Supabase__list_migrations`).
2. **SEGERA setelah apply berhasil**, commit file `.sql`-nya ke
   `supabase/migrations/` dengan nama persis
   `<version_dari_list_migrations>_<nama>.sql`. Isi file harus SAMA PERSIS
   dengan SQL yang dijalankan.
3. **Jangan pernah** menjalankan migration ke Supabase tanpa langsung
   commit file-nya di commit yang sama atau commit berikutnya secepatnya.
   Ini pelajaran dari insiden nyata: migration `0010_schedule_entry` sempat
   dibangun dua sesi berbeda secara independen tanpa saling tahu, dan
   ketahuan baru saat salah satu push — untung skemanya hampir identik.
4. Kalau menemukan migration sudah live di Supabase tapi filenya TIDAK ada
   di repo (cek `mcp__Supabase__list_migrations` vs `ls supabase/migrations/`):
   itu tanda sesi lain pernah kerja di sini. Verifikasi skema NYATA lewat
   `information_schema.columns` dan `pg_indexes`/`pg_policies`
   (`mcp__Supabase__execute_sql`), tulis file `.sql` yang mencocokkan
   kenyataan itu — jangan menebak dari asumsi desain sendiri.

## 3. Menulis kode aplikasi

Pola arsitektur yang sudah dipakai konsisten di seluruh repo — ikuti, jangan
buat pola baru:

- `src/lib/domain/<entitas>.ts` — TypeScript types, tidak ada logic
- `src/lib/data-access/<entitas>.ts` — query Supabase murni (select/insert/
  update), fungsi `toDomain()` untuk konversi row→domain type
- `src/lib/application/<entitas>.actions.ts` — Next.js Server Actions
  (`"use server"`), validasi input, panggil data-access, `revalidatePath`
- `src/components/<area>/<Nama>.tsx` — komponen React. Client component
  (`"use client"`) hanya kalau butuh interaktivitas; default server component
- `src/app/<route>/page.tsx` — halaman, fetch data, compose komponen

Skill yang WAJIB dibaca sebelum bikin komponen baru: cek
`/mnt/skills/public/frontend-design/SKILL.md` kalau ada di environment-mu.

Prinsip desain yang mengikat semua kode (jangan langgar tanpa alasan kuat):
lihat `SAKALA-V3-MASTER-GABUNGAN.txt` di root repo — terutama Bagian A
(prinsip LOCKED) sebelum menambah fitur apa pun.

## 4. Verifikasi SEBELUM commit — dua perintah wajib

```bash
npx tsc --noEmit
npx eslint src --quiet
```

Keduanya harus **bersih total** (tidak ada output) sebelum lanjut ke commit.
Kalau `next build` lokal gagal karena `fonts.googleapis.com` tidak
terjangkau sandbox — itu wajar, bukan bug kode, jangan panik, lanjut saja
(Vercel punya akses internet penuh saat build).

Kalau eslint komplain `react-hooks/set-state-in-effect`: JANGAN coba
akali dengan menggabung beberapa `setState` jadi satu (sudah dicoba, tetap
gagal). Solusi yang benar:
- Untuk baca localStorage/state eksternal saat mount → pakai
  `useSyncExternalStore`, bukan `useState` + `useEffect`
- Untuk reset state saat membuka panel/dropdown → pindahkan logic reset ke
  handler klik yang membuka panel, bukan di `useEffect`
- Untuk animasi masuk (entrance) → pakai CSS `@keyframes` murni (lihat
  `globals.css`), jangan pakai `mounted` state + `useEffect`

## 5. Git — commit, rebase, push (urutan ini, tidak boleh dibalik)

```bash
# SELALU cek dulu, meskipun baru saja fetch di langkah 1
git fetch origin -q
git log --oneline HEAD..origin/main
```

- **Kalau kosong** (tidak ada commit baru): langsung `git add -A && git commit` lalu `git push origin main`.
- **Kalau ada commit baru**: `git rebase origin/main`. Kalau konflik (lihat
  §6 di bawah), selesaikan, lalu `git push origin main`.

Commit identity **wajib** persis ini (kalau belum ter-set di sandbox):

```bash
git config user.name "adizalmumtaz30"
git config user.email "adizalmumtaz30@gmail.com"
```

Commit message: bahasa Indonesia, jelaskan APA dan KENAPA, kaitkan ke
bagian dokumen master (mis. "Bagian E.1.2") kalau relevan. Sesi lain
membaca commit message-mu untuk paham konteks — tulis untuk mereka, bukan
cuma untuk diri sendiri.

**Push gagal "could not read Password" / "Bad credentials"**: token PAT
kadaluarsa/di-rotate user. Minta token baru ke user, lalu:
```bash
git remote set-url origin "https://<token_baru>@github.com/adizalmumtaz30/SAKALA-V3.git"
```
Jangan simpan token di memory/file apa pun. Token hanya hidup selama
sandbox berjalan.

**Push ditolak "Updates were rejected... fast-forward"**: sesi lain baru
saja push. Ini **normal**, bukan error — kembali ke atas §5, fetch+rebase.

## 6. Menyelesaikan konflik rebase

Paling sering terjadi di file migration `.sql` kalau dua sesi merancang
tabel yang sama secara independen (lihat §2 poin 4). Prinsip resolusi:

1. **Jangan** asal pilih salah satu sisi (`--ours`/`--theirs`) tanpa cek.
2. Query skema NYATA di Supabase (`information_schema.columns`,
   `pg_indexes`, `pg_policies`) — itu satu-satunya sumber kebenaran.
3. Tulis ulang file konflik supaya PERSIS mencocokkan skema live tsb,
   gabungkan komentar penjelasan dari kedua sisi kalau sama-sama berguna.
4. `git add <file>` lalu `GIT_EDITOR=true git rebase --continue`
   (sandbox biasanya tidak punya editor interaktif terpasang).
5. Jalankan ulang §4 (tsc + eslint) SETELAH rebase selesai, sebelum push —
   kode dari sesi lain yang baru masuk juga harus lolos verifikasi di
   sandboxmu, bukan cuma percaya CI mereka.

## 7. Setelah push — verifikasi deployment (WAJIB, bukan opsional)

Build sukses ≠ halaman benar-benar jalan. Insiden nyata pernah terjadi:
semua deployment READY selama berhari-hari padahal runtime 500 error total
(environment variable salah nama) — ketahuan baru saat user laporkan.

```
1. Tunggu ~45 detik (Vercel build)
2. mcp__Vercel__list_deployments (limit 1, project_id, team_id)
   → cocokkan meta.githubCommitSha dengan `git rev-parse HEAD`
   → pastikan state="READY" dan target="production"
3. mcp__Vercel__web_fetch_vercel_url ke production URL (halaman yang barusan diubah)
   → pastikan status 200, dan isi HTML-nya benar-benar mengandung fitur baru
     (bukan cuma cek status code — baca sepotong konten yang relevan)
```

Kalau langkah 2 menunjukkan commit SHA tidak berubah setelah push (padahal
push berhasil di GitHub): webhook Vercel↔GitHub mungkin tidak trigger.
Fix: `mcp__Vercel__create_git_project` dengan `deploy: true` dan `repo`
yang sama (reuse project existing), lalu push commit kosong verifikasi:
```bash
git commit --allow-empty -m "chore: verify Vercel git integration"
git push origin main
```

## 8. Baru boleh lapor "selesai" ke user setelah §7 lolos

Bukan setelah `git push` sukses. Bukan setelah build "READY". Baru setelah
runtime fetch mengonfirmasi kode benar-benar hidup dan menunjukkan data
yang diharapkan.

## 9. Checkpoint — tulis di memory, bukan cuma di chat

Setiap fitur/batch besar selesai dan terverifikasi live, ringkas ke memory
(`/areas/sakala-v3.md` kalau kamu Claude dengan akses memory) supaya sesi
Claude berikutnya (kamu sendiri di percakapan lain) tidak mulai dari nol.
AI lain yang tidak punya akses memory yang sama harus mengandalkan §1
(fetch+baca commit log) dan dokumen ini sebagai gantinya.

## Referensi lengkap

- `SAKALA-V3-MASTER-GABUNGAN.txt` (root repo) — seluruh keputusan produk,
  prinsip LOCKED, status fitur, dan roadmap 46-item
- `supabase/migrations/README.md` — disiplin version control migration
- Riwayat commit `main` — baca 10-20 commit terakhir untuk konteks
  keputusan desain terbaru sebelum menambah fitur besar
