// =============================================
// MONITORING PKL BINAAN — Guru
// File: js-monitoring-pkl.js
// Versi: v2026-09-23a (Kunjungan DUDI)
// =============================================

var monitoringPKLState = {
  data: null,
  filterStatus: '',
  searchKey: '',
  activeTab: 'siswa',  // 'siswa' | 'riwayat'
  riwayat: null,
  kunjungan: {
    nis: null,
    namaSiswa: '',
    namaDUDI: '',
    radius: 20,
    lat: '',
    lng: '',
    jarak: '',
    selfie: '',
    catatan: ''
  }
};

// =============================================
// LOAD UTAMA
// =============================================
function loadMonitoringPKLGuru() {
  if (!currentUser || !currentUser.gtk) {
    console.error('[Monitoring PKL] User bukan GTK');
    return;
  }
  var nbm = String(currentUser.gtk.NBM).trim();
  var container = document.getElementById('monitoring-pkl-content');
  if (!container) return;

  container.innerHTML =
    '<div style="text-align:center;padding:32px;">' +
      '<i class="fas fa-spinner fa-spin" style="font-size:2em;color:var(--primary);"></i>' +
      '<p style="margin-top:12px;color:var(--text-muted);">Memuat data siswa binaan...</p>' +
    '</div>';

  google.script.run
    .withSuccessHandler(function(data) {
      monitoringPKLState.data = data || { guru: null, siswa: [], totalSiswa: 0, totalJurnalPending: 0 };
      renderMonitoringPKLGuru();
    })
    .withFailureHandler(function(err) {
      container.innerHTML =
        '<div class="card" style="background:#fee2e2;padding:18px;">' +
          '<div style="font-weight:800;color:#991b1b;font-size:14px;">' +
            '<i class="fas fa-exclamation-triangle"></i> Gagal Memuat Data' +
          '</div>' +
          '<div style="font-size:12.5px;color:#7f1d1d;margin-top:6px;">' +
            (err && err.message ? err.message : 'Unknown error') +
          '</div>' +
          '<button class="btn btn-outline btn-sm" onclick="loadMonitoringPKLGuru()" style="margin-top:12px;">' +
            '<i class="fas fa-redo"></i> Coba Lagi' +
          '</button>' +
        '</div>';
    })
    .getMonitoringBinaanGuru(nbm);
}

