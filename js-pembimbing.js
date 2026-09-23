// =============================================
// MODUL PEMBIMBING — Backend FINAL
// File: pembimbing.gs
// ✅ FIX: handle Date object untuk kolom Tanggal
// =============================================

var SHEET_ABSEN_PKL_PEMB = 'Absen_PKL';
var SHEET_JURNAL_PKL_PEMB = 'Jurnal_PKL';
var GRACE_PERIODE_PKL_HARI = 7;

// ⭐ Helper: Normalisasi tanggal → "yyyy-MM-dd"
function toISODate(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'Asia/Jakarta', 'yyyy-MM-dd');
  }
  var s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  var d = new Date(s);
  if (!isNaN(d.getTime())) {
    return Utilities.formatDate(d, 'Asia/Jakarta', 'yyyy-MM-dd');
  }
  return s;
}

// ⭐ Helper: Normalisasi waktu → "HH:mm:ss"
function toHHmmss(val) {
  if (!val) return '';
  if (val instanceof Date) {
    return Utilities.formatDate(val, 'Asia/Jakarta', 'HH:mm:ss');
  }
  var s = String(val).trim();
  if (!s) return '';
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(s)) return s.length === 5 ? s + ':00' : s;
  var d = new Date(s);
  if (!isNaN(d.getTime())) {
    return Utilities.formatDate(d, 'Asia/Jakarta', 'HH:mm:ss');
  }
  return s;
}

// ═══════════════════════════════════════════════
// DUDI — Kode & PIN
// ═══════════════════════════════════════════════
function getDUDIByKodeAkses(kode) {
  if (!kode) throw new Error('Kode akses kosong.');
  var list = getAllDUDI();
  for (var i = 0; i < list.length; i++) {
    if (String(list[i].Kode_Akses || '').trim().toUpperCase() === String(kode).trim().toUpperCase()) {
      return list[i];
    }
  }
  throw new Error('Kode akses tidak valid.');
}

function generatePin6Digit() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// ═══════════════════════════════════════════════
// TOKEN — Stateless SHA256
// ═══════════════════════════════════════════════
function getOrCreateScriptSecret() {
  var props = PropertiesService.getScriptProperties();
  var secret = props.getProperty('PEMBIMBING_SECRET');
  if (!secret) {
    secret = Utilities.getUuid() + '-' + Utilities.getUuid();
    props.setProperty('PEMBIMBING_SECRET', secret);
  }
  return secret;
}

function generatePembimbingToken(kode, pin) {
  var raw = String(kode).toUpperCase() + '|' + String(pin) + '|' + getOrCreateScriptSecret();
  var bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, raw);
  return bytes.map(function(b) {
    return ((b < 0 ? b + 256 : b).toString(16)).padStart(2, '0');
  }).join('');
}

function verifyPembimbingToken(kode, token) {
  if (!kode || !token) return { valid: false, reason: 'Token tidak lengkap' };
  try {
    var dudi = getDUDIByKodeAkses(kode);
    var pin = String(dudi.PIN_Pembimbing || '').trim();
    if (!pin) return { valid: false, reason: 'PIN belum diatur' };

    var expected = generatePembimbingToken(dudi.Kode_Akses, pin);
    if (expected !== token) return { valid: false, reason: 'PIN sudah di-reset / token kadaluarsa' };

    return { valid: true, dudi: dudi };
  } catch (e) {
    return { valid: false, reason: e.message };
  }
}

// ═══════════════════════════════════════════════
// LOGIN PEMBIMBING DUDI
// ═══════════════════════════════════════════════
function loginPembimbing(kode, pin) {
  if (!kode || !pin) throw new Error('Kode akses & PIN wajib diisi.');
  var dudi = getDUDIByKodeAkses(kode);
  var pinTersimpan = String(dudi.PIN_Pembimbing || '').trim();
  if (!pinTersimpan) throw new Error('PIN belum diatur. Hubungi admin.');
  if (String(pin).trim() !== pinTersimpan) throw new Error('PIN salah.');

  return {
    success: true,
    token: generatePembimbingToken(dudi.Kode_Akses, pinTersimpan),
    dudi: {
      ID_DUDI: dudi.ID_DUDI,
      Nama_DUDI: dudi.Nama_DUDI,
      Nama_Pembimbing: dudi.Nama_Pembimbing || '',
      Kode_Akses: dudi.Kode_Akses
    }
  };
}

