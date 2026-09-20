// =============================================
// AI ASSISTANT GURU — Frontend
// File: JS_AI_Guru.html
// ⭐ UPDATE: Prota & Promes (multi-semester) + Landscape + Local CP Upload
// =============================================

// ═══════════════════════════════════════════════════════════
// KONFIGURASI LOGO
// ═══════════════════════════════════════════════════════════
var FE_SCHOOL_LOGO_URL = "https://lh3.googleusercontent.com/d/1d1xBvybSKr-I8d_LOYZwdEV1TlVgptfo";

// ═══════════════════════════════════════════════════════════
// KONSTANTA FRONTEND
// ═══════════════════════════════════════════════════════════
var FE_SMK_JURUSAN = [
  { id: "TP",  nama: "Teknik Pemesinan",          singkat: "TP",  bidang: "Teknologi Manufaktur dan Rekayasa" },
  { id: "TPL", nama: "Teknik Pengelasan",         singkat: "TPL", bidang: "Teknologi Manufaktur dan Rekayasa" },
  { id: "TKR", nama: "Teknik Kendaraan Ringan",   singkat: "TKR", bidang: "Teknologi Manufaktur dan Rekayasa" },
  { id: "TSM", nama: "Teknik Sepeda Motor",       singkat: "TSM", bidang: "Teknologi Manufaktur dan Rekayasa" }
];

var FE_DIMENSI_LULUSAN = [
  { kode: "D1", nama: "Keimanan dan Ketakwaan terhadap Tuhan YME" },
  { kode: "D2", nama: "Kewargaan" },
  { kode: "D3", nama: "Penalaran Kritis" },
  { kode: "D4", nama: "Kreativitas" },
  { kode: "D5", nama: "Kolaborasi" },
  { kode: "D6", nama: "Kemandirian" },
  { kode: "D7", nama: "Kesehatan" },
  { kode: "D8", nama: "Komunikasi" }
];

var FE_MODEL_PEMBELAJARAN = [
  { id: "pjbl",      nama: "Project Based Learning (PjBL)" },
  { id: "pbl",       nama: "Problem Based Learning (PBL)" },
  { id: "cbl",       nama: "Case Based Learning (CBL)" },
  { id: "ps",        nama: "Problem Solving" },
  { id: "discovery", nama: "Discovery Learning" },
  { id: "inquiry",   nama: "Inquiry Learning" },
  { id: "ctl",       nama: "Contextual Teaching and Learning (CTL)" },
  { id: "coop",      nama: "Cooperative Learning" },
  { id: "diff",      nama: "Pembelajaran Berdiferensiasi" }
];

var FE_FASE_SMK = [
  { id: "E", nama: "Fase E (Kelas 10)" },
  { id: "F", nama: "Fase F (Kelas 11-12)" }
];

// ⭐ TEMA KOKURIKULER RESMI (12 pilihan)
var TEMA_KOKURIKULER = [
  "Literasi dan Numerasi",
  "Kesehatan dan Gaya Hidup Sehat",
  "Lingkungan Hidup dan Keberlanjutan",
  "Kewirausahaan",
  "Kewargaan dan Kebhinekaan",
  "Digital Safety dan Literasi Digital",
  "Kreativitas dan Inovasi",
  "Kepemimpinan dan Kolaborasi",
  "Budaya dan Kearifan Lokal",
  "Pencegahan Perundungan dan Kekerasan",
  "Keselamatan dan Mitigasi Bencana",
  "Penguatan Karakter dan Etika Sosial"
];

// ⭐ PENDEKATAN BELAJAR (6 pilihan)
var PENDEKATAN_BELAJAR = [
  { id: "deep",        nama: "Deep Learning (Mindful, Meaningful, Joyful)" },
  { id: "pjbl",        nama: "Project Based Learning (PjBL)" },
  { id: "inquiry",     nama: "Inquiry Based Learning" },
  { id: "pbl",         nama: "Problem Based Learning (PBL)" },
  { id: "experiential",nama: "Experiential Learning" },
  { id: "service",     nama: "Service Learning" }
];

// ⭐ KONDISI LINGKUNGAN (7 pilihan)
var KONDISI_LINGKUNGAN = [
  "Lingkungan Kelas/Sekolah",
  "Lingkungan Alam Sekitar",
  "Lingkungan Masyarakat/Pasar",
  "Lingkungan Digital/Maya",
  "Lingkungan Rumah Murid",
  "Perpustakaan/Laboratorium",
  "Masjid/Musholla"
];

// ⭐ MAPEL UNTUK INTEGRASI (13 pilihan)
var MAPEL_INTEGRASI = [
  "PAI & Budi Pekerti",
  "Pendidikan Pancasila",
  "Bahasa Indonesia",
  "Matematika",
  "IPAS",
  "IPA",
  "IPS",
  "Informatika",
  "Seni & Budaya",
  "PJOK",
  "Bahasa Inggris",
  "KIK",
  "Muatan Lokal"
];

// ═══════════════════════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════════════════════
var aiGuruState = {
  activeTab: 'prota',
  lastResult: null,
  lastFitur: null,
  lastParams: null,
  isLoading: false,
  previewTab: 'prota',
  cpFileObject: null,
  cpFileName: '',
  cpFileSize: 0
};

// =============================================
// HELPER: Ambil data guru dari currentUser
// =============================================
function getGuruInfo() {
  if (!currentUser || !currentUser.gtk) {
    return { nama: "", nbm: "" };
  }
  return {
    nama: currentUser.gtk.Nama_GTK || "",
    nbm: currentUser.gtk.NBM || ""
  };
}

// =============================================
// HELPER: Auto-Fill Nama Guru & NBM (editable)
// =============================================
function autoFillGuruFields() {
  var guru = getGuruInfo();
  if (!guru.nama && !guru.nbm) return;

  var fields = [
    { nama: 'pt_namaGuru', nip: 'pt_nipGuru' },
    { nama: 'ma_namaGuru', nip: 'ma_nipGuru' },
    { nama: 'so_namaGuru', nip: null },
    { nama: 'kk_namaGuru', nip: null }
  ];

  fields.forEach(function(f) {
    var elNama = document.getElementById(f.nama);
    if (elNama && guru.nama) elNama.value = guru.nama;
    if (f.nip) {
      var elNip = document.getElementById(f.nip);
      if (elNip && guru.nbm) elNip.value = guru.nbm;
    }
  });
}

// =============================================
// INIT PAGE
// =============================================
function initAIGuruPage() {
  if (!currentUser || currentUser.role !== 'Guru') {
    var container = document.getElementById('ai-guru-content');
    if (container) {
      container.innerHTML = '<div class="card" style="text-align:center;padding:32px;">' +
        '<i class="fas fa-lock" style="font-size:3em;color:#ef4444;margin-bottom:10px;"></i>' +
        '<h3 style="font-size:16px;font-weight:800;color:#0f172a;">Akses Terbatas</h3>' +
        '<p style="font-size:12.5px;color:var(--text-muted);margin-top:4px;">Fitur AI Assistant hanya tersedia untuk Guru.</p>' +
      '</div>';
    }
    return;
  }
  renderAIGuruPage();
}

