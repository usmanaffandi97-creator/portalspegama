# 📱 DAFTAR FITUR LENGKAP: EKOSISTEM APLIKASI SEKOLAH TERPADU & BUKU PELANGGARAN SISWA

Dokumen ini memuat daftar lengkap seluruh fitur, fungsi, dan arsitektur teknis dari ekosistem aplikasi sekolah yang telah dikembangkan:
1. 🏫 **Portal Sistem Informasi Sekolah Terpadu (Super App Hub & SSO)**
2. ⚖️ **Aplikasi Buku Catatan & Poin Pelanggaran Siswa (Disiplin Siswa v2.0)**
3. 🔗 **Integrasi Aplikasi Nilai SMP, Presensi Ekskul, dan 7 Kebiasaan Karakter**
4. 📲 **Fitur Mobile App & Progressive Web App (PWA Android)**
5. 🔺 **Fitur Hosting Vercel & Sinkronisasi Google Sheets Database**

---

## 🏫 BAGIAN 1: FITUR PORTAL SEKOLAH TERPADU (SUPER APP HUB)

Portal ini bertindak sebagai **Pusat Pintu Masuk Tunggal (*Single Point of Entry*)** bagi seluruh ekosistem digital sekolah dengan manajemen identitas dan hak akses terpisah.

### 1.1. Pemisahan Peran Pengguna (Role-Based Access Control)
* **👥 Tiga Tampilan Khusus Berdasarkan Pengguna**:
  1. **Tampilan Siswa**:
     - Masuk menggunakan **10 Digit NISN** (atau memilih nama dari daftar).
     - Kartu Profil Siswa: Nama Lengkap, Kelas, NISN, dan Nama Wali Kelas.
     - **Menu Khusus Siswa**:
       - 📊 *Cek Capaian Nilai*: Langsung membuka rapor nilai siswa bersangkutan.
       - ⚽ *Presensi Ekskul Saya*: Memantau riwayat kehadiran latihan ekskul.
       - 🌟 *Jurnal 7 Kebiasaan*: Mengisi jurnal pembiasaan karakter harian.
       - ⚖️ *Buku Saku Tata Tertib*: Mengecek akumulasi poin pelanggaran dan status pembinaan.
     - **Proteksi Akses**: Siswa tidak dapat melihat atau membuka menu pengaturan, input nilai guru, pencatatan pelanggaran, maupun database master.
  2. **Tampilan Guru & Tenaga Pendidik**:
     - Masuk dengan memilih nama guru atau memasukkan NIP.
     - Profil Guru: Nama Lengkap & Gelar, NIP, Jabatan (Wali Kelas / Guru BK / Pembina).
     - **Menu Khusus Guru**:
       - 📝 *Input Nilai & Leger*: Penilaian mata pelajaran dan capaian kelas.
       - 📋 *Input Presensi Ekskul*: Mengabsen anggota ekskul yang dibina.
       - ✨ *Validasi Karakter*: Mereview dan memvalidasi jurnal pembiasaan siswa binaan.
       - 🚨 *Catat Pelanggaran*: Formulir kedisiplinan dan razia pagi.
  3. **Tampilan Administrator (Admin)**:
     - Dilindungi **PIN Administrator** (Default: `123456`, dapat diganti).
     - **Hak Akses Penuh**:
       - Mengatur tautan URL 4 aplikasi sekolah (Vercel, Google Apps Script, atau domain sekolah).
       - Mengelola Master Database Siswa terpusat.
       - Mengelola Master Database Guru & Staf terpusat.
       - Sinkronisasi otomatis 1-klik ke seluruh spreadsheet aplikasi.
       - Mengubah identitas sekolah dan PIN administrator.

---

### 1.2. Single Sign-On (SSO) Terpadu
* **Login Sekali untuk Semua Aplikasi**:
  Ketika siswa atau guru masuk di portal lalu memilih salah satu aplikasi (Nilai, Ekskul, Pelanggaran), portal secara otomatis menyertakan parameter sesi terenkripsi:
  `?role=siswa&nisn=0081234567&nama=Ahmad&kelas=8-A&portal_url=...`
* **Otomasi di Aplikasi Tujuan**:
  Aplikasi tujuan langsung mengenali identitas siswa tanpa meminta login ulang atau mengetikkan NISN lagi.

---

### 1.3. Navigasi Terpadu "← Ke Portal"
* Semua aplikasi yang terhubung dilengkapi tombol navigasi **`← Ke Portal`** di bilah atas (*topbar*).
* Memungkinkan pengguna berpindah antar-aplikasi dan kembali ke portal dengan satu ketukan tanpa kehilangan sesi kerja.

