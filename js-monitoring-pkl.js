// =============================================
// MONITORING PKL BINAAN — Guru
// File: js-monitoring-pkl.js
// Versi: v2026-09-22a
// =============================================

var monitoringPKLState = {
  data: null,
  filterStatus: '',
  searchKey: ''
};

function loadMonitoringPKLGuru() {
  if (!currentUser || !currentUser.gtk) {
    console.error('[Monitoring PKL] User bukan GTK');
    return;
  }
  var nbm = String(currentUser.gtk.NBM).trim();
  var container = document.getElementById('monitoring-pkl-content');
  if (!container) {
    console.error('[Monitoring PKL] Container tidak ditemukan');
    return;
  }

  container.innerHTML =
    '<div style="text-align:center;padding:32px;">' +
      '<i class="fas fa-spinner fa-spin" style="font-size:2em;color:var(--primary);"></i>' +
      '<p style="margin-top:12px;color:var(--text-muted);">Memuat data siswa binaan...</p>' +
    '</div>';

  console.log('[Monitoring PKL] Fetching data untuk NBM:', nbm);

  google.script.run
    .withSuccessHandler(function(data) {
      console.log('[Monitoring PKL] Data diterima:', data);
      monitoringPKLState.data = data || { guru: null, siswa: [], totalSiswa: 0, totalJurnalPending: 0 };
      renderMonitoringPKLGuru();
    })
    .withFailureHandler(function(err) {
      console.error('[Monitoring PKL] Error:', err);
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

function renderMonitoringPKLGuru() {
  var container = document.getElementById('monitoring-pkl-content');
  if (!container) return;

  var data = monitoringPKLState.data || {};
  var guru = data.guru || {};
  var semuaSiswa = data.siswa || [];
  var totalSiswa = data.totalSiswa || 0;
  var totalJurnalPending = data.totalJurnalPending || 0;

  // Filter
  var siswa = semuaSiswa.filter(function(s) {
    if (monitoringPKLState.filterStatus && s.Status !== monitoringPKLState.filterStatus) return false;
    if (monitoringPKLState.searchKey) {
      var key = monitoringPKLState.searchKey.toLowerCase();
      var hay = (s.Nama_Siswa + ' ' + s.NIS + ' ' + s.Nama_Kelas + ' ' + s.Nama_DUDI).toLowerCase();
      if (hay.indexOf(key) === -1) return false;
    }
    return true;
  });

  // Header info guru
  var html = '';
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

  // List siswa
  if (siswa.length === 0) {
    html +=
      '<div class="card" style="text-align:center;padding:24px;color:var(--text-muted);">' +
        '<i class="fas fa-search" style="font-size:2em;margin-bottom:8px;opacity:0.5;"></i>' +
        '<div style="font-size:12.5px;">Tidak ada siswa yang cocok dengan filter.</div>' +
      '</div>';
    container.innerHTML = html;
    return;
  }

  html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px;">';
  siswa.forEach(function(s) {
    html += renderMonitoringSiswaCard(s);
  });
  html += '</div>';

  container.innerHTML = html;
}

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
      'style="min-height:30px;padding:0.25em 0.9em;font-size:11.5px;">' +
        '<i class="fab fa-whatsapp"></i> WA DUDI' +
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
      '<button class="btn btn-outline btn-sm" onclick="monitoringLihatDetail(\'' + escapeAttr(s.NIS) + '\')" ' +
        'style="flex:1;min-height:32px;font-size:11.5px;">' +
        '<i class="fas fa-eye"></i> Detail' +
      '</button>' +
      waBtn +
    '</div>' +
  '</div>';
}

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
    var container = document.getElementById('monitoring-pkl-content');
    if (!container) return;
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