// =============================================
// RENDER HALAMAN UTAMA
// =============================================
function renderMonitoringPKLGuru() {
  var container = document.getElementById('monitoring-pkl-content');
  if (!container) return;

  var data = monitoringPKLState.data || {};
  var guru = data.guru || {};
  var semuaSiswa = data.siswa || [];
  var totalSiswa = data.totalSiswa || 0;
  var totalJurnalPending = data.totalJurnalPending || 0;

  var html = '';

  // Header guru
  if (guru && guru.Nama_GTK) {
    html +=
      '<div class="card" style="background:var(--primary-light);border:1px solid var(--primary-border);margin-bottom:16px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">' +
          '<div>' +
            '<div style="font-size:16px;font-weight:800;color:var(--primary-dark);">' +
              '<i class="fas fa-chalkboard-teacher"></i> ' + escapeHtml(guru.Nama_GTK) +
            '</div>' +
            '<div style="font-size:12px;color:#065f46;margin-top:2px;">' +
              'NBM: ' + escapeHtml(guru.NBM) + ' | Tugas: ' + escapeHtml(guru.Tugas || '-') +
            '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div style="font-size:11px;color:#065f46;font-weight:700;text-transform:uppercase;">Total Siswa Binaan</div>' +
            '<div style="font-size:24px;font-weight:800;color:var(--primary-dark);">' + totalSiswa + '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
  }

  // Kalau tidak ada siswa
  if (semuaSiswa.length === 0) {
    html +=
      '<div class="card" style="text-align:center;padding:40px 20px;">' +
        '<i class="fas fa-user-slash" style="font-size:3em;color:#94a3b8;margin-bottom:12px;"></i>' +
        '<h3 style="font-size:16px;font-weight:800;color:#0f172a;">Belum Ada Siswa Binaan</h3>' +
        '<p style="font-size:12.5px;color:var(--text-muted);margin-top:6px;max-width:400px;margin-left:auto;margin-right:auto;">' +
          'Anda belum ditugaskan sebagai pembimbing PKL. Hubungi admin untuk meng-assign siswa binaan.' +
        '</p>' +
      '</div>';
    container.innerHTML = html;
    return;
  }

  // Statistik ringkas
  var countAktif = semuaSiswa.filter(function(s) { return s.Status === 'Aktif'; }).length;
  var countSelesai = semuaSiswa.filter(function(s) { return s.Status !== 'Aktif'; }).length;
  var countDudi = uniqueDudiCount(semuaSiswa);

  html +=
    '<div class="stat-grid" style="margin-bottom:16px;">' +
      '<div class="stat-card" style="background:linear-gradient(135deg,#10b981,#059669);">' +
        '<div class="stat-label">Siswa Aktif</div>' +
        '<div class="stat-value">' + countAktif + '</div>' +
        '<i class="fas fa-user-check stat-icon"></i>' +
      '</div>' +
      '<div class="stat-card" style="background:linear-gradient(135deg,#94a3b8,#64748b);">' +
        '<div class="stat-label">Selesai</div>' +
        '<div class="stat-value">' + countSelesai + '</div>' +
        '<i class="fas fa-flag-checkered stat-icon"></i>' +
      '</div>' +
      '<div class="stat-card" style="background:linear-gradient(135deg,#f59e0b,#d97706);">' +
        '<div class="stat-label">Jurnal Perlu Approve</div>' +
        '<div class="stat-value">' + totalJurnalPending + '</div>' +
        '<i class="fas fa-clock stat-icon"></i>' +
      '</div>' +
      '<div class="stat-card" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);">' +
        '<div class="stat-label">Total DUDI</div>' +
        '<div class="stat-value">' + countDudi + '</div>' +
        '<i class="fas fa-building stat-icon"></i>' +
      '</div>' +
    '</div>';

  // Tab: Siswa Binaan | Riwayat Kunjungan
  html +=
    '<div class="ai-tabs" style="margin-bottom:14px;">' +
      '<button type="button" class="ai-tab-btn ' + (monitoringPKLState.activeTab === 'siswa' ? 'active' : '') + '" ' +
        'onclick="switchMonitoringTab(\'siswa\')">' +
        '<i class="fas fa-users"></i> Siswa Binaan' +
      '</button>' +
      '<button type="button" class="ai-tab-btn ' + (monitoringPKLState.activeTab === 'riwayat' ? 'active' : '') + '" ' +
        'onclick="switchMonitoringTab(\'riwayat\')">' +
        '<i class="fas fa-history"></i> Riwayat Kunjungan' +
      '</button>' +
    '</div>';

  // Panel siswa
  if (monitoringPKLState.activeTab === 'siswa') {
    html += renderPanelSiswa(semuaSiswa);
  } else {
    html += '<div id="monitoring-riwayat-container">' +
      '<div style="text-align:center;padding:24px;">' +
        '<i class="fas fa-spinner fa-spin" style="font-size:2em;color:var(--primary);"></i>' +
      '</div>' +
    '</div>';
  }

  container.innerHTML = html;

  if (monitoringPKLState.activeTab === 'riwayat') {
    loadRiwayatKunjungan();
  }
}

function renderPanelSiswa(semuaSiswa) {
  var siswa = semuaSiswa.filter(function(s) {
    if (monitoringPKLState.filterStatus && s.Status !== monitoringPKLState.filterStatus) return false;
    if (monitoringPKLState.searchKey) {
      var key = monitoringPKLState.searchKey.toLowerCase();
      var hay = (s.Nama_Siswa + ' ' + s.NIS + ' ' + s.Nama_Kelas + ' ' + s.Nama_DUDI).toLowerCase();
      if (hay.indexOf(key) === -1) return false;
    }
    return true;
  });

  var html = '';

  // Filter & search
  html +=
    '<div class="card" style="padding:14px 18px;background:#f8fafc;border:1px solid var(--border);margin-bottom:16px;">' +
      '<div style="display:flex;gap:12px;align-items:flex-end;flex-wrap:wrap;">' +
        '<div class="form-group" style="flex:1;min-width:200px;margin-bottom:0;">' +
          '<label><i class="fas fa-search"></i> Cari Siswa / DUDI</label>' +
          '<input type="text" id="monitoring_search" class="form-control" placeholder="Ketik nama, NIS, atau DUDI..." ' +
            'value="' + escapeHtml(monitoringPKLState.searchKey) + '" oninput="handleMonitoringSearch(this.value)">' +
        '</div>' +
        '<div class="form-group" style="flex:0 0 160px;margin-bottom:0;">' +
          '<label><i class="fas fa-filter"></i> Status</label>' +
          '<select id="monitoring_filter" class="form-control" onchange="handleMonitoringFilter(this.value)">' +
            '<option value=""' + (monitoringPKLState.filterStatus === '' ? ' selected' : '') + '>-- Semua --</option>' +
            '<option value="Aktif"' + (monitoringPKLState.filterStatus === 'Aktif' ? ' selected' : '') + '>Aktif</option>' +
            '<option value="Selesai"' + (monitoringPKLState.filterStatus === 'Selesai' ? ' selected' : '') + '>Selesai</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
    '</div>';

  if (siswa.length === 0) {
    html +=
      '<div class="card" style="text-align:center;padding:24px;color:var(--text-muted);">' +
        '<i class="fas fa-search" style="font-size:2em;margin-bottom:8px;opacity:0.5;"></i>' +
        '<div style="font-size:12.5px;">Tidak ada siswa yang cocok dengan filter.</div>' +
      '</div>';
    return html;
  }

  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px;">';
  siswa.forEach(function(s) {
    html += renderMonitoringSiswaCard(s);
  });
  html += '</div>';
  return html;
}