// =============================================
// RENDER HALAMAN UTAMA AI GURU
// =============================================
function renderAIGuruPage() {
  var container = document.getElementById('ai-guru-content');
  if (!container) return;

  var jurusanOptions = FE_SMK_JURUSAN.map(function(j) {
    return '<option value="' + j.id + '">' + j.nama + ' (' + j.singkat + ')</option>';
  }).join('');

  var modelOptions = FE_MODEL_PEMBELAJARAN.map(function(m) {
    return '<option value="' + m.id + '">' + m.nama + '</option>';
  }).join('');

  var faseOptions = FE_FASE_SMK.map(function(f) {
    return '<option value="' + f.id + '">' + f.nama + '</option>';
  }).join('');

  var dimensiCheckboxes = FE_DIMENSI_LULUSAN.map(function(d) {
    return '<label class="ai-checkbox-item">' +
      '<input type="checkbox" name="dimensi_' + d.kode + '" value="' + d.kode + '">' +
      '<span><strong>' + d.kode + '</strong> — ' + d.nama + '</span>' +
    '</label>';
  }).join('');

  container.innerHTML =
    '<div class="card ai-guru-intro" style="background:linear-gradient(135deg,#065f46 0%,#059669 100%);color:#fff;border:none;">' +
      '<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap;">' +
        '<div style="font-size:2.5em;">✨</div>' +
        '<div style="flex:1;min-width:220px;">' +
          '<div style="font-size:18px;font-weight:800;">AI Assistant Guru</div>' +
          '<div style="font-size:12.5px;opacity:0.9;margin-top:2px;">Bantu buat Prota, Promes, Modul Ajar, Soal, dan Modul Kokurikuler dengan AI.</div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="ai-tabs">' +
      '<button type="button" class="ai-tab-btn active" data-tab="prota" onclick="switchAITab(\'prota\')"><i class="fas fa-calendar-alt"></i> Prota & Promes</button>' +
      '<button type="button" class="ai-tab-btn" data-tab="modul_ajar" onclick="switchAITab(\'modul_ajar\')"><i class="fas fa-book-open"></i> Modul Ajar</button>' +
      '<button type="button" class="ai-tab-btn" data-tab="soal" onclick="switchAITab(\'soal\')"><i class="fas fa-question-circle"></i> Buat Soal</button>' +
      '<button type="button" class="ai-tab-btn" data-tab="kokurikuler" onclick="switchAITab(\'kokurikuler\')"><i class="fas fa-users-cog"></i> Kokurikuler</button>' +
    '</div>' +

    // ═══════════════════════════════════════════════
    // PANEL PROTA & PROMES
    // ═══════════════════════════════════════════════
    '<div class="ai-panel" id="ai-panel-prota">' +
      buildPanelHeader('Prota & Promes', 'Buat Program Tahunan (Prota) dan Program Semester (Promes) sekaligus.', 'fa-calendar-alt') +
      '<div class="card ai-form-card">' +

        // ─── SECTION A: IDENTITAS ───
        '<div class="ai-form-section">' +
          '<div class="ai-form-section-title"><i class="fas fa-id-card"></i> A. Identitas</div>' +
          '<div class="ai-form-grid">' +
            '<div class="form-group"><label><i class="fas fa-user-tie"></i> Nama Guru</label><input type="text" id="pt_namaGuru" class="form-control" placeholder="Nama lengkap"></div>' +
            '<div class="form-group"><label><i class="fas fa-id-card"></i> NIP/NBM</label><input type="text" id="pt_nipGuru" class="form-control" placeholder="NIP atau NBM"></div>' +
            '<div class="form-group"><label><i class="fas fa-school"></i> Satuan Pendidikan</label><input type="text" id="pt_sekolah" class="form-control" value="SMK Muhammadiyah 1 Surakarta" placeholder="Nama sekolah"></div>' +
            '<div class="form-group"><label><i class="fas fa-book"></i> Mata Pelajaran</label><input type="text" id="pt_mapel" class="form-control" placeholder="Contoh: SMAW"></div>' +
            '<div class="form-group"><label><i class="fas fa-graduation-cap"></i> Jurusan</label><select id="pt_jurusan" class="form-control"><option value="">-- Pilih --</option>' + jurusanOptions + '</select></div>' +
            '<div class="form-group"><label><i class="fas fa-layer-group"></i> Fase</label><select id="pt_fase" class="form-control"><option value="">-- Pilih --</option>' + faseOptions + '</select></div>' +
            '<div class="form-group"><label><i class="fas fa-door-open"></i> Kelas</label><select id="pt_kelas" class="form-control"><option value="10">10</option><option value="11" selected>11</option><option value="12">12</option></select></div>' +
            '<div class="form-group"><label><i class="fas fa-calendar"></i> Tahun Ajaran</label><input type="text" id="pt_tahunAjaran" class="form-control" placeholder="2026/2027" value="2026/2027"></div>' +
            '<div class="form-group" style="grid-column: 1 / -1;"><label><i class="fas fa-calendar-alt"></i> Semester <span style="text-transform:none;font-weight:400;color:var(--text-muted);font-size:11px;">(pilih 1 atau 2)</span></label>' +
              '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                '<label class="ai-checkbox-item" style="flex:1;min-width:140px;padding:10px 14px;cursor:pointer;">' +
                  '<input type="checkbox" id="pt_semesterGanjil" value="Ganjil" checked>' +
                  '<span><strong>Ganjil</strong> (Juli - Desember)</span>' +
                '</label>' +
                '<label class="ai-checkbox-item" style="flex:1;min-width:140px;padding:10px 14px;cursor:pointer;">' +
                  '<input type="checkbox" id="pt_semesterGenap" value="Genap">' +
                  '<span><strong>Genap</strong> (Januari - Juni)</span>' +
                '</label>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        // ─── SECTION B: BAHAN BAKU ───
        '<div class="ai-form-section">' +
          '<div class="ai-form-section-title"><i class="fas fa-file-alt"></i> B. Bahan Baku (CP/TP)</div>' +
          '<div class="form-group">' +
            '<label style="text-transform:none;letter-spacing:0;font-weight:600;font-size:13px;"><input type="checkbox" id="pt_punyaFile" onchange="toggleUploadCP()"> Punya file CP sendiri? Upload di sini</label>' +
            '<div style="font-size:11.5px;color:var(--text-muted);margin-left:22px;margin-top:2px;">File disimpan di session browser (tidak dikirim ke Drive).</div>' +
          '</div>' +
          '<div id="pt_uploadContainer" style="display:none;">' +
            '<div class="form-group">' +
              '<label style="text-transform:none;letter-spacing:0;font-weight:600;font-size:13px;">Upload File CP (PDF/DOCX, maks 5 MB)</label>' +
              '<div class="personal-file-upload" style="width:100%;">' +
                '<label class="file-label" for="pt_fileCP" style="width:100%;justify-content:center;min-height:46px;font-size:13px;"><i class="fas fa-cloud-upload-alt" style="font-size:17px;"></i> Pilih File CP</label>' +
                '<input type="file" id="pt_fileCP" accept=".pdf,.docx,.doc" onchange="handleCPUpload(this)">' +
                '<span class="file-name" id="pt_fileCP_name" style="margin-top:8px;display:block;text-align:center;font-size:12px;">Belum ada file dipilih</span>' +
              '</div>' +
            '</div>' +
            '<div id="pt_cpUrlDisplay" style="display:none;background:#ecfdf5;border:1px solid var(--primary-border);border-radius:8px;padding:10px 14px;font-size:12px;color:#065f46;margin-top:8px;"></div>' +
          '</div>' +
          '<div class="form-group" style="margin-top:12px;">' +
            '<label><i class="fas fa-list-check"></i> ATAU Paste Teks CP/TP <span style="text-transform:none;font-weight:400;color:var(--text-muted);font-size:11px;">(opsional)</span></label>' +
            '<textarea id="pt_kdCp" class="form-control" rows="5" placeholder="Paste Capaian Pembelajaran atau Tujuan Pembelajaran di sini..."></textarea>' +
            '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Kosongkan jika ingin AI rumuskan sendiri berdasarkan jurusan & mapel.</div>' +
          '</div>' +
        '</div>' +

        // ─── SECTION C: MODAL WAKTU ───
        '<div class="ai-form-section">' +
          '<div class="ai-form-section-title"><i class="fas fa-clock"></i> C. Modal Waktu</div>' +
          '<div class="ai-form-grid">' +
            '<div class="form-group"><label><i class="fas fa-calendar-week"></i> Minggu Efektif per Semester</label><input type="number" id="pt_mingguEfektif" class="form-control" value="18" min="1" max="30" oninput="hitungTotalJP()"></div>' +
            '<div class="form-group"><label><i class="fas fa-hourglass-half"></i> JP per Minggu</label><input type="number" id="pt_jpPerMinggu" class="form-control" value="4" min="1" max="20" oninput="hitungTotalJP()"></div>' +
          '</div>' +
          '<div style="background:#ecfdf5;border:1px dashed var(--primary-border);border-radius:8px;padding:12px 16px;margin-top:8px;">' +
            '<div style="font-size:12px;color:#065f46;font-weight:700;">📊 Perhitungan Otomatis:</div>' +
            '<div style="font-size:12px;color:#065f46;margin-top:4px;" id="pt_totalJPDisplay">' +
              '18 minggu × 4 JP = <strong>72 JP</strong> per semester | <strong>144 JP</strong> per tahun' +
            '</div>' +
          '</div>' +
        '</div>' +

        buildActionButtonsProta() +
      '</div>' +
      '<div class="ai-output-container" id="ai-output-prota"></div>' +
    '</div>' +

    // PANEL MODUL AJAR
    '<div class="ai-panel hidden" id="ai-panel-modul_ajar">' +
      buildPanelHeader('Modul Ajar SMK', 'Susun modul ajar lengkap sesuai Kurikulum Merdeka dengan K3LH & standar industri.', 'fa-book-open') +
      '<div class="card ai-form-card">' +
        '<div class="ai-form-section"><div class="ai-form-section-title"><i class="fas fa-info-circle"></i> Informasi Dasar</div>' +
          '<div class="ai-form-grid">' +
            '<div class="form-group"><label><i class="fas fa-user-tie"></i> Nama Guru</label><input type="text" id="ma_namaGuru" class="form-control" placeholder="Nama lengkap"></div>' +
            '<div class="form-group"><label><i class="fas fa-id-card"></i> NIP/NBM</label><input type="text" id="ma_nipGuru" class="form-control" placeholder="NIP/NBM"></div>' +
            '<div class="form-group"><label><i class="fas fa-calendar"></i> Tahun Pelajaran</label><input type="text" id="ma_tahunAjaran" class="form-control" placeholder="Contoh: 2026/2027" value="2026/2027"></div>' +
            '<div class="form-group"><label><i class="fas fa-graduation-cap"></i> Jurusan</label><select id="ma_jurusan" class="form-control"><option value="">-- Pilih --</option>' + jurusanOptions + '</select></div>' +
            '<div class="form-group"><label><i class="fas fa-layer-group"></i> Fase</label><select id="ma_fase" class="form-control"><option value="">-- Pilih --</option>' + faseOptions + '</select></div>' +
            '<div class="form-group"><label><i class="fas fa-door-open"></i> Kelas</label><select id="ma_kelas" class="form-control"><option value="10">10</option><option value="11">11</option><option value="12">12</option></select></div>' +
            '<div class="form-group"><label><i class="fas fa-book"></i> Mata Pelajaran</label><input type="text" id="ma_mapel" class="form-control" placeholder="Contoh: Gambar Teknik Manufaktur"></div>' +
            '<div class="form-group"><label><i class="fas fa-lightbulb"></i> Materi Pokok / Judul Modul</label><input type="text" id="ma_materi" class="form-control" placeholder="Contoh: Menggunakan Software AutoCAD"></div>' +
          '</div>' +
        '</div>' +
        '<div class="ai-form-section"><div class="ai-form-section-title"><i class="fas fa-list-ol"></i> Detail Pembelajaran</div>' +
          '<div class="ai-form-grid">' +
            '<div class="form-group"><label><i class="fas fa-hashtag"></i> Jumlah Pertemuan</label><input type="number" id="ma_jumlahPertemuan" class="form-control" value="3" min="1" max="20"></div>' +
            '<div class="form-group"><label><i class="fas fa-clock"></i> Alokasi per Pertemuan</label><input type="text" id="ma_alokasiPerPertemuan" class="form-control" placeholder="Contoh: 3 x 45 menit" value="3 x 45 menit"></div>' +
            '<div class="form-group"><label><i class="fas fa-project-diagram"></i> Model Pembelajaran</label><select id="ma_modelPembelajaran" class="form-control"><option value="">-- Pilih Model --</option>' + modelOptions + '</select></div>' +
            '<div class="form-group"><label><i class="fas fa-users"></i> Target Peserta Didik</label><input type="text" id="ma_targetPesertaDidik" class="form-control" placeholder="Contoh: Peserta didik reguler (28-32 siswa)" value="Peserta didik reguler (28-32 siswa)"></div>' +
          '</div>' +
        '</div>' +
        '<div class="ai-form-section"><div class="ai-form-section-title"><i class="fas fa-bullseye"></i> Kompetensi & Tujuan</div>' +
          '<div class="form-group"><label><i class="fas fa-list-check"></i> CP / Kompetensi Dasar</label><textarea id="ma_kdCp" class="form-control" rows="4" placeholder="Paste Capaian Pembelajaran atau KD resmi dari kurikulum..."></textarea></div>' +
          '<div class="form-group"><label><i class="fas fa-graduation-cap"></i> Kompetensi Awal (opsional)</label><textarea id="ma_kompetensiAwal" class="form-control" rows="2" placeholder="Pengetahuan/keterampilan dasar yang harus dimiliki siswa sebelum materi ini"></textarea></div>' +
          '<div class="form-group"><label><i class="fas fa-bullseye"></i> Tujuan Pembelajaran (opsional)</label><textarea id="ma_tujuan" class="form-control" rows="3" placeholder="Kosongkan jika ingin AI rumuskan sendiri"></textarea></div>' +
        '</div>' +
        '<div class="ai-form-section"><div class="ai-form-section-title"><i class="fas fa-tools"></i> Sarana & Dimensi Lulusan</div>' +
          '<div class="form-group"><label><i class="fas fa-microscope"></i> Sarana & Prasarana (opsional)</label><textarea id="ma_saranaPrasarana" class="form-control" rows="2" placeholder="Contoh: Lab Komputer, Software AutoCAD, Proyektor, Jobsheet (khas SMK)"></textarea></div>' +
          '<div class="form-group"><label><i class="fas fa-users-cog"></i> Dimensi Profil Lulusan (pilih 2-3)</label><div class="ai-checkbox-grid">' + dimensiCheckboxes + '</div></div>' +
          '<div class="form-group"><label><i class="fas fa-layer-group"></i> Versi Modul</label><select id="ma_versi" class="form-control"><option value="ringkas">Ringkas (2-3 halaman)</option><option value="lengkap" selected>Lengkap (10+ halaman)</option></select></div>' +
        '</div>' +
        buildActionButtons('modul_ajar') +
      '</div>' +
      '<div class="ai-output-container" id="ai-output-modul_ajar"></div>' +
    '</div>' +

    // PANEL SOAL (BARU — full featured)
    '<div class="ai-panel hidden" id="ai-panel-soal">' +
      buildPanelHeader('Buat Soal Ujian', 'Buat paket soal lengkap dengan kunci, pembahasan, dan kisi-kisi.', 'fa-question-circle') +
      '<div class="card ai-form-card">' +

        // ─── SECTION A: IDENTITAS ───
        '<div class="soal-form-section">' +
          '<div class="soal-form-section-title"><i class="fas fa-id-card"></i> A. Identitas & Asesmen</div>' +
          '<div class="ai-form-grid">' +
            '<div class="form-group"><label><i class="fas fa-user-tie"></i> Nama Guru</label><input type="text" id="so_namaGuru" class="form-control" placeholder="Nama lengkap"></div>' +
            '<div class="form-group"><label><i class="fas fa-id-card"></i> NIP/NBM</label><input type="text" id="so_nipGuru" class="form-control" placeholder="NIP/NBM"></div>' +
            '<div class="form-group"><label><i class="fas fa-school"></i> Satuan Pendidikan</label><input type="text" id="so_sekolah" class="form-control" value="SMK Muhammadiyah 1 Surakarta"></div>' +
            '<div class="form-group"><label><i class="fas fa-graduation-cap"></i> Jurusan</label><select id="so_jurusan" class="form-control"><option value="">-- Pilih --</option>' + jurusanOptions + '</select></div>' +
            '<div class="form-group"><label><i class="fas fa-book"></i> Mata Pelajaran</label><input type="text" id="so_mapel" class="form-control" placeholder="Contoh: Teknik Pemesinan Bubut"></div>' +
            '<div class="form-group"><label><i class="fas fa-chalkboard"></i> Kelas</label><select id="so_kelas" class="form-control"><option value="X">X</option><option value="XI">XI</option><option value="XII">XII</option></select></div>' +
            '<div class="form-group"><label><i class="fas fa-calendar"></i> Tahun Ajaran</label><input type="text" id="so_tahunAjaran" class="form-control" value="2026/2027"></div>' +
            '<div class="form-group"><label><i class="fas fa-clipboard-check"></i> Jenis Asesmen</label><select id="so_jenisAsesmen" class="form-control">' +
              '<option value="Sumatif Harian">Sumatif Harian</option>' +
              '<option value="Sumatif Tengah Semester">Sumatif Tengah Semester (STS)</option>' +
              '<option value="Sumatif Akhir Semester">Sumatif Akhir Semester (SAS)</option>' +
              '<option value="Sumatif Akhir Tahun">Sumatif Akhir Tahun (SAT)</option>' +
              '<option value="Formatif">Formatif</option>' +
              '<option value="Diagnostik">Diagnostik</option>' +
              '<option value="Try Out">Try Out / Latihan</option>' +
            '</select></div>' +
            '<div class="form-group"><label><i class="fas fa-clock"></i> Alokasi Waktu</label><input type="text" id="so_alokasi" class="form-control" value="90 menit"></div>' +
          '</div>' +
        '</div>' +

        // ─── SECTION B: TIPE SOAL ───
        '<div class="soal-form-section">' +
          '<div class="soal-form-section-title" style="display:flex;justify-content:space-between;align-items:center;">' +
            '<span><i class="fas fa-list-ol"></i> B. Komposisi Soal</span>' +
            '<span class="total-soal-badge"><i class="fas fa-calculator"></i> Total: <strong id="so_totalSoalDisplay">30</strong></span>' +
          '</div>' +
          '<div style="margin-bottom:10px;">' +
            '<label style="text-transform:none;font-size:12.5px;font-weight:700;color:#334155;">Opsi Jawaban (PG):</label>' +
            '<select id="so_opsiPG" class="form-control" style="max-width:200px;margin-top:4px;">' +
              '<option value="3">3 Opsi (A-C)</option>' +
              '<option value="4" selected>4 Opsi (A-D)</option>' +
              '<option value="5">5 Opsi (A-E)</option>' +
            '</select>' +
          '</div>' +
          '<div class="tipe-soal-grid">' +
            '<div class="tipe-soal-card bg-pg">' +
              '<div class="tipe-icon"><i class="fas fa-check-circle"></i></div>' +
              '<div class="tipe-label">Pilihan Ganda</div>' +
              '<input type="number" id="so_jumlahPG" value="20" min="0" max="30" oninput="hitungTotalSoal()">' +
            '</div>' +
            '<div class="tipe-soal-card bg-isian">' +
              '<div class="tipe-icon"><i class="fas fa-pen"></i></div>' +
              '<div class="tipe-label">Isian Singkat</div>' +
              '<input type="number" id="so_jumlahIsian" value="5" min="0" max="30" oninput="hitungTotalSoal()">' +
            '</div>' +
            '<div class="tipe-soal-card bg-esai">' +
              '<div class="tipe-icon"><i class="fas fa-file-alt"></i></div>' +
              '<div class="tipe-label">Esai / Uraian</div>' +
              '<input type="number" id="so_jumlahEsai" value="5" min="0" max="30" oninput="hitungTotalSoal()">' +
            '</div>' +
          '</div>' +
          '<div id="so_totalWarning" style="font-size:11.5px;color:#991b1b;margin-top:8px;display:none;">' +
            '<i class="fas fa-exclamation-triangle"></i> Total soal tidak boleh lebih dari 30. Mohon sesuaikan.' +
          '</div>' +
        '</div>' +

        // ─── SECTION C: PROPORSI KESULITAN ───
        '<div class="soal-form-section">' +
          '<div class="soal-form-section-title"><i class="fas fa-signal"></i> C. Proporsi Tingkat Kesulitan</div>' +
          '<div class="proporsi-grid">' +
            '<div class="proporsi-item p-mudah">' +
              '<div class="proporsi-label"><span>Mudah</span><span class="proporsi-value" id="so_valMudah">30%</span></div>' +
              '<input type="range" id="so_propMudah" min="0" max="100" value="30" oninput="updateProporsi()">' +
            '</div>' +
            '<div class="proporsi-item p-sedang">' +
              '<div class="proporsi-label"><span>Sedang</span><span class="proporsi-value" id="so_valSedang">50%</span></div>' +
              '<input type="range" id="so_propSedang" min="0" max="100" value="50" oninput="updateProporsi()">' +
            '</div>' +
            '<div class="proporsi-item p-sulit">' +
              '<div class="proporsi-label"><span>Sulit</span><span class="proporsi-value" id="so_valSulit">20%</span></div>' +
              '<input type="range" id="so_propSulit" min="0" max="100" value="20" oninput="updateProporsi()">' +
            '</div>' +
          '</div>' +
          '<div id="so_proporsiWarning" class="proporsi-total-warning ok" style="margin-top:10px;">' +
            '<i class="fas fa-check-circle"></i> Total: 100%' +
          '</div>' +
        '</div>' +

        // ─── SECTION D: LEVEL KOGNITIF ───
        '<div class="soal-form-section">' +
          '<div class="soal-form-section-title"><i class="fas fa-brain"></i> D. Level Kognitif <span style="text-transform:none;font-weight:400;color:var(--text-muted);font-size:11px;">(wajib C3-C6, pilih minimal 2)</span></div>' +
          '<div class="kognitif-grid">' +
            '<label class="kognitif-chip"><input type="checkbox" id="so_kogC3" value="C3" checked><span class="kode">C3</span><span class="label">Menerapkan</span></label>' +
            '<label class="kognitif-chip"><input type="checkbox" id="so_kogC4" value="C4" checked><span class="kode">C4</span><span class="label">Menganalisis</span></label>' +
            '<label class="kognitif-chip"><input type="checkbox" id="so_kogC5" value="C5"><span class="kode">C5</span><span class="label">Mengevaluasi</span></label>' +
            '<label class="kognitif-chip"><input type="checkbox" id="so_kogC6" value="C6"><span class="kode">C6</span><span class="label">Mencipta</span></label>' +
          '</div>' +
          '<div id="so_hotsWarning" style="font-size:11.5px;color:#92400e;background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:8px 12px;margin-top:10px;display:none;">' +
            '<i class="fas fa-fire"></i> C5/C6 dipilih — proporsi soal <strong>Sulit minimal 30%</strong> (auto-disesuaikan).' +
          '</div>' +
        '</div>' +

        // ─── SECTION E: VISUAL & MULTIMEDIA ───
        '<div class="soal-form-section">' +
          '<div class="soal-form-section-title"><i class="fas fa-image"></i> E. Visual & Multimedia <span style="text-transform:none;font-weight:400;color:var(--text-muted);font-size:11px;">(opsional)</span></div>' +
          '<div class="visual-grid">' +
            '<label class="visual-card">' +
              '<input type="checkbox" id="so_pakaiIlustrasi">' +
              '<div class="visual-info">' +
                '<div class="visual-title"><i class="fas fa-palette"></i> Soal dengan Ilustrasi</div>' +
                '<div class="visual-desc">AI akan menyertakan prompt untuk generate gambar ilustrasi sederhana. Prompt bisa dicopy ke Midjourney / DALL-E / Gemini Image.</div>' +
              '</div>' +
            '</label>' +
            '<label class="visual-card">' +
              '<input type="checkbox" id="so_pakaiDiagram">' +
              '<div class="visual-info">' +
                '<div class="visual-title"><i class="fas fa-chart-bar"></i> Soal dengan Diagram/Grafik</div>' +
                '<div class="visual-desc">AI akan menyertakan prompt untuk generate diagram atau grafik sederhana.</div>' +
              '</div>' +
            '</label>' +
            '<label class="visual-card">' +
              '<input type="checkbox" id="so_pakaiPetaKonsep">' +
              '<div class="visual-info">' +
                '<div class="visual-title"><i class="fas fa-project-diagram"></i> Soal dengan Peta Konsep</div>' +
                '<div class="visual-desc">AI akan menyertakan prompt untuk generate peta konsep (mind map) sederhana.</div>' +
              '</div>' +
            '</label>' +
          '</div>' +
        '</div>' +

        // ─── SECTION F: MATERI & CP ───
        '<div class="soal-form-section">' +
          '<div class="soal-form-section-title"><i class="fas fa-lightbulb"></i> F. Materi / Topik & CP</div>' +
          '<div class="form-group"><label><i class="fas fa-lightbulb"></i> Materi / Topik Soal</label>' +
            '<input type="text" id="so_materi" class="form-control" placeholder="Contoh: Alat potong mesin bubut, parameter pemotongan, dll"></div>' +
          '<div class="form-group" style="margin-bottom:0;"><label><i class="fas fa-list-check"></i> CP / KD / Tujuan Pembelajaran <span style="text-transform:none;font-weight:400;color:var(--text-muted);font-size:11px;">(opsional)</span></label>' +
            '<textarea id="so_kdCp" class="form-control" rows="4" placeholder="Paste Capaian Pembelajaran atau Tujuan Pembelajaran..."></textarea></div>' +
        '</div>' +

        buildActionButtonsSoal() +
      '</div>' +
      '<div class="ai-output-container" id="ai-output-soal"></div>' +
    '</div>' +

    // PANEL KOKURIKULER (BARU)
    '<div class="ai-panel hidden" id="ai-panel-kokurikuler">' +
      buildPanelHeader('Modul Kokurikuler (Kolaborasi Lintas Mapel)', 'Susun modul projek kokurikuler berbasis 8 Dimensi Lulusan & kolaborasi lintas mata pelajaran.', 'fa-users-cog') +
      '<div class="card ai-form-card">' +

        // ─── SECTION A: IDENTITAS UMUM ───
        '<div class="soal-form-section">' +
          '<div class="soal-form-section-title"><i class="fas fa-id-card"></i> A. Identitas Umum</div>' +
          '<div class="ai-form-grid">' +
            '<div class="form-group"><label><i class="fas fa-user-tie"></i> Nama Penyusun</label><input type="text" id="kk_namaGuru" class="form-control" placeholder="Nama lengkap"></div>' +
            '<div class="form-group"><label><i class="fas fa-school"></i> Instansi</label><input type="text" id="kk_sekolah" class="form-control" value="SMK Muhammadiyah 1 Surakarta" readonly style="background:#f1f5f9;"></div>' +
            '<div class="form-group"><label><i class="fas fa-door-open"></i> Jenjang / Kelas</label><select id="kk_kelas" class="form-control"><option value="X">Kelas X</option><option value="XI" selected>Kelas XI</option><option value="XII">Kelas XII</option></select></div>' +
            '<div class="form-group"><label><i class="fas fa-calendar"></i> Tahun Ajaran</label><input type="text" id="kk_tahunAjaran" class="form-control" value="2026/2027"></div>' +
          '</div>' +
        '</div>' +

        // ─── SECTION B: TEMA KEGIATAN ───
        '<div class="soal-form-section">' +
          '<div class="soal-form-section-title"><i class="fas fa-palette"></i> B. Tema Kegiatan</div>' +
          '<div class="tema-tabs">' +
            '<button type="button" class="tema-tab-btn active" onclick="switchTemaTab(\'resmi\', this)"><i class="fas fa-check-circle"></i> Tema Resmi</button>' +
            '<button type="button" class="tema-tab-btn" onclick="switchTemaTab(\'khusus\', this)"><i class="fas fa-pen"></i> Tema Khusus</button>' +
          '</div>' +
          '<div class="tema-panel active" id="tema-panel-resmi">' +
            '<div class="tema-grid">' +
              TEMA_KOKURIKULER.map(function(t, idx) {
                return '<label class="tema-card">' +
                  '<input type="radio" name="kk_tema" value="' + t + '"' + (idx === 0 ? ' checked' : '') + '>' +
                  '<span>' + t + '</span>' +
                '</label>';
              }).join('') +
            '</div>' +
          '</div>' +
          '<div class="tema-panel" id="tema-panel-khusus">' +
            '<div class="tema-khusus-input">' +
              '<label><i class="fas fa-lightbulb"></i> Tema Custom (isi sendiri)</label>' +
              '<input type="text" id="kk_temaKhusus" placeholder="Contoh: Pengolahan Limbah Logam menjadi Produk Kreatif" oninput="handleTemaKhususInput()">' +
            '</div>' +
          '</div>' +
        '</div>' +

        // ─── SECTION C: DIMENSI LULUSAN (MAKS 3) ───
        '<div class="soal-form-section">' +
          '<div class="soal-form-section-title" style="display:flex;justify-content:space-between;align-items:center;">' +
            '<span><i class="fas fa-bullseye"></i> C. Target Dimensi Lulusan <span style="text-transform:none;font-weight:400;color:var(--text-muted);font-size:11px;">(maks. 3)</span></span>' +
            '<span class="dimensi-counter ok" id="kk_dimensiCounter">0 / 3</span>' +
          '</div>' +
          '<div class="ai-checkbox-grid">' +
            FE_DIMENSI_LULUSAN.map(function(d) {
              return '<label class="ai-checkbox-item">' +
                '<input type="checkbox" name="kk_dimensi" value="' + d.kode + '" onchange="handleDimensiChange(this)">' +
                '<span><strong>' + d.kode + '</strong> — ' + d.nama + '</span>' +
              '</label>';
            }).join('') +
          '</div>' +
          '<div id="kk_dimensiWarning" style="font-size:11.5px;color:#991b1b;background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;padding:8px 12px;margin-top:10px;display:none;">' +
            '<i class="fas fa-exclamation-triangle"></i> Maksimal 3 dimensi. Pilihan ke-4 otomatis dibatalkan.' +
          '</div>' +
        '</div>' +

        // ─── SECTION D: METODOLOGI DEEP LEARNING ───
        '<div class="soal-form-section">' +
          '<div class="soal-form-section-title"><i class="fas fa-graduation-cap"></i> D. Metodologi Pembelajaran</div>' +
          '<div class="form-group"><label><i class="fas fa-lightbulb"></i> Pendekatan Belajar</label>' +
            '<select id="kk_pendekatan" class="form-control">' +
              PENDEKATAN_BELAJAR.map(function(p) {
                return '<option value="' + p.nama + '"' + (p.id === 'deep' ? ' selected' : '') + '>' + p.nama + '</option>';
              }).join('') +
            '</select>' +
          '</div>' +
          '<div class="ai-form-grid">' +
            '<div class="form-group"><label><i class="fas fa-clock"></i> Alokasi Waktu (JP)</label><input type="text" id="kk_alokasi" class="form-control" placeholder="Contoh: 120 JP" value="36 JP"></div>' +
            '<div class="form-group"><label><i class="fas fa-calendar-alt"></i> Sesi Pertemuan</label><input type="text" id="kk_sesi" class="form-control" placeholder="Contoh: 8 Sesi / Blok" value="8 Sesi"></div>' +
          '</div>' +
          '<div class="form-group" style="margin-bottom:0;"><label><i class="fas fa-map-marker-alt"></i> Kondisi Lingkungan</label>' +
            '<select id="kk_kondisiLingkungan" class="form-control">' +
              KONDISI_LINGKUNGAN.map(function(k) {
                return '<option value="' + k + '">' + k + '</option>';
              }).join('') +
            '</select>' +
          '</div>' +
        '</div>' +

        // ─── SECTION E: INTEGRASI MATA PELAJARAN ───
        '<div class="soal-form-section">' +
          '<div class="soal-form-section-title"><i class="fas fa-layer-group"></i> E. Integrasi Mata Pelajaran</div>' +
          '<div class="form-group">' +
            '<label style="text-transform:uppercase;font-size:11px;font-weight:700;color:#475569;letter-spacing:0.04em;">Pilih Mata Pelajaran Terkait</label>' +
            '<div class="mapel-chips-container" id="kk_mapelChips">' +
              MAPEL_INTEGRASI.map(function(m) {
                return '<label class="mapel-chip">' +
                  '<input type="checkbox" name="kk_mapel" value="' + m + '" onchange="handleMapelChange(this)">' +
                  '<span>' + m + '</span>' +
                '</label>';
              }).join('') +
            '</div>' +
            '<div class="mapel-manual-input">' +
              '<input type="text" id="kk_mapelManualInput" placeholder="Tambah mapel manual (Contoh: Tahfidz)..." onkeypress="if(event.key===\'Enter\'){event.preventDefault();tambahMapelManual();}">' +
              '<button type="button" onclick="tambahMapelManual()" title="Tambah mapel"><i class="fas fa-plus"></i></button>' +
            '</div>' +
          '</div>' +
          '<div class="mapel-tp-list" id="kk_mapelTPList"></div>' +
          '<div class="mapel-empty" id="kk_mapelEmpty"><i class="fas fa-info-circle"></i> Belum ada mapel terpilih. Klik chip di atas untuk memilih mapel, lalu isi Tujuan Pembelajaran.</div>' +
        '</div>' +

        // ─── SECTION F: TOPIK PROJEK ───
        '<div class="soal-form-section">' +
          '<div class="soal-form-section-title"><i class="fas fa-lightbulb"></i> F. Topik Projek</div>' +
          '<div class="form-group" style="margin-bottom:0;"><label><i class="fas fa-tag"></i> Topik / Sub-Tema Spesifik</label>' +
            '<input type="text" id="kk_topik" class="form-control" placeholder="Contoh: Pengolahan Limbah Logam Menjadi Kerajinan"></div>' +
        '</div>' +

        // ─── SECTION G: DESKRIPSI SINGKAT ───
        '<div class="soal-form-section">' +
          '<div class="soal-form-section-title"><i class="fas fa-align-left"></i> G. Deskripsi Singkat Projek <span style="text-transform:none;font-weight:400;color:var(--text-muted);font-size:11px;">(opsional)</span></div>' +
          '<div class="form-group" style="margin-bottom:0;">' +
            '<textarea id="kk_deskripsi" class="form-control" rows="3" placeholder="Kosongkan jika ingin AI kembangkan sendiri berdasarkan tema + topik..."></textarea>' +
          '</div>' +
        '</div>' +

        buildActionButtons('kokurikuler') +
      '</div>' +
      '<div class="ai-output-container" id="ai-output-kokurikuler"></div>' +
    '</div>';

  // ⭐ AUTO-FILL NAMA GURU & NBM dari session login
  autoFillGuruFields();

  // ⭐ RESTORE FILE CP dari state (kalau ada, misal setelah buka menu AI Guru lagi)
  restoreCPUploadFromState();

  // ⭐ Attach listener ke chip kognitif soal
  attachKognitifListeners();
}