function resetPinPembimbing(kodeAkses) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Data_DUDI');
  if (!sheet) throw new Error('Sheet Data_DUDI tidak ada.');
  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idxPin = headers.indexOf('PIN_Pembimbing');
  var idxKode = headers.indexOf('Kode_Akses');
  if (idxPin === -1) throw new Error('Kolom PIN_Pembimbing belum ada. Jalankan migrasi.');

  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idxKode]).trim().toUpperCase() === String(kodeAkses).trim().toUpperCase()) {
      var pinBaru = generatePin6Digit();
      sheet.getRange(i + 1, idxPin + 1).setValue(pinBaru);
      return { success: true, pinBaru: pinBaru, message: 'PIN baru: ' + pinBaru };
    }
  }
  throw new Error('DUDI tidak ditemukan.');
}

// ═══════════════════════════════════════════════
// DASHBOARD PEMBIMBING DUDI
// ═══════════════════════════════════════════════
function getDashboardPembimbingSecure(kode, token) {
  var v = verifyPembimbingToken(kode, token);
  if (!v.valid) throw new Error('Sesi tidak valid: ' + v.reason);
  return getDashboardPembimbing(kode);
}

function getDashboardPembimbing(kode) {
  var dudi = getDUDIByKodeAkses(kode);

  var semuaPKL = getAllPKL();
  var siswaDUDI = semuaPKL.filter(function(p) {
    return String(p.ID_DUDI).trim() === String(dudi.ID_DUDI).trim();
  });

  var nisSet = {};
  siswaDUDI.forEach(function(p) { nisSet[String(p.NIS).trim()] = true; });

  var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');

  // ── Absen ──
  var absenSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ABSEN_PKL_PEMB);
  var absenPending = [];
  var absenApprovedHariIni = 0;

  if (absenSheet) {
    var aData = absenSheet.getDataRange().getValues();
    for (var i = 1; i < aData.length; i++) {
      var r = aData[i];
      var nis = String(r[0]).trim();
      if (!nisSet[nis]) continue;

      var tgl = toISODate(r[1]);                          // ⭐ FIX
      var approval = String(r[14] || 'Pending').trim();

      if (tgl === today && approval === 'Approved') absenApprovedHariIni++;
      if (approval === 'Pending') absenPending.push(buildAbsenObj(r, siswaDUDI));
    }
  }
  absenPending.sort(function(a, b) { return b.Tanggal.localeCompare(a.Tanggal); });

  // ── Jurnal ──
  var jSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_JURNAL_PKL_PEMB);
  var jurnalPending = [];
  if (jSheet) {
    var jData = jSheet.getDataRange().getValues();
    for (var j = 1; j < jData.length; j++) {
      var jr = jData[j];
      if (!nisSet[String(jr[2]).trim()]) continue;
      var appDUDI = String(jr[6] || 'Pending').trim();
      if (appDUDI !== 'Pending') continue;
      jurnalPending.push(buildJurnalObj(jr, siswaDUDI));
    }
  }
  jurnalPending.sort(function(a, b) { return b.Tanggal.localeCompare(a.Tanggal); });

  return {
    dudi: {
      ID_DUDI: dudi.ID_DUDI,
      Nama_DUDI: dudi.Nama_DUDI,
      Alamat: dudi.Alamat || '',
      Nama_Pembimbing: dudi.Nama_Pembimbing || '',
      WA_Pembimbing: dudi.WA_Pembimbing || '',
      Radius_Meter: dudi.Radius_Meter || 20
    },
    siswa: siswaDUDI,
    totalSiswa: siswaDUDI.length,
    absenPending: absenPending,
    jurnalPending: jurnalPending,
    stats: {
      totalAbsenPending: absenPending.length,
      totalJurnalPending: jurnalPending.length,
      absenApprovedHariIni: absenApprovedHariIni
    }
  };
}

function buildAbsenObj(r, siswaList) {
  var nis = String(r[0]).trim();
  var s = siswaList.find(function(x) { return String(x.NIS).trim() === nis; }) || {};
  return {
    NIS: nis,
    Nama_Siswa: s.Nama_Siswa || '(?)',
    Nama_Kelas: s.Nama_Kelas || '-',
    Tanggal: toISODate(r[1]),                              // ⭐ FIX
    Jam_Masuk: toHHmmss(r[3]),                             // ⭐ FIX
    Jam_Pulang: toHHmmss(r[4]),                            // ⭐ FIX
    Selfie_Masuk: r[5] || '',
    Selfie_Pulang: r[6] || '',
    Jarak_Masuk: r[9] || '',
    Status: String(r[13] || 'Hadir').trim(),
    Status_Approval: String(r[14] || 'Pending').trim(),
    Keterangan: r[15] || '',
    Alasan_Tanpa_Selfie: r[19] || ''
  };
}

