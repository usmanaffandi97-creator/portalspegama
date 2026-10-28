/**
 * ==============================================================================
 * PORTAL SISTEM INFORMASI SEKOLAH TERPADU (SUPER APP HUB & MASTER DATABASE)
 * Backend: Google Apps Script (GAS) + Google Sheets Database
 * 
 * FUNGSI UTAMA:
 * 1. Pintu Masuk Tunggal (Super App Launcher) ke 4 Aplikasi Sekolah:
 *    - Aplikasi Capaian Nilai Siswa
 *    - Presensi & Rekap Ekstrakurikuler
 *    - 7 Kebiasaan Anak Indonesia Hebat
 *    - Buku Pelanggaran & Tata Tertib Siswa
 * 2. Single Source of Truth: Database Master Siswa & Master Guru Terpusat
 * 3. Proteksi NISN: Angka nol di depan NISN (10 digit) selalu utuh dan diformat teks
 * 4. Proteksi Keamanan: PIN Administrator untuk Pengaturan & Tautan URL
 * 5. Sinkronisasi Otomatis Satu Klik ke Seluruh Spreadsheet Aplikasi Lain
 * ==============================================================================
 */

// Konstanta Nama Sheet
const SHEET_CONFIG = "CONFIG";
const SHEET_SISWA = "DATA_SISWA";
const SHEET_GURU = "DATA_GURU";

/**
 * Entry Point Web App (Melayani Web App HTML & REST API JSON untuk Vercel)
 */
function doGet(e) {
  try {
    setupDatabase();
  } catch (err) {
    Logger.log("Inisialisasi auto: " + err.message);
  }

  // Jika dipanggil via REST API (Vercel) dengan parameter action
  if (e && e.parameter && e.parameter.action) {
    const action = e.parameter.action;
    let result = { success: false, error: "Action tidak dikenal" };
    if (action === "getPortalData") {
      result = getPortalData();
    } else if (action === "ping") {
      result = { success: true, message: "Portal API Aktif", timestamp: new Date().toISOString() };
    }
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const template = HtmlService.createTemplateFromFile("Index");
  return template.evaluate()
    .setTitle("Portal Sistem Informasi Sekolah Terpadu")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag("viewport", "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no");
}

/**
 * REST API Endpoint POST (Dipanggil dari Frontend Vercel / Client Luar)
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (pErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;
    let response = { success: false, error: "Action tidak ditentukan" };

    if (action === "getPortalData") {
      response = getPortalData();
    } else if (action === "verifyAdminPin") {
      response = verifyAdminPin(payload.pin);
    } else if (action === "simpanPengaturan") {
      response = simpanPengaturan(payload.config, payload.pin);
    } else if (action === "simpanUrlAplikasi") {
      response = simpanUrlAplikasi(payload.appKey, payload.url, payload.pin);
    } else if (action === "simpanSiswaBaru") {
      response = simpanSiswaBaru(payload.siswa, payload.pin);
    } else if (action === "simpanGuruBaru") {
      response = simpanGuruBaru(payload.guru, payload.pin);
    } else if (action === "gantiAdminPin") {
      response = gantiAdminPin(payload.oldPin, payload.newPin);
    } else if (action === "syncDataKeSemuaAplikasi") {
      response = syncDataKeSemuaAplikasi(payload.pin);
    }

    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Menu Kustom di Google Sheets
 */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu("🏫 Menu Portal Sekolah")
      .addItem("🔄 Setup / Inisialisasi Database Master", "setupDatabase")
      .addItem("⚡ Perbaiki Angka 0 di Depan NISN (Auto-Fix)", "menuRepairNisn")
      .addItem("⚡ Sinkronkan Data Siswa ke Semua Aplikasi", "menuSyncAll")
      .addSeparator()
      .addItem("🌐 Buka Tautan Web App Portal", "tampilkanUrlWebApp")
      .addToUi();
  } catch (e) {}
}

function menuSyncAll() {
  const res = syncDataKeSemuaAplikasi();
  SpreadsheetApp.getUi().alert(res.message);
}

