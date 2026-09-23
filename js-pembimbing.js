// =============================================
// PEMBIMBING DUDI — Frontend
// File: js-pembimbing.js
// =============================================

var PEMBIMBING_STORAGE_KEY = 'mutusuka_pembimbing';
var SESSION_DAYS = 7;

var pembimbingState = { kodeAkses: null, token: null, data: null };

// ═══════════════════════════════════════════════
// SESSION MANAGEMENT
// ═══════════════════════════════════════════════

function simpanSessionPembimbing(data) {
  localStorage.setItem(PEMBIMBING_STORAGE_KEY, JSON.stringify({
    kode: data.dudi.Kode_Akses,
    token: data.token,
    namaPembimbing: data.dudi.Nama_Pembimbing,
    namaDUDI: data.dudi.Nama_DUDI,
    exp: Date.now() + (SESSION_DAYS * 24 * 60 * 60 * 1000)
  }));
}

function ambilSessionPembimbing() {
  try {
    var s = JSON.parse(localStorage.getItem(PEMBIMBING_STORAGE_KEY) || 'null');
    if (!s || !s.token || !s.kode) return null;
    if (s.exp && Date.now() > s.exp) {
      localStorage.removeItem(PEMBIMBING_STORAGE_KEY);
      return null;
    }
    return s;
  } catch (e) {
    return null;
  }
}

// ═══════════════════════════════════════════════
// LOGIN PEMBIMBING
// ═══════════════════════════════════════════════

function handleLoginPembimbing(e) {
  if (e) e.preventDefault();
  var kode = document.getElementById('pemb_kode').value.trim().toUpperCase();
  var pin = document.getElementById('pemb_pin').value.trim();

  if (!kode || !pin) {
    Swal.fire({ icon: 'warning', title: 'Lengkapi Data', text: 'Kode akses & PIN wajib diisi.' });
    return;
  }

  showLoading();
  google.script.run
    .withSuccessHandler(function(res) {
      hideLoading();
      if (!res || !res.success) {
        Swal.fire({ icon: 'error', title: 'Gagal', text: 'Response tidak valid' });
        return;
      }
      simpanSessionPembimbing(res);
      if (window.location.hash) history.replaceState(null, '', window.location.pathname);
      masukKeDashboardPembimbing(res.dudi.Kode_Akses, res.token);
    })
    .withFailureHandler(function(err) {
      hideLoading();
      Swal.fire({ icon: 'error', title: 'Login Gagal', text: err.message });
    })
    .loginPembimbing(kode, pin);
}

function cobaAutoLoginPembimbing() {
  var session = ambilSessionPembimbing();
  if (!session) return false;
  masukKeDashboardPembimbing(session.kode, session.token);
  return true;
}