---

### 1.4. Manajemen Tautan Cepat (Vercel & Apps Script)
* Administrator dapat menginput atau mengganti tautan aplikasi kapan saja melalui dialog sembul (*modal*).
* **URL Auto-Normalization**: Mengetikkan `nilai-smp.vercel.app` otomatis dikonversi menjadi `https://nilai-smp.vercel.app`.
* **Badge Deteksi Platform Otomatis**:
  - `▲ Vercel`: Tautan hosting Vercel.
  - `Google Apps Script`: Tautan Web App Google.
  - `Tersambung`: Tautan domain mandiri sekolah.
* **Tombol Uji Tautan Langsung (`🔗 Tes Buka`)**: Menguji apakah tautan aktif di tab baru sebelum disimpan.

---

### 1.5. Master Database Terpusat & Proteksi NISN
* **Single Source of Truth**: Data siswa dan guru cukup diinput satu kali di Portal Master.
* **Proteksi Nol di Depan NISN**: Menjamin seluruh 10 digit NISN (misal: `0081234567`) tidak terpotong menjadi `81234567` melalui format teks murni `@` dan fungsi normalisasi `padStart(10, '0')`.
* **Sinkronisasi 1-Klik**: Tombol *"Mulai Sinkronisasi"* otomatis menyalin seluruh data siswa ke spreadsheet aplikasi Nilai, Ekskul, 7 Kebiasaan, dan Pelanggaran.

---

## ⚖️ BAGIAN 2: FITUR APLIKASI BUKU PELANGGARAN SISWA (DISIPLIN SISWA V2.0)

Modul mandiri khusus untuk penegakan tata tertib sekolah, razia atribut, bimbingan konseling, dan pembinaan karakter siswa.

### 2.1. Pengelompokan Jenis Pelanggaran (Grouping Tata Tertib)
Daftar pelanggaran dikelompokkan ke dalam 5 kelompok tata tertib sekolah:
1. **Atribut & Kerapian**: Sabuk sekolah, dasi, topi upacara, seragam lengkap, kaos kaki, sepatu, kerapian rambut putra, makeup/perhiasan putri, kuku.
2. **Kedisiplinan & Waktu**: Terlambat masuk sekolah, membolos jam pelajaran, membolos seharian, melompat pagar/kabur dari sekolah.
3. **Kebersihan & Fasilitas**: Membuang sampah sembarangan, mengabaikan jadwal piket kelas, mencoret-coret meja/dinding, merusak fasilitas sekolah.
4. **Etika, Perilaku & KBM**: Membawa barang non-edukatif, bermain HP/game saat pelajaran, berkata kotor/kasar, tidak mengindahkan instruksi guru.
5. **Pelanggaran Berat & Hukum**: Merokok/vape di sekolah, tawuran/berkelahi, perundungan (*bullying*), mencuri, membawa senjata tajam, miras/narkoba, asusila.

---

### 2.2. Sistem Anti-Duplikasi Harian (Cegah Double Catat)
* **Pelanggaran Sifat Tunggal (`1x Per Hari`)**:
  - Contoh: *Tidak membawa sabuk, tidak memakai dasi, seragam tidak rapi, terlambat masuk*.
  - **Aturan**: Siswa yang sama tidak dapat dicatat dua kali dalam satu hari untuk pelanggaran yang sama.
  - Jika guru jam kedua mencoba mencatat kembali siswa yang sudah dicatat oleh guru piket pagi, sistem memunculkan **peringatan merah**:
    > *"⚠️ Siswa ini SUDAH TERCATAT melakukan pelanggaran ini hari ini pada pukul 07.15 oleh Guru Piket."*
  - Tombol simpan otomatis dinonaktifkan (tersedia opsi centang darurat jika ada kasus luar biasa).
* **Pelanggaran Sifat Berulang (`Bisa Berkali-kali`)**:
  - Contoh: *Membuang sampah sembarangan, bermain HP saat KBM, berkata kotor*.
  - **Aturan**: Diizinkan dicatat lebih dari satu kali jika pelanggaran memang diulangi di jam pelajaran yang berbeda.

---