function buildJurnalObj(r, siswaList) {
  var nis = String(r[2]).trim();
  var s = siswaList.find(function(x) { return String(x.NIS).trim() === nis; }) || {};
  return {
    ID_Jurnal: r[0],
    Tanggal: toISODate(r[1]),                              // ⭐ FIX
    NIS: nis,
    Nama_Siswa: s.Nama_Siswa || '(?)',
    Nama_Kelas: s.Nama_Kelas || '-',
    Kegiatan: r[4],
    Foto_Url: r[5] || '',
    Approval_DUDI: String(r[6] || 'Pending').trim(),
    Approval_Sekolah: String(r[9] || 'Pending').trim(),
    Status_Final: String(r[12] || 'Pending').trim()
  };
}

// ═══════════════════════════════════════════════
// APPROVE / REJECT ABSEN (oleh DUDI)
// ═══════════════════════════════════════════════
function approveAbsenPembimbingSecure(kode, token, nis, tanggal) {
  var v = verifyPembimbingToken(kode, token);
  if (!v.valid) throw new Error('Sesi tidak valid: ' + v.reason);
  return _approveAbsenPembimbing(v.dudi, nis, tanggal);
}

function _approveAbsenPembimbing(dudi, nis, tanggal) {
  validasiSiswaMilikDUDI(nis, dudi.ID_DUDI);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ABSEN_PKL_PEMB);
  if (!sheet) throw new Error('Sheet Absen_PKL tidak ada.');

  var values = sheet.getDataRange().getValues();
  var nisClean = String(nis).trim();
  var tglClean = toISODate(tanggal);                      // ⭐ FIX
  var now = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');

  for (var i = 1; i < values.length; i++) {
    var rowTgl = toISODate(values[i][1]);                  // ⭐ FIX
    if (String(values[i][0]).trim() === nisClean && rowTgl === tglClean) {
      sheet.getRange(i + 1, 15).setValue('Approved');
      sheet.getRange(i + 1, 17).setValue(dudi.Nama_Pembimbing || 'Pembimbing');
      sheet.getRange(i + 1, 18).setValue(now);
      return { success: true, message: 'Absen ' + nisClean + ' disetujui.' };
    }
  }
  throw new Error('Data absen tidak ditemukan. NIS=' + nisClean + ' Tgl=' + tglClean);
}

function rejectAbsenPembimbingSecure(kode, token, nis, tanggal, alasan) {
  var v = verifyPembimbingToken(kode, token);
  if (!v.valid) throw new Error('Sesi tidak valid: ' + v.reason);
  return _rejectAbsenPembimbing(v.dudi, nis, tanggal, alasan);
}

function _rejectAbsenPembimbing(dudi, nis, tanggal, alasan) {
  validasiSiswaMilikDUDI(nis, dudi.ID_DUDI);
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_ABSEN_PKL_PEMB);
  if (!sheet) throw new Error('Sheet Absen_PKL tidak ada.');

  var values = sheet.getDataRange().getValues();
  var nisClean = String(nis).trim();
  var tglClean = toISODate(tanggal);
  var now = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');

  for (var i = 1; i < values.length; i++) {
    var rowTgl = toISODate(values[i][1]);
    if (String(values[i][0]).trim() === nisClean && rowTgl === tglClean) {
      var ketBaru = (values[i][15] || '') + ' | DITOLAK: ' + (alasan || '-');
      sheet.getRange(i + 1, 15).setValue('Rejected');
      sheet.getRange(i + 1, 16).setValue(ketBaru);
      sheet.getRange(i + 1, 17).setValue(dudi.Nama_Pembimbing || 'Pembimbing');
      sheet.getRange(i + 1, 18).setValue(now);
      return { success: true, message: 'Absen ' + nisClean + ' ditolak.' };
    }
  }
  throw new Error('Data absen tidak ditemukan. NIS=' + nisClean + ' Tgl=' + tglClean);
}

function validasiSiswaMilikDUDI(nis, idDudi) {
  var pklInfo = getPKLByNIS(nis);
  if (!pklInfo) throw new Error('Siswa ' + nis + ' tidak terdaftar PKL aktif.');
  if (String(pklInfo.ID_DUDI).trim() !== String(idDudi).trim()) {
    throw new Error('Siswa bukan bimbingan DUDI ini.');
  }
}

