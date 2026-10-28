# 🏫 PANDUAN LENGKAP: PORTAL SEKOLAH TERPADU (SUPER APP HUB & SSO)

Portal ini adalah **Pusat Pintu Masuk Tunggal (Super App Hub)** dengan sistem **Pemisahan Peran Pengguna (Siswa, Guru, Admin)** dan **Single Sign-On (SSO)** ke seluruh aplikasi sekolah:
1. 🎓 **Aplikasi Nilai SMP**
2. ⚽ **Presensi & Rekap Ekstrakurikuler**
3. 🌟 **7 Kebiasaan Anak Indonesia Hebat**
4. ⚖️ **Buku Pelanggaran & Tata Tertib Siswa** (Modul Mandiri Baru)

---

## 🌟 1. Pemisahan Fitur Berdasarkan Pengguna

### A. Portal Siswa (Peserta Didik)
* Siswa masuk cukup dengan memasukkan **10 Digit NISN** (atau memilih nama dari daftar).
* Menampilkan informasi profil siswa: Nama Lengkap, Kelas, NISN, dan Nama Wali Kelas.
* **Fitur yang ditampilkan hanya yang relevan bagi siswa**:
  - 📊 **Cek Nilai Saya**: Membuka rapor hasil belajar.
  - ⚽ **Presensi Ekskul Saya**: Memantau riwayat kehadiran latihan ekskul.
  - 🌟 **Jurnal 7 Kebiasaan**: Mengisi pembiasaan karakter harian.
  - ⚖️ **Buku Poin Kedisiplinan**: Cek buku saku poin tata tertib dan status bimbingan konseling.
* **Single Sign-On (SSO) Otomatis**: Ketika siswa mengklik salah satu aplikasi di atas, aplikasi target **otomatis memuat data siswa tersebut tanpa perlu login lagi atau mengetikkan NISN ulang**.
* Siswa **tidak dapat** melihat menu Master Siswa, Master Guru, Sinkronisasi, atau Pengaturan Admin.

### B. Portal Guru & Tenaga Pendidik
* Guru masuk dengan memilih nama guru atau memasukkan NIP.
* Menampilkan profil guru, NIP, jabatan (Wali Kelas / Guru BK / Pembina).
* **Fitur yang ditampilkan untuk guru**:
  - 📝 **Input Nilai & Leger Kelas**: Penilaian capaian belajar massal.
  - 📋 **Input Presensi Ekskul**: Mengabsen kehadiran anggota ekskul binaan.
  - ✨ **Validasi 7 Kebiasaan**: Mereview jurnal karakter siswa binaan.
  - 🚨 **Catat Pelanggaran**: Pencatatan tata tertib, razia atribut, dan poin sanksi.

### C. Portal Administrator (Admin)
* Dilindungi oleh **PIN Administrator** (Default: **`123456`**).
* **Hak Akses Penuh**:
  - Manajemen Tautan URL 4 Aplikasi (Mendukung link **Vercel**, Google Apps Script, atau Domain Sekolah).
  - Master Database Siswa Terpusat (Tambah/Edit/Hapus Siswa).
  - Master Database Guru Terpusat.
  - Sinkronisasi Otomatis Satu Klik ke seluruh Spreadsheet aplikasi.
  - Ubah Identitas Sekolah & Ganti PIN Keamanan.

---

## 🌐 2. Cara Memasukkan Link Vercel ke Portal (Sangat Mudah!)

Jika aplikasi Anda di-deploy menggunakan **Vercel** (misalnya `https://nilai-smp.vercel.app`), kini Anda dapat memasukkannya langsung dari Dashboard Admin:

1. Buka Portal Sekolah, pilih peran **Administrator**, lalu masukkan PIN **`123456`**.
2. Pada bagian **"Tautan URL 4 Aplikasi Sekolah"**, klik tombol **`✏️ Atur Tautan (Vercel / GAS)`** pada kartu aplikasi yang diinginkan.
3. Jendela sembul (*modal dialog*) akan muncul. Tempel (*paste*) tautan Vercel Anda di kolom yang tersedia:
   - *Contoh format Vercel:* `https://nilai-smp.vercel.app`
   - *Tips:* Anda juga boleh mengetik `nilai-smp.vercel.app` tanpa `https://` — sistem akan otomatis melengkapinya!
4. Klik tombol **`🔗 Tes Buka`** untuk memastikan website Vercel Anda dapat dibuka dengan lancar di tab baru.
5. Klik **`Simpan Tautan`**. Tautan langsung tersimpan permanen ke database Google Sheets dan status aplikasi akan otomatis berubah menjadi **`▲ Vercel (Tersambung)`**.

---

## 🔄 3. Mekanisme Tombol "Kembali ke Portal"

* Setiap kali siswa, guru, atau admin membuka aplikasi dari portal, portal secara otomatis menyertakan parameter `portal_url`.
* Di dalam setiap aplikasi (Nilai SMP, Ekskul, dan Pelanggaran Siswa):
  - Tersedia tombol **`← Ke Portal`** di bilah navigasi atas (*topbar*).
  - Pengguna cukup mengklik tombol tersebut untuk langsung kembali ke Portal Sekolah Terpadu kapan saja tanpa kehilangan sesi kerja.