// =============================================
// HELPER: RESTORE FILE CP DARI STATE
// =============================================
function restoreCPUploadFromState() {
  if (!aiGuruState.cpFileName) return;

  var checkbox = document.getElementById('pt_punyaFile');
  var container = document.getElementById('pt_uploadContainer');
  var nameSpan = document.getElementById('pt_fileCP_name');
  var displayEl = document.getElementById('pt_cpUrlDisplay');

  if (checkbox) checkbox.checked = true;
  if (container) container.style.display = 'block';

  if (nameSpan) {
    var size = (aiGuruState.cpFileSize / 1024).toFixed(1);
    nameSpan.textContent = '📎 ' + aiGuruState.cpFileName + ' (' + size + ' KB)';
    nameSpan.style.color = 'var(--primary-dark)';
    nameSpan.style.fontWeight = '700';
  }

  if (displayEl) {
    var size2 = (aiGuruState.cpFileSize / 1024).toFixed(1);
    displayEl.style.display = 'block';
    displayEl.innerHTML = '✅ File tersimpan di session: <strong>' + aiGuruState.cpFileName + '</strong> (' + size2 + ' KB)' +
      '<br><span style="font-size:11px;color:#047857;">File tidak dikirim ke Drive. Akan hilang saat halaman di-refresh.</span>';
  }
}