function switchMonitoringTab(tab) {
  monitoringPKLState.activeTab = tab;
  renderMonitoringPKLGuru();
}

// =============================================
// CARD SISWA + TOMBOL KUNJUNGI
// =============================================
function renderMonitoringSiswaCard(s) {
  var statusBadge = s.Status === 'Aktif'
    ? '<span class="badge-status-table badge-hadir">Aktif</span>'
    : '<span class="badge-status-table badge-alpa">Selesai</span>';

  var jurnalPendingBadge = s.JurnalPendingSekolah > 0
    ? '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:12px;font-size:10.5px;font-weight:800;background:#fef3c7;color:#92400e;border:1px solid #f59e0b;">' +
        '<i class="fas fa-clock"></i> ' + s.JurnalPendingSekolah + ' perlu approve' +
      '</span>'
    : '';

  var waBtn = s.WA_Pembimbing_DUDI
    ? '<button class="btn btn-wa btn-sm" onclick="monitoringWAkeDudi(\'' + escapeAttr(s.NIS) + '\')" ' +
      'style="min-height:32px;padding:0.25em 0.9em;font-size:11.5px;">' +
        '<i class="fab fa-whatsapp"></i> WA' +
      '</button>'
    : '';

  var periode = s.Tanggal_Mulai && s.Tanggal_Selesai
    ? (s.Tanggal_Mulai + ' s/d ' + s.Tanggal_Selesai)
    : '-';

  return '<div class="card" style="padding:16px;display:flex;flex-direction:column;gap:10px;">' +
    '<div>' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">' +
        '<div>' +
          '<div style="font-size:15px;font-weight:800;color:#0f172a;">' + escapeHtml(s.Nama_Siswa) + '</div>' +
          '<div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">' +
            'NIS: ' + escapeHtml(s.NIS) + ' | Kelas: ' + escapeHtml(s.Nama_Kelas) +
          '</div>' +
        '</div>' +
        statusBadge +
      '</div>' +
    '</div>' +

    '<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:10px 12px;">' +
      '<div style="font-size:10.5px;color:#0369a1;font-weight:800;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:4px;">' +
        '<i class="fas fa-building"></i> DUDI' +
      '</div>' +
      '<div style="font-size:13px;font-weight:700;color:#0c4a6e;">' + escapeHtml(s.Nama_DUDI) + '</div>' +
      '<div style="font-size:11.5px;color:#075985;margin-top:2px;">' +
        'Pembimbing: ' + escapeHtml(s.Nama_Pembimbing_DUDI) +
      '</div>' +
      '<div style="font-size:11px;color:#0369a1;margin-top:4px;">' +
        '<i class="far fa-calendar"></i> ' + escapeHtml(periode) +
      '</div>' +
    '</div>' +

    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">' +
      '<div style="background:#ecfdf5;border-radius:6px;padding:6px 10px;">' +
        '<div style="font-size:10px;color:#065f46;font-weight:700;text-transform:uppercase;">Absen</div>' +
        '<div style="font-size:14px;font-weight:800;color:#047857;">' + s.TotalAbsen + '</div>' +
      '</div>' +
      '<div style="background:#f5f3ff;border-radius:6px;padding:6px 10px;">' +
        '<div style="font-size:10px;color:#5b21b6;font-weight:700;text-transform:uppercase;">Jurnal</div>' +
        '<div style="font-size:14px;font-weight:800;color:#6d28d9;">' + s.TotalJurnal + '</div>' +
      '</div>' +
    '</div>' +

    (jurnalPendingBadge ? '<div>' + jurnalPendingBadge + '</div>' : '') +

    '<div style="display:flex;gap:6px;flex-wrap:wrap;padding-top:6px;border-top:1px dashed var(--border);">' +
      '<button class="btn btn-primary btn-sm" onclick="openKunjunganModal(\'' + escapeAttr(s.NIS) + '\')" ' +
        'style="flex:1;min-height:34px;font-size:11.5px;">' +
        '<i class="fas fa-map-marked-alt"></i> Kunjungi DUDI' +
      '</button>' +
      '<button class="btn btn-outline btn-sm" onclick="monitoringLihatDetail(\'' + escapeAttr(s.NIS) + '\')" ' +
        'style="min-height:34px;font-size:11.5px;" title="Detail">' +
        '<i class="fas fa-eye"></i>' +
      '</button>' +
      waBtn +
    '</div>' +
  '</div>';
}