---

## ⚡ 4. Solusi NISN Angka Nol di Depan Hilang
* Seluruh kolom NISN pada Google Sheets diformat secara ketat sebagai **Plain Text (`@`)**.
* Format NISN dinormalisasi otomatis menjadi **10 digit utuh berawalan angka nol** (misalnya `0081234567`).
* Tersedia menu Google Sheets: **`🏫 Menu Portal Sekolah` &rarr; `⚡ Perbaiki Angka 0 di Depan NISN (Auto-Fix)`** untuk memperbaiki database lama dalam 1 klik.

---

## 🚀 5. Langkah Pemasangan ke Google Apps Script (Backend & Database)

1. Buat Spreadsheet baru di [Google Sheets](https://sheets.new) dengan nama: **`Database Master Portal Sekolah`**.
2. Klik **Ekstensi** &rarr; **Apps Script**.
3. Salin isi [Code.gs](file:///f:/portal-sekolah/Code.gs).
4. Buat file HTML baru bernama `Index` dan salin isi dari [Index.html](file:///f:/portal-sekolah/Index.html).
5. Klik **Simpan (Ikon Disket)**.
6. Muat ulang tab Google Sheets & klik menu **`🏫 Menu Portal Sekolah` &rarr; `🔄 Setup / Inisialisasi Database Master`**.
7. Deploy sebagai Web App (**Deploy** &rarr; **New deployment** &rarr; **Web app** &rarr; *Who has access: Anyone*).
8. Salin **Web App URL** yang dihasilkan (akhiran `/exec`). Simpan URL ini untuk dihubungkan ke Vercel.

---

## 🔺 6. Panduan Pasang di Vercel (Hosting Cepat & Modern)

Folder `portal-sekolah` telah dilengkapi konfigurasi Vercel lengkap: `package.json`, `vercel.json` (URL rewrites & CORS headers), `manifest.json`, icon PWA, dan Service Worker.

### Cara 1: Menggunakan Vercel CLI (Paling Cepat)
1. Buka PowerShell di folder `f:\portal-sekolah`.
2. Jalankan perintah:
   ```powershell
   npx vercel
   ```
3. Ikuti panduan di layar:
   - *Set up and deploy?* &rarr; Ketik **`y`**
   - *Which scope?* &rarr; Pilih akun Vercel Anda
   - *Link to existing project?* &rarr; Ketik **`n`**
   - *What's your project's name?* &rarr; Ketik **`portal-sekolah`**
   - *In which directory is your code located?* &rarr; Tekan Enter (`./`)
4. Setelah proses selesai, Vercel akan memberikan domain HTTPS cepat, misalnya: `https://portal-sekolah-anda.vercel.app`.

### Cara 2: Menggunakan GitHub / Vercel Dashboard
1. Upload folder `portal-sekolah` ke repository GitHub Anda.
2. Buka dashboard [Vercel](https://vercel.com) &rarr; klik **Add New** &rarr; **Project**.
3. Import repository GitHub tersebut &rarr; klik **Deploy**.
4. Website langsung aktif dan siap digunakan secara publik dengan HTTPS otomatis.

### Menghubungkan Vercel ke Google Apps Script (Database Spreadsheet Live):
1. Buka portal di Vercel Anda (`https://portal-sekolah.vercel.app`).
2. Masuk sebagai **Administrator** (PIN default: `123456`).
3. Pada kartu **"Backend API Google Apps Script"**, klik tombol **`Setel Web App URL`**.
4. Tempel (*paste*) URL Web App Google Apps Script Anda (dari Langkah 5).
5. Klik **`Uji Respon`** &rarr; jika muncul pesan hijau `🟢 Koneksi Berhasil!`, klik **`Simpan & Muat Data`**.
6. Data siswa, guru, dan pengaturan kini tersinkronisasi langsung ke Google Sheets secara real-time!

---

## 📲 7. Cara Memasang Aplikasi di HP Android (PWA - Tanpa Play Store)

Portal Sekolah Terpadu telah dioptimalkan secara penuh sebagai **Progressive Web App (PWA)**:
* Tampilan layar penuh (*fullscreen standalone*) tanpa bilah alamat browser.
* Berjalan mulus dan sangat ringan di semua tipe HP Android.
* Ikon aplikasi resmi sekolah muncul di Layar Utama (*Home Screen*) dan Laci Aplikasi Android.

### Langkah Pemasangan di HP Android Pengguna:
1. Buka tautan Vercel (atau Web App) portal di browser **Google Chrome** pada HP Android.
2. Akan muncul banner biru di bagian atas: **"Pasang di HP Android Anda"** dengan tombol **`Pasang`**.
3. Ketuk tombol **`Pasang`** &rarr; konfirmasi pop-up Chrome **"Instal"**.
4. **Jika banner otomatis tidak muncul**:
   - Ketuk menu **titik tiga (⋮)** di pojok kanan atas layar browser Chrome.
   - Pilih menu **"Tambahkan ke Layar Utama"** (*Add to Home screen*) atau **"Instal Aplikasi"** (*Install app*).
   - Ketuk **Instal**.
5. Selesai! Ikon **PortalSekolah** akan terpasang di HP pengguna layaknya aplikasi Android resmi dari Google Play Store.
