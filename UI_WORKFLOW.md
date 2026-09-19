# SAKALA V3 — Alur Kerja UI

Pelengkap `AI_WORKFLOW.md` (proses Git/Supabase/Vercel). Dokumen ini khusus
menjawab: **pakai apa** untuk UI, **tahapannya bagaimana**, dan **batasan
apa saja yang nyata** (bukan asumsi) — supaya AI lain tidak mencoba hal
yang sudah terbukti tidak bisa jalan di lingkungan ini.

## 1. Stack UI — persis ini, jangan tambah library tanpa alasan kuat

```json
{
  "next": "16.3.5",
  "react": "19.2.8",
  "tailwindcss": "^4",
  "lucide-react": "..."
}
```

Cuma itu untuk UI. **Tidak ada** component library (bukan shadcn/ui, bukan
Radix, bukan Framer Motion, bukan three.js/react-three-fiber). Semua
komponen — Drawer, Toast, ConfirmDialog, ColorPicker, Command Palette —
ditulis dari nol pakai React + Tailwind + CSS murni. Ini bukan kelalaian,
ini keputusan sadar: setiap dependency baru adalah bundle size, permukaan
bug baru, dan sesuatu yang harus dipelajari sesi berikutnya. Kalau memang
perlu library baru, install dengan alasan tertulis di commit message.

## 2. Sistem token desain

Satu file: `src/app/globals.css`. CSS custom properties biasa (bukan JS
theme object), diekspos ke Tailwind lewat `@theme inline` supaya jadi
utility class (`bg-canvas`, `text-ink`, `border-hairline`, dst).

- Dark adalah default (`:root`). Light lewat `[data-theme="light"]`
  (belum ada UI toggle-nya, tapi CSS-nya sudah siap dipakai).
- Warna nama semantik, bukan nama warna literal: `--color-canvas`,
  `--color-surface-elevated`, `--color-status-blocked`, dst — supaya
  kalau nanti ganti palet, tidak perlu grep-replace nama warna di 40 file.
- Motion: keyframes CSS murni di sini juga (`drawer-fade-in`,
  `drawer-slide-in`, `toast-in`, `dialog-in`), dipakai lewat
  `[animation:nama-keyframe_200ms_ease-out]` di className Tailwind
  langsung. Alasan kenapa CSS bukan JS state — lihat §5.

Kalau menambah warna/token baru: tambah di `:root` DAN di blok
`[data-theme="light"]`, lalu daftarkan di `@theme inline`. Jangan hardcode
hex color di komponen.

## 3. Arsitektur komponen — batas Server/Client, INI PALING SERING BIKIN BUG

Next.js App Router: default semua komponen **Server Component** (jalan di
server, tidak ada JS dikirim ke browser). Client Component (`"use client"`
di baris pertama file) cuma kalau butuh `useState`/`onClick`/dll.

**Insiden nyata yang terjadi di repo ini** (baca commit `dbd003a` untuk
detail lengkap): halaman Server Component mengirim sebuah **function**
sebagai prop ke Client Component — misalnya `renderRow={(item) => ...}`
atau `onClose={() => bulkAction(ids, "active")}`. Ini terlihat normal,
**lolos `tsc` dan `eslint` tanpa keluhan sama sekali**, tapi meledak jadi
runtime error `"Functions cannot be passed directly to Client Components"`
begitu halaman benar-benar dikunjungi user — karena ini aturan batas
serialisasi React, bukan aturan tipe TypeScript.

**Aturan tegasnya:**
- Boleh lintas Server→Client: string, number, boolean, object/array polos,
  dan **JSX yang sudah dirender** (`<EntityRow {...props} />` sebagai
  `children`, bukan fungsi yang me-render-nya).
- **Tidak boleh** lintas Server→Client: function apa pun, termasuk closure
  yang membungkus Server Action (`(id) => someServerAction(id, "extra")` —
  pembungkusan ini menghilangkan status "Server Action" dari fungsi
  aslinya, walau `someServerAction` sendiri valid dikirim langsung).
- Kalau Client Component butuh data yang "dihitung" dari sesuatu yang
  fungsinya cuma ada di server (contoh: filter kompleks): kirim **data
  mentahnya** sebagai prop serializable, lalu hitung ulang DI DALAM Client
  Component pakai `useMemo` — bukan kirim fungsi hasil hitungannya.