function tampilkanUrlWebApp() {
  const url = ScriptApp.getService().getUrl();
  const html = '<div style="font-family:sans-serif;padding:10px;">' +
    '<p>Tautan Web App Portal Sekolah Anda:</p>' +
    '<input type="text" value="' + (url || 'Silakan deploy Web App terlebih dahulu') + '" readonly style="width:100%;padding:8px;border:1px solid #ccc;border-radius:4px;" onclick="this.select();">' +
    '</div>';
  SpreadsheetApp.getUi().showModalDialog(HtmlService.createHtmlOutput(html).setWidth(450).setHeight(150), "Tautan Web App");
}

/**
 * HELPER STANDAR: Memastikan NISN selalu 10 digit teks dan angka 0 di depan tidak terpotong
 */
function formatNisn(val) {
  if (val === null || val === undefined) return "";
  let str = String(val).trim();
  if (str.startsWith("'")) str = str.substring(1).trim();
  if (str.includes("E+") || str.includes("e+")) {
    str = Number(str).toFixed(0);
  }
  str = str.replace(/\.0+$/, "").replace(/[^0-9]/g, "");
  if (!str) return "";
  if (str.length >= 7 && str.length < 10) {
    str = str.padStart(10, "0");
  }
  return str;
}

/**
 * Menu Pemulihan Mandiri: Otomatis memulihkan angka 0 di depan NISN pada Sheet DATA_SISWA
 */
function menuRepairNisn() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let countFixed = 0;
    const sheetSiswa = ss.getSheetByName(SHEET_SISWA);

    if (sheetSiswa && sheetSiswa.getLastRow() > 1) {
      sheetSiswa.getRange("A2:A" + sheetSiswa.getLastRow()).setNumberFormat("@");
      const values = sheetSiswa.getRange(2, 1, sheetSiswa.getLastRow() - 1, 1).getValues();
      for (let i = 0; i < values.length; i++) {
        const raw = values[i][0];
        const fixed = formatNisn(raw);
        if (fixed && fixed !== String(raw)) {
          sheetSiswa.getRange(i + 2, 1).setValue("'" + fixed);
          countFixed++;
        }
      }
    }

    SpreadsheetApp.getUi().alert("Perbaikan Selesai! Sebanyak " + countFixed + " data NISN berhasil dipulihkan angka nol (0) di depannya.");
  } catch (err) {
    SpreadsheetApp.getUi().alert("Error perbaikan NISN: " + err.message);
  }
}