// ═══════════════════════════════════════════════
// APPROVE / REJECT JURNAL (oleh DUDI)
// ═══════════════════════════════════════════════
function approveJurnalDUDISecure(kode, token, idJurnal, catatan) {
  var v = verifyPembimbingToken(kode, token);
  if (!v.valid) throw new Error('Sesi tidak valid: ' + v.reason);

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_JURNAL_PKL_PEMB);
  if (!sheet) throw new Error('Sheet Jurnal_PKL tidak ada.');

  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(idJurnal).trim()) {
      validasiSiswaMilikDUDI(values[i][2], v.dudi.ID_DUDI);
      var now = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
      sheet.getRange(i + 1, 7).setValue('Approved');
      sheet.getRange(i + 1, 8).setValue(catatan || '');
      sheet.getRange(i + 1, 9).setValue(now);
      updateStatusFinalJurnal(sheet, i + 1);
      return { success: true, message: 'Jurnal disetujui (DUDI).' };
    }
  }
  throw new Error('Jurnal tidak ditemukan.');
}

function rejectJurnalDUDISecure(kode, token, idJurnal, catatan) {
  var v = verifyPembimbingToken(kode, token);
  if (!v.valid) throw new Error('Sesi tidak valid: ' + v.reason);

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_JURNAL_PKL_PEMB);
  if (!sheet) throw new Error('Sheet Jurnal_PKL tidak ada.');

  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(idJurnal).trim()) {
      validasiSiswaMilikDUDI(values[i][2], v.dudi.ID_DUDI);
      var now = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
      sheet.getRange(i + 1, 7).setValue('Rejected');
      sheet.getRange(i + 1, 8).setValue(catatan || 'Tidak valid');
      sheet.getRange(i + 1, 9).setValue(now);
      updateStatusFinalJurnal(sheet, i + 1);
      return { success: true, message: 'Jurnal ditolak (DUDI).' };
    }
  }
  throw new Error('Jurnal tidak ditemukan.');
}

// ═══════════════════════════════════════════════
// PEMBIMBING SEKOLAH (Guru via NBM)
// ═══════════════════════════════════════════════
function getSiswaBinaanGuru(nbm) {
  if (!nbm) return [];
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Data_PKL');
  if (!sheet) return [];

  var values = sheet.getDataRange().getValues();
  var headers = values[0];
  var idxNBM = headers.indexOf('NBM_Pembimbing_Sekolah');
  if (idxNBM === -1) return [];

  var nbmClean = String(nbm).trim();
  var allPKL = getAllPKL();
  var pklMap = {};
  allPKL.forEach(function(p) { pklMap[String(p.NIS).trim()] = p; });

  var result = [];
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][idxNBM]).trim() !== nbmClean) continue;
    var nis = String(values[i][0]).trim();
    if (pklMap[nis]) result.push(pklMap[nis]);
  }
  return result;
}

function getJurnalPendingGuru(nbm) {
  var binaan = getSiswaBinaanGuru(nbm);
  if (binaan.length === 0) return [];

  var nisSet = {};
  binaan.forEach(function(s) { nisSet[String(s.NIS).trim()] = true; });

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_JURNAL_PKL_PEMB);
  if (!sheet) return [];

  var values = sheet.getDataRange().getValues();
  var result = [];

  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[0]) continue;
    var nis = String(r[2]).trim();
    if (!nisSet[nis]) continue;
    if (String(r[9] || 'Pending').trim() !== 'Pending') continue;

    var s = binaan.find(function(x) { return String(x.NIS).trim() === nis; }) || {};
    result.push({
      ID_Jurnal: r[0],
      Tanggal: toISODate(r[1]),                             // ⭐ FIX
      NIS: nis,
      Nama_Siswa: s.Nama_Siswa || '(?)',
      Nama_Kelas: s.Nama_Kelas || '-',
      Nama_DUDI: s.Nama_DUDI || '-',
      Kegiatan: r[4],
      Foto_Url: r[5] || '',
      Approval_DUDI: String(r[6] || 'Pending').trim(),
      Catatan_DUDI: r[7] || ''
    });
  }
  result.sort(function(a, b) { return b.Tanggal.localeCompare(a.Tanggal); });
  return result;
}