// =============================================
// MODAL KUNJUNGAN
// =============================================
function openKunjunganModal(nis) {
  var data = monitoringPKLState.data || {};
  var s = (data.siswa || []).find(function(x) { return String(x.NIS) === String(nis); });
  if (!s) {
    Swal.fire({ icon: 'error', title: 'Error', text: 'Data siswa tidak ditemukan.' });
    return;
  }

  // Reset state
  monitoringPKLState.kunjungan = {
    nis: s.NIS,
    namaSiswa: s.Nama_Siswa,
    namaDUDI: s.Nama_DUDI,
    radius: parseFloat(s.Radius_Meter) || 20,
    lat: '',
    lng: '',
    jarak: '',
    selfie: '',
    catatan: ''
  };

  var html =
    '<div style="text-align:left;font-size:13px;">' +
      '<div style="background:#ecfdf5;border:1px solid var(--primary-border);border-radius:8px;padding:10px 12px;margin-bottom:12px;">' +
        '<div style="font-weight:800;color:var(--primary-dark);font-size:14px;">' +
          '<i class="fas fa-user-graduate"></i> ' + escapeHtml(s.Nama_Siswa) +
        '</div>' +
        '<div style="font-size:11.5px;color:#065f46;margin-top:2px;">' +
          'NIS: ' + escapeHtml(s.NIS) + ' | Kelas: ' + escapeHtml(s.Nama_Kelas) +
        '</div>' +
        '<div style="font-size:11.5px;color:#065f46;margin-top:4px;">' +
          '<i class="fas fa-building"></i> ' + escapeHtml(s.Nama_DUDI) +
        '</div>' +
        '<div style="font-size:11px;color:#065f46;margin-top:2px;">' +
          '<i class="fas fa-map-marker-alt"></i> Radius DUDI: ' + (s.Radius_Meter || 20) + 'm' +
        '</div>' +
      '</div>' +

      // Selfie
      '<div style="margin-bottom:12px;">' +
        '<div style="font-weight:700;color:#334155;font-size:11.5px;text-transform:uppercase;margin-bottom:6px;">' +
          '<i class="fas fa-camera"></i> Foto Selfie di DUDI <span style="color:#dc2626;">*Wajib</span>' +
        '</div>' +
        '<button type="button" class="btn btn-primary" onclick="openSelfieKunjungan()" style="width:100%;min-height:42px;">' +
          '<i class="fas fa-camera"></i> Ambil Selfie' +
        '</button>' +
        '<input type="file" id="kunjungan_selfie_input" accept="image/*" capture="user" style="display:none;" onchange="handleSelfieKunjungan(this)">' +
        '<img id="kunjungan_selfie_preview" src="" style="display:none;max-width:180px;border-radius:10px;margin-top:8px;">' +
        '<div id="kunjungan_selfie_status" style="font-size:11px;color:#94a3b8;margin-top:4px;">Belum ada foto</div>' +
      '</div>' +

      // GPS
      '<div style="margin-bottom:12px;">' +
        '<div style="font-weight:700;color:#334155;font-size:11.5px;text-transform:uppercase;margin-bottom:6px;">' +
          '<i class="fas fa-satellite"></i> Lokasi GPS <span style="color:#dc2626;">*Wajib</span>' +
        '</div>' +
        '<button type="button" class="btn btn-outline" onclick="getLocationKunjungan()" style="width:100%;min-height:40px;">' +
          '<i class="fas fa-location-dot"></i> Deteksi Lokasi' +
        '</button>' +
        '<div id="kunjungan_gps_info" style="font-size:11.5px;color:var(--text-muted);margin-top:6px;">Klik untuk mendeteksi lokasi Anda di DUDI.</div>' +
      '</div>' +

      // Catatan
      '<div style="margin-bottom:8px;">' +
        '<div style="font-weight:700;color:#334155;font-size:11.5px;text-transform:uppercase;margin-bottom:6px;">' +
          '<i class="fas fa-sticky-note"></i> Catatan Kunjungan (opsional)' +
        '</div>' +
        '<textarea id="kunjungan_catatan" class="swal2-textarea" style="width:100%;min-height:60px;font-size:12.5px;" ' +
          'placeholder="Contoh: Siswa aktif bekerja, kondisi aman, koordinasi dengan pembimbing DUDI berjalan baik."></textarea>' +
      '</div>' +
    '</div>';

  Swal.fire({
    title: '<i class="fas fa-map-marked-alt"></i> Kunjungan Monitoring',
    html: html,
    width: 520,
    showCancelButton: true,
    confirmButtonText: '<i class="fas fa-paper-plane"></i> Kirim Kunjungan',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#64748b',
    focusConfirm: false,
    didOpen: function() {
      // Auto start GPS
      setTimeout(function() { getLocationKunjungan(); }, 500);
    },
    preConfirm: function() {
      var k = monitoringPKLState.kunjungan;
      if (!k.selfie) {
        Swal.showValidationMessage('Foto selfie wajib diambil.');
        return false;
      }
      if (!k.lat || !k.lng) {
        Swal.showValidationMessage('Lokasi GPS wajib dideteksi.');
        return false;
      }
      k.catatan = document.getElementById('kunjungan_catatan').value.trim();
      return true;
    }
  }).then(function(r) {
    if (r.isConfirmed) submitKunjunganGuru();
  });
}