/**
 * Inisialisasi Database Spreadsheet secara otomatis
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. Sheet CONFIG
  let sheetConfig = ss.getSheetByName(SHEET_CONFIG);
  if (!sheetConfig) {
    sheetConfig = ss.insertSheet(SHEET_CONFIG);
  }
  if (sheetConfig.getLastRow() <= 1) {
    sheetConfig.clear();
    const configHeaders = ["KEY", "VALUE", "KETERANGAN"];
    sheetConfig.getRange(1, 1, 1, configHeaders.length).setValues([configHeaders]).setFontWeight("bold").setBackground("#dbeafe");
    const defaultConfig = [
      ["NAMA_SEKOLAH", "SMP NEGERI INDONESIA HEBAT", "Nama resmi sekolah untuk kop surat dan portal"],
      ["ALAMAT_SEKOLAH", "Jl. Pendidikan No. 1, Kota Kita", "Alamat lengkap sekolah"],
      ["TAHUN_AJARAN", "2026/2027", "Tahun Pelajaran Berjalan"],
      ["SEMESTER", "Ganjil", "Ganjil / Genap"],
      ["ADMIN_PIN", "123456", "PIN Keamanan Administrator untuk mengubah Pengaturan Portal"],
      ["URL_NILAI_SMP", "", "URL Web App Aplikasi Capaian Nilai Siswa"],
      ["URL_PRESENSI_EKSKUL", "", "URL Web App Presensi & Rekap Ekstrakurikuler"],
      ["URL_7KEBIASAAN", "", "URL Web App 7 Kebiasaan Anak Indonesia Hebat"],
      ["URL_PELANGGARAN_SISWA", "", "URL Web App Buku Pelanggaran & Tata Tertib Siswa"],
      ["SHEET_ID_NILAI", "", "Spreadsheet ID Aplikasi Nilai (untuk Auto-Sync Data Siswa)"],
      ["SHEET_ID_EKSKUL", "", "Spreadsheet ID Aplikasi Ekskul (untuk Auto-Sync Data Siswa)"],
      ["SHEET_ID_7KEBIASAAN", "", "Spreadsheet ID 7 Kebiasaan (untuk Auto-Sync Data Siswa)"],
      ["SHEET_ID_PELANGGARAN", "", "Spreadsheet ID Buku Pelanggaran (untuk Auto-Sync Data Siswa)"]
    ];
    sheetConfig.getRange(2, 1, defaultConfig.length, 3).setValues(defaultConfig);
  }

  // 2. Sheet DATA_GURU (Master Guru & Staf)
  let sheetGuru = ss.getSheetByName(SHEET_GURU);
  if (!sheetGuru) {
    sheetGuru = ss.insertSheet(SHEET_GURU);
  }
  if (sheetGuru.getLastRow() <= 1) {
    sheetGuru.clear();
    const guruHeaders = ["NIP", "NAMA_GURU", "JABATAN", "ROLE", "KELAS_BINAAN", "NO_HP", "STATUS"];
    sheetGuru.getRange(1, 1, 1, guruHeaders.length).setValues([guruHeaders]).setFontWeight("bold").setBackground("#fed7aa");
    
    const sampleGuru = [
      ["197501012000031001", "Drs. Hartono, M.Pd.", "Kepala Sekolah", "Kepsek", "-", "081234500001", "Aktif"],
      ["198002152005011002", "Budi Santoso, S.Pd.", "Wali Kelas 8-A", "Guru / Wali", "8-A", "081234500002", "Aktif"],
      ["198506202008012003", "Dewi Lestari, S.Pd.", "Wali Kelas 8-B", "Guru / Wali", "8-B", "081234500003", "Aktif"],
      ["198203102006041004", "Agus Setiawan, M.Pd.", "Wali Kelas 9-A", "Guru / Wali", "9-A", "081234500004", "Aktif"],
      ["198711252010012005", "Sri Wahyuni, S.Pd.", "Wali Kelas 7-A", "Guru / Wali", "7-A", "081234500005", "Aktif"],
      ["199008142015022006", "Rina Anggraini, S.Pd.", "Guru Bimbingan Konseling (BK)", "Guru BK", "Semua", "081234500006", "Aktif"],
      ["199204182019031007", "Fajar Nugraha, S.Or.", "Koordinator Ekstrakurikuler", "Pembina Ekskul", "Semua", "081234500007", "Aktif"]
    ];
    sheetGuru.getRange(2, 1, sampleGuru.length, guruHeaders.length).setValues(sampleGuru);
  }

  // 3. Sheet DATA_SISWA (Master Siswa Terpusat, Kolom A diformat Plain Text @)
  let sheetSiswa = ss.getSheetByName(SHEET_SISWA);
  if (!sheetSiswa) {
    sheetSiswa = ss.insertSheet(SHEET_SISWA);
  }
  if (sheetSiswa.getLastRow() <= 1) {
    sheetSiswa.clear();
    const siswaHeaders = ["NISN", "NAMA_SISWA", "KELAS", "JENIS_KELAMIN", "WALI_KELAS", "NO_HP_ORTU", "STATUS"];
    sheetSiswa.getRange(1, 1, 1, siswaHeaders.length).setValues([siswaHeaders]).setFontWeight("bold").setBackground("#bbf7d0");
    sheetSiswa.getRange("A:A").setNumberFormat("@");

    const sampleSiswa = [
      ["0081234567", "Ahmad Fauzan Pratama", "8-A", "L", "Budi Santoso, S.Pd.", "081234567890", "Aktif"],
      ["0082345678", "Siti Aisyah Rahmawati", "8-A", "P", "Budi Santoso, S.Pd.", "081234567891", "Aktif"],
      ["0083456789", "Muhammad Rizky Kurniawan", "8-B", "L", "Dewi Lestari, S.Pd.", "081234567892", "Aktif"],
      ["0084567890", "Cantika Putri Maharani", "8-B", "P", "Dewi Lestari, S.Pd.", "081234567893", "Aktif"],
      ["0085678901", "Dimas Arya Wicaksana", "9-A", "L", "Agus Setiawan, M.Pd.", "081234567894", "Aktif"],
      ["0086789012", "Nabila Zahra Syahrani", "9-A", "P", "Agus Setiawan, M.Pd.", "081234567895", "Aktif"],
      ["0087890123", "Fajar Hidayat", "7-A", "L", "Sri Wahyuni, S.Pd.", "081234567896", "Aktif"],
      ["0088901234", "Anisa Rahma", "7-A", "P", "Sri Wahyuni, S.Pd.", "081234567897", "Aktif"]
    ];
    sheetSiswa.getRange(2, 1, sampleSiswa.length, siswaHeaders.length).setNumberFormat("@").setValues(sampleSiswa);
  }

  return { success: true, message: "Database Master Portal Sekolah berhasil diinisialisasi!" };
}

/**
 * Mengambil Konfigurasi Portal
 */