// =============================================
// HELPER: BUILD PANEL HEADER
// =============================================
function buildPanelHeader(title, subtitle, icon) {
  return '<div class="card ai-panel-header" style="background:#ecfdf5;border:1px solid #a7f3d0;padding:14px 18px;margin-bottom:14px;">' +
    '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">' +
      '<div style="font-size:1.6em;color:var(--primary);"><i class="fas ' + icon + '"></i></div>' +
      '<div style="flex:1;min-width:200px;">' +
        '<div style="font-size:14px;font-weight:800;color:var(--primary-dark);">' + title + '</div>' +
        '<div style="font-size:12px;color:#065f46;margin-top:2px;">' + subtitle + '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

// =============================================
// HELPER: BUILD ACTION BUTTONS (Umum)
// =============================================
function buildActionButtons(fitur) {
  return '<div class="ai-form-actions">' +
    '<button type="button" class="btn btn-primary ai-btn-generate" onclick="aiGuruSubmit(\'' + fitur + '\')"><i class="fas fa-magic"></i> Generate dengan AI</button>' +
    '<button type="button" class="btn btn-outline" onclick="aiGuruResetForm(\'' + fitur + '\')"><i class="fas fa-undo"></i> Reset Form</button>' +
  '</div>';
}

// =============================================
// HELPER: BUILD ACTION BUTTONS (Khusus Prota)
// =============================================
function buildActionButtonsProta() {
  return '<div class="ai-form-actions">' +
    '<button type="button" class="btn btn-primary ai-btn-generate" onclick="aiGuruSubmit(\'prota\')"><i class="fas fa-magic"></i> Generate Prota & Promes dengan AI</button>' +
    '<button type="button" class="btn btn-outline" onclick="aiGuruResetForm(\'prota\')"><i class="fas fa-undo"></i> Reset Form</button>' +
  '</div>';
}

// =============================================
// HELPER: BUILD ACTION BUTTONS (Khusus Soal)
// =============================================
function buildActionButtonsSoal() {
  return '<div class="ai-form-actions">' +
    '<button type="button" class="btn btn-primary ai-btn-generate" onclick="aiGuruSubmit(\'soal\')"><i class="fas fa-magic"></i> Buat Soal Otomatis</button>' +
    '<button type="button" class="btn btn-outline" onclick="aiGuruResetForm(\'soal\')"><i class="fas fa-undo"></i> Reset Form</button>' +
  '</div>';
}

// =============================================
// KOKURIKULER: SWITCH TAB TEMA (Resmi / Khusus)
// =============================================
function switchTemaTab(tab, btnEl) {
  // Update active button
  var container = btnEl.parentNode;
  if (container) {
    container.querySelectorAll('.tema-tab-btn').forEach(function(b) {
      b.classList.remove('active');
    });
  }
  btnEl.classList.add('active');

  // Toggle panel
  var panelResmi = document.getElementById('tema-panel-resmi');
  var panelKhusus = document.getElementById('tema-panel-khusus');

  if (tab === 'resmi') {
    if (panelResmi) panelResmi.classList.add('active');
    if (panelKhusus) panelKhusus.classList.remove('active');
  } else {
    if (panelResmi) panelResmi.classList.remove('active');
    if (panelKhusus) panelKhusus.classList.add('active');
  }
}

// =============================================
// KOKURIKULER: Handle input tema khusus
// =============================================
function handleTemaKhususInput() {
  var input = document.getElementById('kk_temaKhusus');
  if (!input) return;
  var val = (input.value || '').trim();

  // Kalau tema khusus diisi, uncheck radio tema resmi
  if (val.length > 0) {
    document.querySelectorAll('input[name="kk_tema"]').forEach(function(r) {
      r.checked = false;
    });
  } else {
    // Kalau kosong, centang radio pertama kembali
    var firstRadio = document.querySelector('input[name="kk_tema"]');
    if (firstRadio) firstRadio.checked = true;
  }
}

// =============================================
// KOKURIKULER: Handle checkbox Dimensi (maks 3)
// =============================================
function handleDimensiChange(checkbox) {
  var checked = document.querySelectorAll('input[name="kk_dimensi"]:checked');
  var counterEl = document.getElementById('kk_dimensiCounter');
  var warningEl = document.getElementById('kk_dimensiWarning');

  // Kalau coba centang ke-4, batalkan
  if (checked.length > 3) {
    checkbox.checked = false;
    if (warningEl) {
      warningEl.style.display = 'block';
      setTimeout(function() { warningEl.style.display = 'none'; }, 3000);
    }
    checked = document.querySelectorAll('input[name="kk_dimensi"]:checked');
  }

  var count = checked.length;

  // Update counter
  if (counterEl) {
    counterEl.textContent = count + ' / 3';
    counterEl.className = 'dimensi-counter';
    if (count === 0) counterEl.classList.add('warning');
    else if (count <= 3) counterEl.classList.add('ok');
  }
}

// =============================================
// KOKURIKULER: Handle checkbox Mapel → render TP card
// =============================================
function handleMapelChange(checkbox) {
  var mapel = checkbox.value;
  var list = document.getElementById('kk_mapelTPList');
  var emptyEl = document.getElementById('kk_mapelEmpty');
  if (!list) return;

  if (checkbox.checked) {
    // Tambahkan TP card
    var card = document.createElement('div');
    card.className = 'mapel-tp-card';
    card.setAttribute('data-mapel', mapel);
    card.innerHTML =
      '<div class="mapel-tp-header">' +
        '<span class="mapel-tp-name"><i class="fas fa-book"></i> ' + escapeHtml(mapel) + '</span>' +
        '<button type="button" class="mapel-tp-remove" onclick="hapusMapel(\'' + escapeAttr(mapel) + '\')" title="Hapus"><i class="fas fa-times"></i></button>' +
      '</div>' +
      '<div>' +
        '<label>Tujuan Pembelajaran</label>' +
        '<textarea name="kk_tp_' + escapeAttr(mapel) + '" placeholder="Tulis tujuan pembelajaran untuk mapel ' + escapeHtml(mapel) + '..."></textarea>' +
      '</div>';
    list.appendChild(card);
  } else {
    // Hapus TP card
    var existing = list.querySelector('[data-mapel="' + mapel + '"]');
    if (existing) existing.remove();
  }

  updateMapelEmptyState();
}

// =============================================
// KOKURIKULER: Hapus Mapel (dari TP card button)
// =============================================
function hapusMapel(mapel) {
  // Uncheck chip mapel
  var chip = document.querySelector('.mapel-chip input[value="' + mapel + '"]');
  if (chip) chip.checked = false;

  // Hapus TP card
  var list = document.getElementById('kk_mapelTPList');
  if (list) {
    var card = list.querySelector('[data-mapel="' + mapel + '"]');
    if (card) card.remove();
  }

  updateMapelEmptyState();
}

// =============================================
// KOKURIKULER: Tambah Mapel Manual
// =============================================
function tambahMapelManual() {
  var input = document.getElementById('kk_mapelManualInput');
  if (!input) return;

  var val = (input.value || '').trim();
  if (!val) return;

  // Cek duplikat
  var existing = document.querySelector('.mapel-chip input[value="' + val + '"]');
  if (existing) {
    Swal.fire({ icon: 'info', title: 'Mapel Sudah Ada', text: 'Mapel "' + val + '" sudah ada di daftar.' });
    return;
  }

  // Buat chip baru
  var container = document.getElementById('kk_mapelChips');
  if (!container) return;

  var chip = document.createElement('label');
  chip.className = 'mapel-chip';
  chip.innerHTML =
    '<input type="checkbox" name="kk_mapel" value="' + escapeAttr(val) + '" checked onchange="handleMapelChange(this)">' +
    '<span>' + escapeHtml(val) + '</span>';
  container.appendChild(chip);

  // Trigger change → render TP card
  var newInput = chip.querySelector('input');
  if (newInput) {
    newInput.checked = true;
    handleMapelChange(newInput);
  }

  // Clear input
  input.value = '';
  input.focus();
}

// =============================================
// KOKURIKULER: Update empty state mapel
// =============================================
function updateMapelEmptyState() {
  var list = document.getElementById('kk_mapelTPList');
  var emptyEl = document.getElementById('kk_mapelEmpty');
  if (!list || !emptyEl) return;

  var cards = list.querySelectorAll('.mapel-tp-card');
  if (cards.length === 0) {
    emptyEl.style.display = 'block';
  } else {
    emptyEl.style.display = 'none';
  }
}

// =============================================
// HELPER: Escape attribute value
// =============================================
function escapeAttr(str) {
  if (!str) return '';
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// =============================================
// HELPER: HITUNG TOTAL SOAL
// =============================================
function hitungTotalSoal() {
  var pgEl = document.getElementById('so_jumlahPG');
  var isianEl = document.getElementById('so_jumlahIsian');
  var esaiEl = document.getElementById('so_jumlahEsai');
  var displayEl = document.getElementById('so_totalSoalDisplay');
  var warningEl = document.getElementById('so_totalWarning');

  if (!pgEl || !isianEl || !esaiEl || !displayEl) return;

  var pg = parseInt(pgEl.value, 10) || 0;
  var isian = parseInt(isianEl.value, 10) || 0;
  var esai = parseInt(esaiEl.value, 10) || 0;
  var total = pg + isian + esai;

  displayEl.textContent = total;

  if (total > 30) {
    if (warningEl) warningEl.style.display = 'block';
    displayEl.style.color = '#991b1b';
  } else {
    if (warningEl) warningEl.style.display = 'none';
    displayEl.style.color = '';
  }
}

// =============================================
// HELPER: UPDATE PROPORS I (Slider)
// =============================================
function updateProporsi() {
  var mudahEl = document.getElementById('so_propMudah');
  var sedangEl = document.getElementById('so_propSedang');
  var sulitEl = document.getElementById('so_propSulit');
  var valMudahEl = document.getElementById('so_valMudah');
  var valSedangEl = document.getElementById('so_valSedang');
  var valSulitEl = document.getElementById('so_valSulit');
  var warningEl = document.getElementById('so_proporsiWarning');

  if (!mudahEl || !sedangEl || !sulitEl) return;

  var mudah = parseInt(mudahEl.value, 10) || 0;
  var sedang = parseInt(sedangEl.value, 10) || 0;
  var sulit = parseInt(sulitEl.value, 10) || 0;
  var total = mudah + sedang + sulit;

  if (valMudahEl) valMudahEl.textContent = mudah + '%';
  if (valSedangEl) valSedangEl.textContent = sedang + '%';
  if (valSulitEl) valSulitEl.textContent = sulit + '%';

  if (warningEl) {
    if (total === 100) {
      warningEl.className = 'proporsi-total-warning ok';
      warningEl.innerHTML = '<i class="fas fa-check-circle"></i> Total: 100% — OK';
    } else {
      warningEl.className = 'proporsi-total-warning err';
      warningEl.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Total: ' + total + '% — akan auto-normalisasi ke 100%';
    }
  }

  // Cek HOTs warning
  cekHOTsWarning();
}

// =============================================
// HELPER: CEK HOTs (C5/C6 dipilih)
// =============================================
function cekHOTsWarning() {
  var c5 = document.getElementById('so_kogC5');
  var c6 = document.getElementById('so_kogC6');
  var warningEl = document.getElementById('so_hotsWarning');

  if (!c5 || !c6 || !warningEl) return;

  var adaHOTs = c5.checked || c6.checked;
  warningEl.style.display = adaHOTs ? 'block' : 'none';

  // Auto-adjust proporsi minimal Sulit 30% kalau ada HOTs
  if (adaHOTs) {
    var sulitEl = document.getElementById('so_propSulit');
    if (sulitEl && parseInt(sulitEl.value, 10) < 30) {
      sulitEl.value = 30;
      var valSulitEl = document.getElementById('so_valSulit');
      if (valSulitEl) valSulitEl.textContent = '30%';

      // Sesuaikan sedang & mudah
      var sedangEl = document.getElementById('so_propSedang');
      var mudahEl = document.getElementById('so_propMudah');
      if (sedangEl && mudahEl) {
        var sedang = parseInt(sedangEl.value, 10) || 0;
        var mudahBaru = 100 - 30 - sedang;
        if (mudahBaru < 0) {
          mudahBaru = 0;
          sedang = 70;
          sedangEl.value = 70;
          var valSedangEl = document.getElementById('so_valSedang');
          if (valSedangEl) valSedangEl.textContent = '70%';
        }
        mudahEl.value = mudahBaru;
        var valMudahEl = document.getElementById('so_valMudah');
        if (valMudahEl) valMudahEl.textContent = mudahBaru + '%';
      }
    }
  }
}

// =============================================
// HELPER: HITUNG TOTAL JP (Prota)
// =============================================
function hitungTotalJP() {
  var mingguEl = document.getElementById('pt_mingguEfektif');
  var jpEl = document.getElementById('pt_jpPerMinggu');
  var displayEl = document.getElementById('pt_totalJPDisplay');

  if (!mingguEl || !jpEl || !displayEl) return;

  var minggu = parseInt(mingguEl.value, 10) || 0;
  var jp = parseInt(jpEl.value, 10) || 0;
  var perSemester = minggu * jp;
  var perTahun = perSemester * 2;

  displayEl.innerHTML =
    minggu + ' minggu × ' + jp + ' JP = <strong>' + perSemester + ' JP</strong> per semester | ' +
    '<strong>' + perTahun + ' JP</strong> per tahun';
}

// =============================================
// INIT: Attach listener ke chip kognitif (dipanggil setelah render)
// =============================================
function attachKognitifListeners() {
  var ids = ['so_kogC3', 'so_kogC4', 'so_kogC5', 'so_kogC6'];
  ids.forEach(function(id) {
    var el = document.getElementById(id);
    if (el && !el.dataset.listenerAttached) {
      el.dataset.listenerAttached = '1';
      el.addEventListener('change', function() {
        cekHOTsWarning();
      });
    }
  });
}

// =============================================
// HELPER: TOGGLE UPLOAD CP
// =============================================
function toggleUploadCP() {
  var checkbox = document.getElementById('pt_punyaFile');
  var container = document.getElementById('pt_uploadContainer');
  if (checkbox && container) {
    container.style.display = checkbox.checked ? 'block' : 'none';
  }
}

// =============================================
// HELPER: HANDLE UPLOAD CP (LOKAL — tidak kirim ke Drive)
// =============================================
function handleCPUpload(input) {
  var nameSpan = document.getElementById('pt_fileCP_name');
  if (!nameSpan) return;

  if (input.files && input.files[0]) {
    var file = input.files[0];

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({ icon: 'warning', title: 'File Terlalu Besar', text: 'Maksimal 5 MB.' });
      input.value = '';
      nameSpan.textContent = 'Belum ada file dipilih';
      return;
    }

    // ⭐ Simpan file ke state (lokal)
    aiGuruState.cpFileObject = file;
    aiGuruState.cpFileName = file.name;
    aiGuruState.cpFileSize = file.size;

    var size = (file.size / 1024).toFixed(1);
    nameSpan.textContent = '📎 ' + file.name + ' (' + size + ' KB)';
    nameSpan.style.color = 'var(--primary-dark)';
    nameSpan.style.fontWeight = '700';

    var displayEl = document.getElementById('pt_cpUrlDisplay');
    if (displayEl) {
      displayEl.style.display = 'block';
      displayEl.innerHTML = '✅ File tersimpan di session: <strong>' + file.name + '</strong> (' + size + ' KB)' +
        '<br><span style="font-size:11px;color:#047857;">File tidak dikirim ke Drive. Akan hilang saat halaman di-refresh.</span>';
    }
  } else {
    aiGuruState.cpFileObject = null;
    aiGuruState.cpFileName = '';
    aiGuruState.cpFileSize = 0;

    nameSpan.textContent = 'Belum ada file dipilih';
    nameSpan.style.color = 'var(--text-muted)';
    nameSpan.style.fontWeight = '400';

    var displayEl = document.getElementById('pt_cpUrlDisplay');
    if (displayEl) displayEl.style.display = 'none';
  }
}

// =============================================
// SWITCH TAB (Panel utama)
// =============================================
function switchAITab(tabId) {
  aiGuruState.activeTab = tabId;
  document.querySelectorAll('.ai-tab-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  document.querySelectorAll('.ai-panel').forEach(function(panel) {
    panel.classList.add('hidden');
  });
  var activePanel = document.getElementById('ai-panel-' + tabId);
  if (activePanel) activePanel.classList.remove('hidden');
}