function cekHashPembimbing() {
  var hash = window.location.hash || '';
  var match = hash.match(/#pembimbing=([A-Za-z0-9]+)/);
  if (!match) return false;

  var kode = decodeURIComponent(match[1]).toUpperCase();

  if (typeof showLoginDUDI === 'function') {
    showLoginDUDI();
  }

  var inpKode = document.getElementById('pemb_kode');
  if (inpKode) inpKode.value = kode;

  var session = ambilSessionPembimbing();
  if (session && session.kode === kode) {
    cobaAutoLoginPembimbing();
  } else {
    setTimeout(function() {
      var inpPin = document.getElementById('pemb_pin');
      if (inpPin) inpPin.focus();
    }, 300);
  }
  return true;
}

// ═══════════════════════════════════════════════
// MASUK DASHBOARD
// ═══════════════════════════════════════════════

function masukKeDashboardPembimbing(kode, token) {
  pembimbingState.kodeAkses = kode;
  pembimbingState.token = token;

  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('app-layout').classList.add('hidden');
  document.getElementById('page-pembimbing').classList.remove('hidden');

  showLoading();
  google.script.run
    .withSuccessHandler(function(data) {
      hideLoading();
      pembimbingState.data = data;
      renderPembimbingDashboard(data);
    })
    .withFailureHandler(function(err) {
      hideLoading();
      if (err.message && err.message.indexOf('Sesi tidak valid') !== -1) {
        logoutPembimbing();
        Swal.fire({ icon: 'warning', title: 'Sesi Habis', text: 'Silakan login ulang dengan PIN.' });
        return;
      }
      renderPembimbingError(err.message);
    })
    .getDashboardPembimbingSecure(kode, token);
}

function logoutPembimbing() {
  localStorage.removeItem(PEMBIMBING_STORAGE_KEY);
  pembimbingState = { kodeAkses: null, token: null, data: null };
  document.getElementById('page-pembimbing').classList.add('hidden');
  document.getElementById('login-page').classList.remove('hidden');
  if (window.location.hash) history.replaceState(null, '', window.location.pathname);
  if (typeof switchLoginTab === 'function') switchLoginTab('admin');
}

function renderPembimbingError(msg) {
  var c = document.getElementById('pembimbing-content');
  if (!c) return;
  c.innerHTML =
    '<div class="card" style="text-align:center;padding:40px;background:#fef2f2;border:1px solid #fecaca;">' +
      '<i class="fas fa-exclamation-triangle" style="font-size:3em;color:#dc2626;margin-bottom:12px;"></i>' +
      '<h3 style="color:#991b1b;font-size:18px;font-weight:800;">Akses Ditolak</h3>' +
      '<p style="color:#7f1d1d;font-size:13px;margin-top:8px;">' + escapeHtml(msg) + '</p>' +
      '<button class="btn btn-outline" onclick="logoutPembimbing()" style="margin-top:16px;">Kembali</button>' +
    '</div>';
}

// ═══════════════════════════════════════════════
// RENDER DASHBOARD
// ═══════════════════════════════════════════════

function renderPembimbingDashboard(data) {
  var c = document.getElementById('pembimbing-content');
  if (!c) return;
  var dudi = data.dudi;
  var stats = data.stats;

  var html = '';

  // Header DUDI
  html +=
    '<div class="card" style="background:var(--primary-light);border:1px solid var(--primary-border);margin-bottom:16px;">' +
      '<div style="font-size:18px;font-weight:800;color:var(--primary-dark);"><i class="fas fa-building"></i> ' + escapeHtml(dudi.Nama_DUDI) + '</div>' +
      '<div style="font-size:12.5px;color:#065f46;margin-top:4px;">' +
        '<i class="fas fa-user-tie"></i> ' + escapeHtml(dudi.Nama_Pembimbing || '-') +
        ' | <i class="fas fa-users"></i> ' + data.totalSiswa + ' siswa binaan' +
      '</div>' +
    '</div>';

  // Stat cards
  html +=
    '<div class="stat-grid" style="margin-bottom:18px;">' +
      '<div class="stat-card" style="background:linear-gradient(135deg,#f59e0b,#d97706);">' +
        '<div class="stat-label">Absen Menunggu</div>' +
        '<div class="stat-value">' + stats.totalAbsenPending + '</div>' +
        '<i class="fas fa-clock stat-icon"></i>' +
      '</div>' +
      '<div class="stat-card" style="background:linear-gradient(135deg,#8b5cf6,#7c3aed);">' +
        '<div class="stat-label">Jurnal Menunggu</div>' +
        '<div class="stat-value">' + stats.totalJurnalPending + '</div>' +
        '<i class="fas fa-book stat-icon"></i>' +
      '</div>' +
      '<div class="stat-card bg-hadir">' +
        '<div class="stat-label">Approved Hari Ini</div>' +
        '<div class="stat-value">' + stats.absenApprovedHariIni + '</div>' +
        '<i class="fas fa-check-circle stat-icon"></i>' +
      '</div>' +
      '<div class="stat-card" style="background:linear-gradient(135deg,#0ea5e9,#0284c7);">' +
        '<div class="stat-label">Total Siswa</div>' +
        '<div class="stat-value">' + data.totalSiswa + '</div>' +
        '<i class="fas fa-user-graduate stat-icon"></i>' +
      '</div>' +
    '</div>';

  // Tab navigation
  html +=
    '<div style="display:flex;gap:8px;margin-bottom:14px;flex-wrap:wrap;">' +
      '<button type="button" class="btn btn-primary btn-sm" onclick="showPembimbingTab(\'absen\')" id="tab-pemb-absen">' +
        '<i class="fas fa-fingerprint"></i> Approval Absen (' + stats.totalAbsenPending + ')' +
      '</button>' +
      '<button type="button" class="btn btn-outline btn-sm" onclick="showPembimbingTab(\'jurnal\')" id="tab-pemb-jurnal">' +
        '<i class="fas fa-book"></i> Approval Jurnal (' + stats.totalJurnalPending + ')' +
      '</button>' +
      '<button type="button" class="btn btn-outline btn-sm" onclick="showPembimbingTab(\'siswa\')" id="tab-pemb-siswa">' +
        '<i class="fas fa-users"></i> Daftar Siswa' +
      '</button>' +
      '<button type="button" class="btn btn-danger btn-sm" onclick="logoutPembimbing()" style="margin-left:auto;">' +
        '<i class="fas fa-sign-out-alt"></i> Keluar' +
      '</button>' +
    '</div>';

  // Tab content container
  html += '<div id="pembimbing-tab-content"></div>';

  c.innerHTML = html;
  showPembimbingTab('absen');
}

function showPembimbingTab(tab) {
  ['absen', 'jurnal', 'siswa'].forEach(function(t) {
    var btn = document.getElementById('tab-pemb-' + t);
    if (btn) {
      btn.className = (t === tab) ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm';
    }
  });

  var c = document.getElementById('pembimbing-tab-content');
  if (!c) return;

  if (tab === 'absen') renderPembimbingAbsen(c);
  else if (tab === 'jurnal') renderPembimbingJurnal(c);
  else if (tab === 'siswa') renderPembimbingSiswa(c);
}

// ═══════════════════════════════════════════════
// TAB: APPROVAL ABSEN
// ═══════════════════════════════════════════════

function renderPembimbingAbsen(c) {
  var list = pembimbingState.data.absenPending || [];

  if (list.length === 0) {
    c.innerHTML =
      '<div class="card" style="text-align:center;padding:32px;">' +
        '<i class="fas fa-check-double" style="font-size:3em;color:var(--primary);"></i>' +
        '<h3 style="font-size:16px;font-weight:800;color:#0f172a;margin-top:10px;">Tidak Ada Absen Menunggu</h3>' +
      '</div>';
    return;
  }

  var html = '<div style="display:flex;flex-direction:column;gap:12px;">';

  list.forEach(function(a) {
    var statusClass = {
      'TEPAT_WAKTU': 'badge-hadir',
      'TERLAMBAT': 'badge-izin',
      'SETELAH_ISTIRAHAT': 'badge-izin'
    }[a.Status] || 'badge-hadir';

    var selfieHtml = a.Selfie_Masuk
      ? '<a href="' + escapeHtml(a.Selfie_Masuk) + '" target="_blank">' +
          '<img src="' + escapeHtml(a.Selfie_Masuk) + '" style="width:90px;height:90px;object-fit:cover;border-radius:10px;border:2px solid #e2e8f0;">' +
        '</a>'
      : '<div style="width:90px;height:90px;border-radius:10px;background:#fef3c7;display:flex;align-items:center;justify-content:center;color:#92400e;font-size:10px;text-align:center;font-weight:700;padding:6px;">TANPA<br>SELFIE</div>';

    html +=
      '<div class="card" style="padding:14px;">' +
        '<div style="display:flex;gap:14px;flex-wrap:wrap;">' +
          selfieHtml +
          '<div style="flex:1;min-width:200px;">' +
            '<div style="font-weight:800;font-size:15px;">' + escapeHtml(a.Nama_Siswa) + '</div>' +
            '<div style="font-size:11.5px;color:var(--text-muted);">NIS: ' + escapeHtml(a.NIS) + ' | ' + escapeHtml(a.Nama_Kelas) + ' | ' + escapeHtml(a.Tanggal) + '</div>' +
            '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;">' +
              '<span class="badge-status-table ' + statusClass + '" style="font-size:11px;padding:3px 12px;">' + a.Status + '</span>' +
              '<span style="font-size:11px;color:var(--text-muted);">Masuk: ' + (a.Jam_Masuk || '-') + '</span>' +
              (a.Jarak_Masuk ? '<span style="font-size:11px;color:var(--text-muted);">' + a.Jarak_Masuk + 'm</span>' : '') +
            '</div>' +
            (a.Keterangan ? '<div style="font-size:11.5px;color:#475569;margin-top:6px;">Ket: ' + escapeHtml(a.Keterangan) + '</div>' : '') +
          '</div>' +
          '<div style="display:flex;flex-direction:column;gap:6px;justify-content:center;">' +
            '<button class="btn btn-primary btn-sm" onclick="konfirmApproveAbsen(\'' + a.NIS + '\',\'' + a.Tanggal + '\')">' +
              '<i class="fas fa-check"></i> Setujui' +
            '</button>' +
            '<button class="btn btn-danger btn-sm" onclick="konfirmRejectAbsen(\'' + a.NIS + '\',\'' + a.Tanggal + '\')">' +
              '<i class="fas fa-times"></i> Tolak' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
  });

  html += '</div>';
  c.innerHTML = html;
}

// ═══════════════════════════════════════════════
// TAB: APPROVAL JURNAL
// ═══════════════════════════════════════════════

function renderPembimbingJurnal(c) {
  var list = pembimbingState.data.jurnalPending || [];

  if (list.length === 0) {
    c.innerHTML =
      '<div class="card" style="text-align:center;padding:32px;">' +
        '<i class="fas fa-check-double" style="font-size:3em;color:var(--primary);"></i>' +
        '<h3 style="font-size:16px;font-weight:800;color:#0f172a;margin-top:10px;">Tidak Ada Jurnal Menunggu</h3>' +
      '</div>';
    return;
  }

  var html = '<div style="display:flex;flex-direction:column;gap:12px;">';

  list.forEach(function(j) {
    var fotoHtml = j.Foto_Url
      ? '<a href="' + escapeHtml(j.Foto_Url) + '" target="_blank">' +
          '<img src="' + escapeHtml(j.Foto_Url) + '" style="width:100px;height:100px;object-fit:cover;border-radius:10px;border:2px solid #e2e8f0;">' +
        '</a>'
      : '';

    html +=
      '<div class="card" style="padding:14px;">' +
        '<div style="display:flex;gap:14px;flex-wrap:wrap;">' +
          fotoHtml +
          '<div style="flex:1;min-width:250px;">' +
            '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;">' +
              '<strong style="font-size:14px;">' + escapeHtml(j.Nama_Siswa || '-') + '</strong>' +
              '<span style="font-size:11px;color:var(--text-muted);">' + escapeHtml(j.Tanggal) + '</span>' +
            '</div>' +
            '<div style="font-size:12.5px;color:#475569;line-height:1.5;margin-top:8px;">' +
              escapeHtml(j.Kegiatan).replace(/\n/g, '<br>') +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="margin-top:10px;display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">' +
          '<button class="btn btn-primary btn-sm" onclick="konfirmApproveJurnalDUDI(\'' + j.ID_Jurnal + '\')">' +
            '<i class="fas fa-check"></i> Setujui' +
          '</button>' +
          '<button class="btn btn-danger btn-sm" onclick="konfirmRejectJurnalDUDI(\'' + j.ID_Jurnal + '\')">' +
            '<i class="fas fa-times"></i> Tolak' +
          '</button>' +
        '</div>' +
      '</div>';
  });

  html += '</div>';
  c.innerHTML = html;
}

// ═══════════════════════════════════════════════
// TAB: DAFTAR SISWA
// ═══════════════════════════════════════════════

function renderPembimbingSiswa(c) {
  var list = pembimbingState.data.siswa || [];

  if (list.length === 0) {
    c.innerHTML = '<div class="card" style="text-align:center;padding:32px;color:var(--text-muted);">Belum ada siswa</div>';
    return;
  }

  var html = '<div class="card"><div style="overflow-x:auto;">' +
    '<table class="table-laporan" style="min-width:600px;">' +
      '<thead>' +
        '<tr>' +
          '<th>No</th><th>NIS</th><th>Nama</th><th>Kelas</th><th>Periode</th><th>Status</th>' +
        '</tr>' +
      '</thead>' +
      '<tbody>';

  list.forEach(function(s, i) {
    html +=
      '<tr>' +
        '<td>' + (i + 1) + '</td>' +
        '<td>' + escapeHtml(s.NIS) + '</td>' +
        '<td style="text-align:left;"><strong>' + escapeHtml(s.Nama_Siswa) + '</strong></td>' +
        '<td>' + escapeHtml(s.Nama_Kelas) + '</td>' +
        '<td style="font-size:11px;">' + (s.Tanggal_Mulai || '-') + ' s/d ' + (s.Tanggal_Selesai || '-') + '</td>' +
        '<td>' + (s.Status === 'Aktif'
          ? '<span class="badge-status-table badge-hadir">Aktif</span>'
          : '<span class="badge-status-table badge-alpa">Selesai</span>') + '</td>' +
      '</tr>';
  });

  html += '</tbody></table></div></div>';
  c.innerHTML = html;
}

// ═══════════════════════════════════════════════
// KONFIRMASI APPROVE / REJECT ABSEN
// ═══════════════════════════════════════════════

function konfirmApproveAbsen(nis, tanggal) {
  Swal.fire({
    title: 'Setujui Absen?',
    html: 'Absen <strong>' + escapeHtml(nis) + '</strong> (' + escapeHtml(tanggal) + ')?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Setujui',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#10b981'
  }).then(function(r) {
    if (!r.isConfirmed) return;

    showLoading();
    google.script.run
      .withSuccessHandler(function(res) {
        hideLoading();
        Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
        masukKeDashboardPembimbing(pembimbingState.kodeAkses, pembimbingState.token);
      })
      .withFailureHandler(function(err) {
        hideLoading();
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
      })
      .approveAbsenPembimbingSecure(pembimbingState.kodeAkses, pembimbingState.token, nis, tanggal);
  });
}

function konfirmRejectAbsen(nis, tanggal) {
  Swal.fire({
    title: 'Tolak Absen?',
    input: 'text',
    inputLabel: 'Alasan',
    inputPlaceholder: 'Min 5 karakter...',
    showCancelButton: true,
    confirmButtonText: 'Tolak',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#ef4444',
    inputValidator: function(v) {
      if (!v || v.length < 5) return 'Alasan minimal 5 karakter.';
    }
  }).then(function(r) {
    if (!r.isConfirmed) return;

    showLoading();
    google.script.run
      .withSuccessHandler(function(res) {
        hideLoading();
        Swal.fire({ icon: 'success', title: 'Ditolak', text: res.message, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
        masukKeDashboardPembimbing(pembimbingState.kodeAkses, pembimbingState.token);
      })
      .withFailureHandler(function(err) {
        hideLoading();
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
      })
      .rejectAbsenPembimbingSecure(pembimbingState.kodeAkses, pembimbingState.token, nis, tanggal, r.value);
  });
}

// ═══════════════════════════════════════════════
// KONFIRMASI APPROVE / REJECT JURNAL
// ═══════════════════════════════════════════════

function konfirmApproveJurnalDUDI(idJurnal) {
  Swal.fire({
    title: 'Setujui Jurnal?',
    input: 'textarea',
    inputLabel: 'Catatan (opsional)',
    showCancelButton: true,
    confirmButtonText: 'Setujui',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#10b981'
  }).then(function(r) {
    if (!r.isConfirmed) return;

    showLoading();
    google.script.run
      .withSuccessHandler(function(res) {
        hideLoading();
        Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
        masukKeDashboardPembimbing(pembimbingState.kodeAkses, pembimbingState.token);
      })
      .withFailureHandler(function(err) {
        hideLoading();
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
      })
      .approveJurnalDUDISecure(pembimbingState.kodeAkses, pembimbingState.token, idJurnal, r.value || '');
  });
}

function konfirmRejectJurnalDUDI(idJurnal) {
  Swal.fire({
    title: 'Tolak Jurnal?',
    input: 'textarea',
    inputLabel: 'Alasan',
    showCancelButton: true,
    confirmButtonText: 'Tolak',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#ef4444',
    inputValidator: function(v) {
      if (!v || v.length < 5) return 'Alasan minimal 5 karakter.';
    }
  }).then(function(r) {
    if (!r.isConfirmed) return;

    showLoading();
    google.script.run
      .withSuccessHandler(function(res) {
        hideLoading();
        Swal.fire({ icon: 'success', title: 'Ditolak', text: res.message, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
        masukKeDashboardPembimbing(pembimbingState.kodeAkses, pembimbingState.token);
      })
      .withFailureHandler(function(err) {
        hideLoading();
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
      })
      .rejectJurnalDUDISecure(pembimbingState.kodeAkses, pembimbingState.token, idJurnal, r.value);
  });
}