### 2.3. Scanner QR Code Kartu Pelajar
* Menggunakan kamera HP / Laptop untuk membaca QR Code pada kartu tanda pelajar siswa.
* **Auto-Focus & Konfirmasi Suara Bip**: Terdengar suara audio bip saat QR code sukses terbaca.
* **Auto-Select Siswa**: NISN otomatis diekstrak, data siswa (Nama, Kelas, Riwayat Pelanggaran Hari Ini) langsung terpilih dalam waktu kurang dari 1 detik.

---

### 2.4. Pencarian Manual Fleksibel
* **Filter Kelas**: Memilih kelas (misal: `8-A`), daftar nama siswa otomatis terfilter khusus kelas tersebut.
* **Filter NISN**: Mengetik atau menempelkan nomor NISN, sistem langsung mencocokkan identitas siswa.
* Menampilkan ringkasan langsung: Total akumulasi poin siswa saat ini dan daftar pelanggaran yang sudah tercatat pada hari yang sama.

---

### 2.5. Mode Razia Pagi Cepat (Multi-Atribut Sekaligus)
* Mode khusus pemeriksaan pagi gerbang sekolah atau pemeriksaan seragam upacara bendera.
* Guru dapat mencentang beberapa pelanggaran atribut sekaligus untuk satu siswa (misal: *sabuk + dasi + kaos kaki*).
* Total poin dihitung otomatis dan item yang sudah dicatat pada hari tersebut langsung digembok (*disabled*) agar tidak terjadi duplikasi.

---

### 2.6. Akumulasi Poin & Ambang Surat Peringatan (SP)
* Sistem otomatis menjumlahkan poin pelanggaran siswa dan mengkategorikan status pembinaan:
  - 🟢 **Aman**: Poin di bawah batas SP-1 (0 - 29 poin).
  - 🟡 **SP-1 (Peringatan & Pembinaan BK)**: Ambang poin default ≥ 30 poin.
  - 🟠 **SP-2 (Peringatan Keras & Panggilan Orang Tua)**: Ambang poin default ≥ 60 poin.
  - 🔴 **SP-3 (Konferensi Kasus & Skorsing)**: Ambang poin default ≥ 90 poin.
* Ambang batas poin dapat disesuaikan dengan mudah melalui menu Pengaturan.

---

### 2.7. Buku Saku Digital Siswa
* Kartu rekam jejak kedisiplinan perorangan siswa.
* Menampilkan grafik poin, riwayat lengkap tanggal/jam kejadian, jenis pelanggaran, guru pelapor, sanksi, dan catatan konseling guru BK.

---

### 2.8. Cetak Resmi Surat Panggilan Orang Tua (Standar A4)
* Fitur satu klik **`🖨️ Cetak Surat Panggilan`** dari Buku Saku Siswa.
* Format cetak resmi standar surat dinas sekolah:
  - Kop surat resmi lengkap dengan logo pemerintah & sekolah.
  - Nomor surat otomatis.
  - Identitas lengkap siswa dan wali murid.
  - Tabel rincian pelanggaran dan akumulasi poin.
  - Tanggal panggilan dan ruangan bimbingan konseling.
  - Kolom tanda tangan resmi Kepala Sekolah dan Guru BK / Kesiswaan.

---

### 2.9. Manajemen Bimbingan Konseling (BK)
* Pelacakan status penyelesaian kasus:
  - `Pending`: Pelanggaran baru tercatat, menunggu pembinaan.
  - `Proses BK`: Sedang dalam proses pemanggilan atau konseling berkala.
  - `Selesai`: Kasus telah tuntas dibina dan siswa telah menjalankan sanksi edukatif.
* Riwayat catatan hasil pembinaan tersimpan aman di database.

---

## 📱 BAGIAN 3: FITUR MOBILE APP & PROGRESSIVE WEB APP (PWA ANDROID)

Kedua aplikasi telah dimaksimalkan untuk kenyamanan di HP Android:

| Fitur Mobile / PWA | Manfaat bagi Pengguna |
| :--- | :--- |
| **Instalasi Tanpa Play Store** | Pengguna cukup membuka link di Google Chrome HP &rarr; ketuk tombol *"Pasang Aplikasi"*. |
| **Tampilan Fullscreen Standalone** | Berjalan layaknya aplikasi native Android tanpa bilah alamat (*URL bar*) browser. |
| **Ikon Resmi di Layar Utama** | Ikon beresolusi tinggi (192px & 512px) muncul di Home Screen dan menu aplikasi HP. |
| **Bottom Navigation Bar** | Bilah menu bawah khas aplikasi mobile memudahkan navigasi dengan satu ibu jari. |
| **Offline Cache & Fast Load** | Service Worker (`sw.js`) menyimpan aset statis, membuat aplikasi terbuka seketika dan hemat kuota. |
| **Banner Pemasangan Otomatis** | Mengingatkan guru atau siswa untuk memasang aplikasi saat pertama kali berkunjung. |