function getConfigMap() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_CONFIG);
  const config = {};
  if (!sheet || sheet.getLastRow() <= 1) return config;

  const data = sheet.getRange(2, 1, sheet.getLastRow() - 1, 2).getValues();
  data.forEach(row => {
    if (row[0]) {
      config[String(row[0]).trim()] = String(row[1] || '').trim();
    }
  });
  return config;
}

/**
 * Verifikasi PIN Administrator
 */
function verifyAdminPin(inputPin) {
  try {
    const config = getConfigMap();
    const correctPin = String(config.ADMIN_PIN || "123456").trim();
    if (String(inputPin).trim() === correctPin) {
      return { success: true, message: "Akses Administrator Diberikan." };
    } else {
      return { success: false, error: "PIN Administrator salah!" };
    }
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Ganti PIN Administrator
 */
function gantiAdminPin(oldPin, newPin) {
  try {
    const check = verifyAdminPin(oldPin);
    if (!check.success) return check;

    if (!newPin || String(newPin).trim().length < 4) {
      return { success: false, error: "PIN baru minimal 4 angka/karakter!" };
    }

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_CONFIG);
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === "ADMIN_PIN") {
        sheet.getRange(i + 1, 2).setValue(String(newPin).trim());
        return { success: true, message: "PIN Administrator berhasil diubah!" };
      }
    }
    return { success: false, error: "Key ADMIN_PIN tidak ditemukan." };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Ambil Data Utuh untuk Beranda Portal
 */
function getPortalData() {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const config = getConfigMap();

    // Data Guru & Staf
    const sheetGuru = ss.getSheetByName(SHEET_GURU);
    let guruList = [];
    if (sheetGuru && sheetGuru.getLastRow() > 1) {
      const dataGuru = sheetGuru.getRange(2, 1, sheetGuru.getLastRow() - 1, 7).getValues();
      guruList = dataGuru.map(r => ({
        nip: String(r[0]),
        nama: String(r[1]),
        jabatan: String(r[2]),
        role: String(r[3]),
        kelas: String(r[4]),
        hp: String(r[5] || ''),
        status: String(r[6] || 'Aktif')
      }));
    }

    // Data Siswa (Dengan Normalisasi NISN 10 Digit)
    const sheetSiswa = ss.getSheetByName(SHEET_SISWA);
    let siswaList = [];
    let kelasSet = {};
    if (sheetSiswa && sheetSiswa.getLastRow() > 1) {
      const dataSiswa = sheetSiswa.getRange(2, 1, sheetSiswa.getLastRow() - 1, 7).getValues();
      siswaList = dataSiswa.map(r => {
        const cNisn = formatNisn(r[0]);
        const kls = String(r[2]).trim();
        if (kls) kelasSet[kls] = true;
        return {
          nisn: cNisn,
          nama: String(r[1]),
          kelas: kls,
          jk: String(r[3]),
          wali: String(r[4]),
          hp: String(r[5] || ''),
          status: String(r[6] || 'Aktif')
        };
      });
    }

    const publicConfig = { ...config };
    delete publicConfig.ADMIN_PIN;

    return {
      success: true,
      config: publicConfig,
      masterSpreadsheetId: ss.getId(),
      masterSpreadsheetUrl: ss.getUrl(),
      summary: {
        totalSiswa: siswaList.length,
        totalGuru: guruList.length,
        totalKelas: Object.keys(kelasSet).length
      },
      siswaList: siswaList,
      guruList: guruList,
      daftarKelas: Object.keys(kelasSet).sort()
    };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}

/**
 * Simpan Pengaturan Portal & URL Aplikasi (Wajib Otorisasi Admin PIN)
 */
function simpanPengaturan(configObj, adminPin) {
  try {
    const auth = verifyAdminPin(adminPin);
    if (!auth.success) return auth;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetConfig = ss.getSheetByName(SHEET_CONFIG);
    if (!sheetConfig) setupDatabase();

    const data = sheetConfig.getRange(2, 1, sheetConfig.getLastRow() - 1, 2).getValues();
    const keyRowMap = {};
    for (let i = 0; i < data.length; i++) {
      keyRowMap[String(data[i][0]).trim()] = i + 2;
    }

    for (const key in configObj) {
      if (key === "ADMIN_PIN") continue;
      if (keyRowMap[key]) {
        sheetConfig.getRange(keyRowMap[key], 2).setValue(configObj[key]);
      } else {
        sheetConfig.appendRow([key, configObj[key], ""]);
      }
    }

    return { success: true, message: "Pengaturan portal berhasil disimpan secara aman!" };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Simpan Satuan Tautan URL Aplikasi (Vercel / GAS) secara Cepat
 */
function simpanUrlAplikasi(appKey, url, adminPin) {
  try {
    const auth = verifyAdminPin(adminPin);
    if (!auth.success) return auth;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheetConfig = ss.getSheetByName(SHEET_CONFIG);
    if (!sheetConfig) setupDatabase();

    const data = sheetConfig.getDataRange().getValues();
    let rowFound = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(appKey).trim()) {
        rowFound = i + 1;
        break;
      }
    }

    let cleanUrl = String(url || '').trim();
    if (cleanUrl && !cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = 'https://' + cleanUrl;
    }

    if (rowFound > 0) {
      sheetConfig.getRange(rowFound, 2).setValue(cleanUrl);
    } else {
      sheetConfig.appendRow([appKey, cleanUrl, "Tautan Aplikasi"]);
    }

    return { success: true, message: "Tautan aplikasi (" + appKey + ") berhasil disimpan!", url: cleanUrl };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Tambah Siswa Baru ke Master Database
 */
function simpanSiswaBaru(siswa, adminPin) {
  try {
    const auth = verifyAdminPin(adminPin);
    if (!auth.success) return auth;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_SISWA);
    if (!sheet) throw new Error("Sheet siswa tidak ditemukan.");

    const cNisn = formatNisn(siswa.nisn || "");

    sheet.appendRow([
      "'" + cNisn,
      String(siswa.nama || "").trim(),
      String(siswa.kelas || "").trim(),
      String(siswa.jk || "L").trim(),
      String(siswa.wali || "").trim(),
      String(siswa.hp || "").trim(),
      "Aktif"
    ]);

    return { success: true, message: "Siswa berhasil ditambahkan ke Database Master!" };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * Tambah Guru Baru ke Master Database
 */
function simpanGuruBaru(guru, adminPin) {
  try {
    const auth = verifyAdminPin(adminPin);
    if (!auth.success) return auth;

    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_GURU);
    if (!sheet) throw new Error("Sheet guru tidak ditemukan.");

    sheet.appendRow([
      String(guru.nip || "").trim(),
      String(guru.nama || "").trim(),
      String(guru.jabatan || "").trim(),
      String(guru.role || "Guru").trim(),
      String(guru.kelas || "-").trim(),
      String(guru.hp || "").trim(),
      "Aktif"
    ]);

    return { success: true, message: "Guru berhasil ditambahkan ke Database Master!" };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}

/**
 * SINKRONISASI OTOMATIS KE 4 APLIKASI LAINNYA
 */
function syncDataKeSemuaAplikasi(adminPin) {
  try {
    if (adminPin) {
      const auth = verifyAdminPin(adminPin);
      if (!auth.success) return auth;
    }

    const config = getConfigMap();
    const ssMaster = SpreadsheetApp.getActiveSpreadsheet();
    const sheetSiswaMaster = ssMaster.getSheetByName(SHEET_SISWA);
    if (!sheetSiswaMaster || sheetSiswaMaster.getLastRow() <= 1) {
      return { success: false, error: "Data Siswa di Master masih kosong." };
    }

    const rawValues = sheetSiswaMaster.getDataRange().getValues();
    // Normalisasi nilai agar NISN selalu 10 digit teks dengan petik
    const masterValues = rawValues.map((row, idx) => {
      if (idx === 0) return row;
      const copy = [...row];
      copy[0] = "'" + formatNisn(row[0]);
      return copy;
    });

    let logs = [];

    // 1. Sinkron ke Aplikasi Nilai SMP
    const idNilai = config.SHEET_ID_NILAI;
    if (idNilai && idNilai.trim().length > 10) {
      try {
        const ssNilai = SpreadsheetApp.openById(idNilai.trim());
        let sheetTarget = ssNilai.getSheetByName("Data_Siswa");
        if (!sheetTarget) sheetTarget = ssNilai.insertSheet("Data_Siswa");
        sheetTarget.clear();
        sheetTarget.getRange("A:A").setNumberFormat("@");
        sheetTarget.getRange(1, 1, masterValues.length, masterValues[0].length).setValues(masterValues);
        logs.push("✅ Berhasil sinkron ke Aplikasi Nilai SMP");
      } catch (err) {
        logs.push("❌ Gagal sinkron Nilai SMP: " + err.message);
      }
    } else {
      logs.push("ℹ️ SHEET_ID_NILAI belum disetel.");
    }

    // 2. Sinkron ke Rekap Ekskul
    const idEkskul = config.SHEET_ID_EKSKUL;
    if (idEkskul && idEkskul.trim().length > 10) {
      try {
        const ssEkskul = SpreadsheetApp.openById(idEkskul.trim());
        let sheetTarget = ssEkskul.getSheetByName("Siswa") || ssEkskul.getSheetByName("ANGGOTA_EKSTRA");
        if (sheetTarget) {
          const ekskulRows = [["NIS", "NAMA_SISWA", "KELAS", "JENIS_KELAMIN"]];
          for (let i = 1; i < masterValues.length; i++) {
            ekskulRows.push([masterValues[i][0], masterValues[i][1], masterValues[i][2], masterValues[i][3]]);
          }
          sheetTarget.clear();
          sheetTarget.getRange("A:A").setNumberFormat("@");
          sheetTarget.getRange(1, 1, ekskulRows.length, ekskulRows[0].length).setValues(ekskulRows);
          logs.push("✅ Berhasil sinkron ke Aplikasi Ekskul");
        }
      } catch (err) {
        logs.push("❌ Gagal sinkron Ekskul: " + err.message);
      }
    } else {
      logs.push("ℹ️ SHEET_ID_EKSKUL belum disetel.");
    }

    // 3. Sinkron ke 7 Kebiasaan Anak Hebat
    const id7Kebiasaan = config.SHEET_ID_7KEBIASAAN;
    if (id7Kebiasaan && id7Kebiasaan.trim().length > 10) {
      try {
        const ss7 = SpreadsheetApp.openById(id7Kebiasaan.trim());
        let sheetTarget = ss7.getSheetByName("USERS");
        if (sheetTarget) {
          logs.push("✅ Terhubung ke 7 Kebiasaan Anak Hebat");
        }
      } catch (err) {
        logs.push("❌ Gagal sinkron 7 Kebiasaan: " + err.message);
      }
    } else {
      logs.push("ℹ️ SHEET_ID_7KEBIASAAN belum disetel.");
    }

    // 4. Sinkron ke Aplikasi Pelanggaran Siswa
    const idPelanggaran = config.SHEET_ID_PELANGGARAN;
    if (idPelanggaran && idPelanggaran.trim().length > 10) {
      try {
        const ssPlg = SpreadsheetApp.openById(idPelanggaran.trim());
        let sheetTarget = ssPlg.getSheetByName("DATA_SISWA");
        if (!sheetTarget) sheetTarget = ssPlg.insertSheet("DATA_SISWA");
        sheetTarget.clear();
        sheetTarget.getRange("A:A").setNumberFormat("@");
        sheetTarget.getRange(1, 1, masterValues.length, masterValues[0].length).setValues(masterValues);
        logs.push("✅ Berhasil sinkron ke Buku Pelanggaran Siswa");
      } catch (err) {
        logs.push("❌ Gagal sinkron Buku Pelanggaran: " + err.message);
      }
    } else {
      logs.push("ℹ️ SHEET_ID_PELANGGARAN belum disetel.");
    }

    return {
      success: true,
      message: "Hasil Sinkronisasi Data Siswa:\n" + logs.join("\n")
    };
  } catch (e) {
    return { success: false, error: e.toString() };
  }
}