// =============================================
// SUBMIT FORM
// =============================================
function aiGuruSubmit(fitur) {
  try {
    // ⭐ Reset isLoading kalau stuck
    if (aiGuruState.isLoading) {
      console.warn('[AI Guru] isLoading stuck, reset paksa.');
      aiGuruState.isLoading = false;
    }

    var params = collectFormParams(fitur);
    console.log('[AI Guru] Params:', params);

    if (!params) return;
    if (!validateParams(fitur, params)) return;

    aiGuruState.isLoading = true;
    aiGuruState.lastFitur = fitur;
    aiGuruState.lastParams = params;

    var outputContainer = document.getElementById('ai-output-' + fitur);
    if (outputContainer) {
      outputContainer.innerHTML =
        '<div class="card ai-loading-card">' +
          '<div class="ai-loading-spinner"></div>' +
          '<div class="ai-loading-text"><i class="fas fa-magic"></i> AI sedang menyusun dokumen...</div>' +
          '<div class="ai-loading-subtext">Proses ini memakan waktu 60-90 detik. Mohon bersabar.</div>' +
        '</div>';
      outputContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    setFormButtonsDisabled(fitur, true);

    google.script.run
      .withSuccessHandler(function(result) {
        console.log('[AI Guru] Response:', result);
        aiGuruState.isLoading = false;
        aiGuruState.lastResult = result;
        setFormButtonsDisabled(fitur, false);
        renderAIOutput(fitur, result);
      })
      .withFailureHandler(function(err) {
        console.error('[AI Guru] Error:', err);
        aiGuruState.isLoading = false;
        setFormButtonsDisabled(fitur, false);
        var oc = document.getElementById('ai-output-' + fitur);
        if (oc) {
          oc.innerHTML =
            '<div class="card" style="background:#fee2e2;border:1px solid #fca5a5;padding:18px;">' +
              '<div style="font-weight:800;color:#991b1b;font-size:14px;"><i class="fas fa-exclamation-circle"></i> Terjadi Kesalahan</div>' +
              '<div style="font-size:12.5px;color:#7f1d1d;margin-top:6px;">' + (err && err.message ? err.message : 'Unknown error') + '</div>' +
              '<button type="button" class="btn btn-outline btn-sm" onclick="aiGuruSubmit(\'' + fitur + '\')" style="margin-top:10px;"><i class="fas fa-redo"></i> Coba Lagi</button>' +
            '</div>';
        }
      })
      .aiGuruGenerate(fitur, params);

  } catch (e) {
    aiGuruState.isLoading = false;
    setFormButtonsDisabled(fitur, false);
    console.error('[AI Guru] Exception:', e);
    Swal.fire({ icon: 'error', title: 'Error', text: e.message });
  }
}

// =============================================
// VALIDASI
// =============================================
function validateParams(fitur, params) {
  if (fitur === 'prota') {
    if (!params.mapel) { Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Mohon isi mata pelajaran.' }); return false; }
    if (!params.jurusan) { Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Mohon isi jurusan.' }); return false; }
    if (!params.mingguEfektif || params.mingguEfektif < 1) { Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Mohon isi minggu efektif.' }); return false; }
    if (!params.jpPerMinggu || params.jpPerMinggu < 1) { Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Mohon isi JP per minggu.' }); return false; }
    if (!params.semester || params.semester.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Pilih Semester', text: 'Mohon centang minimal 1 semester.' });
      return false;
    }
  } else if (fitur === 'modul_ajar') {
    if (!params.mapel || !params.jurusan) { Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Mohon isi jurusan & mata pelajaran.' }); return false; }
  } else if (fitur === 'soal') {
    if (!params.mapel) { Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Mohon isi mata pelajaran.' }); return false; }
    if (!params.materi) { Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Mohon isi materi/topik soal.' }); return false; }
    if (params.totalSoal < 1) { Swal.fire({ icon: 'warning', title: 'Komposisi Soal Kosong', text: 'Mohon isi minimal 1 soal (PG / Isian / Esai).' }); return false; }
    if (params.totalSoal > 30) { Swal.fire({ icon: 'warning', title: 'Terlalu Banyak', text: 'Total soal maksimal 30. Sekarang: ' + params.totalSoal + ' soal.' }); return false; }
    if (!params.levelKognitif || params.levelKognitif.length < 2) { Swal.fire({ icon: 'warning', title: 'Level Kognitif Kurang', text: 'Pilih minimal 2 level kognitif (C3-C6).' }); return false; }
  } else if (fitur === 'kokurikuler') {
    // Tema: dari resmi atau khusus
    var temaFinal = params.temaKhusus && params.temaKhusus.trim() !== ''
      ? params.temaKhusus.trim()
      : params.tema;

    if (!temaFinal) {
      Swal.fire({ icon: 'warning', title: 'Tema Belum Dipilih', text: 'Pilih tema resmi atau isi tema khusus.' });
      return false;
    }
    if (!params.topik) {
      Swal.fire({ icon: 'warning', title: 'Topik Kosong', text: 'Mohon isi topik / sub-tema projek.' });
      return false;
    }
    if (!params.dimensi || params.dimensi.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Pilih Dimensi', text: 'Pilih minimal 1 dimensi lulusan.' });
      return false;
    }
    if (params.dimensi.length > 3) {
      Swal.fire({ icon: 'warning', title: 'Terlalu Banyak Dimensi', text: 'Maksimal 3 dimensi lulusan.' });
      return false;
    }
    if (!params.integrasiMapel || params.integrasiMapel.length === 0) {
      Swal.fire({ icon: 'warning', title: 'Belum Pilih Mapel', text: 'Pilih minimal 1 mata pelajaran untuk integrasi.' });
      return false;
    }
    // Cek TP semua mapel terisi
    var belumIsiTP = [];
    params.integrasiMapel.forEach(function(m) {
      if (!params.mapelTP[m] || params.mapelTP[m].trim() === '') belumIsiTP.push(m);
    });
    if (belumIsiTP.length > 0) {
      Swal.fire({
        icon: 'warning',
        title: 'TP Belum Lengkap',
        html: 'Tujuan Pembelajaran belum diisi untuk:<br><strong>' + belumIsiTP.join(', ') + '</strong>'
      });
      return false;
    }
  }
  return true;
}

// =============================================
// COLLECT FORM PARAMS
// =============================================
function collectFormParams(fitur) {
  function val(id) { var el = document.getElementById(id); return el ? el.value.trim() : ''; }
  function check(id) { var el = document.getElementById(id); return el ? el.checked : false; }

  if (fitur === 'prota') {
    var semesterList = [];
    if (check('pt_semesterGanjil')) semesterList.push('Ganjil');
    if (check('pt_semesterGenap')) semesterList.push('Genap');

    return {
      namaGuru: val('pt_namaGuru'),
      nipGuru: val('pt_nipGuru'),
      sekolah: val('pt_sekolah'),
      mapel: val('pt_mapel'),
      jurusan: val('pt_jurusan'),
      fase: val('pt_fase'),
      kelas: val('pt_kelas'),
      tahunAjaran: val('pt_tahunAjaran'),
      semester: semesterList,
      kdCp: val('pt_kdCp'),
      cpFileName: aiGuruState.cpFileName,
      cpFileSize: aiGuruState.cpFileSize,
      mingguEfektif: val('pt_mingguEfektif'),
      jpPerMinggu: val('pt_jpPerMinggu')
    };
  }

  if (fitur === 'modul_ajar') {
    var dimensiCheckedMA = [];
    document.querySelectorAll('#ai-panel-modul_ajar input[name^="dimensi_"]:checked').forEach(function(el) { dimensiCheckedMA.push(el.value); });
    return {
      namaGuru: val('ma_namaGuru'), nipGuru: val('ma_nipGuru'), tahunAjaran: val('ma_tahunAjaran'),
      jurusan: val('ma_jurusan'), fase: val('ma_fase'), kelas: val('ma_kelas'), mapel: val('ma_mapel'),
      materi: val('ma_materi'), jumlahPertemuan: val('ma_jumlahPertemuan'), alokasiPerPertemuan: val('ma_alokasiPerPertemuan'),
      modelPembelajaran: val('ma_modelPembelajaran'), targetPesertaDidik: val('ma_targetPesertaDidik'),
      kdCp: val('ma_kdCp'), kompetensiAwal: val('ma_kompetensiAwal'), tujuan: val('ma_tujuan'),
      saranaPrasarana: val('ma_saranaPrasarana'), dimensiLulusan: dimensiCheckedMA, versi: val('ma_versi')
    };
  }

  if (fitur === 'soal') {
    var jmlPG = parseInt(val('so_jumlahPG'), 10) || 0;
    var jmlIsian = parseInt(val('so_jumlahIsian'), 10) || 0;
    var jmlEsai = parseInt(val('so_jumlahEsai'), 10) || 0;

    var levelKog = [];
    if (check('so_kogC3')) levelKog.push('C3');
    if (check('so_kogC4')) levelKog.push('C4');
    if (check('so_kogC5')) levelKog.push('C5');
    if (check('so_kogC6')) levelKog.push('C6');

    return {
      namaGuru: val('so_namaGuru'),
      nipGuru: val('so_nipGuru'),
      sekolah: val('so_sekolah'),
      jurusan: val('so_jurusan'),
      mapel: val('so_mapel'),
      kelas: val('so_kelas'),
      tahunAjaran: val('so_tahunAjaran'),
      jenisAsesmen: val('so_jenisAsesmen'),
      alokasi: val('so_alokasi'),
      opsiPG: val('so_opsiPG'),
      jumlahPG: jmlPG,
      jumlahIsian: jmlIsian,
      jumlahEsai: jmlEsai,
      totalSoal: jmlPG + jmlIsian + jmlEsai,
      propMudah: val('so_propMudah'),
      propSedang: val('so_propSedang'),
      propSulit: val('so_propSulit'),
      levelKognitif: levelKog,
      pakaiIlustrasi: check('so_pakaiIlustrasi'),
      pakaiDiagram: check('so_pakaiDiagram'),
      pakaiPetaKonsep: check('so_pakaiPetaKonsep'),
      materi: val('so_materi'),
      kdCp: val('so_kdCp')
    };
  }

  if (fitur === 'kokurikuler') {
    var dimensiCheckedKK = [];
    document.querySelectorAll('#ai-panel-kokurikuler input[name="kk_dimensi"]:checked').forEach(function(el) {
      dimensiCheckedKK.push(el.value);
    });

    var temaResmi = '';
    var radioChecked = document.querySelector('#ai-panel-kokurikuler input[name="kk_tema"]:checked');
    if (radioChecked) temaResmi = radioChecked.value;
    var temaKhusus = val('kk_temaKhusus');

    var integrasiMapel = [];
    var mapelTP = {};
    document.querySelectorAll('#ai-panel-kokurikuler input[name="kk_mapel"]:checked').forEach(function(el) {
      var mapelName = el.value;
      integrasiMapel.push(mapelName);
      var tpTextarea = document.querySelector('#kk_mapelTPList textarea[name="kk_tp_' + mapelName + '"]');
      mapelTP[mapelName] = tpTextarea ? tpTextarea.value.trim() : '';
    });

    return {
      namaGuru: val('kk_namaGuru'),
      sekolah: val('kk_sekolah'),
      kelas: val('kk_kelas'),
      tahunAjaran: val('kk_tahunAjaran'),
      tema: temaResmi,
      temaKhusus: temaKhusus,
      dimensi: dimensiCheckedKK,
      pendekatan: val('kk_pendekatan'),
      alokasi: val('kk_alokasi'),
      sesi: val('kk_sesi'),
      kondisiLingkungan: val('kk_kondisiLingkungan'),
      integrasiMapel: integrasiMapel,
      mapelTP: mapelTP,
      topik: val('kk_topik'),
      deskripsi: val('kk_deskripsi')
    };
  }

  return {};
}

// =============================================
// SET BUTTONS DISABLED
// =============================================
function setFormButtonsDisabled(fitur, disabled) {
  var panel = document.getElementById('ai-panel-' + fitur);
  if (!panel) return;
  var btns = panel.querySelectorAll('.ai-form-actions button');
  btns.forEach(function(b) {
    b.disabled = disabled;
    if (disabled) { b.style.opacity = '0.5'; b.style.cursor = 'wait'; }
    else { b.style.opacity = ''; b.style.cursor = ''; }
  });
}

// =============================================
// RESET FORM
// =============================================
function aiGuruResetForm(fitur) {
  Swal.fire({
    title: 'Reset Form?', text: 'Semua isian di form akan dikosongkan.',
    icon: 'question', showCancelButton: true,
    confirmButtonText: 'Ya, Reset', cancelButtonText: 'Batal',
    confirmButtonColor: '#ef4444'
  }).then(function(res) {
    if (!res.isConfirmed) return;
    var panel = document.getElementById('ai-panel-' + fitur);
    if (!panel) return;
    panel.querySelectorAll('input[type="text"], textarea').forEach(function(el) {
      if (el.id !== 'so_sekolah' && el.id !== 'so_tahunAjaran' && el.id !== 'so_alokasi') {
        el.value = '';
      }
    });
    panel.querySelectorAll('input[type="number"]').forEach(function(el) { el.value = el.defaultValue || ''; });
    panel.querySelectorAll('select').forEach(function(el) { el.selectedIndex = el.id === 'so_opsiPG' ? 1 : 0; });

    // Reset checkbox
    panel.querySelectorAll('input[type="checkbox"]').forEach(function(el) {
      if (el.id === 'pt_semesterGanjil') el.checked = true;
      else if (el.id === 'so_kogC3') el.checked = true;
      else if (el.id === 'so_kogC4') el.checked = true;
      else el.checked = false;
    });

    // Khusus Prota: reset UI upload + clear state file
    aiGuruState.cpFileObject = null;
    aiGuruState.cpFileName = '';
    aiGuruState.cpFileSize = 0;

    var uploadContainer = document.getElementById('pt_uploadContainer');
    if (uploadContainer) uploadContainer.style.display = 'none';
    var fileCP = document.getElementById('pt_fileCP');
    if (fileCP) fileCP.value = '';
    var fileCPName = document.getElementById('pt_fileCP_name');
    if (fileCPName) fileCPName.textContent = 'Belum ada file dipilih';
    var cpUrlDisplay = document.getElementById('pt_cpUrlDisplay');
    if (cpUrlDisplay) cpUrlDisplay.style.display = 'none';

    // Reset output
    var outputContainer = document.getElementById('ai-output-' + fitur);
    if (outputContainer) outputContainer.innerHTML = '';

    // Auto-fill ulang
    autoFillGuruFields();

    Swal.fire({ icon: 'success', title: 'Form direset', timer: 1200, showConfirmButton: false, toast: true, position: 'top-end' });
  });
}

// =============================================
// RENDER OUTPUT
// =============================================
function renderAIOutput(fitur, result) {
  var outputContainer = document.getElementById('ai-output-' + fitur);
  if (!outputContainer) return;
  if (!result) { outputContainer.innerHTML = '<div class="card" style="background:#fee2e2;padding:18px;">Response kosong dari server.</div>'; return; }

  // ⭐ Khusus Prota: tampilkan 2 tab (Prota & Promes)
  if (fitur === 'prota' && result.mode === 'ai') {
    renderProtaOutput(outputContainer, result);
    return;
  }

  // ⭐ Khusus Soal: tampilkan 4 sub-tab (Soal / Kunci / Pembahasan / Kisi-Kisi)
  if (fitur === 'soal' && result.mode === 'ai') {
    renderSoalOutput(outputContainer, result);
    return;
  }

  // Fitur lain: 1 dokumen
  if (result.mode === 'ai' && result.html) {
    outputContainer.innerHTML =
      '<div class="card ai-result-card">' +
        '<div class="ai-result-toolbar">' +
          '<div class="ai-result-badge ai-badge-success"><i class="fas fa-check-circle"></i> Mode AI — Berhasil di-generate</div>' +
          '<div class="ai-result-actions">' +
            '<button type="button" class="btn btn-primary btn-sm" onclick="aiGuruDownloadWord()"><i class="fas fa-download"></i> Download Word</button>' +
            '<button type="button" class="btn btn-outline btn-sm" onclick="aiGuruPreview()"><i class="fas fa-eye"></i> Preview</button>' +
            '<button type="button" class="btn btn-outline btn-sm" onclick="aiGuruSubmit(\'' + fitur + '\')"><i class="fas fa-redo"></i> Regenerate</button>' +
          '</div>' +
        '</div>' +
        '<div class="ai-result-preview" id="ai-result-preview">' + result.html + '</div>' +
      '</div>';
    return;
  }

  // Fallback mode
  if (result.mode === 'fallback' && result.prompt) {
    outputContainer.innerHTML =
      '<div class="card ai-result-card ai-result-fallback">' +
        '<div class="ai-result-toolbar"><div class="ai-result-badge ai-badge-warning"><i class="fas fa-exclamation-triangle"></i> Mode Cepat — Copy prompt manual</div></div>' +
        '<div class="ai-fallback-note"><i class="fas fa-info-circle"></i> ' + escapeHtml(result.message || '') + '</div>' +
        '<div class="ai-fallback-steps">' +
          '<div class="ai-step"><span class="ai-step-num">1</span> Copy prompt di bawah</div>' +
          '<div class="ai-step"><span class="ai-step-num">2</span> Klik tombol "Buka AI Chat"</div>' +
          '<div class="ai-step"><span class="ai-step-num">3</span> Paste prompt di AI chat</div>' +
          '<div class="ai-step"><span class="ai-step-num">4</span> Copy hasil → paste ke Word</div>' +
        '</div>' +
        '<div class="ai-prompt-box"><pre id="ai-prompt-text">' + escapeHtml(result.prompt) + '</pre></div>' +
        '<div class="ai-result-actions" style="margin-top:12px;">' +
          '<button type="button" class="btn btn-primary btn-sm" onclick="aiGuruCopyPrompt()"><i class="fas fa-copy"></i> Copy Prompt</button>' +
          '<button type="button" class="btn btn-wa btn-sm" onclick="aiGuruOpenAI()"><i class="fas fa-external-link-alt"></i> Buka AI Chat</button>' +
        '</div>' +
      '</div>';
    return;
  }

  // Debug: tampilkan struktur respons kalau tidak dikenal
  outputContainer.innerHTML =
    '<div class="card" style="background:#fee2e2;padding:18px;">' +
      '<div style="font-weight:800;color:#991b1b;margin-bottom:8px;">Format response tidak dikenal.</div>' +
      '<div style="font-size:11px;color:#7f1d1d;font-family:monospace;white-space:pre-wrap;max-height:200px;overflow:auto;">' +
        escapeHtml(JSON.stringify(result, null, 2)) +
      '</div>' +
    '</div>';
}

// =============================================
// RENDER OUTPUT PROTA & PROMES (2 TAB)
// =============================================
function renderProtaOutput(container, result) {
  var htmlProta = result.htmlProta || '<div style="padding:20px;text-align:center;color:#94a3b8;">Prota tidak tersedia</div>';
  var htmlPromes = result.htmlPromes || '<div style="padding:20px;text-align:center;color:#94a3b8;">Promes tidak tersedia</div>';

  container.innerHTML =
    '<div class="card ai-result-card">' +
      '<div class="ai-result-toolbar">' +
        '<div class="ai-result-badge ai-badge-success"><i class="fas fa-check-circle"></i> ' + escapeHtml(result.message || 'Berhasil di-generate') + '</div>' +
        '<div class="ai-result-actions">' +
          '<button type="button" class="btn btn-primary btn-sm" onclick="aiGuruDownloadProta()"><i class="fas fa-download"></i> Download Prota Word</button>' +
          '<button type="button" class="btn btn-primary btn-sm" style="background:linear-gradient(135deg,#059669,#047857);" onclick="aiGuruDownloadPromes()"><i class="fas fa-download"></i> Download Promes Word</button>' +
          '<button type="button" class="btn btn-outline btn-sm" onclick="aiGuruSubmit(\'prota\')"><i class="fas fa-redo"></i> Regenerate</button>' +
        '</div>' +
      '</div>' +

      // Tab internal untuk preview
      '<div class="ai-preview-tabs" style="display:flex;gap:6px;margin-bottom:14px;border-bottom:1px solid var(--border);padding-bottom:0;">' +
        '<button type="button" class="ai-preview-tab-btn active" id="tab-btn-prota" onclick="switchPreviewTab(\'prota\')" style="padding:10px 20px;border:none;background:transparent;font-weight:700;font-size:13px;color:var(--primary-dark);border-bottom:3px solid var(--primary);cursor:pointer;transition:all 0.2s;">' +
          '<i class="fas fa-calendar-alt"></i> Prota' +
        '</button>' +
        '<button type="button" class="ai-preview-tab-btn" id="tab-btn-promes" onclick="switchPreviewTab(\'promes\')" style="padding:10px 20px;border:none;background:transparent;font-weight:700;font-size:13px;color:#94a3b8;border-bottom:3px solid transparent;cursor:pointer;transition:all 0.2s;">' +
          '<i class="fas fa-calendar-week"></i> Promes' +
        '</button>' +
      '</div>' +

      '<div class="ai-result-preview" id="ai-preview-prota" style="display:block;">' + htmlProta + '</div>' +
      '<div class="ai-result-preview" id="ai-preview-promes" style="display:none;">' + htmlPromes + '</div>' +
    '</div>';
}

// =============================================
// ⭐ RENDER OUTPUT SOAL (4 Sub-Tab)
// =============================================
function renderSoalOutput(container, result) {
  var html = result.html || '';
  var splitResult = splitSoalBySection(html);

  container.innerHTML =
    '<div class="card ai-result-card">' +
      '<div class="ai-result-toolbar">' +
        '<div class="ai-result-badge ai-badge-success"><i class="fas fa-check-circle"></i> Soal berhasil di-generate</div>' +
        '<div class="ai-result-actions">' +
          '<button type="button" class="btn btn-primary btn-sm" onclick="aiGuruDownloadWord()"><i class="fas fa-download"></i> Download Word</button>' +
          '<button type="button" class="btn btn-outline btn-sm" onclick="aiGuruSubmit(\'soal\')"><i class="fas fa-redo"></i> Regenerate</button>' +
        '</div>' +
      '</div>' +

      '<div class="preview-subtabs">' +
        '<button type="button" class="preview-subtab-btn active" onclick="switchSoalSubTab(\'soal\', this)"><i class="fas fa-question-circle"></i> Soal</button>' +
        '<button type="button" class="preview-subtab-btn" onclick="switchSoalSubTab(\'kunci\', this)"><i class="fas fa-key"></i> Kunci Jawaban</button>' +
        '<button type="button" class="preview-subtab-btn" onclick="switchSoalSubTab(\'pembahasan\', this)"><i class="fas fa-book-open"></i> Pembahasan</button>' +
        '<button type="button" class="preview-subtab-btn" onclick="switchSoalSubTab(\'kisi\', this)"><i class="fas fa-table"></i> Kisi-Kisi</button>' +
      '</div>' +

      '<div class="preview-subtab-content" id="soal-subtab-soal" style="display:block;">' +
        '<div class="ai-result-preview">' + (splitResult.soal || html) + '</div>' +
      '</div>' +
      '<div class="preview-subtab-content" id="soal-subtab-kunci" style="display:none;">' +
        '<div class="ai-result-preview">' + (splitResult.kunci || '<p style="color:#94a3b8;text-align:center;">Kunci jawaban tidak tersedia</p>') + '</div>' +
      '</div>' +
      '<div class="preview-subtab-content" id="soal-subtab-pembahasan" style="display:none;">' +
        '<div class="ai-result-preview">' + (splitResult.pembahasan || '<p style="color:#94a3b8;text-align:center;">Pembahasan tidak tersedia</p>') + '</div>' +
      '</div>' +
      '<div class="preview-subtab-content" id="soal-subtab-kisi" style="display:none;">' +
        '<div class="ai-result-preview">' + (splitResult.kisi || '<p style="color:#94a3b8;text-align:center;">Kisi-kisi tidak tersedia</p>') + '</div>' +
      '</div>' +

      // Prompt gambar (kalau ada)
      (splitResult.promptGambar ?
        '<div style="margin-top:20px;">' +
          '<h3 style="font-size:14px;font-weight:800;color:var(--primary-dark);margin-bottom:10px;">' +
            '<i class="fas fa-image"></i> Prompt Gambar (Copy ke Midjourney / DALL-E / Gemini Image)' +
          '</h3>' +
          '<div style="font-size:11.5px;color:var(--text-muted);margin-bottom:12px;">' +
            'Klik "Copy" untuk menyalin prompt, lalu paste di tool image generator favorit Anda.' +
          '</div>' +
          '<div class="prompt-gambar-list">' + splitResult.promptGambar + '</div>' +
          '<button type="button" class="btn btn-outline btn-sm" style="margin-top:12px;" onclick="copyAllPrompts()">' +
            '<i class="fas fa-copy"></i> Copy Semua Prompt' +
          '</button>' +
        '</div>'
      : '') +
    '</div>';
}

// =============================================
// ⭐ HELPER: SPLIT HTML SOAL MENJADI 4 BAGIAN
// =============================================
function splitSoalBySection(html) {
  if (!html) return { soal: '', kunci: '', pembahasan: '', kisi: '', promptGambar: '' };

  var result = { soal: '', kunci: '', pembahasan: '', kisi: '', promptGambar: '' };

  // Cari posisi heading untuk split
  // Pattern: <h2>A. ... </h2>, <h2>B. ... </h2>, dst
  var h2Regex = /<h2[^>]*>\s*([A-Z])\.\s*([^<]+)<\/h2>/gi;
  var matches = [];
  var m;
  while ((m = h2Regex.exec(html)) !== null) {
    matches.push({
      letter: m[1],
      title: m[2].trim().toUpperCase(),
      startIndex: m.index,
      headingEnd: h2Regex.lastIndex
    });
  }

  if (matches.length === 0) {
    // Fallback: semua di "soal"
    return { soal: html, kunci: '', pembahasan: '', kisi: '', promptGambar: '' };
  }

  // Ambil bagian sebelum heading pertama (judul + identitas) → masuk ke "soal"
  var intro = html.substring(0, matches[0].startIndex);
  var soalParts = [intro];

  // Loop setiap section
  for (var i = 0; i < matches.length; i++) {
    var sec = matches[i];
    var nextStart = (i + 1 < matches.length) ? matches[i + 1].startIndex : html.length;
    var secContent = html.substring(sec.startIndex, nextStart);

    var titleUpper = sec.title;

    if (titleUpper.indexOf('SOAL') !== -1 && titleUpper.indexOf('KUNCI') === -1) {
      // Soal (Pilihan Ganda / Isian / Esai)
      soalParts.push(secContent);
    } else if (titleUpper.indexOf('KUNCI') !== -1) {
      result.kunci = secContent;
    } else if (titleUpper.indexOf('PEMBAHASAN') !== -1) {
      result.pembahasan = secContent;
    } else if (titleUpper.indexOf('KISI') !== -1) {
      result.kisi = secContent;
    } else if (titleUpper.indexOf('PROMPT GAMBAR') !== -1 || titleUpper.indexOf('GAMBAR') !== -1) {
      result.promptGambar = secContent;
    } else {
      // Default: masuk soal
      soalParts.push(secContent);
    }
  }

  result.soal = soalParts.join('');
  return result;
}

// =============================================
// SWITCH SUB-TAB (Soal / Kunci / Pembahasan / Kisi)
// =============================================
function switchSoalSubTab(tab, btnEl) {
  var tabs = ['soal', 'kunci', 'pembahasan', 'kisi'];
  tabs.forEach(function(t) {
    var content = document.getElementById('soal-subtab-' + t);
    if (content) content.style.display = (t === tab) ? 'block' : 'none';
  });

  if (btnEl) {
    var container = btnEl.parentNode;
    if (container) {
      container.querySelectorAll('.preview-subtab-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      btnEl.classList.add('active');
    }
  }
}

// =============================================
// ⭐ COPY SEMUA PROMPT GAMBAR
// =============================================
function copyAllPrompts() {
  var promptCards = document.querySelectorAll('.prompt-gambar-card');
  if (promptCards.length === 0) {
    Swal.fire({ icon: 'info', title: 'Tidak ada prompt', text: 'Tidak ada prompt gambar untuk dicopy.' });
    return;
  }

  var allText = '';
  promptCards.forEach(function(card, idx) {
    var title = card.querySelector('.prompt-title');
    var body = card.querySelector('.prompt-body');
    if (title) allText += title.textContent.trim() + '\n';
    if (body) allText += body.textContent.trim() + '\n';
    allText += '\n' + '─'.repeat(40) + '\n\n';
  });

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(allText).then(function() {
      Swal.fire({ icon: 'success', title: 'Semua prompt tercopy!', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
    }).catch(function() { fallbackCopy(allText); });
  } else {
    fallbackCopy(allText);
  }
}

// =============================================
// ⭐ COPY PROMPT GAMBAR SATU PER SATU
// =============================================
function copyOnePrompt(btnEl) {
  var card = btnEl.closest('.prompt-gambar-card');
  if (!card) return;

  var title = card.querySelector('.prompt-title');
  var body = card.querySelector('.prompt-body');
  var text = '';
  if (title) text += title.textContent.trim() + '\n';
  if (body) text += body.textContent.trim();

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      Swal.fire({ icon: 'success', title: 'Prompt tercopy!', timer: 1200, showConfirmButton: false, toast: true, position: 'top-end' });
    }).catch(function() { fallbackCopy(text); });
  } else {
    fallbackCopy(text);
  }
}

// =============================================
// SWITCH PREVIEW TAB (Prota / Promes)
// =============================================
function switchPreviewTab(tab) {
  aiGuruState.previewTab = tab;

  var btnProta = document.getElementById('tab-btn-prota');
  var btnPromes = document.getElementById('tab-btn-promes');
  var panelProta = document.getElementById('ai-preview-prota');
  var panelPromes = document.getElementById('ai-preview-promes');

  if (!btnProta || !btnPromes || !panelProta || !panelPromes) return;

  if (tab === 'prota') {
    btnProta.classList.add('active');
    btnProta.style.color = 'var(--primary-dark)';
    btnProta.style.borderBottom = '3px solid var(--primary)';
    btnPromes.classList.remove('active');
    btnPromes.style.color = '#94a3b8';
    btnPromes.style.borderBottom = '3px solid transparent';
    panelProta.style.display = 'block';
    panelPromes.style.display = 'none';
  } else {
    btnPromes.classList.add('active');
    btnPromes.style.color = 'var(--primary-dark)';
    btnPromes.style.borderBottom = '3px solid var(--primary)';
    btnProta.classList.remove('active');
    btnProta.style.color = '#94a3b8';
    btnProta.style.borderBottom = '3px solid transparent';
    panelPromes.style.display = 'block';
    panelProta.style.display = 'none';
  }
}

// =============================================
// COPY PROMPT
// =============================================
function aiGuruCopyPrompt() {
  var pre = document.getElementById('ai-prompt-text');
  if (!pre) return;
  var text = pre.textContent || pre.innerText || '';
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function() {
      Swal.fire({ icon: 'success', title: 'Prompt tercopy!', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
    }).catch(function() { fallbackCopy(text); });
  } else { fallbackCopy(text); }
}

function fallbackCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text; ta.style.position = 'fixed'; ta.style.left = '-9999px';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); Swal.fire({ icon: 'success', title: 'Prompt tercopy!', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' }); }
  catch (e) { Swal.fire({ icon: 'error', title: 'Gagal copy', text: 'Copy manual dari kotak prompt.' }); }
  document.body.removeChild(ta);
}

// =============================================
// OPEN DEEPSEK
// =============================================
function aiGuruOpenAI() {
  var url = 'https://chat.deepseek.com/';
  if (aiGuruState.lastResult && aiGuruState.lastResult.fallbackUrl) {
    url = aiGuruState.lastResult.fallbackUrl;
  }
  window.open(url, '_blank');
}

// Alias untuk backward compatibility
function aiGuruOpenGemini() {
  aiGuruOpenAI();
}

// =============================================
// PREVIEW (Buka di tab baru)
// =============================================
function aiGuruPreview() {
  if (!aiGuruState.lastResult || !aiGuruState.lastResult.html) {
    Swal.fire({ icon: 'warning', title: 'Tidak ada hasil', text: 'Generate dulu sebelum preview.' });
    return;
  }
  openPreviewWindow(aiGuruState.lastResult.html);
}

function aiGuruPreviewProta() {
  if (!aiGuruState.lastResult || !aiGuruState.lastResult.htmlProta) {
    Swal.fire({ icon: 'warning', title: 'Tidak ada hasil', text: 'Generate dulu sebelum preview.' });
    return;
  }
  openPreviewWindow(aiGuruState.lastResult.htmlProta);
}

function aiGuruPreviewPromes() {
  if (!aiGuruState.lastResult || !aiGuruState.lastResult.htmlPromes) {
    Swal.fire({ icon: 'warning', title: 'Tidak ada hasil', text: 'Generate dulu sebelum preview.' });
    return;
  }
  openPreviewWindow(aiGuruState.lastResult.htmlPromes);
}

// =============================================
// PREVIEW — style SAMA dengan Word
// =============================================
function openPreviewWindow(html) {
  if (!html) {
    Swal.fire({ icon: 'warning', title: 'Tidak ada isi', text: 'Dokumen kosong.' });
    return;
  }

  var win = window.open('', '_blank');
  win.document.write(
    '<!DOCTYPE html>' +
    '<html><head><meta charset="UTF-8"><title>Preview Dokumen</title>' +
    '<style>' +

      // ═══ PAGE SETUP ═══
      '@page { size: A4; margin: 2cm; }' +
      'body { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; line-height: 1.15; color: #000; max-width: 21cm; margin: 0 auto; padding: 2cm; background: #fff; }' +

      // ═══ HEADING ═══
      'h1 { font-family: "Calibri", Calibri, sans-serif; font-size: 14pt; font-weight: bold; text-align: center; text-transform: uppercase; margin: 6pt 0; line-height: 1.0; page-break-after: avoid; }' +
      'h2 { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; font-weight: bold; text-transform: uppercase; margin: 6pt 0 3pt 0; padding: 0; border: none; line-height: 1.0; margin-left: 0; text-indent: -0.63cm; padding-left: 0.63cm; }' +
      'h3 { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; font-weight: bold; margin: 6pt 0 3pt 0; padding: 0; line-height: 1.0; margin-left: 0.63cm; text-indent: -1.27cm; padding-left: 1.27cm; }' +
      'h4 { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; font-weight: bold; font-style: italic; margin: 6pt 0 3pt 0; padding: 0; line-height: 1.0; margin-left: 1.27cm; text-indent: -1.9cm; padding-left: 1.9cm; }' +

      // ═══ PARAGRAPH ═══
      'p { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; color: #000; margin: 3pt 0; padding: 0; text-align: justify; line-height: 1.15; }' +

      // ═══ TABEL — 12pt, rata kiri cell, spasi 0 ═══
      'table { width: 100%; border-collapse: collapse; margin: 0; font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; }' +
      'th { background: #ffffff; color: #000; padding: 3pt 6pt; border: 0.5pt solid #000; text-align: center; vertical-align: middle; font-weight: bold; font-size: 12pt; line-height: 1.0; }' +
      'td { padding: 3pt 6pt; border: 0.5pt solid #000; vertical-align: top; text-align: left; font-size: 12pt; line-height: 1.0; }' +
      'table p, table td p, table th p { margin: 0; padding: 0; line-height: 1.0; font-size: 12pt; }' +
      'table span, table div, table li { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; color: #000; }' +

      // ═══ TABEL IDENTITAS ═══
      'table.identitas { border: none; }' +
      'table.identitas td, table.identitas th { border: none; padding: 0 6pt 0 0; line-height: 1.0; vertical-align: top; text-align: left; font-size: 12pt; }' +

      // ═══ TABEL TTD — CENTER ═══
      'table.ttd { border: none; margin-top: 24pt; }' +
      'table.ttd td { border: none; padding: 0; text-align: center; vertical-align: top; line-height: 1.15; font-size: 12pt; }' +
      'table.ttd p, table.ttd div, table.ttd span { text-align: center; font-size: 12pt; margin: 0; padding: 0; line-height: 1.15; }' +

      // ═══ STYLE TEKS ═══
      'strong, b { font-weight: bold; color: #000; font-size: 12pt; }' +
      'em, i { font-style: italic; color: #000; font-size: 12pt; }' +
      'u { text-decoration: underline; color: #000; }' +
      'span { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; }' +

      // ═══ LIST ═══
      'ul, ol { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; margin: 3pt 0 3pt 20pt; padding: 0; }' +
      'li { font-size: 12pt; margin: 0; padding: 0; line-height: 1.15; }' +

      // ═══ OPSI PG ═══
      'ol[type="A"] li, ol[type="a"] li { text-align: left; font-weight: normal; }' +

      // ═══ LOGO ═══
      '.ai-doc-header { text-align: center; padding: 0; margin: 0 0 6pt 0; }' +
      '.ai-doc-header img { width: 2.5cm; height: 3.05cm; display: block; margin: 0 auto; }' +

      // ═══ PROMPT GAMBAR ═══
      '.prompt-gambar-card { border: 1px dashed #94a3b8; border-radius: 6px; padding: 8pt 10pt; margin: 8pt 0; background: #f8fafc; page-break-inside: avoid; }' +
      '.prompt-gambar-card p { margin: 2pt 0; font-size: 12pt; text-align: left; }' +

      // ═══ PAGE BREAK ═══
      '.page-break { page-break-before: always; }' +

    '</style></head><body>' + html + '</body></html>'
  );
  win.document.close();
}

// =============================================
// ⭐ DOWNLOAD PROTA (Word — Landscape)
// =============================================
function aiGuruDownloadProta() {
  if (!aiGuruState.lastResult || !aiGuruState.lastResult.htmlProta) {
    Swal.fire({ icon: 'warning', title: 'Tidak ada hasil', text: 'Generate dulu sebelum download.' });
    return;
  }

  if (typeof htmlDocx === 'undefined') {
    Swal.fire({ icon: 'error', title: 'Library Belum Siap', text: 'Library Word belum termuat. Tunggu beberapa detik lalu coba lagi.', confirmButtonColor: '#10b981' });
    return;
  }

  showLoading();

  var params = aiGuruState.lastParams || {};
  var mapel = (params.mapel || 'Mapel').replace(/[^a-zA-Z0-9]/g, '_');
  var kelas = (params.kelas || 'X').replace(/[^a-zA-Z0-9]/g, '');
  var tahun = (params.tahunAjaran || '2026-2027').replace(/[^a-zA-Z0-9]/g, '-');
  var fileName = 'Prota_' + mapel + '_' + kelas + '_' + tahun + '.docx';

  try {
    downloadWordFromHtml(aiGuruState.lastResult.htmlProta, 'PROGRAM TAHUNAN (PROTA)', fileName, 'landscape');
  } catch (e) {
    hideLoading();
    Swal.fire({ icon: 'error', title: 'Gagal Download', text: e.message });
  }
}

// =============================================
// ⭐ DOWNLOAD PROMES (Word — Landscape, multi-semester)
// =============================================
function aiGuruDownloadPromes() {
  if (!aiGuruState.lastResult || !aiGuruState.lastResult.htmlPromes) {
    Swal.fire({ icon: 'warning', title: 'Tidak ada hasil', text: 'Generate dulu sebelum download.' });
    return;
  }

  if (typeof htmlDocx === 'undefined') {
    Swal.fire({ icon: 'error', title: 'Library Belum Siap', text: 'Library Word belum termuat. Tunggu beberapa detik lalu coba lagi.', confirmButtonColor: '#10b981' });
    return;
  }

  showLoading();

  var params = aiGuruState.lastParams || {};
  var mapel = (params.mapel || 'Mapel').replace(/[^a-zA-Z0-9]/g, '_');
  var kelas = (params.kelas || 'X').replace(/[^a-zA-Z0-9]/g, '');
  var tahun = (params.tahunAjaran || '2026-2027').replace(/[^a-zA-Z0-9]/g, '-');

  // ⭐ Nama file: kalau semester array, gabung jadi "_Ganjil-Genap"
  var semesterLabel = 'Semester';
  if (Array.isArray(params.semester) && params.semester.length > 0) {
    semesterLabel = params.semester.join('-');
  } else if (typeof params.semester === 'string') {
    semesterLabel = params.semester;
  }

  var fileName = 'Promes_' + mapel + '_' + kelas + '_' + semesterLabel + '_' + tahun + '.docx';

  try {
    downloadWordFromHtml(aiGuruState.lastResult.htmlPromes, 'PROGRAM SEMESTER (PROMES)', fileName, 'landscape');
  } catch (e) {
    hideLoading();
    Swal.fire({ icon: 'error', title: 'Gagal Download', text: e.message });
  }
}

// =============================================
// DOWNLOAD WORD (Umum — fitur lain)
// =============================================
function aiGuruDownloadWord() {
  if (!aiGuruState.lastResult || !aiGuruState.lastResult.html) {
    Swal.fire({ icon: 'warning', title: 'Tidak ada hasil', text: 'Generate dulu sebelum download.' });
    return;
  }

  if (typeof htmlDocx === 'undefined') {
    Swal.fire({ icon: 'error', title: 'Library Belum Siap', text: 'Library Word belum termuat. Tunggu beberapa detik lalu coba lagi.', confirmButtonColor: '#10b981' });
    return;
  }

  showLoading();

  var fitur = aiGuruState.lastFitur || 'dokumen';
  var judulMap = { 'modul_ajar': 'Modul Ajar', 'soal': 'Soal Ujian', 'kokurikuler': 'Modul Kokurikuler' };
  var judulBase = judulMap[fitur] || 'Dokumen AI Guru';
  var tanggal = new Date().toISOString().slice(0, 10);
  var fileName = judulBase.replace(/\s+/g, '_') + '_' + tanggal + '.docx';

  try {
    downloadWordFromHtml(aiGuruState.lastResult.html, judulBase, fileName, 'portrait');
  } catch (e) {
    hideLoading();
    Swal.fire({ icon: 'error', title: 'Gagal Download', text: e.message });
  }
}

// =============================================
// HELPER: DOWNLOAD WORD DARI HTML
// ⭐ Support: orientation 'portrait' (default) atau 'landscape'
// =============================================
function downloadWordFromHtml(html, judul, fileName, orientation) {
  orientation = orientation || 'portrait';

  var htmlWithInlineStyles = forceInlineTableStyles(html);

  // Header logo (tanpa garis dobel)
  var headerLogo =
    '<div class="ai-doc-header" style="text-align:center;padding:0;margin:0 0 6pt 0;">' +
      '<img src="' + FE_SCHOOL_LOGO_URL + '" ' +
        'width="94" height="115" ' +
        'style="width:2.5cm;height:3.05cm;display:block;margin:0 auto;" ' +
        'crossorigin="anonymous" />' +
    '</div>';

  var cleanHtml = htmlWithInlineStyles.replace(/<div class="ai-doc-header"[\s\S]*?<\/div>/g, '');

  var wordHtml = '<!DOCTYPE html><html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
    'xmlns:w="urn:schemas-microsoft-com:office:word" ' +
    'xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8">' +
    '<title>' + judul + '</title>' +
    '<xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom>' +
      '<w:DoNotOptimizeForBrowser/>' +
    '</w:WordDocument></xml>' +
    '<style>' + getWordStylesFrontend(orientation) + '</style>' +
    '</head><body>' +
    '<div class="WordSection1">' + headerLogo + cleanHtml + '</div>' +
    '</body></html>';

  var blob = htmlDocx.asBlob(wordHtml);
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(function() { URL.revokeObjectURL(url); }, 1000);

  hideLoading();
  Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'File ' + fileName + ' sedang diunduh.', timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
}

// =============================================
// POST-PROCESSING: FORCE INLINE STYLE
// ⭐ Handle: bold angka, hanging indent, font-size, rata kiri, width tabel
// =============================================
function forceInlineTableStyles(html) {
  if (!html) return html;
  var result = html;

  // ═══════════════════════════════════════════════════════════
  // STEP 0: Hapus inline style AI yang bertabrakan
  // ═══════════════════════════════════════════════════════════

  // Hapus margin-left, padding-left, text-indent di semua tag
  result = result.replace(/\s*(margin-left|padding-left|text-indent)\s*:\s*[^;"]+;?/gi, '');

  // Hapus font-size di semua tag (biar pakai default 12pt dari CSS)
  result = result.replace(/\s*font-size\s*:\s*[^;"]+;?/gi, '');

  // Hapus <span> yang tidak perlu (biar tidak ganggu)
  result = result.replace(/<span\s*>([\s\S]*?)<\/span>/gi, '$1');
  result = result.replace(/<span\s+style\s*=\s*"[^"]*"\s*>([\s\S]*?)<\/span>/gi, '$1');

  // ═══════════════════════════════════════════════════════════
  // STEP 1: Hapus <strong>/<b> di angka nomor soal
  // ═══════════════════════════════════════════════════════════

  result = result.replace(/<strong>(\d+[\.\)])\s*<\/strong>/gi, '$1 ');
  result = result.replace(/<b>(\d+[\.\)])\s*<\/b>/gi, '$1 ');

  result = result.replace(/<p([^>]*)><strong>(\d+[\.\)]\s[^<]*(?:<[^\/][^>]*>[^<]*<\/[^>]+>[^<]*)*)<\/strong><\/p>/gi, '<p$1>$2</p>');
  result = result.replace(/<p([^>]*)><strong>(\d+[\.\)][\s\S]*?)<\/strong><\/p>/gi, '<p$1>$2</p>');

  result = result.replace(/<p([^>]*)><b>(\d+[\.\)][\s\S]*?)<\/b><\/p>/gi, '<p$1>$2</p>');

  result = result.replace(/<strong>([A-E][\.\)])\s*<\/strong>/gi, '$1 ');
  result = result.replace(/<b>([A-E][\.\)])\s*<\/b>/gi, '$1 ');
  result = result.replace(/<p([^>]*)><strong>([A-E][\.\)][\s\S]*?)<\/strong><\/p>/gi, '<p$1>$2</p>');

  result = result.replace(/<strong>(Bobot:[^<]*)<\/strong>/gi, '$1');
  result = result.replace(/<p([^>]*)><em>(Bobot:[^<]*)<\/em><\/p>/gi, '<p$1>$2</p>');

  // ═══════════════════════════════════════════════════════════
  // STEP 2: Tambah hanging indent ke paragraf diawali angka + titik
  // ═══════════════════════════════════════════════════════════

  result = result.replace(/<p([^>]*)>(\s*)(\d+[\.\)])(\s+)([\s\S]*?)<\/p>/gi, function(match, attrs, sp1, num, sp2, content) {
    var textOnly = content.replace(/<[^>]*>/g, '').trim();
    if (textOnly.length < 5) return match;

    if (/^[A-Za-z\s\/]+\s*:/.test(textOnly) && textOnly.length < 100) {
      return match;
    }

    var baseStyle = "margin-left:0cm;text-indent:-0.63cm;padding-left:0.63cm;mso-para-margin-left:0cm;mso-text-indent-alt:-0.63cm;";

    if (/style\s*=\s*"/i.test(attrs)) {
      attrs = attrs.replace(/style\s*=\s*"([^"]*)"/i, function(m, s) {
        return 'style="' + s + ';' + baseStyle + '"';
      });
    } else if (/style\s*=\s*'/i.test(attrs)) {
      attrs = attrs.replace(/style\s*=\s*'([^']*)'/i, function(m, s) {
        return 'style="' + s + ';' + baseStyle + '"';
      });
    } else {
      attrs = attrs + ' style="' + baseStyle + '"';
    }

    return '<p' + attrs + '>' + sp1 + num + sp2 + content + '</p>';
  });

  result = result.replace(/<p([^>]*)>(\s*)([A-E][\.\)])(\s+)([\s\S]*?)<\/p>/gi, function(match, attrs, sp1, num, sp2, content) {
    var baseStyle = "margin-left:0.63cm;text-indent:-0.63cm;padding-left:0.63cm;mso-para-margin-left:0.63cm;mso-text-indent-alt:-0.63cm;";

    if (/style\s*=\s*"/i.test(attrs)) {
      attrs = attrs.replace(/style\s*=\s*"([^"]*)"/i, function(m, s) {
        return 'style="' + s + ';' + baseStyle + '"';
      });
    } else if (/style\s*=\s*'/i.test(attrs)) {
      attrs = attrs.replace(/style\s*=\s*'([^']*)'/i, function(m, s) {
        return 'style="' + s + ';' + baseStyle + '"';
      });
    } else {
      attrs = attrs + ' style="' + baseStyle + '"';
    }

    return '<p' + attrs + '>' + sp1 + num + sp2 + content + '</p>';
  });

  // ═══════════════════════════════════════════════════════════
  // STEP 3: Helper inject style
  // ═══════════════════════════════════════════════════════════

  function injectStyle(tagName, baseStyle) {
    var re = new RegExp('<' + tagName + '([^>]*)>', 'gi');
    return result.replace(re, function(match, attrs) {
      if (/style\s*=\s*"/i.test(attrs)) {
        return '<' + tagName + attrs.replace(/style\s*=\s*"([^"]*)"/i, function(m, s) {
          return 'style="' + baseStyle + s + '"';
        }) + '>';
      }
      if (/style\s*=\s*'/i.test(attrs)) {
        return '<' + tagName + attrs.replace(/style\s*=\s*'([^']*)'/i, function(m, s) {
          return 'style="' + baseStyle + s + '"';
        }) + '>';
      }
      return '<' + tagName + attrs + ' style="' + baseStyle + '">';
    });
  }

  function injectStyleInTable(tagName, baseStyle) {
    return result.replace(/<table[\s\S]*?<\/table>/gi, function(tableMatch) {
      var re = new RegExp('<' + tagName + '([^>]*)>', 'gi');
      return tableMatch.replace(re, function(match, attrs) {
        if (/style\s*=\s*"/i.test(attrs)) {
          return '<' + tagName + attrs.replace(/style\s*=\s*"([^"]*)"/i, function(m, s) {
            return 'style="' + baseStyle + s + '"';
          }) + '>';
        }
        if (/style\s*=\s*'/i.test(attrs)) {
          return '<' + tagName + attrs.replace(/style\s*=\s*'([^']*)'/i, function(m, s) {
            return 'style="' + baseStyle + s + '"';
          }) + '>';
        }
        return '<' + tagName + attrs + ' style="' + baseStyle + '">';
      });
    });
  }

  // ═══════════════════════════════════════════════════════════
  // STYLE DASAR
  // ═══════════════════════════════════════════════════════════

  var tableStyle = "font-family:'Calibri',serif;font-size:12pt;color:#000000;border-collapse:collapse;margin:0;padding:0;width:100%;";

  var thStyle = "font-family:'Calibri',serif;font-size:12pt;font-weight:bold;color:#000000;background:#ffffff;padding:3pt 6pt;border:0.5pt solid #000000;text-align:center;vertical-align:middle;line-height:1.0;mso-para-margin:0cm;";

  var tdStyle = "font-family:'Calibri',serif;font-size:12pt;color:#000000;padding:3pt 6pt;border:0.5pt solid #000000;vertical-align:top;text-align:left;line-height:1.0;mso-para-margin:0cm;";

  var pStyleUmum = "font-family:'Calibri',serif;font-size:12pt;color:#000000;margin:3pt 0;padding:0;line-height:1.15;";

  var pStyleInTable = "font-family:'Calibri',serif;font-size:12pt;color:#000000;margin:0cm;padding:0;line-height:1.0;mso-para-margin:0cm;mso-para-margin-top:0cm;mso-para-margin-bottom:0cm;";

  var h2Style = "font-family:'Calibri',serif;font-size:12pt;font-weight:bold;color:#000000;text-transform:uppercase;margin:6pt 0 3pt 0;padding:0;border:none;line-height:1.0;margin-left:0cm;text-indent:-0.63cm;padding-left:0.63cm;";
  var h3Style = "font-family:'Calibri',serif;font-size:12pt;font-weight:bold;color:#000000;margin:6pt 0 3pt 0;padding:0;line-height:1.0;margin-left:0.63cm;text-indent:-1.27cm;padding-left:1.27cm;";
  var h4Style = "font-family:'Calibri',serif;font-size:12pt;font-weight:bold;font-style:italic;color:#000000;margin:6pt 0 3pt 0;padding:0;line-height:1.0;margin-left:1.27cm;text-indent:-1.9cm;padding-left:1.9cm;";

  // ═══════════════════════════════════════════════════════════
  // URUTAN INJECT
  // ═══════════════════════════════════════════════════════════
  result = injectStyle('table', tableStyle);
  result = injectStyle('th', thStyle);
  result = injectStyle('td', tdStyle);
  result = injectStyle('h2', h2Style);
  result = injectStyle('h3', h3Style);
  result = injectStyle('h4', h4Style);
  result = injectStyle('p', pStyleUmum);

  result = injectStyleInTable('p', pStyleInTable);
  result = injectStyleInTable('li', pStyleInTable);

  // ═══════════════════════════════════════════════════════════
  // STEP 4: Rata kiri untuk kolom teks + fix width kolom pendek
  // ═══════════════════════════════════════════════════════════

  result = result.replace(/<th([^>]*)>(\s*)(No|No\.\s*Soal|Skor)(\s*)<\/th>/gi, function(match, attrs, sp1, label, sp2) {
    var widthMap = { 'No': '1cm', 'No. Soal': '1.5cm', 'Skor': '1.2cm' };
    var cleanLabel = label.replace(/\s+/g, ' ').trim();
    var width = widthMap[cleanLabel] || '1cm';
    var newStyle = 'style="width:' + width + ';white-space:nowrap;text-align:center;"';

    attrs = attrs.replace(/\s*style\s*=\s*"[^"]*"/i, '').replace(/\s*style\s*=\s*'[^']*'/i, '');
    return '<th' + attrs + ' ' + newStyle + '>' + sp1 + label + sp2 + '</th>';
  });

  result = result.replace(/<td([^>]*)>(\s*)(C3|C4|C5|C6)([^<]*)<\/td>/gi, function(match, attrs, sp1, level, rest) {
    if (/style\s*=\s*"/i.test(attrs)) {
      attrs = attrs.replace(/text-align\s*:\s*[^;]+;?/gi, '');
      attrs = attrs.replace(/style\s*=\s*"([^"]*)"/i, function(m, s) {
        return 'style="' + s + 'text-align:center;"';
      });
    } else {
      attrs = attrs + ' style="text-align:center;"';
    }
    return '<td' + attrs + '>' + sp1 + level + rest + '</td>';
  });

  result = result.replace(/<td([^>]*)>([\s\S]*?)<\/td>/gi, function(match, attrs, content) {
    var textOnly = content.replace(/<[^>]*>/g, '').trim();

    if (/^[\d\s\.\,%\-]+$/.test(textOnly)) return match;

    if (textOnly.length > 3 && /[a-zA-Z]/.test(textOnly)) {
      if (/style\s*=\s*"/i.test(attrs)) {
        attrs = attrs.replace(/style\s*=\s*"([^"]*)"/i, function(m, s) {
          var cleaned = s.replace(/text-align\s*:\s*[^;]+;?/gi, '');
          return 'style="' + cleaned + 'text-align:left;"';
        });
      } else {
        attrs = attrs + ' style="text-align:left;"';
      }
    }

    return '<td' + attrs + '>' + content + '</td>';
  });

  // ═══════════════════════════════════════════════════════════
  // STEP 5: Override tabel identitas (border none)
  // ═══════════════════════════════════════════════════════════
  result = result.replace(/<table([^>]*class\s*=\s*"[^"]*\bidentitas\b[^"]*"[^>]*)>([\s\S]*?)<\/table>/gi, function(match, tableAttrs, inner) {
    var cleanedTable = tableAttrs.replace(/\s*style\s*=\s*"[^"]*"/i, '').replace(/\s*style\s*=\s*'[^']*'/i, '');
    var cleanedInner = inner
      .replace(/<td([^>]*)>/gi, function(m, attrs) {
        var c = attrs.replace(/\s*style\s*=\s*"[^"]*"/i, '').replace(/\s*style\s*=\s*'[^']*'/i, '');
        return '<td' + c + ' style="border:none;padding:0 6pt 0 0;vertical-align:top;line-height:1.0;text-align:left;font-family:\'Calibri\',serif;font-size:12pt;">';
      })
      .replace(/<th([^>]*)>/gi, function(m, attrs) {
        var c = attrs.replace(/\s*style\s*=\s*"[^"]*"/i, '').replace(/\s*style\s*=\s*'[^']*'/i, '');
        return '<td' + c + ' style="border:none;padding:0 6pt 0 0;vertical-align:top;line-height:1.0;font-weight:normal;text-align:left;font-family:\'Calibri\',serif;font-size:12pt;">';
      });
    return '<table' + cleanedTable + '>' + cleanedInner + '</table>';
  });

  // ═══════════════════════════════════════════════════════════
  // STEP 6: Override tabel TTD (border none, 2 kolom CENTER)
  // ═══════════════════════════════════════════════════════════
  result = result.replace(/<table([^>]*class\s*=\s*"[^"]*\bttd\b[^"]*"[^>]*)>([\s\S]*?)<\/table>/gi, function(match, tableAttrs, inner) {
    var cleanedTable = tableAttrs.replace(/\s*style\s*=\s*"[^"]*"/i, '').replace(/\s*style\s*=\s*'[^']*'/i, '');
    var cleanedInner = inner
      .replace(/<td([^>]*)>/gi, function(m, attrs) {
        var c = attrs.replace(/\s*style\s*=\s*"[^"]*"/i, '').replace(/\s*style\s*=\s*'[^']*'/i, '');
        return '<td' + c + ' style="border:none;padding:0;text-align:center;vertical-align:top;line-height:1.15;font-family:\'Calibri\',serif;font-size:12pt;">';
      });
    return '<table' + cleanedTable + ' class="ttd" style="border:none;border-collapse:collapse;width:100%;margin:24pt 0 0 0;padding:0;">' + cleanedInner + '</table>';
  });

  result = result.replace(/<table([^>]*class\s*=\s*"[^"]*\bttd\b[^"]*"[^>]*)>([\s\S]*?)<\/table>/gi, function(match, tableAttrs, inner) {
    var cleanedInner = inner.replace(/<p([^>]*)>/gi, function(m, attrs) {
      var c = attrs.replace(/\s*style\s*=\s*"[^"]*"/i, '').replace(/\s*style\s*=\s*'[^']*'/i, '');
      return '<p' + c + ' style="margin:0;padding:0;text-align:center;line-height:1.15;">';
    });
    return match.replace(inner, cleanedInner);
  });

  // ═══════════════════════════════════════════════════════════
  // STEP 7: Spacer 2 baris sebelum "Mengetahui"
  // ═══════════════════════════════════════════════════════════
  result = result.replace(/(<(?:table|div)[^>]*>(?:(?!<\/?(?:table|div))[\s\S])*?Mengetahui)/gi, function(match, prefix) {
    return '<p style="margin:0;padding:0;line-height:1.15;">&nbsp;</p>' +
           '<p style="margin:0;padding:0;line-height:1.15;">&nbsp;</p>' +
           prefix;
  });

  return result;
}

