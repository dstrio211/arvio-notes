# Arvio v3.7.7

Patch untuk v3.7.6. Tidak perlu SQL baru atau environment variable baru.

## Pasang

Ekstrak ZIP, upload seluruh isinya ke root repository GitHub dengan struktur folder tetap sama, lalu commit. Ganti file yang namanya sama tanpa menghapus file proyek lainnya. Tunggu Vercel Ready, lalu refresh halaman pemilik dan halaman shared. Link shared lama tetap berlaku.

## Perubahan

- Shared reader mempertahankan inline format teks yang aman: warna, background kode, font monospace, ukuran/ketebalan teks, line-height, whitespace/indentasi, highlight, daftar bernomor, dan struktur tabel. Heading tidak lagi kehilangan font-weight khusus. JavaScript, event handler, iframe, CSS URL dan posisi overlay tetap dibuang.
- Tipografi isi editor dan shared kini punya satu pemilik, `src/styles/note-content.css`. Aturan tipografi lama dipindahkan dari note.css dan ui-system.css. Layout editor dan interaksi lainnya tetap dimiliki subsystem asal.
- Shared memakai aset `/arvio-logo.png` dan aturan branding asli. Tidak ada filter atau transform pada gambar logo.
- Menu slash mobile memakai batas atas/bawah Visual Viewport, mengikuti resize dan scroll saat keyboard tampil. Tinggi menu dibatasi pada ruang tersedia dan daftar tetap bisa digulir.
- Pada browser yang mendukung Popover API, menu yang sama tampil di top layer, sehingga ancestor transform/clipping tidak menggeser atau menutupi menu. DOM, kontrol Paragraph spacing, caret, dan animasi yang sudah ada tetap dipakai. Warna teks ditentukan eksplisit agar tidak berubah ke warna default popup browser.

## Pemeriksaan

Lolos: Node syntax, Vite production build, production browser smoke navigasi/pin/reload, dan tes Chromium desktop 1440px serta mobile 390px. Computed typography fixture dibandingkan antara editor v3.7.6, editor v3.7.7 dan shared reader. Fixture meliputi heading, kode berwarna, font legacy, background, indentasi, highlight, daftar dan tabel. Sanitasi script/event/position/CSS URL diperiksa.

Simulasi Visual Viewport: keyboard membuka/menutup, offset saat layar bergeser, viewport kecil, ancestor bertransformasi, pemilihan Paragraph spacing dan penutupan top-layer. Menu berada di dalam area terlihat pada skenario tersebut. Screenshot shared dan menu diperiksa.

Keyboard iPhone fisik/Safari dan deployment live belum diuji di lingkungan ini. Pengujian keyboard di atas merupakan simulasi ukuran/offset viewport, bukan keyboard iOS sungguhan. Fixture format meniru pola screenshot, bukan salinan HTML catatan pribadi. Font yang tidak tersedia di perangkat penerima memakai fallback font perangkat.
