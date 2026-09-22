# Arvio v3.7.6 — Share link sungguhan

Patch ini untuk project v3.7.5 yang sudah terhubung ke Supabase. ZIP hanya memuat file aplikasi yang diubah/ditambahkan, migrasi SQL, dan petunjuk ini.

## Urutan pemasangan

1. Ekstrak ZIP.
2. Buka project Supabase yang dipakai Arvio → SQL Editor → New query.
3. Salin SELURUH isi `supabase/share-v3.7.6.sql`, kemudian Run. Ini migrasi tambahan; jangan mengganti atau menghapus tabel workspace yang sudah ada. SQL boleh dijalankan ulang.
4. Setelah berhasil, upload isi ZIP ke root repository GitHub Arvio. Pertahankan folder `src`, `src/styles`, dan `supabase`. Ganti file yang sama; jangan menghapus file lainnya. Jangan upload ZIP sebagai satu file.
5. Commit, lalu tunggu deployment Vercel menjadi Ready. Variabel lingkungan tetap `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY`; tidak ada key baru.
6. Buka catatan → Share → aktifkan Anyone with the link → tunggu Link ready → Copy link.
7. Buka link di incognito atau perangkat lain, tanpa login. Coba matikan akses, lalu refresh link tersebut: harus tidak tersedia.

## Perilaku

- Link memakai origin deployment saat ini dan token acak per stable note ID, bukan judul/path.
- Akses awal mati. Aktifkan secara eksplisit untuk membuat link publik baca-saja. Siapa pun yang memiliki link dapat membacanya.
- Mematikan akses menghapus token. Mengaktifkan kembali menghasilkan link baru; link lama tetap tidak berlaku.
- Preview membuka halaman penerima sungguhan di tab baru. Tidak ada simulasi edit atau login-to-edit.
- Halaman penerima tidak menjalankan kode workspace, tidak memuat sesi tersimpan, dan tidak menyimpan catatan ke workspace penerima.
- Hanya isi catatan yang dipilih dibagikan, tidak otomatis seluruh anak, breadcrumb privat, email pemilik, atau workspace.
- Judul/isi mengikuti versi terakhir yang berhasil tersinkron ke Supabase. Rename/move mempertahankan link. Perubahan offline tidak langsung terlihat di penerima. Refresh halaman penerima untuk membaca pembaruan.
- Setelah sinkronisasi, Trash membuat link tidak tersedia. Restore mengaktifkan link yang belum dicabut. Permanent delete membersihkan token seluruh subtree.
- HTML penerima dibangun ulang melalui daftar elemen/atribut yang diizinkan. Script, handler event, iframe, dan URL javascript tidak diteruskan. Format khusus di luar daftar dapat disederhanakan; gambar blob lokal tidak bisa dibagikan lintas perangkat.
- Error SQL belum dipasang, sesi, jaringan, dan kegagalan clipboard ditampilkan; tidak ada lagi status Copied palsu.

## Ownership dan pemeriksaan

- `src/main.js`: mengganti seluruh alur Share decoy; menggunakan client Supabase, penyimpanan editor, rantai sync, sheet dan waktu animasi yang sudah ada.
- `src/supabase.js`: satu RPC pembaca anonim tanpa token sesi pengguna.
- `src/entry.js`: memilih workspace normal atau pembaca publik sebelum inisialisasi workspace.
- `src/shared-view.js` dan `src/styles/shared-view.css`: pembaca publik terisolasi, sanitasi konten, layout safe-area.
- `index.html`: membuang permission Editor/owner/preview palsu, menambahkan status/link asli.
- `src/styles/share.css`: hanya style baru untuk status, field link, dan disabled controls; tidak mengganti motion/sheet geometry.
- Migrasi memakai RLS untuk pemilik, tanpa izin SELECT anonim pada tabel. Pembaca mengakses RPC token terbatas. Fungsi security definer mempunyai search_path kosong dan izin execute eksplisit, mengikuti https://supabase.com/docs/guides/database/functions.

Lolos: syntax JavaScript; Vite production build; pemeriksaan duplicate function/HTML IDs dan URL decoy; production touch/navigation/persistence smoke; pengujian SQL di PostgreSQL WASM (PGlite) termasuk idempotensi, pembatasan role, rename/move/trash/restore/permanent subtree delete; pengujian browser Chromium dengan API tiruan pada desktop 1440×1000 dan mobile 390×844; screenshot Share desktop/mobile diperiksa; guest reload dan sanitasi HTML.

Belum diuji: koneksi end-to-end ke Supabase/Vercel milik Anda, perangkat iPhone fisik/Safari. Tidak ada perubahan ke Supabase live, push GitHub, atau deployment yang dilakukan dari sini. Patch ini tidak menambahkan kolaborasi Editor atau mengubah arsitektur konflik sinkronisasi workspace yang sudah ada.