// =============================================
// WORD STYLES — Portrait / Landscape
// ⭐ 12pt semua (kecuali heading), Calibri, spasi tabel 0, rata kiri cell
// =============================================
function getWordStylesFrontend(orientation) {
  orientation = orientation || 'portrait';

  var pageSize = (orientation === 'landscape')
    ? 'size: 29.7cm 21cm; mso-page-orientation: landscape;'
    : 'size: 21cm 29.7cm; mso-page-orientation: portrait;';

  return ''
    + '@page WordSection1 { ' + pageSize + ' mso-paper-source: 0; margin: 2cm 2cm 2cm 2cm; }'
    + 'div.WordSection1 { page: WordSection1; }'

    + 'body { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; color: #000000; line-height: 1.15; margin: 0; padding: 0; }'

    + 'h1 { font-family: "Calibri", Calibri, sans-serif; font-size: 14pt; font-weight: bold; color: #000000; text-align: center; margin: 6pt 0; padding: 0; text-transform: uppercase; line-height: 1.0; page-break-after: avoid; }'

    + 'h2 { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; font-weight: bold; color: #000000; text-transform: uppercase; margin: 6pt 0 3pt 0; padding: 0; border: none; line-height: 1.0; page-break-after: avoid; margin-left: 0cm; text-indent: -0.63cm; padding-left: 0.63cm; }'

    + 'h3 { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; font-weight: bold; color: #000000; margin: 6pt 0 3pt 0; padding: 0; line-height: 1.0; page-break-after: avoid; margin-left: 0.63cm; text-indent: -1.27cm; padding-left: 1.27cm; }'

    + 'h4 { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; font-weight: bold; font-style: italic; color: #000000; margin: 6pt 0 3pt 0; padding: 0; line-height: 1.0; page-break-after: avoid; margin-left: 1.27cm; text-indent: -1.9cm; padding-left: 1.9cm; }'

    + 'body > p, body > div > p { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; color: #000000; margin: 3pt 0; padding: 0; text-align: justify; line-height: 1.15; }'

    + 'table { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; color: #000000; border-collapse: collapse; margin: 0; padding: 0; width: 100%; mso-table-lspace: 0pt; mso-table-rspace: 0pt; mso-table-bspace: 0pt; mso-table-tspace: 0pt; }'

    + 'th { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; font-weight: bold; color: #000000; background: #ffffff; padding: 3pt 6pt; mso-padding-alt: 3pt 6pt; border: 0.5pt solid #000000; text-align: center; vertical-align: middle; line-height: 1.0; margin: 0cm; mso-para-margin: 0cm; }'

    + 'td { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; color: #000000; padding: 3pt 6pt; mso-padding-alt: 3pt 6pt; border: 0.5pt solid #000000; vertical-align: top; text-align: left; line-height: 1.0; margin: 0cm; mso-para-margin: 0cm; }'

    + 'tr { font-family: "Calibri", Calibri, sans-serif; color: #000000; margin: 0; padding: 0; }'

    + 'table p, table td p, table th p { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; color: #000000; margin: 0cm; padding: 0; line-height: 1.0; mso-para-margin: 0cm; mso-para-margin-top: 0cm; mso-para-margin-bottom: 0cm; }'

    + 'table span, table div, table li { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; color: #000000; }'

    + 'table.identitas { border: none; }'
    + 'table.identitas td, table.identitas th { border: none; padding: 0 6pt 0 0; line-height: 1.0; vertical-align: top; text-align: left; font-size: 12pt; margin: 0cm; mso-para-margin: 0cm; }'

    + 'table.ttd { border: none; margin-top: 24pt; }'
    + 'table.ttd td { border: none; padding: 0; text-align: center; vertical-align: top; line-height: 1.15; font-size: 12pt; }'
    + 'table.ttd p, table.ttd div, table.ttd span { text-align: center; font-size: 12pt; margin: 0; padding: 0; line-height: 1.15; }'

    + 'strong, b { font-weight: bold; color: #000000; font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; }'
    + 'em, i { font-style: italic; color: #000000; font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; }'
    + 'u { text-decoration: underline; color: #000000; }'

    + 'ul, ol { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; color: #000000; margin: 3pt 0 3pt 20pt; padding: 0; }'
    + 'li { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; color: #000000; margin: 0; padding: 0; line-height: 1.15; }'

    + 'ol[type="A"] li, ol[type="a"] li { text-align: left; font-weight: normal; }'

    + 'span { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; }'
    + 'div { font-family: "Calibri", Calibri, sans-serif; font-size: 12pt; color: #000000; }'

    + '.ai-doc-header { text-align: center; padding: 0; margin: 0 0 6pt 0; }'
    + '.ai-doc-header img { width: 2.5cm; height: 3.05cm; display: block; margin: 0 auto; }'

    + '.prompt-gambar-card { border: 1px dashed #94a3b8; border-radius: 6px; padding: 8pt 10pt; margin: 8pt 0; background: #f8fafc; page-break-inside: avoid; }'
    + '.prompt-gambar-card p { margin: 2pt 0; font-size: 12pt; text-align: left; }'
    + '.prompt-gambar-card strong { font-size: 12pt; font-weight: bold; }'
    + '.prompt-gambar-card em { font-style: normal; font-weight: bold; color: #475569; }'

    + '.page-break { page-break-before: always; }';
}