function openSelfieKunjungan() {
  if (!isDesktopDevice()) {
    document.getElementById('kunjungan_selfie_input').click();
    return;
  }
  // PC: pakai webcam
  openKunjunganWebcam();
}

function openKunjunganWebcam() {
  Swal.fire({
    title: 'Ambil Selfie',
    html: '<div id="kunjungan-webcam-container" style="text-align:center;">Memuat kamera...</div>',
    showConfirmButton: false,
    showCancelButton: true,
    cancelButtonText: 'Tutup',
    didOpen: function() {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then(function(stream) {
          var cont = document.getElementById('kunjungan-webcam-container');
          cont.innerHTML = '<video id="kunjungan-webcam-video" autoplay playsinline muted ' +
            'style="width:100%;max-width:400px;border-radius:12px;transform:scaleX(-1);"></video>' +
            '<div style="margin-top:10px;">' +
              '<button type="button" class="swal2-confirm swal2-styled" onclick="captureKunjunganWebcam()" style="background:#10b981;">' +
                'Ambil Foto' +
              '</button>' +
            '</div>';
          var v = document.getElementById('kunjungan-webcam-video');
          v.srcObject = stream;
          window._kunjunganWebcamStream = stream;
        })
        .catch(function(err) {
          document.getElementById('kunjungan-webcam-container').innerHTML =
            '<div style="color:#ef4444;">Gagal akses kamera: ' + err.message + '</div>';
        });
    },
    willClose: function() {
      if (window._kunjunganWebcamStream) {
        window._kunjunganWebcamStream.getTracks().forEach(function(t) { t.stop(); });
        window._kunjunganWebcamStream = null;
      }
    }
  });
}

function captureKunjunganWebcam() {
  var video = document.getElementById('kunjungan-webcam-video');
  if (!video || !video.videoWidth) return;

  var canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  var ctx = canvas.getContext('2d');
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);

  var maxDim = 480;
  var w = canvas.width, h = canvas.height;
  if (w > h && w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; }
  else if (h > maxDim) { w = Math.round(w * maxDim / h); h = maxDim; }
  if (w !== canvas.width) {
    var tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    tmp.getContext('2d').drawImage(canvas, 0, 0, w, h);
    canvas = tmp;
  }
  var base64 = canvas.toDataURL('image/jpeg', 0.7);
  var q = 0.7;
  while (base64.length > 50000 && q > 0.2) {
    q -= 0.05;
    base64 = canvas.toDataURL('image/jpeg', q);
  }

  monitoringPKLState.kunjungan.selfie = base64;
  updateKunjunganSelfieUI(base64);

  if (window._kunjunganWebcamStream) {
    window._kunjunganWebcamStream.getTracks().forEach(function(t) { t.stop(); });
    window._kunjunganWebcamStream = null;
  }
  Swal.close();
  // Buka lagi modal utama
  setTimeout(function() { openKunjunganModal(monitoringPKLState.kunjungan.nis); }, 300);
}