---

## 🔺 BAGIAN 4: FITUR DEPLOYMENT VERCEL & DATABASE GOOGLE SHEETS

### 4.1. Hosting Modern Vercel
* **Kecepatan Tinggi & Global CDN**: Website memuat dalam hitungan milidetik dari server Vercel.
* **HTTPS Otomatis**: Keamanan SSL aktif otomatis, memenuhi syarat wajib kamera QR dan instalasi PWA di Android.
* **URL Rewriting Aman**: File `vercel.json` memastikan halaman utama dan sub-rute diarahkan dengan benar.

### 4.2. Jembatan API Vercel & Google Apps Script (Simple CORS Bridge)
* Menghilangkan kendala error CORS saat frontend Vercel berkomunikasi dengan Google Apps Script.
* Menggunakan request `POST` berheader `text/plain;charset=utf-8` sehingga tidak memicu preflight `OPTIONS` yang sering gagal di Google Apps Script.
* **Uji Respon Mandiri**: Terdapat tombol *"Uji Respon"* di menu pengaturan untuk memverifikasi koneksi database Spreadsheet dalam 1 detik.

---

## 📊 TABEL MATRIKS HAK AKSES PENGGUNA

| Modul / Fitur | Siswa | Guru Mata Pelajaran / Wali Kelas | Guru BK / Kesiswaan | Administrator |
| :--- | :---: | :---: | :---: | :---: |
| **Portal: Cek Nilai Sendiri** | ✅ | - | - | ✅ |
| **Portal: Presensi Ekskul Sendiri** | ✅ | - | - | ✅ |
| **Portal: Jurnal 7 Kebiasaan** | ✅ | Validasi | Validasi | ✅ |
| **Portal: Buku Saku Tata Tertib** | ✅ (Lihat Saja) | ✅ | ✅ | ✅ |
| **Portal: Atur Tautan Vercel / GAS** | ❌ | ❌ | ❌ | ✅ |
| **Portal: Master Database Siswa & Guru**| ❌ | ❌ | ❌ | ✅ |
| **Portal: Sinkronisasi Seluruh App** | ❌ | ❌ | ❌ | ✅ |
| **Disiplin: Scan QR Kartu Pelajar** | ❌ | ✅ | ✅ | ✅ |
| **Disiplin: Pencatatan Pelanggaran** | ❌ | ✅ | ✅ | ✅ |
| **Disiplin: Razia Pagi Multi-Atribut**| ❌ | ✅ | ✅ | ✅ |
| **Disiplin: Tindak Lanjut & Catatan BK**| ❌ | ❌ | ✅ | ✅ |
| **Disiplin: Cetak Surat Panggilan Ortu**| ❌ | Rekomendasi | ✅ | ✅ |
| **Disiplin: Pengaturan Ambang Poin SP** | ❌ | ❌ | ❌ | ✅ |

---

## 📁 LOKASI FILE & DOKUMENTASI PROYEK

* **Portal Sekolah**:
  - Halaman Utama: [f:/portal-sekolah/Index.html](file:///f:/portal-sekolah/Index.html)
  - Backend Script: [f:/portal-sekolah/Code.gs](file:///f:/portal-sekolah/Code.gs)
  - Panduan Pemasangan: [f:/portal-sekolah/PANDUAN_SETUP.md](file:///f:/portal-sekolah/PANDUAN_SETUP.md)
* **Buku Pelanggaran Siswa**:
  - Halaman Utama: [f:/aplikasi-pelanggaran-siswa/Index.html](file:///f:/aplikasi-pelanggaran-siswa/Index.html)
  - Backend Script: [f:/aplikasi-pelanggaran-siswa/Code.gs](file:///f:/aplikasi-pelanggaran-siswa/Code.gs)
  - Panduan Pemasangan: [f:/aplikasi-pelanggaran-siswa/PANDUAN_SETUP.md](file:///f:/aplikasi-pelanggaran-siswa/PANDUAN_SETUP.md)
* **Aplikasi Nilai SMP**: [f:/aplikasi-nilai-smp/Index.html](file:///f:/aplikasi-nilai-smp/Index.html)
* **Presensi Rekap Ekskul**: [f:/rekap-ekskul-appscript/index.html](file:///f:/rekap-ekskul-appscript/index.html)