function getRiwayatJurnalGuru(nbm) {
  var binaan = getSiswaBinaanGuru(nbm);
  if (binaan.length === 0) return [];

  var nisSet = {};
  binaan.forEach(function(s) { nisSet[String(s.NIS).trim()] = true; });

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_JURNAL_PKL_PEMB);
  if (!sheet) return [];

  var values = sheet.getDataRange().getValues();
  var result = [];

  for (var i = 1; i < values.length; i++) {
    var r = values[i];
    if (!r[0]) continue;
    var nis = String(r[2]).trim();
    if (!nisSet[nis]) continue;

    var s = binaan.find(function(x) { return String(x.NIS).trim() === nis; }) || {};
    result.push({
      ID_Jurnal: r[0],
      Tanggal: toISODate(r[1]),                             // ⭐ FIX
      NIS: nis,
      Nama_Siswa: s.Nama_Siswa || '(?)',
      Nama_Kelas: s.Nama_Kelas || '-',
      Nama_DUDI: s.Nama_DUDI || '-',
      Kegiatan: r[4],
      Foto_Url: r[5] || '',
      Approval_DUDI: String(r[6] || 'Pending').trim(),
      Catatan_DUDI: r[7] || '',
      Approval_Sekolah: String(r[9] || 'Pending').trim(),
      Catatan_Sekolah: r[10] || '',
      Status_Final: String(r[12] || 'Pending').trim()
    });
  }
  result.sort(function(a, b) { return b.Tanggal.localeCompare(a.Tanggal); });
  return result;
}

function approveJurnalSekolah(nbm, idJurnal, catatan) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_JURNAL_PKL_PEMB);
  if (!sheet) throw new Error('Sheet Jurnal_PKL tidak ada.');

  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(idJurnal).trim()) {
      var nisJurnal = String(values[i][2]).trim();
      var binaan = getSiswaBinaanGuru(nbm);
      var ok = binaan.some(function(s) { return String(s.NIS).trim() === nisJurnal; });
      if (!ok) throw new Error('Anda bukan pembimbing siswa ini.');

      var now = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
      sheet.getRange(i + 1, 10).setValue('Approved');
      sheet.getRange(i + 1, 11).setValue(catatan || '');
      sheet.getRange(i + 1, 12).setValue(now);
      sheet.getRange(i + 1, 14).setValue(nbm);
      updateStatusFinalJurnal(sheet, i + 1);
      return { success: true, message: 'Jurnal disetujui (Sekolah).' };
    }
  }
  throw new Error('Jurnal tidak ditemukan.');
}

function rejectJurnalSekolah(nbm, idJurnal, catatan) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_JURNAL_PKL_PEMB);
  if (!sheet) throw new Error('Sheet Jurnal_PKL tidak ada.');

  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][0]).trim() === String(idJurnal).trim()) {
      var nisJurnal = String(values[i][2]).trim();
      var binaan = getSiswaBinaanGuru(nbm);
      var ok = binaan.some(function(s) { return String(s.NIS).trim() === nisJurnal; });
      if (!ok) throw new Error('Anda bukan pembimbing siswa ini.');

      var now = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
      sheet.getRange(i + 1, 10).setValue('Rejected');
      sheet.getRange(i + 1, 11).setValue(catatan || 'Tidak valid');
      sheet.getRange(i + 1, 12).setValue(now);
      sheet.getRange(i + 1, 14).setValue(nbm);
      updateStatusFinalJurnal(sheet, i + 1);
      return { success: true, message: 'Jurnal ditolak (Sekolah).' };
    }
  }
  throw new Error('Jurnal tidak ditemukan.');
}

function updateStatusFinalJurnal(sheet, rowIndex) {
  var row = sheet.getRange(rowIndex, 1, 1, 15).getValues()[0];
  var appDUDI = String(row[6] || 'Pending').trim();
  var appSekolah = String(row[9] || 'Pending').trim();
  var final = 'Pending';
  if (appDUDI === 'Rejected' || appSekolah === 'Rejected') final = 'Rejected';
  else if (appDUDI === 'Approved' && appSekolah === 'Approved') final = 'Approved';
  else if (appDUDI === 'Approved' || appSekolah === 'Approved') final = 'Partial';
  sheet.getRange(rowIndex, 13).setValue(final);
  sheet.getRange(rowIndex, 15).setValue(Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss'));
}

function getStatsJurnalGuru(nbm) {
  var pending = getJurnalPendingGuru(nbm);
  return { pending: pending.length };
}