function handleSelfieKunjungan(input) {
  if (!input.files || !input.files[0]) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var cv = document.createElement('canvas');
      var maxDim = 480;
      var w = img.width, h = img.height;
      if (w > h && w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; }
      else if (h > maxDim) { w = Math.round(w * maxDim / h); h = maxDim; }
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      var base64 = cv.toDataURL('image/jpeg', 0.7);
      var q = 0.7;
      while (base64.length > 50000 && q > 0.2) {
        q -= 0.05;
        base64 = cv.toDataURL('image/jpeg', q);
      }
      monitoringPKLState.kunjungan.selfie = base64;
      updateKunjunganSelfieUI(base64);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

function updateKunjunganSelfieUI(base64) {
  var preview = document.getElementById('kunjungan_selfie_preview');
  var status = document.getElementById('kunjungan_selfie_status');
  if (preview) { preview.src = base64; preview.style.display = 'block'; }
  if (status) {
    status.textContent = '✅ Selfie tersimpan';
    status.style.color = '#10b981';
    status.style.fontWeight = '700';
  }
}

function getLocationKunjungan() {
  var infoDiv = document.getElementById('kunjungan_gps_info');
  if (infoDiv) infoDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mendeteksi lokasi...';

  if (typeof getAccuratePosition !== 'function') {
    if (infoDiv) infoDiv.innerHTML = '<span style="color:#ef4444;">Fungsi GPS tidak tersedia.</span>';
    return;
  }

  getAccuratePosition()
    .then(function(reading) {
      // Hitung jarak ke DUDI
      var data = monitoringPKLState.data || {};
      var s = (data.siswa || []).find(function(x) { return String(x.NIS) === String(monitoringPKLState.kunjungan.nis); });
      var dudiLat = 0, dudiLng = 0;
      if (s && s.Latitude) {
        dudiLat = parseFloat(s.Latitude);
        dudiLng = parseFloat(s.Longitude);
      }

      var jarak = 0;
      if (dudiLat && dudiLng) {
        var R = 6371000;
        var dLat = (dudiLat - reading.lat) * Math.PI / 180;
        var dLon = (dudiLng - reading.lng) * Math.PI / 180;
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(reading.lat * Math.PI / 180) * Math.cos(dudiLat * Math.PI / 180) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        jarak = Math.round(R * c);
      }

      monitoringPKLState.kunjungan.lat = reading.lat;
      monitoringPKLState.kunjungan.lng = reading.lng;
      monitoringPKLState.kunjungan.jarak = jarak;

      var radius = monitoringPKLState.kunjungan.radius;
      var color = jarak <= radius ? '#10b981' : '#ef4444';
      var statusText = jarak <= radius
        ? '✅ Dalam radius DUDI — auto approve'
        : '⚠️ Di luar radius — perlu verifikasi admin';

      if (infoDiv) {
        infoDiv.innerHTML =
          '<strong style="color:' + color + ';">Jarak: ' + jarak + 'm dari DUDI (radius ' + radius + 'm)</strong><br>' +
          statusText +
          '<br><small>Akurasi: ±' + Math.round(reading.acc) + 'm</small>';
      }
    })
    .catch(function(err) {
      if (infoDiv) infoDiv.innerHTML = '<span style="color:#ef4444;">' + err.message + '</span>';
    });
}

function submitKunjunganGuru() {
  var k = monitoringPKLState.kunjungan;
  if (!k.nis || !k.selfie || !k.lat || !k.lng) {
    Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Selfie & GPS wajib.' });
    return;
  }

  showLoading();
  var nbm = String(currentUser.gtk.NBM).trim();

  google.script.run
    .withSuccessHandler(function(res) {
      hideLoading();
      Swal.fire({
        icon: 'success',
        title: 'Kunjungan Tercatat!',
        html: '<div style="text-align:left;font-size:13px;">' +
          '<div>' + (res.message || '') + '</div>' +
          '<div style="margin-top:10px;padding:10px;background:#f0fdf4;border-radius:8px;">' +
            '<strong>Status:</strong> ' +
            (res.status === 'Approved'
              ? '<span style="color:#065f46;">✅ Approved</span>'
              : '<span style="color:#92400e;">⏳ Pending (verifikasi admin)</span>') +
          '</div>' +
        '</div>'
      });
      // Reload tab riwayat
      monitoringPKLState.activeTab = 'riwayat';
      renderMonitoringPKLGuru();
    })
    .withFailureHandler(function(err) {
      hideLoading();
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    })
    .submitMonitoringPKL(nbm, k.nis, k.lat, k.lng, k.jarak, k.selfie, k.catatan);
}

// =============================================
// RIWAYAT KUNJUNGAN
// =============================================
function loadRiwayatKunjungan() {
  var container = document.getElementById('monitoring-riwayat-container');
  if (!container) return;

  var nbm = String(currentUser.gtk.NBM).trim();

  google.script.run
    .withSuccessHandler(function(list) {
      monitoringPKLState.riwayat = list || [];
      renderRiwayatKunjungan();
    })
    .withFailureHandler(function(err) {
      container.innerHTML =
        '<div class="card" style="background:#fee2e2;padding:18px;">' +
          '<div style="font-weight:800;color:#991b1b;">Gagal memuat riwayat</div>' +
          '<div style="font-size:12.5px;color:#7f1d1d;margin-top:6px;">' + escapeHtml(err.message) + '</div>' +
        '</div>';
    })
    .getRiwayatMonitoringGuru(nbm);
}

function renderRiwayatKunjungan() {
  var container = document.getElementById('monitoring-riwayat-container');
  if (!container) return;

  var list = monitoringPKLState.riwayat || [];

  if (list.length === 0) {
    container.innerHTML =
      '<div class="card" style="text-align:center;padding:40px 20px;">' +
        '<i class="fas fa-map-marked-alt" style="font-size:3em;color:#94a3b8;margin-bottom:12px;"></i>' +
        '<h3 style="font-size:16px;font-weight:800;color:#0f172a;">Belum Ada Riwayat Kunjungan</h3>' +
        '<p style="font-size:12.5px;color:var(--text-muted);margin-top:6px;">' +
          'Buka tab "Siswa Binaan" dan klik <strong>Kunjungi DUDI</strong> untuk memulai.' +
        '</p>' +
      '</div>';
    return;
  }

  var html = '<div style="display:flex;flex-direction:column;gap:12px;">';
  list.forEach(function(m) {
    var statusBadge = m.Status_Approval === 'Approved'
      ? '<span class="badge-approval-approved" style="font-size:11px;padding:3px 12px;">✅ Approved</span>'
      : m.Status_Approval === 'Rejected'
        ? '<span class="badge-approval-rejected" style="font-size:11px;padding:3px 12px;">❌ Rejected</span>'
        : '<span class="badge-approval-pending" style="font-size:11px;padding:3px 12px;">⏳ Pending</span>';

    var selfieHtml = m.Selfie_Url
      ? '<a href="' + escapeHtml(m.Selfie_Url) + '" target="_blank">' +
          '<img src="' + escapeHtml(m.Selfie_Url) + '" ' +
            'style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:2px solid #e2e8f0;">' +
        '</a>'
      : '<div style="width:80px;height:80px;border-radius:8px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#94a3b8;">' +
          '<i class="fas fa-image"></i>' +
        '</div>';

    var jarakText = m.Jarak_Meter !== '' && m.Jarak_Meter !== null
      ? m.Jarak_Meter + 'm'
      : '-';

    html +=
      '<div class="card" style="padding:14px;">' +
        '<div style="display:flex;gap:14px;flex-wrap:wrap;">' +
          selfieHtml +
          '<div style="flex:1;min-width:200px;">' +
            '<div style="display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;align-items:flex-start;">' +
              '<div>' +
                '<div style="font-weight:800;font-size:14px;color:#0f172a;">' +
                  escapeHtml(m.Nama_Siswa || '-') +
                '</div>' +
                '<div style="font-size:11.5px;color:var(--text-muted);">' +
                  'NIS: ' + escapeHtml(m.NIS) + ' | Kelas: ' + escapeHtml(m.Nama_Kelas) +
                '</div>' +
              '</div>' +
              statusBadge +
            '</div>' +
            '<div style="font-size:12px;color:#0369a1;margin-top:6px;background:#f0f9ff;padding:6px 10px;border-radius:6px;">' +
              '<i class="fas fa-building"></i> ' + escapeHtml(m.Nama_DUDI) +
            '</div>' +
            '<div style="display:flex;gap:14px;margin-top:6px;flex-wrap:wrap;font-size:11.5px;color:#475569;">' +
              '<span><i class="far fa-calendar"></i> ' + escapeHtml(m.Tanggal) + '</span>' +
              '<span><i class="fas fa-map-marker-alt"></i> ' + escapeHtml(jarakText) + '</span>' +
            '</div>' +
            (m.Catatan
              ? '<div style="font-size:11.5px;color:#334155;margin-top:6px;padding:6px 10px;background:#f8fafc;border-radius:6px;border-left:3px solid #10b981;">' +
                  escapeHtml(m.Catatan) +
                '</div>'
              : '') +
            (m.Catatan_Approval
              ? '<div style="font-size:11px;color:#92400e;margin-top:6px;padding:6px 10px;background:#fef3c7;border-radius:6px;">' +
                  '<strong>Admin:</strong> ' + escapeHtml(m.Catatan_Approval) +
                '</div>'
              : '') +
          '</div>' +
        '</div>' +
      '</div>';
  });
  html += '</div>';

  container.innerHTML = html;
}

// =============================================
// UTILITIES
// =============================================
function uniqueDudiCount(siswa) {
  var set = {};
  siswa.forEach(function(s) { if (s.ID_DUDI) set[s.ID_DUDI] = true; });
  return Object.keys(set).length;
}

function escapeAttr(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function handleMonitoringSearch(val) {
  monitoringPKLState.searchKey = String(val || '').trim();
  clearTimeout(window._monitoringSearchTimer);
  window._monitoringSearchTimer = setTimeout(function() {
    var focused = document.activeElement;
    var wasSearch = focused && focused.id === 'monitoring_search';
    var cursorPos = wasSearch ? focused.selectionStart : 0;
    renderMonitoringPKLGuru();
    if (wasSearch) {
      var inp = document.getElementById('monitoring_search');
      if (inp) {
        inp.focus();
        inp.setSelectionRange(cursorPos, cursorPos);
      }
    }
  }, 250);
}

function handleMonitoringFilter(val) {
  monitoringPKLState.filterStatus = String(val || '');
  renderMonitoringPKLGuru();
}

function monitoringLihatDetail(nis) {
  var data = monitoringPKLState.data || {};
  var s = (data.siswa || []).find(function(x) { return String(x.NIS) === String(nis); });
  if (!s) return;

  var waDudi = s.WA_Pembimbing_DUDI
    ? '<div style="margin-top:8px;"><i class="fab fa-whatsapp" style="color:#25D366;"></i> <strong>WA DUDI:</strong> ' + escapeHtml(s.WA_Pembimbing_DUDI) + '</div>'
    : '';
  var alamat = s.Alamat_DUDI
    ? '<div style="margin-top:4px;"><i class="fas fa-map-marker-alt"></i> <strong>Alamat:</strong> ' + escapeHtml(s.Alamat_DUDI) + '</div>'
    : '';

  Swal.fire({
    title: 'Detail Siswa',
    html:
      '<div style="text-align:left;font-size:13px;line-height:1.7;">' +
        '<div style="font-size:16px;font-weight:800;color:#0f172a;margin-bottom:4px;">' + escapeHtml(s.Nama_Siswa) + '</div>' +
        '<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">' +
          'NIS: ' + escapeHtml(s.NIS) + ' | Kelas: ' + escapeHtml(s.Nama_Kelas) +
        '</div>' +
        '<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:10px 12px;margin-bottom:10px;">' +
          '<div style="font-weight:800;color:#0369a1;font-size:11px;text-transform:uppercase;margin-bottom:6px;">DUDI</div>' +
          '<div style="font-weight:700;color:#0c4a6e;">' + escapeHtml(s.Nama_DUDI) + '</div>' +
          '<div style="font-size:12px;color:#075985;">Pembimbing: ' + escapeHtml(s.Nama_Pembimbing_DUDI) + '</div>' +
          alamat + waDudi +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">' +
          '<div style="background:#ecfdf5;border-radius:6px;padding:8px 10px;">' +
            '<div style="font-size:10px;color:#065f46;font-weight:700;">ABSEN</div>' +
            '<div style="font-size:18px;font-weight:800;color:#047857;">' + s.TotalAbsen + '</div>' +
            '<div style="font-size:10.5px;color:#065f46;">' + s.AbsenPending + ' pending</div>' +
          '</div>' +
          '<div style="background:#f5f3ff;border-radius:6px;padding:8px 10px;">' +
            '<div style="font-size:10px;color:#5b21b6;font-weight:700;">JURNAL</div>' +
            '<div style="font-size:18px;font-weight:800;color:#6d28d9;">' + s.TotalJurnal + '</div>' +
            '<div style="font-size:10.5px;color:#5b21b6;">' + s.JurnalPendingSekolah + ' perlu approve</div>' +
          '</div>' +
        '</div>' +
        '<div style="margin-top:10px;padding:8px 12px;background:#f8fafc;border-radius:8px;font-size:12px;">' +
          '<strong>Periode:</strong> ' +
          escapeHtml(s.Tanggal_Mulai || '-') + ' s/d ' + escapeHtml(s.Tanggal_Selesai || '-') +
        '</div>' +
      '</div>',
    width: 500,
    confirmButtonText: 'Tutup',
    confirmButtonColor: '#10b981'
  });
}

function monitoringWAkeDudi(nis) {
  var data = monitoringPKLState.data || {};
  var s = (data.siswa || []).find(function(x) { return String(x.NIS) === String(nis); });
  if (!s) return;

  if (!s.WA_Pembimbing_DUDI) {
    Swal.fire({ icon: 'warning', title: 'WA Kosong', text: 'Nomor WA pembimbing DUDI belum terdaftar.' });
    return;
  }

  var nomor = formatWaNumber(s.WA_Pembimbing_DUDI);
  if (!nomor) {
    Swal.fire({ icon: 'error', title: 'Nomor Tidak Valid', text: 'Nomor WA minimal 10 digit.' });
    return;
  }

  var pesan =
    "Assalamu'alaikum Bapak/Ibu " + (s.Nama_Pembimbing_DUDI || 'Pembimbing') + ",\n\n" +
    "Saya " + (currentUser && currentUser.gtk ? currentUser.gtk.Nama_GTK : 'Guru') + " dari SMK Muhammadiyah 1 Surakarta.\n\n" +
    "Menghubungi terkait siswa PKL binaan kami:\n" +
    "👤 Nama: *" + s.Nama_Siswa + "*\n" +
    "🆔 NIS: " + s.NIS + "\n" +
    "🏫 Kelas: " + s.Nama_Kelas + "\n\n" +
    "Mohon bantuan Bapak/Ibu untuk memantau kegiatan siswa tersebut di DUDI. " +
    "Jika ada kendala, mohon info ke kami.\n\n" +
    "Terima kasih.\n- SMK Muhammadiyah 1 Surakarta";

  window.open('https://wa.me/' + nomor + '?text=' + encodeURIComponent(pesan), '_blank');
}