- Kalau Client Component butuh memanggil-balik ke parent (misal "tutup
  drawer ini"): pakai **React Context** yang di-`Provider`-kan DARI DALAM
  Client Component itu sendiri (bukan diteruskan dari Server Component),
  child membaca lewat `useContext`.

**Cara menangkap bug ini**: `tsc`/`eslint` TIDAK CUKUP. Wajib kunjungi
rute dinamis yang sebenarnya (`web_fetch_vercel_url` ke production, atau
`next dev` kalau environment punya akses) setelah deploy — lihat
`AI_WORKFLOW.md` §7. Kalau menulis komponen baru yang menerima props dari
Server Component, audit manual: apakah ada prop yang tipenya function?

## 4. Ikon & ilustrasi — batasan nyata, bukan pilihan gaya semata

**Tidak ada tool image-generation di environment ini.** Konsekuensinya
langsung menentukan pendekatan:

- **Ikon**: custom SVG React component (`src/components/icons/index.tsx`),
  digambar manual pakai `<path>`/`<circle>` dengan `viewBox="0 0 24 24"`,
  `stroke="currentColor"`, `strokeWidth={1.75}`. Bukan diambil dari icon
  pack lain di luar `lucide-react` (untuk konsistensi ketebalan garis —
  "satu visual DNA").
- **Ilustrasi "3D"**: lihat `src/components/dashboard/DashboardHeroIllustration.tsx`
  — itu bukan render 3D sungguhan. Itu **SVG isometric flat** (bentuk
  geometris digambar dengan sudut & shading yang menipu mata seolah 3D,
  gaya yang sama dipakai Stripe/Linear di ilustrasi mereka), ~2KB, dimuat
  instan. **`three.js`/WebGL/`react-three-fiber` sengaja dihindari** untuk
  elemen dekoratif — alasannya ditulis eksplisit di dokumen produk
  (`SAKALA-V3-MASTER-GABUNGAN.txt` Bagian E.1.6): *"BATAS TEKNIS: aset
  statis teroptimasi (SVG/WebP/AVIF), BUKAN render 3D real-time. Kecepatan
  operator di atas kemewahan visual."* Ini bukan keterbatasan teknis
  environment, ini keputusan produk yang LOCKED — jangan pasang three.js
  meski environment-nya memungkinkan.
- **Foto manusia (avatar guru/admin)**: tidak ada pipeline upload file.
  Kolom `teacher.photo_url` cuma nampung URL eksternal (operator paste
  link foto yang sudah di-hosting di tempat lain). Belum ada UI upload-nya.
  **Jangan** coba generate foto wajah orang lewat AI image generator —
  di luar kemampuan environment ini, dan secara prinsip produk juga
  mewajibkan "Photo Preservation Rule" (foto asli tidak boleh diubah/
  direka ulang wajahnya) yang tidak relevan kalau fotonya hasil generate.

## 5. Motion / animasi — aturan durasi + kenapa CSS bukan JS state

Durasi baku (dari dokumen produk, LOCKED):
- Hover: 120–180ms
- Transisi normal/seleksi: 180–260ms
- Drawer/panel: 280–400ms
- Transisi kompleks: 400–600ms

**Dilarang total** (bukan soal selera, ini prinsip produk): bounce,
elastic, glow, particle, confetti, fireworks, blink/flash, animasi
dekoratif tanpa makna fungsional. Baca §D.13 di
`SAKALA-V3-MASTER-GABUNGAN.txt` untuk daftar lengkap + alasannya.

**Kenapa animasi masuk (entrance) di repo ini semua CSS `@keyframes`,
bukan `useState(false)` + `useEffect(() => setState(true))`**: eslint
rule `react-hooks/set-state-in-effect` (baru di React 19 toolchain) akan
menolak pola itu. Sudah dicoba beberapa variasi workaround (gabung
beberapa state jadi satu object, dsb) — tetap ditolak. Solusi yang
benar-benar berhasil:
- Animasi masuk murni dekoratif (drawer muncul, toast muncul, dialog
  muncul) → CSS `@keyframes` di `globals.css`, dipasang lewat
  `[animation:nama_durasi_easing]` di className. Berjalan otomatis saat
  elemen di-mount, tidak butuh React state sama sekali.
- Kalau butuh baca state eksternal saat mount (localStorage, dst;
  BUKAN untuk animasi) → `useSyncExternalStore`, lihat contoh di
  `Sidebar.tsx` (collapse/expand).
- Kalau butuh reset state saat membuka panel/dropdown → taruh logic reset
  di handler klik yang membuka panel, bukan di `useEffect`. Lihat contoh
  di `SmartSelect.tsx`.

## 6. Tahapan membuat/mengubah UI — urutan yang sudah terbukti jalan

1. **Baca pola yang sudah ada** untuk kasus serupa (list halaman lain
   kalau bikin halaman list baru, dst) — jangan mulai dari nol kalau
   sudah ada pola.
2. **Cek `SAKALA-V3-MASTER-GABUNGAN.txt` Bagian D** kalau menambah pola UI
   baru (Drawer, Sheet, dst) — banyak keputusan visual sudah LOCKED di
   sana (radius hierarkis, warna, prinsip "richness by scale", dll).
3. Tulis komponen: **Server Component dulu** (default), turunkan jadi
   Client Component cuma untuk bagian yang benar-benar butuh
   interaktivitas — bukan seluruh halaman jadi `"use client"`.
4. Kalau ada Server→Client boundary: cek §3 di atas SEBELUM menulis kode,
   bukan sesudah dapat error runtime.
5. Style pakai utility class Tailwind dari token yang sudah ada
   (`bg-surface`, `text-ink-muted`, dst) — jangan `style={{ color:
   '#22262F' }}` inline kecuali untuk nilai dinamis (warna identitas
   mapel, misalnya, yang memang datang dari database).
6. `npx tsc --noEmit && npx eslint src --quiet` — wajib nol output.
7. Commit, push (ikuti `AI_WORKFLOW.md` §5).
8. **Verifikasi runtime** (`AI_WORKFLOW.md` §7) — untuk perubahan UI,
   ini berarti benar-benar baca potongan HTML yang di-fetch dan pastikan
   class/struktur yang diharapkan ada di sana, bukan cuma status 200.

## 7. Keterbatasan verifikasi visual — batasan paling penting untuk disadari

**AI yang mengerjakan UI di sini TIDAK PUNYA MATA.** Tidak ada browser,
tidak ada screenshot, tidak ada rendering visual yang bisa dilihat
langsung. Yang bisa dilakukan cuma:
- Baca HTML mentah hasil `web_fetch_vercel_url` dan menalar dari situ
  (class Tailwind apa yang terpasang, teks apa yang muncul, struktur DOM)
- Percaya pada konsistensi sistem token (kalau `bg-surface` dipakai benar,
  warnanya PASTI benar, karena sudah didefinisikan sekali di token)

**Konsekuensinya**: kesalahan visual halus (spacing kurang pas, warna
kurang kontras, elemen kepotong di lebar layar tertentu) **tidak akan
ketahuan** lewat proses ini. Untuk perubahan visual yang signifikan,
sebaiknya user sendiri yang konfirmasi tampilannya di browser dan kasih
tahu kalau ada yang janggal — jangan asumsikan "sudah kutulis classnya
dengan benar" sama dengan "sudah pasti terlihat bagus".

## 8. Batasan lain yang sudah terverifikasi nyata

- **Local build/dev**: `next build` di sandbox sering gagal di tahap font
  (`fonts.googleapis.com` tidak ada di allowlist jaringan sandbox). Ini
  BUKAN bug kode — Vercel production build punya akses internet penuh dan
  akan berhasil. Jangan panik, jangan coba "fix" dengan hapus Google
  Fonts. Cukup andalkan `tsc`+`eslint` di lokal, biarkan Vercel yang
  membuktikan build sungguhan.
- **Tidak ada asset gambar biner** (`.png`/`.jpg`/`.webp`) di repo sama
  sekali — semua visual adalah SVG inline (kode), bukan file gambar.
  Ini disengaja: SVG tajam di resolusi apa pun, ukuran kecil, dan bisa
  ikut `currentColor` mengikuti tema dark/light otomatis. Kalau perlu
  aset visual baru, defaultnya adalah "gambar sebagai SVG", bukan cari
  file gambar dari luar.
