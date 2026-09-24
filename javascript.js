// =============================================
// JAVASCRIPT UTAMA — Login, Navigasi, Dashboard
// File: javascript.js
// Versi: v2026-09-24-clean-final
// ⭐ FIX: renderApprovalList (nested if rusak) + race token
// =============================================

// ===== GLOBAL STATE =====
var currentUser = null;
var dataKelasCache = [];
var isEditAbsenMode = false;
var laporanDataCache = [];

var chartTrenInstance = null;
var chartDistribusiInstance = null;
var chartPerKelasInstance = null;
var chartStudentPersonalInstance = null;

var dtKelas = null;
var dtSiswa = null;
var searchTimeout = null;

var DOM = {};

var _dashboardToken = 0;
var _approvalToken = 0;

var paginationState = {
  tugasAdmin:    { page: 1, pageSize: 25, data: [] },
  laporan:       { page: 1, pageSize: 25, data: [] },
  waAdmin:       { page: 1, pageSize: 25, data: [] },
  studentHistory:{ page: 1, pageSize: 25, data: [] },
  studentTugas:  { page: 1, pageSize: 25, data: [] },
  gtkHistory:    { page: 1, pageSize: 25, data: [] }
};

// =============================================
// DOM INIT
// =============================================
function initDOMCache() {
  DOM.loader = document.getElementById('global-loader');
  DOM.sidebar = document.getElementById('sidebar');
  DOM.overlay = document.querySelector('.overlay');
  DOM.tbodyTugasAdmin = document.getElementById('tbodyTugasAdmin');
  DOM.tbodyWaAdmin = document.getElementById('tbodyWhatsappAdmin');
  DOM.tbodyLaporan = document.getElementById('laporanTbody');
  DOM.tbodyStudentHistory = document.getElementById('studentHistoryTbody');
  DOM.tbodyStudentTugas = document.getElementById('studentTugasHistoryTbody');
  DOM.approvalContainer = document.getElementById('approval-list-container');
  DOM.lokasiContainer = document.getElementById('lokasi-list-container');
}

function showLoading() {
  if (!DOM.loader) DOM.loader = document.getElementById('global-loader');
  if (DOM.loader) DOM.loader.classList.remove('hidden');
}

function hideLoading() {
  if (!DOM.loader) DOM.loader = document.getElementById('global-loader');
  if (DOM.loader) DOM.loader.classList.add('hidden');
}

// =============================================
// UTILITY
// =============================================
var ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, function(m) { return ESC_MAP[m]; });
}

var dateCache = {};
function shortDate(dateStr) {
  if (!dateStr) return '-';
  var clean = String(dateStr).trim().slice(0, 10);
  if (dateCache[clean]) return dateCache[clean];
  var parts = clean.split('-');
  if (parts.length === 3) {
    var d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
    if (!isNaN(d.getTime())) {
      dateCache[clean] = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      return dateCache[clean];
    }
  }
  return clean;
}

function todayLocalISO() {
  var d = new Date();
  var tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

function formatDateDisplay(dateStr) {
  if (!dateStr) return '-';
  var d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function formatWaNumber(phoneNumber) {
  if (!phoneNumber) return null;
  var cleaned = String(phoneNumber).replace(/[^0-9]/g, '');
  if (cleaned.length < 10) return null;
  if (cleaned.startsWith('0')) cleaned = '62' + cleaned.substring(1);
  if (!cleaned.startsWith('62')) cleaned = '62' + cleaned;
  return cleaned;
}

// =============================================
// HELPER: BUKA WHATSAPP
// =============================================
function bukaWhatsApp(nomor, pesan, namaPenerima) {
  if (!nomor) {
    Swal.fire({ icon: 'warning', title: 'Nomor Kosong', text: 'Nomor WhatsApp belum terdaftar.' });
    return;
  }

  var formatted = formatWaNumber(nomor);
  if (!formatted) {
    Swal.fire({ icon: 'warning', title: 'Nomor Tidak Valid', text: 'Nomor WA minimal 10 digit angka.' });
    return;
  }

  var text = pesan ? encodeURIComponent(pesan) : '';
  var waMeUrl = 'https://wa.me/' + formatted + (text ? '?text=' + text : '');
  var waDesktopUrl = 'whatsapp://send?phone=' + formatted + (text ? '&text=' + text : '');

  var isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    window.location.href = waMeUrl;
    return;
  }

  var konfirmasiText = namaPenerima
    ? 'Pesan akan dikirim ke <strong>' + escapeHtml(namaPenerima) + '</strong><br>(' + nomor + ')'
    : 'Pesan akan dikirim ke <strong>' + nomor + '</strong>';

  Swal.fire({
    title: 'Kirim ke WhatsApp?',
    html: konfirmasiText + '<br><br><small style="color:#94a3b8;">Jika WhatsApp Desktop terinstall, akan terbuka otomatis.</small>',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: '<i class="fab fa-whatsapp"></i> Buka WhatsApp',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#25D366'
  }).then(function(r) {
    if (!r.isConfirmed) return;

    var desktopOpened = false;
    var fallbackTimer = setTimeout(function() {
      if (!desktopOpened) {
        window.open(waMeUrl, '_blank');
      }
    }, 1500);

    function onVisibilityChange() {
      if (document.hidden) {
        desktopOpened = true;
        clearTimeout(fallbackTimer);
        document.removeEventListener('visibilitychange', onVisibilityChange);
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange);

    try {
      window.location.href = waDesktopUrl;
    } catch (e) {}
  });
}

function openWhatsApp(phoneNumber, namaPenerima) {
  bukaWhatsApp(phoneNumber, null, namaPenerima || null);
}

function kirimWaKeNomor(nomor, pesan, namaPenerima) {
  bukaWhatsApp(nomor, pesan, namaPenerima || null);
}

// =============================================
// WA — Notifikasi
// =============================================
function buildWaMessage(namaSiswa, namaKelas, tanggal, status, keterangan, namaSekolah) {
  var sekolah = namaSekolah || 'SMK Muhammadiyah 1 Surakarta';
  var statusText = status || 'Tidak Hadir';
  var ket = (keterangan && keterangan.trim() !== '') ? keterangan.trim() : '-';

  return "Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\n" +
         "Kami informasikan bahwa siswa berikut tidak hadir hari ini:\n\n" +
         "📌 Nama   : " + namaSiswa + "\n" +
         "🏫 Kelas  : " + namaKelas + "\n" +
         "📅 Tanggal: " + tanggal + "\n" +
         "❗ Status : " + statusText + "\n" +
         "📝 Ket.   : " + ket + "\n\n" +
         "Mohon konfirmasi kepada pihak sekolah.\n\n" +
         "Terima kasih.\n" +
         "- " + sekolah;
}

function kirimWaWaliSiswa(nis, nama, kelas, tanggal, status, keterangan) {
  showLoading();
  google.script.run
    .withSuccessHandler(function(data) {
      hideLoading();
      var waWali = data && data.WA_Wali ? data.WA_Wali : '';
      if (!waWali) {
        Swal.fire({ icon: 'warning', title: 'WA Wali Tidak Ada', html: 'Nomor WhatsApp wali <strong>' + escapeHtml(nama) + '</strong> belum diisi.' });
        return;
      }
      var msg = buildWaMessage(nama, kelas, tanggal, status, keterangan);
      kirimWaKeNomor(waWali, msg, nama);
    })
    .withFailureHandler(function(err) {
      hideLoading();
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    })
    .getWhatsappSiswa(nis);
}

function kirimWaSiswaSendiri(nis, nama, kelas, tanggal, status, keterangan) {
  showLoading();
  google.script.run
    .withSuccessHandler(function(data) {
      hideLoading();
      var waSiswa = data && data.WA_Siswa ? data.WA_Siswa : '';
      if (!waSiswa) {
        Swal.fire({ icon: 'warning', title: 'WA Siswa Tidak Ada', text: 'Nomor WA siswa belum diisi.' });
        return;
      }
      var msg = buildWaMessage(nama, kelas, tanggal, status, keterangan);
      kirimWaKeNomor(waSiswa, msg, nama);
    })
    .withFailureHandler(function(err) {
      hideLoading();
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    })
    .getWhatsappSiswa(nis);
}

// =============================================
// LOAD WA NOTIF SECTION
// =============================================
function loadWaNotifSection(startDate, endDate) {
  var tanggal = startDate || todayLocalISO();
  var container = document.getElementById('wa-notif-container');
  if (!container) return;

  container.innerHTML = '<div style="text-align:center;padding:24px;">' +
    '<i class="fas fa-spinner fa-spin" style="font-size:1.6em;color:var(--primary);"></i>' +
    '<p style="margin-top:8px;color:var(--text-muted);font-size:13px;">Memuat data siswa tidak hadir...</p></div>';

  google.script.run
    .withSuccessHandler(function(list) {
      var data = Array.isArray(list) ? list : [];
      var countInfo = document.getElementById('wa-notif-count-info');
      if (countInfo) countInfo.textContent = data.length + ' siswa tidak hadir';

      if (data.length === 0) {
        container.innerHTML = '<div class="wa-empty-state">' +
          '<i class="fas fa-check-circle" style="color:var(--primary);opacity:1;"></i>' +
          '<div style="font-weight:800;color:#0f172a;font-size:14px;">Tidak Ada Siswa Tidak Hadir</div>' +
          '<div style="font-size:12px;margin-top:4px;">Semua siswa hadir pada tanggal ini. 🎉</div>' +
        '</div>';
        return;
      }

      var statusColorMap = {
        'Alpa': 'background:linear-gradient(135deg,#ef4444,#dc2626);',
        'Sakit': 'background:linear-gradient(135deg,#3b82f6,#2563eb);',
        'Izin': 'background:linear-gradient(135deg,#f59e0b,#d97706);'
      };

      var htmlBuffer = data.map(function(s) {
        var tanggalDisplay = formatDateDisplay(s.Tanggal);
        var badgeStyle = statusColorMap[s.Status] || 'background:#94a3b8;';
        var hasWaWali = s.WA_Wali && s.WA_Wali.length >= 10;
        var hasWaSiswa = s.WA_Siswa && s.WA_Siswa.length >= 10;

        var belumAbsenBadge = s.BelumAbsen
          ? '<span style="background:#dc2626;color:#fff;padding:2px 8px;border-radius:8px;font-size:10px;font-weight:700;margin-left:6px;border:1.5px dashed #fff;">⏰ BELUM ABSEN</span>'
          : '';

        var btnWali = hasWaWali
          ? '<button class="btn btn-wa" onclick="kirimWaWaliSiswa(\'' + s.NIS + '\',\'' + escapeHtml(s.Nama_Siswa).replace(/'/g, "\\'") + '\',\'' + escapeHtml(s.Nama_Kelas).replace(/'/g, "\\'") + '\',\'' + tanggalDisplay + '\',\'' + s.Status + '\',\'' + escapeHtml((s.Keterangan || '').replace(/'/g, "\\'")).substring(0, 80) + '\')">' +
            '<i class="fab fa-whatsapp"></i> WA Wali</button>'
          : '<button class="btn btn-outline" style="opacity:0.5;" disabled title="Nomor belum ada"><i class="fab fa-whatsapp"></i> WA Wali</button>';

        var btnSiswa = hasWaSiswa
          ? '<button class="btn btn-wa" style="background:#0ea5e9;" onclick="kirimWaSiswaSendiri(\'' + s.NIS + '\',\'' + escapeHtml(s.Nama_Siswa).replace(/'/g, "\\'") + '\',\'' + escapeHtml(s.Nama_Kelas).replace(/'/g, "\\'") + '\',\'' + tanggalDisplay + '\',\'' + s.Status + '\',\'' + escapeHtml((s.Keterangan || '').replace(/'/g, "\\'")).substring(0, 80) + '\')">' +
            '<i class="fab fa-whatsapp"></i> WA Siswa</button>'
          : '';

        return '<div class="wa-notif-card">' +
          '<div class="wa-notif-info">' +
            '<div class="wa-notif-name">' +
              '<span class="wa-notif-badge" style="' + badgeStyle + '">' + s.Status + '</span>' +
              belumAbsenBadge +
              ' ' + escapeHtml(s.Nama_Siswa) +
            '</div>' +
            '<div class="wa-notif-meta">' +
              'NIS: ' + escapeHtml(s.NIS) +
              ' | Kelas: <strong>' + escapeHtml(s.Nama_Kelas) + '</strong>' +
              ' | ' + tanggalDisplay +
              (s.Keterangan ? ' | Ket: ' + escapeHtml(s.Keterangan.substring(0, 60)) : '') +
            '</div>' +
          '</div>' +
          '<div class="wa-notif-actions">' + btnWali + btnSiswa + '</div>' +
        '</div>';
      }).join('');

      container.innerHTML = htmlBuffer;
    })
    .withFailureHandler(function(err) {
      container.innerHTML = '<div class="wa-empty-state">' +
        '<i class="fas fa-exclamation-triangle" style="color:#ef4444;opacity:1;"></i>' +
        '<div style="font-weight:700;color:#991b1b;">Gagal memuat data</div>' +
        '<div style="font-size:12px;margin-top:4px;">' + escapeHtml(err.message) + '</div>' +
      '</div>';
    })
    .getSiswaTidakHadirLengkap(tanggal, '');
}

// =============================================
// PAGINATION
// =============================================
function renderPaginationControls(key, renderCallback) {
  var state = paginationState[key];
  var totalRecords = state.data.length;
  var pageSize = state.pageSize;
  var totalPages = Math.ceil(totalRecords / pageSize) || 1;

  if (state.page > totalPages) state.page = totalPages;
  if (state.page < 1) state.page = 1;

  var startIdx = totalRecords === 0 ? 0 : (state.page - 1) * pageSize + 1;
  var endIdx = Math.min(state.page * pageSize, totalRecords);

  var entriesInfoEl = document.getElementById(key + 'EntriesInfo');
  if (entriesInfoEl) {
    entriesInfoEl.textContent = 'Showing ' + startIdx + ' to ' + endIdx + ' of ' + totalRecords + ' entries';
  }

  var btnGroupEl = document.getElementById(key + 'PaginationBtnGroup');
  if (btnGroupEl) {
    var html = '';
    var prevDisabled = (state.page === 1) ? 'disabled' : '';
    html += '<button type="button" class="pagination-btn" ' + prevDisabled + ' onclick="goToPage(\'' + key + '\', ' + (state.page - 1) + ')">Previous</button>';

    var maxPagesToShow = 5;
    var startPage = Math.max(1, state.page - 2);
    var endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (var p = startPage; p <= endPage; p++) {
      var activeClass = (p === state.page) ? 'active' : '';
      html += '<button type="button" class="pagination-btn ' + activeClass + '" onclick="goToPage(\'' + key + '\', ' + p + ')">' + p + '</button>';
    }

    var nextDisabled = (state.page === totalPages || totalRecords === 0) ? 'disabled' : '';
    html += '<button type="button" class="pagination-btn" ' + nextDisabled + ' onclick="goToPage(\'' + key + '\', ' + (state.page + 1) + ')">Next</button>';

    btnGroupEl.innerHTML = html;
  }

  var pageData = state.data.slice((state.page - 1) * pageSize, state.page * pageSize);
  renderCallback(pageData, startIdx);
}

function goToPage(key, pageNum) {
  paginationState[key].page = pageNum;
  if (key === 'tugasAdmin') renderTugasAdminTable();
  else if (key === 'laporan') renderLaporanTable();
  else if (key === 'waAdmin') renderWhatsappAdminTable();
  else if (key === 'studentHistory') renderStudentHistoryTable();
  else if (key === 'studentTugas') renderStudentTugasTable();
  else if (key === 'gtkHistory') renderGTKHistoryTable();
}

function changePageSize(key) {
  var selectEl = document.getElementById(key + 'PageSize');
  if (selectEl) {
    paginationState[key].pageSize = parseInt(selectEl.value, 10) || 25;
    paginationState[key].page = 1;
    goToPage(key, 1);
  }
}

// =============================================
// SIDEBAR
// =============================================
function toggleSidebar() {
  var sidebar = DOM.sidebar || document.getElementById('sidebar');
  var overlay = DOM.overlay || document.querySelector('.overlay');
  if (!sidebar || !overlay) return;

  var isActive = sidebar.classList.contains('active');
  if (isActive) {
    sidebar.classList.remove('active');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  } else {
    sidebar.classList.add('active');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

// =============================================
// LOGIN HANDLERS
// =============================================
function switchLoginTab(role) {
  var map = {
    admin: { tab: 'tab-btn-admin', form: 'loginFormAdmin' },
    gtk:   { tab: 'tab-btn-gtk',   form: 'loginFormGtk' },
    siswa: { tab: 'tab-btn-siswa', form: 'loginFormSiswa' }
  };
  Object.keys(map).forEach(function(r) {
    var t = document.getElementById(map[r].tab);
    var f = document.getElementById(map[r].form);
    if (t) t.classList.remove('active');
    if (f) f.classList.add('hidden');
  });
  if (map[role]) {
    var t = document.getElementById(map[role].tab);
    var f = document.getElementById(map[role].form);
    if (t) t.classList.add('active');
    if (f) f.classList.remove('hidden');
  }
}

function handleLoginAdmin(e) {
  e.preventDefault();
  showLoading();
  var u = document.getElementById('username').value.trim();
  var p = document.getElementById('password').value;

  google.script.run
    .withSuccessHandler(function(res) {
      hideLoading();

      if (res && res.status && (res.role === 'Admin' || res.role === 'AdminPKL')) {
        currentUser = res;
        setupRoleUI(res.role);

        var greeting = res.role === 'AdminPKL'
          ? 'Selamat datang, Admin PKL'
          : 'Selamat datang, Admin';

        Swal.fire({
          icon: 'success',
          title: 'Berhasil Masuk',
          text: greeting,
          timer: 1500,
          showConfirmButton: false,
          toast: true,
          position: 'top-end'
        });

        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('app-layout').classList.remove('hidden');

        if (res.role === 'AdminPKL') {
          initAdminPKL();
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Akses Ditolak',
          text: 'Halaman ini khusus Admin.',
          confirmButtonColor: '#10b981'
        });
      }
    })
    .withFailureHandler(function(err) {
      hideLoading();
      Swal.fire({
        icon: 'error',
        title: 'Login Gagal',
        text: err.message || 'Terjadi kesalahan',
        confirmButtonColor: '#10b981'
      });
    })
    .doLogin(u, p);
}

function handleLoginGTK(e) {
  e.preventDefault();
  showLoading();
  var nbm = document.getElementById('nbm_login').value.trim();
  var pass = document.getElementById('password_gtk').value;

  google.script.run
    .withSuccessHandler(function(res) {
      hideLoading();
      if (res && res.status) {
        currentUser = res;
        setupRoleUI(res.role);
        Swal.fire({ icon: 'success', title: 'Berhasil Masuk', text: 'Selamat datang, ' + res.gtk.Nama_GTK, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('app-layout').classList.remove('hidden');

        document.getElementById('gtk-welcome-name').textContent = res.gtk.Nama_GTK;
        document.getElementById('gtk-welcome-info').textContent = 'NBM: ' + res.gtk.NBM + ' | Tugas: ' + res.gtk.Tugas;

        handleGTKStatusChange('Hadir');
        if (typeof loadLogoAsync === 'function') loadLogoAsync();
        setTimeout(function() { loadGTKDashboard(); }, 300);
      }
    })
    .withFailureHandler(function(err) {
      hideLoading();
      Swal.fire({ icon: 'error', title: 'Login Gagal', text: err.message || 'NBM atau Password salah', confirmButtonColor: '#10b981' });
    })
    .doGtkLogin(nbm, pass);
}

function handleLoginSiswa(e) {
  e.preventDefault();
  showLoading();
  var nis = document.getElementById('nis_login').value.trim();
  var password = document.getElementById('password_siswa').value.trim();

  google.script.run
    .withSuccessHandler(function(res) {
      hideLoading();
      if (res && res.status && res.role === 'Siswa') {
        currentUser = res;
        setupRoleUI('Siswa');
        Swal.fire({ icon: 'success', title: 'Berhasil Masuk', text: 'Selamat datang, ' + res.student.Nama_Siswa, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
        document.getElementById('login-page').classList.add('hidden');
        document.getElementById('app-layout').classList.remove('hidden');
        if (typeof checkPKLSiswaAktif === 'function') {
          checkPKLSiswaAktif(String(res.student.NIS).trim(), function(pklInfo) {
            console.log('[Login] PKL aktif:', !!pklInfo);
          });
        }
        initSiswa();
      }
    })
    .withFailureHandler(function(err) {
      hideLoading();
      Swal.fire({ icon: 'error', title: 'Login Gagal', text: err.message || 'NIS atau Password salah', confirmButtonColor: '#10b981' });
    })
    .doStudentLogin(nis, password);
}

// =============================================
// SETUP ROLE UI
// =============================================
function setupRoleUI(role) {
  var mAdmin = document.getElementById('menu-admin');
  var mGtk = document.getElementById('menu-gtk');
  var mSiswa = document.getElementById('menu-siswa');
  var roleTitle = document.getElementById('sidebar-role-title');

  [mAdmin, mGtk, mSiswa].forEach(function(m) { if (m) m.classList.add('hidden'); });

  if (role === 'Admin' || role === 'AdminPKL') {
    mAdmin.classList.remove('hidden');

    if (role === 'AdminPKL') {
      roleTitle.innerHTML = '<i class="fas fa-user-tie"></i> Admin PKL';
      var fullMenuItems = mAdmin.querySelectorAll('.menu-item-admin-full');
      fullMenuItems.forEach(function(li) { li.classList.add('hidden'); });

      var pklMenuItems = mAdmin.querySelectorAll('.menu-item-admin-pkl');
      pklMenuItems.forEach(function(li) { li.classList.remove('hidden'); });

      showPage('page-pkl-assign', document.querySelector('[data-page="pkl-assign"]'));
    } else {
      roleTitle.innerHTML = '<i class="fas fa-user-shield"></i> Admin Panel';
      var allItems = mAdmin.querySelectorAll('li');
      allItems.forEach(function(li) { li.classList.remove('hidden'); });

      showPage('page-dashboard-admin', document.querySelector('[data-page="dashboard-admin"]'));
    }
  } else if (role === 'Guru' || role === 'Tendik') {
    mGtk.classList.remove('hidden');
    roleTitle.innerHTML = '<i class="fas fa-chalkboard-teacher"></i> Panel GTK';

    var menuGuruTugas = document.getElementById('menu-item-guru-tugas');
    var menuAIGuru = document.getElementById('menu-item-ai-guru');

    if (role === 'Guru') {
      if (menuGuruTugas) menuGuruTugas.classList.remove('hidden');
      if (menuAIGuru) menuAIGuru.classList.remove('hidden');
    } else {
      if (menuGuruTugas) menuGuruTugas.classList.add('hidden');
      if (menuAIGuru) menuAIGuru.classList.add('hidden');
    }
    showPage('page-dashboard-gtk', document.querySelector('#menu-gtk [data-page="dashboard-gtk"]'));
  } else {
    mSiswa.classList.remove('hidden');
    roleTitle.innerHTML = '<i class="fas fa-user-graduate"></i> Panel Siswa';
    showPage('page-dashboard-siswa', document.querySelector('[data-page="dashboard-siswa"]'));
  }
  addRippleEffect();
}

// =============================================
// NAVIGATION
// =============================================
function showPage(pageId, clickedLink) {
  document.querySelectorAll('.page').forEach(function(p) { p.classList.add('hidden'); });
  var targetPage = document.getElementById(pageId);
  if (targetPage) targetPage.classList.remove('hidden');

  if (clickedLink) {
    var parentMenu = clickedLink.closest('.sidebar-menu');
    if (parentMenu) {
      parentMenu.querySelectorAll('a').forEach(function(a) { a.classList.remove('active'); });
      clickedLink.classList.add('active');
    }
  }
  var sidebar = DOM.sidebar || document.getElementById('sidebar');
  if (sidebar && sidebar.classList.contains('active')) toggleSidebar();

  if (pageId === 'page-dashboard-admin') loadDashboardCharts();
  if (pageId === 'page-approval-admin') loadApprovalDashboard();
  if (pageId === 'page-lokasi-kelas') loadLokasiSekolah();
  if (pageId === 'page-dudi') loadDUDI();
  if (pageId === 'page-pkl-assign') loadAssignPKL();
  if (pageId === 'page-kelas') loadKelas();
  if (pageId === 'page-siswa') loadSiswa();
  if (pageId === 'page-laporan') initLaporan();
  if (pageId === 'page-input-absen') loadKelasDropdowns();
  if (pageId === 'page-dashboard-siswa') loadStudentDashboard();
  if (pageId === 'page-dashboard-gtk') loadGTKDashboard();
  if (pageId === 'page-absen-siswa') prepareStudentAbsenPage();
  if (pageId === 'page-pkl-presensi') loadPKLPresensiPage();
  if (pageId === 'page-pkl-jurnal') loadPKLJurnalPage();
  if (pageId === 'page-tugas-admin') loadTugasAdmin();
  if (pageId === 'page-tugas-siswa') loadTugasSiswa();
  if (pageId === 'page-pengaturan-siswa') showPengaturanSiswa();
  if (pageId === 'page-pengaturan-admin') showPengaturanAdmin();
  if (pageId === 'page-whatsapp-siswa') loadWhatsappSiswa();
  if (pageId === 'page-whatsapp-admin') loadWhatsappAdmin();
  if (pageId === 'page-whatsapp-gtk') loadWhatsappGTK();
  if (pageId === 'page-pengaturan-gtk') showPengaturanGTK();
  if (pageId === 'page-ai-guru' && typeof initAIGuruPage === 'function') initAIGuruPage();
  if (pageId === 'page-approval-jurnal-pkl' && typeof loadApprovalJurnalGuru === 'function') loadApprovalJurnalGuru();
  if (pageId === 'page-monitoring-pkl-guru' && typeof loadMonitoringPKLGuru === 'function') loadMonitoringPKLGuru();
}

function initAdmin() {
  refreshAllKelasDropdowns();
}

function initSiswa() {
  if (!currentUser || !currentUser.student) return;
  loadStudentDashboard();
  prepareStudentAbsenPage();
  loadTugasSiswa();
}

function initAdminPKL() {
  console.log('[AdminPKL] Init dashboard PKL');
  if (typeof loadDUDI === 'function') loadDUDI();
  if (typeof loadAssignPKL === 'function') loadAssignPKL();
  if (typeof showPage === 'function') {
    showPage('page-pkl-assign', document.querySelector('[data-page="pkl-assign"]'));
  }
}

// =============================================
// DASHBOARD ADMIN
// =============================================
function setQuickDate(days) {
  var d = new Date();
  d.setDate(d.getDate() + days);
  var tz = d.getTimezoneOffset() * 60000;
  var dateStr = new Date(d.getTime() - tz).toISOString().slice(0, 10);
  var dashDate = document.getElementById('dash_date');
  if (dashDate) dashDate.value = dateStr;
  loadDashboardWithDate();
}

function loadDashboardWithDate() {
  var dashDate = document.getElementById('dash_date');
  if (!dashDate || !dashDate.value) {
    Swal.fire({ icon: 'warning', title: 'Pilih Tanggal', text: 'Silakan pilih tanggal terlebih dahulu.' });
    return;
  }
  loadDashboardCharts(dashDate.value, dashDate.value);
}

function resetDashboardDate() {
  var dashDate = document.getElementById('dash_date');
  if (dashDate) dashDate.value = todayLocalISO();
  loadDashboardCharts();
}

function destroyCharts() {
  if (chartTrenInstance) { chartTrenInstance.destroy(); chartTrenInstance = null; }
  if (chartDistribusiInstance) { chartDistribusiInstance.destroy(); chartDistribusiInstance = null; }
  if (chartPerKelasInstance) { chartPerKelasInstance.destroy(); chartPerKelasInstance = null; }
  if (chartStudentPersonalInstance) { chartStudentPersonalInstance.destroy(); chartStudentPersonalInstance = null; }
}

function loadDashboardCharts(startDate, endDate) {
  _dashboardToken++;
  var myToken = _dashboardToken;

  if (!startDate) {
    var dashInput = document.getElementById('dash_date');
    startDate = (dashInput && dashInput.value) ? dashInput.value : todayLocalISO();
  }
  if (!endDate) endDate = startDate;

  console.log('[Dashboard] Request #' + myToken + ':', startDate, '→', endDate);

  showLoading();
  google.script.run
    .withSuccessHandler(function(data) {
      if (myToken !== _dashboardToken) {
        console.log('[Dashboard] Response #' + myToken + ' STALE — di-skip');
        return;
      }
      hideLoading();
      console.log('[Dashboard] Response #' + myToken + ' dirender');

      data = data || {};
      var totalRekap = data.totalRekap || { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };
      var trenPerHari = Array.isArray(data.trenPerHari) ? data.trenPerHari : [];
      var rekapPerKelas = Array.isArray(data.rekapPerKelas) ? data.rekapPerKelas : [];
      var totalKelas = data.totalKelas || 0;

      var elTrenSub = document.getElementById('trenSubtitle');
      var elDisSub = document.getElementById('distribusiSubtitle');
      if (data.periode && data.periode.start && data.periode.end) {
        var startDisplay = formatDateDisplay(data.periode.start);
        var endDisplay = formatDateDisplay(data.periode.end);
        var textDisplay = (startDisplay === endDisplay) ? 'Data untuk ' + startDisplay : 'Data ' + startDisplay + ' - ' + endDisplay;
        if (elTrenSub) elTrenSub.textContent = textDisplay;
        if (elDisSub) elDisSub.textContent = textDisplay;
      } else {
        if (elTrenSub) elTrenSub.textContent = '7 hari terakhir';
        if (elDisSub) elDisSub.textContent = 'Keseluruhan';
      }

      renderDashStats(data);
      renderChartTren(trenPerHari);
      renderChartDistribusi(totalRekap);
      renderChartPerKelas(rekapPerKelas, totalKelas);

      var tanggalWA = (startDate === endDate) ? startDate : todayLocalISO();
      loadWaNotifSection(tanggalWA);
    })
    .withFailureHandler(function(err) {
      if (myToken !== _dashboardToken) return;
      hideLoading();
      console.error('[Dashboard] Gagal load (request #' + myToken + '):', err);
    })
    .getDashboardAdmin(startDate, endDate);
}

function renderDashStats(data) {
  data = data || {};
  var siswaRekap = data.siswaRekap || data.totalRekap || { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };
  animateCounter('dash-hadir', siswaRekap.Hadir || 0);
  animateCounter('dash-sakit', siswaRekap.Sakit || 0);
  animateCounter('dash-izin', siswaRekap.Izin || 0);
  animateCounter('dash-alpa', siswaRekap.Alpa || 0);
  animateCounter('dash-siswa-tepat', data.siswaTepatWaktu || 0);
  animateCounter('dash-siswa-terlambat', data.siswaTerlambat || 0);

  var siswaInfo = document.getElementById('siswa-count-info');
  if (siswaInfo) siswaInfo.textContent = (data.totalSiswa || 0) + ' Siswa | ' + (data.totalKelas || 0) + ' Kelas';

  var gtkRekap = data.gtkRekap || { Hadir: 0, Sakit: 0, Izin: 0 };
  animateCounter('dash-gtk-hadir', gtkRekap.Hadir || 0);
  animateCounter('dash-gtk-sakit', gtkRekap.Sakit || 0);
  animateCounter('dash-gtk-izin', gtkRekap.Izin || 0);
  animateCounter('dash-gtk-total', data.totalGTK || 0);
  animateCounter('dash-gtk-tepat', data.gtkTepatWaktu || 0);
  animateCounter('dash-gtk-terlambat', data.gtkTerlambat || 0);
  animateCounter('dash-gtk-pulang', data.gtkSudahPulang || 0);

  var gtkInfo = document.getElementById('gtk-count-info');
  if (gtkInfo) gtkInfo.textContent = (data.totalGTK || 0) + ' GTK terdaftar';
}

function animateCounter(elId, target) {
  var el = document.getElementById(elId);
  if (!el) return;
  var duration = 400;
  var start = parseInt(el.textContent, 10) || 0;
  var diff = target - start;
  if (diff === 0) { el.textContent = target; return; }
  var startTime = performance.now();
  function step(currentTime) {
    var elapsed = currentTime - startTime;
    var progress = Math.min(elapsed / duration, 1);
    var eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(start + diff * eased);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function renderChartTren(trenData) {
  var safeTren = Array.isArray(trenData) ? trenData : [];
  if (chartTrenInstance) chartTrenInstance.destroy();
  var canvas = document.getElementById('chartTrenMingguan');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var labels = safeTren.map(function(d) { return shortDate(d.date); });

  chartTrenInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        { label: 'Hadir', data: safeTren.map(function(d) { return d.Hadir || 0; }), borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,0.08)', borderWidth: 2.5, fill: true, tension: 0.35 },
        { label: 'Sakit', data: safeTren.map(function(d) { return d.Sakit || 0; }), borderColor: '#3b82f6', backgroundColor: 'rgba(59,130,246,0.08)', borderWidth: 2.5, fill: true, tension: 0.35 },
        { label: 'Izin', data: safeTren.map(function(d) { return d.Izin || 0; }), borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 2.5, fill: true, tension: 0.35 },
        { label: 'Alpa', data: safeTren.map(function(d) { return d.Alpa || 0; }), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)', borderWidth: 2.5, fill: true, tension: 0.35 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: true, aspectRatio: 2.4, plugins: { legend: { display: true, position: 'top' } } }
  });
}

function renderChartDistribusi(rekap) {
  var safe = rekap || { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 };
  if (chartDistribusiInstance) chartDistribusiInstance.destroy();
  var canvas = document.getElementById('chartDistribusi');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var total = (safe.Hadir || 0) + (safe.Sakit || 0) + (safe.Izin || 0) + (safe.Alpa || 0);
  var colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
  var labels = ['Hadir', 'Sakit', 'Izin', 'Alpa'];
  var values = [safe.Hadir || 0, safe.Sakit || 0, safe.Izin || 0, safe.Alpa || 0];

  chartDistribusiInstance = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#ffffff' }] },
    options: { responsive: true, maintainAspectRatio: true, cutout: '70%', plugins: { legend: { display: false } } }
  });

  var legendEl = document.getElementById('doughnutLegend');
  if (legendEl) {
    legendEl.innerHTML = '';
    labels.forEach(function(label, i) {
      var pct = total > 0 ? ((values[i] / total) * 100).toFixed(1) : '0.0';
      legendEl.innerHTML += '<div class="doughnut-legend-item"><span class="doughnut-legend-dot" style="background:' + colors[i] + ';"></span><span>' + label + '</span><span class="doughnut-legend-val">' + values[i] + ' <small style="font-weight:500;color:#94a3b8;">(' + pct + '%)</small></span></div>';
    });
  }
}

function renderChartPerKelas(rekapData, totalKelas) {
  var safeRekap = Array.isArray(rekapData) ? rekapData : [];
  if (chartPerKelasInstance) chartPerKelasInstance.destroy();
  if (document.getElementById('kelasCountBadge')) document.getElementById('kelasCountBadge').textContent = totalKelas || safeRekap.length;
  if (document.getElementById('kelasCountInfo')) document.getElementById('kelasCountInfo').textContent = safeRekap.length + ' kelas';

  var canvas = document.getElementById('chartPerKelas');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var labels = safeRekap.map(function(d) { return d.kelas || ''; });

  chartPerKelasInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: 'Hadir', data: safeRekap.map(function(d) { return d.Hadir || 0; }), backgroundColor: 'rgba(16,185,129,0.85)', borderRadius: 4 },
        { label: 'Sakit', data: safeRekap.map(function(d) { return d.Sakit || 0; }), backgroundColor: 'rgba(59,130,246,0.85)', borderRadius: 4 },
        { label: 'Izin', data: safeRekap.map(function(d) { return d.Izin || 0; }), backgroundColor: 'rgba(245,158,11,0.85)', borderRadius: 4 },
        { label: 'Alpa', data: safeRekap.map(function(d) { return d.Alpa || 0; }), backgroundColor: 'rgba(239,68,68,0.85)', borderRadius: 4 }
      ]
    },
    options: { responsive: true, maintainAspectRatio: true, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } } }
  });
}

function renderStudentChartPersonal(h, s, i, a) {
  if (chartStudentPersonalInstance) chartStudentPersonalInstance.destroy();
  var canvas = document.getElementById('chartStudentPersonal');
  if (!canvas) return;
  var ctx = canvas.getContext('2d');
  var total = h + s + i + a;
  var values = [h, s, i, a];
  var colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
  var labels = ['Hadir', 'Sakit', 'Izin', 'Alpa'];

  chartStudentPersonalInstance = new Chart(ctx, {
    type: 'doughnut',
    data: { labels: labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#ffffff' }] },
    options: { responsive: true, maintainAspectRatio: true, cutout: '70%', plugins: { legend: { display: false } } }
  });

  var legendEl = document.getElementById('doughnutLegendPersonal');
  if (legendEl) {
    legendEl.innerHTML = '';
    labels.forEach(function(label, idx) {
      var pct = total > 0 ? ((values[idx] / total) * 100).toFixed(1) : '0.0';
      legendEl.innerHTML += '<div class="doughnut-legend-item"><span class="doughnut-legend-dot" style="background:' + colors[idx] + ';"></span><span>' + label + '</span><span class="doughnut-legend-val">' + values[idx] + ' <small style="font-weight:500;color:#94a3b8;">(' + pct + '%)</small></span></div>';
    });
  }
}

// =============================================
// STUDENT DASHBOARD
// =============================================
function loadStudentDashboard() {
  if (!currentUser || !currentUser.student) return;
  var s = currentUser.student;
  var studentNisClean = String(s.NIS).trim();

  var elName = document.getElementById('student-welcome-name');
  var elInfo = document.getElementById('student-welcome-info');
  if (elName) elName.textContent = s.Nama_Siswa;
  if (elInfo) elInfo.textContent = 'NIS: ' + studentNisClean + ' | Kelas: ' + s.Nama_Kelas + (s.Nomor_Absen ? ' | No. Absen: #' + s.Nomor_Absen : '');

  showLoading();
  google.script.run
    .withSuccessHandler(function(res) {
      hideLoading();
      res = res || { history: [], rekap: { Hadir: 0, Sakit: 0, Izin: 0, Alpa: 0 } };
      var studentAbsens = Array.isArray(res.history) ? res.history : [];

      animateCounter('student-stat-hadir', res.rekap ? (res.rekap.Hadir || 0) : 0);
      animateCounter('student-stat-sakit', res.rekap ? (res.rekap.Sakit || 0) : 0);
      animateCounter('student-stat-izin', res.rekap ? (res.rekap.Izin || 0) : 0);
      animateCounter('student-stat-alpa', res.rekap ? (res.rekap.Alpa || 0) : 0);

      renderStudentChartPersonal(
        res.rekap ? (res.rekap.Hadir || 0) : 0,
        res.rekap ? (res.rekap.Sakit || 0) : 0,
        res.rekap ? (res.rekap.Izin || 0) : 0,
        res.rekap ? (res.rekap.Alpa || 0) : 0
      );

      var todayStr = todayLocalISO();
      var todayAbsen = studentAbsens.find(function(r) { return String(r.Tanggal).slice(0,10) === todayStr; });
      var box = document.getElementById('student-today-status-box');
      if (box) {
        if (todayAbsen) {
          var badgeMap = { 'Hadir': 'badge-hadir', 'Sakit': 'badge-sakit', 'Izin': 'badge-izin', 'Alpa': 'badge-alpa' };
          var approvalMap = { 'Pending': 'badge-approval-pending', 'Approved': 'badge-approval-approved', 'Rejected': 'badge-approval-rejected' };
          var approvalStatus = todayAbsen.Status_Approval || 'Approved';

          box.innerHTML = '<div style="font-size:13px;color:var(--text-muted);margin-bottom:6px;">Status Absensi Hari Ini:</div>' +
            '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center;">' +
              '<span class="badge-status-table ' + (badgeMap[todayAbsen.Status] || '') + '" style="font-size:14px;padding:6px 18px;">' +
                '<i class="fas fa-check-circle"></i> ' + todayAbsen.Status +
              '</span>' +
              '<span class="' + (approvalMap[approvalStatus] || 'badge-approval-approved') + '" style="font-size:11px;padding:4px 14px;">' +
                (approvalStatus === 'Pending' ? '<i class="fas fa-clock"></i> Menunggu Approval' :
                 approvalStatus === 'Approved' ? '<i class="fas fa-check"></i> Disetujui' :
                 '<i class="fas fa-times"></i> Ditolak') +
              '</span>' +
              (todayAbsen.Jarak_Meter ? '<span style="font-size:11px;color:var(--text-muted);">📏 ' + todayAbsen.Jarak_Meter + 'm</span>' : '') +
              (todayAbsen.Selfie_Url ? '<a href="' + escapeHtml(todayAbsen.Selfie_Url) + '" target="_blank" class="link-surat" style="font-size:10px;padding:2px 8px;"><i class="fas fa-camera"></i> Selfie</a>' : '') +
            '</div>' +
            '<div style="font-size:12px;color:var(--text-muted);margin-top:10px;">' + (todayAbsen.Keterangan ? 'Keterangan: ' + escapeHtml(todayAbsen.Keterangan) : 'Tercatat di Sistem') + '</div>';
        } else {
          box.innerHTML = '<div style="font-size:13px;color:#ef4444;font-weight:700;margin-bottom:10px;"><i class="fas fa-exclamation-triangle"></i> Anda Belum Absen Hari Ini</div>' +
            '<button type="button" class="btn btn-primary btn-sm" onclick="showPage(\'page-absen-siswa\', document.querySelector(\'[data-page=absen-siswa]\'))">' +
              '<i class="fas fa-user-check"></i> Absen Sekarang' +
            '</button>';
        }
      }

      paginationState.studentHistory.data = studentAbsens;
      paginationState.studentHistory.page = 1;
      renderStudentHistoryTable();
    })
    .withFailureHandler(function(err) { hideLoading(); console.error(err); })
    .getStudentData(studentNisClean);
}

function renderStudentHistoryTable() {
  renderPaginationControls('studentHistory', function(pageData) {
    var tbody = DOM.tbodyStudentHistory || document.getElementById('studentHistoryTbody');
    if (!tbody) return;

    if (pageData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:18px;color:var(--text-muted);">Belum ada riwayat absensi.</td></tr>';
      return;
    }

    var badgeMap = { 'Hadir': 'badge-hadir', 'Sakit': 'badge-sakit', 'Izin': 'badge-izin', 'Alpa': 'badge-alpa' };
    var approvalMap = { 'Pending': 'badge-approval-pending', 'Approved': 'badge-approval-approved', 'Rejected': 'badge-approval-rejected' };
    var approvalLabel = { 'Pending': '⏳ Pending', 'Approved': '✅ Disetujui', 'Rejected': '❌ Ditolak' };

    var htmlBuffer = new Array(pageData.length);
    for (var i = 0; i < pageData.length; i++) {
      var a = pageData[i];
      var approvalStatus = a.Status_Approval || 'Approved';

      htmlBuffer[i] = '<tr>' +
        '<td>' + shortDate(a.Tanggal) + '</td>' +
        '<td><span class="badge-status-table ' + (badgeMap[a.Status] || '') + '">' + a.Status + '</span></td>' +
        '<td><span class="' + (approvalMap[approvalStatus] || 'badge-approval-approved') + '">' + (approvalLabel[approvalStatus] || '✅ Disetujui') + '</span></td>' +
        '<td>' + (escapeHtml(a.Keterangan) || '-') + '</td>' +
        '<td>' + (a.Link_Surat || a.Link ? '<a href="' + escapeHtml(a.Link_Surat || a.Link) + '" target="_blank" class="link-surat"><i class="fas fa-file"></i> Surat</a>' : '-') + '</td>' +
        '<td>' + (a.Selfie_Url ? '<a href="' + escapeHtml(a.Selfie_Url) + '" target="_blank" class="link-surat" style="font-size:10px;padding:2px 8px;"><i class="fas fa-camera"></i></a>' : '-') + '</td>' +
        '<td>' + (a.Jarak_Meter ? a.Jarak_Meter + 'm' : '-') + '</td>' +
      '</tr>';
    }
    tbody.innerHTML = htmlBuffer.join('');
  });
}

// =============================================
// APPROVAL DASHBOARD — sequential
// =============================================
function loadApprovalKelasDropdown() {
  google.script.run
    .withSuccessHandler(function(data) {
      var sel = document.getElementById('approval_filter_kelas');
      if (!sel) return;
      var currentVal = sel.value;
      sel.innerHTML = '<option value="">-- Semua Kelas --</option>';
      var safeData = Array.isArray(data) ? data : [];
      safeData.forEach(function(k) {
        var opt = document.createElement('option');
        opt.value = k.ID_Kelas;
        opt.textContent = k.Nama_Kelas;
        sel.appendChild(opt);
      });
      if (currentVal) sel.value = currentVal;
    })
    .withFailureHandler(function(err) { console.error('Gagal load dropdown kelas:', err); })
    .getKelasForFilter();
}

function loadApprovalDashboard() {
  _approvalToken++;
  var myToken = _approvalToken;

  showLoading();
  var filterKelas = document.getElementById('approval_filter_kelas') ? document.getElementById('approval_filter_kelas').value : '';

  google.script.run
    .withSuccessHandler(function(kelasData) {
      if (myToken !== _approvalToken) return;
      var sel = document.getElementById('approval_filter_kelas');
      if (sel) {
        var currentVal = sel.value;
        sel.innerHTML = '<option value="">-- Semua Kelas --</option>';
        (Array.isArray(kelasData) ? kelasData : []).forEach(function(k) {
          var opt = document.createElement('option');
          opt.value = k.ID_Kelas;
          opt.textContent = k.Nama_Kelas;
          sel.appendChild(opt);
        });
        if (currentVal) sel.value = currentVal;
      }

      google.script.run
        .withSuccessHandler(function(stats) {
          if (myToken !== _approvalToken) return;
          stats = stats || { pending: 0, approved: 0, rejected: 0 };
          animateCounter('approval-pending', stats.pending || 0);
          animateCounter('approval-approved', stats.approved || 0);
          animateCounter('approval-rejected', stats.rejected || 0);

          var badge = document.getElementById('approval-badge');
          if (badge) {
            if (stats.pending > 0) { badge.textContent = stats.pending; badge.classList.remove('hidden'); }
            else { badge.classList.add('hidden'); }
          }

          google.script.run
            .withSuccessHandler(function(pendingList) {
              if (myToken !== _approvalToken) return;
              hideLoading();
              renderApprovalList(pendingList);
            })
            .withFailureHandler(function(err) {
              hideLoading();
              Swal.fire({ icon: 'error', title: 'Error', text: err.message });
            })
            .getPendingApprovals(filterKelas);
        })
        .withFailureHandler(function(err) {
          console.error('Stats error:', err);
          google.script.run
            .withSuccessHandler(function(pendingList) {
              hideLoading();
              renderApprovalList(pendingList);
            })
            .withFailureHandler(function(e2) {
              hideLoading();
              Swal.fire({ icon: 'error', title: 'Error', text: e2.message });
            })
            .getPendingApprovals(filterKelas);
        })
        .getApprovalStats();
    })
    .withFailureHandler(function(err) {
      hideLoading();
      console.error('Gagal load kelas:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    })
    .getKelasForFilter();
}

// =============================================
// RENDER APPROVAL LIST — FIXED (nested if dihapus)
// =============================================
function renderApprovalList(pendingList) {
  var container = DOM.approvalContainer || document.getElementById('approval-list-container');
  if (!container) return;

  if (!pendingList || pendingList.length === 0) {
    container.innerHTML = '<div class="card" style="text-align:center;padding:32px;">' +
      '<i class="fas fa-check-double" style="font-size:3em;color:var(--primary);margin-bottom:10px;"></i>' +
      '<h3 style="font-size:16px;font-weight:800;color:#0f172a;">Tidak Ada Pengajuan</h3>' +
      '<p style="font-size:12.5px;color:var(--text-muted);margin-top:4px;">Semua absensi mandiri sudah diverifikasi.</p>' +
    '</div>';
    return;
  }

  var html = '';
  pendingList.forEach(function(item) {
    var statusBadge;
    if (item.Is_Auto_Alpa) {
      statusBadge = '<span style="background:#7c3aed;color:#fff;padding:3px 10px;border-radius:12px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;gap:4px;">' +
        '<i class="fas fa-robot"></i> AUTO-MARK ALPA</span>';
    } else {
      statusBadge = '<span class="badge-approval-pending"><i class="fas fa-clock"></i> Pending</span>';
    }

    var statusMap = { 'Hadir': 'badge-hadir', 'Sakit': 'badge-sakit', 'Izin': 'badge-izin', 'Alpa': 'badge-alpa' };
    var displayKelas = item.Nama_Kelas || item.ID_Kelas || '-';

    var gpsBadge = '';
    if (item.Has_GPS) {
      gpsBadge = '<span class="badge-approval-approved" style="font-size:10px;background:#e0f2fe;color:#075985;border-color:#7dd3fc;">' +
                 '<i class="fas fa-map-marker-alt"></i> GPS: ' + (item.Jarak_Meter || '?') + 'm';
      if (item.GPS_Accuracy) gpsBadge += ' (±' + item.GPS_Accuracy + 'm)';
      gpsBadge += '</span>';
    } else {
      gpsBadge = '<span class="badge-approval-pending" style="font-size:10px;"><i class="fas fa-location-slash"></i> Tanpa GPS</span>';
    }

    var selfieBadge = item.Has_Selfie
      ? '<a href="' + escapeHtml(item.Selfie_Url) + '" target="_blank" class="link-surat" style="font-size:10px;padding:2px 8px;"><i class="fas fa-camera"></i> Lihat Selfie</a>'
      : '<span class="badge-approval-rejected" style="font-size:10px;"><i class="fas fa-times"></i> Tanpa Selfie</span>';

    html += '<div class="approval-card">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">' +
        '<div>' +
          '<div style="font-weight:800;font-size:15px;">' + escapeHtml(item.Nama_Siswa) + '</div>' +
          '<div style="font-size:12px;color:var(--text-muted);">' +
            'NIS: ' + escapeHtml(item.NIS) +
            ' | Kelas: <strong>' + escapeHtml(displayKelas) + '</strong>' +
            ' | Tanggal: ' + escapeHtml(item.Tanggal) +
          '</div>' +
          '<div style="margin-top:6px;display:flex;gap:6px;flex-wrap:wrap;align-items:center;">' +
            '<span class="badge-status-table ' + (statusMap[item.Status] || 'badge-hadir') + '" style="font-size:11px;padding:3px 12px;">' + item.Status + '</span>' +
            ' ' + statusBadge + ' ' + gpsBadge + ' ' + selfieBadge +
          '</div>' +
          '<div style="font-size:12px;color:#475569;margin-top:6px;">Keterangan: ' + (escapeHtml(item.Keterangan) || '-') + '</div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
          (item.Link_Surat ? '<a href="' + escapeHtml(item.Link_Surat) + '" target="_blank" class="link-surat" style="font-size:12px;padding:6px 12px;"><i class="fas fa-file-download"></i> Unduh Surat</a>' : '') +
        '</div>' +
      '</div>' +
      '<div class="approval-actions">' +
        '<button type="button" class="btn btn-approve btn-sm" onclick="approveAbsensi(\'' + item.ID_Absen + '\', \'' + escapeHtml(item.Nama_Siswa) + '\')" style="min-height:34px;padding:0.3em 1.2em;">' +
          '<i class="fas fa-check-circle"></i> Setujui' +
        '</button>' +
        '<button type="button" class="btn btn-reject btn-sm" onclick="rejectAbsensi(\'' + item.ID_Absen + '\', \'' + escapeHtml(item.Nama_Siswa) + '\')" style="min-height:34px;padding:0.3em 1.2em;">' +
          '<i class="fas fa-times-circle"></i> Tolak (→ Alpa)' +
        '</button>' +
      '</div>' +
    '</div>';
  });

  container.innerHTML = html;
}

function resetFilterApproval() {
  var sel = document.getElementById('approval_filter_kelas');
  if (sel) sel.value = '';
  loadApprovalDashboard();
}

function approveAbsensi(idAbsen, namaSiswa) {
  Swal.fire({
    title: 'Setujui Absensi?',
    text: 'Anda akan menyetujui absensi ' + namaSiswa + '.',
    icon: 'question', showCancelButton: true,
    confirmButtonText: 'Ya, Setujui', cancelButtonText: 'Batal',
    confirmButtonColor: '#10b981'
  }).then(function(result) {
    if (result.isConfirmed) {
      showLoading();
      google.script.run
        .withSuccessHandler(function(msg) {
          hideLoading();
          Swal.fire({ icon: 'success', title: 'Berhasil', text: msg, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
          loadApprovalDashboard();
          loadDashboardCharts();
        })
        .withFailureHandler(function(err) {
          hideLoading();
          Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
        })
        .approveAbsensi(idAbsen);
    }
  });
}

function rejectAbsensi(idAbsen, namaSiswa) {
  Swal.fire({
    title: 'Tolak Absensi?',
    html: 'Anda akan menolak absensi <strong>' + escapeHtml(namaSiswa) + '</strong>.<br>⚠️ Otomatis dicatat sebagai <strong>ALPA</strong>.',
    icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Ya, Tolak → Alpa', cancelButtonText: 'Batal',
    confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b'
  }).then(function(result) {
    if (result.isConfirmed) {
      showLoading();
      google.script.run
        .withSuccessHandler(function(msg) {
          hideLoading();
          Swal.fire({ icon: 'success', title: 'Diproses', text: msg, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
          loadApprovalDashboard();
          loadDashboardCharts();
        })
        .withFailureHandler(function(err) {
          hideLoading();
          Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
        })
        .rejectAbsensi(idAbsen);
    }
  });
}

function loadApprovalStatsOnly() {
  google.script.run
    .withSuccessHandler(function(stats) {
      stats = stats || { pending: 0, approved: 0, rejected: 0 };
      var badge = document.getElementById('approval-badge');
      if (badge) {
        if (stats.pending > 0) { badge.textContent = stats.pending; badge.classList.remove('hidden'); }
        else { badge.classList.add('hidden'); }
      }
    })
    .withFailureHandler(function(err) { console.error(err); })
    .getApprovalStats();
}

// =============================================
// KELAS (CRUD)
// =============================================
function loadKelas() {
  if (dtKelas) { dtKelas.destroy(); dtKelas = null; }
  showLoading();
  google.script.run
    .withSuccessHandler(function(data) {
      hideLoading();
      dataKelasCache = Array.isArray(data) ? data : [];
      if ($('#tableKelas').length) {
        dtKelas = $('#tableKelas').DataTable({
          data: dataKelasCache,
          columns: [
            { data: 'ID_Kelas' },
            { data: 'Nama_Kelas' },
            { data: null, orderable: false, render: function(d) {
              return '<button class="btn btn-outline btn-icon" onclick="editKelas(\'' + d.ID_Kelas + '\',\'' + escapeHtml(d.Nama_Kelas) + '\')" title="Edit"><i class="fas fa-edit"></i></button> ' +
                     '<button class="btn btn-danger btn-icon" onclick="hapusKelas(\'' + d.ID_Kelas + '\')" title="Hapus"><i class="fas fa-trash"></i></button>';
            }}
          ],
          responsive: true, pageLength: 25
        });
      }
    })
    .withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon:'error', title:'Error', text: err.message }); })
    .getKelas();
}

function simpanKelas(e) {
  e.preventDefault();
  var id = document.getElementById('id_kelas').value;
  var nama = document.getElementById('nama_kelas').value.trim();
  if (!nama) return;
  showLoading();
  google.script.run
    .withSuccessHandler(function(msg) {
      hideLoading();
      Swal.fire({ icon:'success', title:'Berhasil', text: msg, timer:1500, showConfirmButton:false, toast:true, position:'top-end' });
      resetFormKelas();
      loadKelas();
      refreshAllKelasDropdowns();
    })
    .withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon:'error', title:'Error', text: err.message }); })
    .saveKelas(id, nama);
}

function editKelas(id, nama) {
  document.getElementById('id_kelas').value = id;
  document.getElementById('nama_kelas').value = nama;
  document.getElementById('nama_kelas').focus();
}

function hapusKelas(id) {
  Swal.fire({
    title: 'Hapus Kelas?', text: 'Data kelas akan dihapus permanen.',
    icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal',
    confirmButtonColor: '#ef4444'
  }).then(function(r) {
    if (r.isConfirmed) {
      showLoading();
      google.script.run
        .withSuccessHandler(function(msg) {
          hideLoading();
          Swal.fire({ icon:'success', title:'Berhasil', text: msg, timer:1500, showConfirmButton:false, toast:true, position:'top-end' });
          loadKelas();
          refreshAllKelasDropdowns();
        })
        .withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon:'error', title:'Error', text: err.message }); })
        .deleteKelas(id);
    }
  });
}

function resetFormKelas() {
  if (document.getElementById('id_kelas')) document.getElementById('id_kelas').value = '';
  if (document.getElementById('nama_kelas')) document.getElementById('nama_kelas').value = '';
}

// =============================================
// SISWA (CRUD)
// =============================================
function loadSiswa() {
  if (dtSiswa) { dtSiswa.destroy(); dtSiswa = null; }
  showLoading();
  google.script.run
    .withSuccessHandler(function(data) {
      hideLoading();
      var safeData = Array.isArray(data) ? data : [];
      if ($('#tableSiswa').length) {
        dtSiswa = $('#tableSiswa').DataTable({
          data: safeData,
          columns: [
            { data: 'Nomor_Absen', defaultContent: '-' },
            { data: 'NIS' },
            { data: 'Nama_Siswa' },
            { data: 'Nama_Kelas' },
            { data: null, orderable: false, render: function(d) {
              return '<button class="btn btn-outline btn-icon" onclick="editSiswa(\'' + d.NIS + '\',\'' + escapeHtml(d.Nama_Siswa) + '\',\'' + d.ID_Kelas + '\',\'' + (d.Nomor_Absen || '') + '\')" title="Edit"><i class="fas fa-edit"></i></button>' +
                     '<button class="btn btn-danger btn-icon" onclick="hapusSiswa(\'' + d.NIS + '\')" title="Hapus"><i class="fas fa-trash"></i></button>';
            }}
          ],
          responsive: true, pageLength: 25
        });
      }
      refreshAllKelasDropdowns();
    })
    .withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon:'error', title:'Error', text: err.message }); })
    .getSiswa();
}

function simpanSiswa(e) {
  e.preventDefault();
  var nis = document.getElementById('nis_siswa').value.trim();
  var nama = document.getElementById('nama_siswa').value.trim();
  var kelas = document.getElementById('kelas_siswa').value;
  var nomorAbsen = document.getElementById('nomor_absen').value.trim();
  var isEdit = document.getElementById('is_edit_siswa').value === 'true';

  if (!nis || !nama || !kelas) {
    Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Harap isi NIS, Nama, dan Kelas.' });
    return;
  }

  showLoading();
  google.script.run
    .withSuccessHandler(function(msg) {
      hideLoading();
      Swal.fire({ icon:'success', title:'Berhasil', text: msg, timer:1500, showConfirmButton:false, toast:true, position:'top-end' });
      resetFormSiswa();
      loadSiswa();
      refreshAllKelasDropdowns();
    })
    .withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon:'error', title:'Error', text: err.message }); })
    .saveSiswa(nis, nama, kelas, nomorAbsen, isEdit);
}

function editSiswa(nis, nama, idKelas, nomorAbsen) {
  document.getElementById('nomor_absen').value = nomorAbsen || '';
  document.getElementById('nis_siswa').value = nis;
  document.getElementById('nis_siswa').readOnly = true;
  document.getElementById('nama_siswa').value = nama;
  document.getElementById('kelas_siswa').value = idKelas;
  document.getElementById('is_edit_siswa').value = 'true';
  document.getElementById('nama_siswa').focus();
}

function hapusSiswa(nis) {
  Swal.fire({
    title: 'Hapus Siswa?', text: 'Data siswa dan riwayat absensinya akan dihapus.',
    icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal',
    confirmButtonColor: '#ef4444'
  }).then(function(r) {
    if (r.isConfirmed) {
      showLoading();
      google.script.run
        .withSuccessHandler(function(msg) {
          hideLoading();
          Swal.fire({ icon:'success', title:'Berhasil', text: msg, timer:1500, showConfirmButton:false, toast:true, position:'top-end' });
          loadSiswa();
        })
        .withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon:'error', title:'Error', text: err.message }); })
        .deleteSiswa(nis);
    }
  });
}

function resetFormSiswa() {
  if (document.getElementById('nomor_absen')) document.getElementById('nomor_absen').value = '';
  if (document.getElementById('nis_siswa')) {
    document.getElementById('nis_siswa').value = '';
    document.getElementById('nis_siswa').readOnly = false;
  }
  if (document.getElementById('nama_siswa')) document.getElementById('nama_siswa').value = '';
  if (document.getElementById('kelas_siswa')) document.getElementById('kelas_siswa').value = '';
  if (document.getElementById('is_edit_siswa')) document.getElementById('is_edit_siswa').value = 'false';
}

// =============================================
// DROPDOWN REFRESH
// =============================================
function refreshAllKelasDropdowns() {
  google.script.run
    .withSuccessHandler(function(data) {
      dataKelasCache = Array.isArray(data) ? data : [];
      populateSelect('kelas_siswa', dataKelasCache, '-- Pilih Kelas --');
      populateSelect('kelas_absen', dataKelasCache, '-- Pilih Kelas --');
      populateSelect('admin_filter_tugas_kelas', dataKelasCache, '-- Semua Kelas --');
      populateSelect('lap_kelas', dataKelasCache, '-- Semua Kelas --');
      populateSelect('admin_wa_filter_kelas', dataKelasCache, '-- Semua Kelas --');
    })
    .withFailureHandler(function(err) { console.error('Gagal refresh dropdown:', err); })
    .getKelas();
}

function populateSelect(elId, data, placeholder) {
  var sel = document.getElementById(elId);
  if (!sel) return;
  var currentVal = sel.value;
  sel.innerHTML = '<option value="">' + placeholder + '</option>';
  var safeData = Array.isArray(data) ? data : [];
  safeData.forEach(function(d) {
    var opt = document.createElement('option');
    opt.value = d.ID_Kelas;
    opt.textContent = d.Nama_Kelas;
    sel.appendChild(opt);
  });
  if (currentVal) sel.value = currentVal;
}

// =============================================
// WHATSAPP ADMIN
// =============================================
function loadWhatsappAdmin() {
  showLoading();
  var idKelas = document.getElementById('admin_wa_filter_kelas') ? document.getElementById('admin_wa_filter_kelas').value : '';
  var searchKey = document.getElementById('admin_wa_filter_search') ? document.getElementById('admin_wa_filter_search').value : '';

  google.script.run
    .withSuccessHandler(function(data) {
      hideLoading();
      paginationState.waAdmin.data = Array.isArray(data) ? data : [];
      paginationState.waAdmin.page = 1;
      renderWhatsappAdminTable();
    })
    .withFailureHandler(function(err) {
      hideLoading();
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    })
    .getAllWhatsappSiswa(idKelas, searchKey);
}

function renderWhatsappAdminTable() {
  renderPaginationControls('waAdmin', function(pageData, startIdx) {
    var tbody = DOM.tbodyWaAdmin || document.getElementById('tbodyWhatsappAdmin');
    if (!tbody) return;

    if (pageData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted);font-style:italic;">Tidak ada data siswa ditemukan.</td></tr>';
      return;
    }

    var htmlBuffer = new Array(pageData.length);
    for (var i = 0; i < pageData.length; i++) {
      var s = pageData[i];
      var waSiswa = s.WA_Siswa || '';
      var waWali = s.WA_Wali || '';
      var hasWaSiswa = waSiswa && waSiswa.length >= 10;
      var hasWaWali = waWali && waWali.length >= 10;

      var waSiswaBtn = hasWaSiswa
        ? '<button class="btn btn-wa btn-sm" style="min-height:28px;padding:0.2em 0.8em;font-size:11px;" onclick="openWhatsApp(\'' + waSiswa + '\', \'' + escapeHtml(s.Nama_Siswa).replace(/'/g, "\\'") + '\')"><i class="fab fa-whatsapp"></i> Chat</button>'
        : '<span class="wa-number empty">-</span>';
      var waWaliBtn = hasWaWali
        ? '<button class="btn btn-wa btn-sm" style="min-height:28px;padding:0.2em 0.8em;font-size:11px;" onclick="openWhatsApp(\'' + waWali + '\', \'' + escapeHtml(s.Nama_Siswa).replace(/'/g, "\\'") + '\')"><i class="fab fa-whatsapp"></i> Chat</button>'
        : '<span class="wa-number empty">-</span>';

      htmlBuffer[i] = '<tr>' +
        '<td>' + (startIdx + i) + '</td>' +
        '<td>' + escapeHtml(s.NIS) + '</td>' +
        '<td style="text-align:left;"><strong>' + escapeHtml(s.Nama_Siswa) + '</strong></td>' +
        '<td><span class="chart-badge">' + escapeHtml(s.Nama_Kelas) + '</span></td>' +
        '<td><span class="wa-number ' + (hasWaSiswa ? 'available' : 'empty') + '">' + (hasWaSiswa ? waSiswa : '-') + '</span></td>' +
        '<td>' + waSiswaBtn + '</td>' +
        '<td><span class="wa-number ' + (hasWaWali ? 'available' : 'empty') + '">' + (hasWaWali ? waWali : '-') + '</span></td>' +
        '<td>' + waWaliBtn + '</td>' +
      '</tr>';
    }
    tbody.innerHTML = htmlBuffer.join('');
  });
}

function resetFilterWhatsappAdmin() {
  if (document.getElementById('admin_wa_filter_kelas')) document.getElementById('admin_wa_filter_kelas').value = '';
  if (document.getElementById('admin_wa_filter_search')) document.getElementById('admin_wa_filter_search').value = '';
  loadWhatsappAdmin();
}

// =============================================
// LAPORAN
// =============================================
function initLaporan() {
  if (document.getElementById('lap_start')) document.getElementById('lap_start').value = todayLocalISO().slice(0,8) + '01';
  if (document.getElementById('lap_end')) document.getElementById('lap_end').value = todayLocalISO();
  loadLaporan();
}

function loadLaporan() {
  var start = document.getElementById('lap_start') ? document.getElementById('lap_start').value : '';
  var end = document.getElementById('lap_end') ? document.getElementById('lap_end').value : '';
  var kelas = document.getElementById('lap_kelas') ? document.getElementById('lap_kelas').value : '';

  if (!start || !end) {
    Swal.fire({ icon: 'warning', title: 'Lengkapi Filter', text: 'Pilih rentang tanggal terlebih dahulu.' });
    return;
  }

  showLoading();
  google.script.run
    .withSuccessHandler(function(data) {
      hideLoading();
      laporanDataCache = Array.isArray(data) ? data : [];
      paginationState.laporan.data = laporanDataCache;
      paginationState.laporan.page = 1;
      renderLaporanTable();
    })
    .withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon:'error', title:'Error', text: err.message }); })
    .getLaporanRekap(start, end, kelas || '');
}

function renderLaporanTable() {
  renderPaginationControls('laporan', function(pageData) {
    var tbody = DOM.tbodyLaporan || document.getElementById('laporanTbody');
    if (!tbody) return;

    if (pageData.length === 0) {
      tbody.innerHTML = '<tr class="empty-row"><td colspan="9"><span class="empty-icon"><i class="fas fa-inbox"></i></span>Tidak ada data absensi pada periode ini</td></tr>';
      if (document.getElementById('exportButtons')) document.getElementById('exportButtons').innerHTML = '';
      return;
    }

    var badgeMap = { 'Hadir': 'badge-hadir', 'Sakit': 'badge-sakit', 'Izin': 'badge-izin', 'Alpa': 'badge-alpa' };
    var htmlBuffer = new Array(pageData.length);
    for (var i = 0; i < pageData.length; i++) {
      var d = pageData[i];
      htmlBuffer[i] = '<tr>' +
        '<td>' + shortDate(d.Tanggal) + '</td>' +
        '<td>' + escapeHtml(d.Nama_Kelas) + '</td>' +
        '<td>' + escapeHtml(d.NIS) + '</td>' +
        '<td>' + escapeHtml(d.Nama_Siswa) + '</td>' +
        '<td><span class="badge-status-table ' + (badgeMap[d.Status] || '') + '">' + d.Status + '</span></td>' +
        '<td>' + (escapeHtml(d.Keterangan) || '-') + '</td>' +
        '<td>' + (d.Link || d.Link_Surat ? '<a href="' + escapeHtml(d.Link || d.Link_Surat) + '" target="_blank" class="link-surat"><i class="fas fa-external-link-alt"></i> Lihat</a>' : '<span class="no-surat">-</span>') + '</td>' +
        '<td>' + (d.Selfie_Url ? '<a href="' + escapeHtml(d.Selfie_Url) + '" target="_blank" class="link-surat" style="font-size:10px;padding:2px 6px;"><i class="fas fa-camera"></i></a>' : '-') + '</td>' +
        '<td>' + (d.Jarak_Meter ? d.Jarak_Meter + 'm' : '-') + '</td>' +
      '</tr>';
    }
    tbody.innerHTML = htmlBuffer.join('');

    if (document.getElementById('exportButtons')) {
      document.getElementById('exportButtons').innerHTML =
        '<button class="btn btn-outline btn-icon" onclick="exportPDF()" title="Export PDF" style="min-height:30px; min-width:30px; padding:0.2em 0.6em; font-size:11px;"><i class="fas fa-file-pdf"></i> PDF</button>' +
        '<button class="btn btn-outline btn-icon" onclick="window.print()" title="Cetak" style="min-height:30px; min-width:30px; padding:0.2em 0.6em; font-size:11px;"><i class="fas fa-print"></i> Cetak</button>';
    }
  });
}

function exportPDF() {
  if (typeof pdfMake === 'undefined') {
    Swal.fire({ icon: 'error', title: 'PDF Error', text: 'Library PDF belum siap.' });
    return;
  }

  var safeLaporan = Array.isArray(laporanDataCache) ? laporanDataCache : [];
  if (!safeLaporan.length) {
    Swal.fire({ icon: 'info', title: 'Tidak Ada Data', text: 'Tidak ada data untuk diexport.' });
    return;
  }

  var start = document.getElementById('lap_start').value;
  var end = document.getElementById('lap_end').value;
  var kelasSel = document.getElementById('lap_kelas');
  var kelasLabel = kelasSel ? kelasSel.options[kelasSel.selectedIndex].text : '-- Semua --';

  var tableBody = [[
    { text: 'Tanggal', style: 'tableHeader' },
    { text: 'Kelas', style: 'tableHeader' },
    { text: 'NIS', style: 'tableHeader' },
    { text: 'Nama Siswa', style: 'tableHeader' },
    { text: 'Status', style: 'tableHeader' },
    { text: 'Keterangan', style: 'tableHeader' }
  ]];

  safeLaporan.forEach(function(d) {
    tableBody.push([shortDate(d.Tanggal), d.Nama_Kelas || '-', d.NIS || '-', d.Nama_Siswa || '-', d.Status || '-', d.Keterangan || '-']);
  });

  var docDefinition = {
    pageOrientation: 'landscape',
    pageMargins: [30, 40, 30, 30],
    content: [
      { text: 'Laporan & Rekap Absensi Digital', style: 'header' },
      { text: 'Periode: ' + formatDateDisplay(start) + ' - ' + formatDateDisplay(end), style: 'subheader' },
      { text: 'Kelas: ' + kelasLabel, style: 'subheader', margin: [0, 0, 0, 10] },
      { table: { headerRows: 1, widths: ['auto', 'auto', 'auto', '*', 'auto', '*'], body: tableBody },
        layout: { fillColor: function (rowIndex) { return rowIndex === 0 ? '#10b981' : (rowIndex % 2 === 0 ? '#f8fafc' : null); } } }
    ],
    styles: {
      header: { fontSize: 16, bold: true, margin: [0, 0, 0, 4], color: '#064e3b' },
      subheader: { fontSize: 10, color: '#475569' },
      tableHeader: { bold: true, fontSize: 9, color: '#ffffff' }
    },
    defaultStyle: { fontSize: 8.5 }
  };

  try { pdfMake.createPdf(docDefinition).download('laporan_absensi_' + todayLocalISO() + '.pdf'); }
  catch (err) { console.error('Gagal membuat PDF:', err); Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal membuat file PDF.' }); }
}

function resetFilterLaporan() {
  if (document.getElementById('lap_start')) document.getElementById('lap_start').value = '';
  if (document.getElementById('lap_end')) document.getElementById('lap_end').value = '';
  if (document.getElementById('lap_kelas')) document.getElementById('lap_kelas').value = '';
  if (document.getElementById('laporanTbody')) document.getElementById('laporanTbody').innerHTML = '';
  paginationState.laporan.data = [];
  paginationState.laporan.page = 1;
  renderLaporanTable();
}

// =============================================
// PENGATURAN
// =============================================
function showPengaturanSiswa() {
  if (!currentUser || !currentUser.student) return;
  var s = currentUser.student;
  document.getElementById('settings-student-name').textContent = s.Nama_Siswa || '-';
  document.getElementById('settings-student-info').textContent = 'NIS: ' + (s.NIS || '-') + ' | Kelas: ' + (s.Nama_Kelas || '-');
  document.getElementById('settings-avatar-initial').textContent = (s.Nama_Siswa || 'S').charAt(0).toUpperCase();
  document.getElementById('current_password').value = '';
  document.getElementById('new_password').value = '';
  document.getElementById('confirm_password').value = '';
}

function handleGantiPassword(e) {
  e.preventDefault();
  if (!currentUser || !currentUser.student) return;

  var currentPass = document.getElementById('current_password').value.trim();
  var newPass = document.getElementById('new_password').value.trim();
  var confirmPass = document.getElementById('confirm_password').value.trim();

  if (!currentPass || !newPass || !confirmPass) { Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Harap isi semua field password.' }); return; }
  if (newPass.length < 6) { Swal.fire({ icon: 'warning', title: 'Password Terlalu Pendek', text: 'Password minimal 6 karakter.' }); return; }
  if (newPass !== confirmPass) { Swal.fire({ icon: 'error', title: 'Password Tidak Cocok', text: 'Password baru dan konfirmasi harus sama.' }); return; }

  var nis = String(currentUser.student.NIS).trim();
  showLoading();
  google.script.run
    .withSuccessHandler(function(msg) {
      hideLoading();
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: msg, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      document.getElementById('current_password').value = '';
      document.getElementById('new_password').value = '';
      document.getElementById('confirm_password').value = '';
    })
    .withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon: 'error', title: 'Gagal Ganti Password', text: err.message }); })
    .gantiPasswordSiswa(nis, currentPass, newPass);
}

function showPengaturanAdmin() {
  var adminName = currentUser ? currentUser.username || 'Administrator' : 'Administrator';
  document.getElementById('settings-admin-name').textContent = adminName;
  document.getElementById('settings-admin-info').textContent = 'Username: ' + (currentUser ? currentUser.username || 'admin' : 'admin');
  document.getElementById('admin_current_username').value = currentUser ? currentUser.username || 'admin' : 'admin';
  document.getElementById('admin_new_username').value = '';
  document.getElementById('admin_current_password').value = '';
  document.getElementById('admin_new_password').value = '';
  document.getElementById('admin_confirm_password').value = '';
}

function handleGantiUsernameAdmin() {
  if (!currentUser) { Swal.fire({ icon: 'error', title: 'Error', text: 'Sesi Anda telah berakhir.' }); return; }

  var currentUsername = document.getElementById('admin_current_username').value.trim();
  var newUsername = document.getElementById('admin_new_username').value.trim();

  if (!currentUsername) { Swal.fire({ icon: 'warning', title: 'Data Tidak Lengkap', text: 'Username saat ini tidak ditemukan.' }); return; }
  if (!newUsername || newUsername.length < 3) { Swal.fire({ icon: 'warning', title: 'Username Terlalu Pendek', text: 'Username baru minimal 3 karakter.' }); return; }
  if (/\s/.test(newUsername)) { Swal.fire({ icon: 'warning', title: 'Username Tidak Valid', text: 'Username tidak boleh mengandung spasi.' }); return; }
  if (currentUsername === newUsername) { Swal.fire({ icon: 'info', title: 'Tidak Ada Perubahan', text: 'Username baru sama dengan username saat ini.' }); return; }

  Swal.fire({
    title: 'Konfirmasi Ganti Username',
    text: 'Anda akan mengganti username dari "' + currentUsername + '" menjadi "' + newUsername + '".',
    icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Ya, Ganti', cancelButtonText: 'Batal',
    confirmButtonColor: '#10b981', cancelButtonColor: '#ef4444'
  }).then(function(result) {
    if (result.isConfirmed) {
      showLoading();
      google.script.run
        .withSuccessHandler(function(msg) {
          hideLoading();
          Swal.fire({
            icon: 'success', title: 'Username Berhasil Diubah!',
            text: msg + '\n\nAnda akan diarahkan ke halaman login.',
            timer: 3000, showConfirmButton: true, confirmButtonText: 'Login Ulang'
          }).then(function() {
            if (currentUser) currentUser.username = newUsername;
            logout();
            document.getElementById('username').value = newUsername;
          });
        })
        .withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon: 'error', title: 'Gagal Ganti Username', text: err.message }); })
        .gantiUsernameAdmin(currentUsername, newUsername);
    }
  });
}

function handleGantiPasswordAdmin(e) {
  e.preventDefault();
  if (!currentUser) return;
  var currentPass = document.getElementById('admin_current_password').value.trim();
  var newPass = document.getElementById('admin_new_password').value.trim();
  var confirmPass = document.getElementById('admin_confirm_password').value.trim();

  if (!currentPass || !newPass || !confirmPass) { Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Harap isi semua field password.' }); return; }
  if (newPass.length < 6) { Swal.fire({ icon: 'warning', title: 'Password Terlalu Pendek', text: 'Password minimal 6 karakter.' }); return; }
  if (newPass !== confirmPass) { Swal.fire({ icon: 'error', title: 'Password Tidak Cocok', text: 'Password baru dan konfirmasi harus sama.' }); return; }

  var username = String(currentUser.username || 'admin').trim();
  showLoading();
  google.script.run
    .withSuccessHandler(function(msg) {
      hideLoading();
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: msg, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      document.getElementById('admin_current_password').value = '';
      document.getElementById('admin_new_password').value = '';
      document.getElementById('admin_confirm_password').value = '';
    })
    .withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon: 'error', title: 'Gagal Ganti Password', text: err.message }); })
    .gantiPasswordAdmin(username, currentPass, newPass);
}

function loadWhatsappSiswa() {
  if (!currentUser || !currentUser.student) return;
  var nis = String(currentUser.student.NIS).trim();
  showLoading();
  google.script.run
    .withSuccessHandler(function(data) {
      hideLoading();
      data = data || {};
      document.getElementById('wa_siswa').value = data.WA_Siswa || '';
      document.getElementById('wa_wali').value = data.WA_Wali || '';
      document.getElementById('display-wa-siswa').textContent = data.WA_Siswa || '-';
      document.getElementById('display-wa-wali').textContent = data.WA_Wali || '-';
    })
    .withFailureHandler(function(err) { hideLoading(); console.error(err); })
    .getWhatsappSiswa(nis);
}

function handleUpdateWhatsappSiswa(e) {
  e.preventDefault();
  if (!currentUser || !currentUser.student) return;

  var waSiswa = document.getElementById('wa_siswa').value.trim();
  var waWali = document.getElementById('wa_wali').value.trim();
  var nis = String(currentUser.student.NIS).trim();

  if (waSiswa && !/^\d{10,15}$/.test(waSiswa)) { Swal.fire({ icon: 'warning', title: 'Format Salah', text: 'Nomor WhatsApp pribadi harus 10-15 digit angka.' }); return; }
  if (waWali && !/^\d{10,15}$/.test(waWali)) { Swal.fire({ icon: 'warning', title: 'Format Salah', text: 'Nomor WhatsApp wali harus 10-15 digit angka.' }); return; }

  showLoading();
  google.script.run
    .withSuccessHandler(function(msg) {
      hideLoading();
      Swal.fire({ icon: 'success', title: 'Berhasil', text: msg, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      loadWhatsappSiswa();
    })
    .withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon: 'error', title: 'Error', text: err.message }); })
    .updateWhatsappSiswa(nis, waSiswa, waWali);
}

// =============================================
// WHATSAPP GTK
// =============================================
function loadWhatsappGTK() {
  if (!currentUser || !currentUser.gtk) return;
  var nbm = String(currentUser.gtk.NBM).trim();
  showLoading();
  google.script.run
    .withSuccessHandler(function(data) {
      hideLoading();
      data = data || {};
      document.getElementById('wa_gtk_input').value = data.WA_GTK || '';
    })
    .withFailureHandler(function(err) { hideLoading(); console.error(err); })
    .getWhatsappGTK(nbm);
}

function handleUpdateWhatsappGTK(e) {
  e.preventDefault();
  if (!currentUser || !currentUser.gtk) return;
  var waGTK = document.getElementById('wa_gtk_input').value.trim();
  var nbm = String(currentUser.gtk.NBM).trim();

  if (waGTK && !/^\d{10,15}$/.test(waGTK)) { Swal.fire({ icon: 'warning', title: 'Format Salah', text: 'Nomor WhatsApp harus 10-15 digit angka.' }); return; }

  showLoading();
  google.script.run
    .withSuccessHandler(function(msg) {
      hideLoading();
      Swal.fire({ icon: 'success', title: 'Berhasil', text: msg, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
    })
    .withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon: 'error', title: 'Error', text: err.message }); })
    .updateWhatsappGTK(nbm, waGTK);
}

// =============================================
// PENGATURAN GTK
// =============================================
function showPengaturanGTK() {
  if (!currentUser || !currentUser.gtk) return;
  var g = currentUser.gtk;
  document.getElementById('settings-gtk-name').textContent = g.Nama_GTK || '-';
  document.getElementById('settings-gtk-info').textContent = 'NBM: ' + (g.NBM || '-') + ' | Tugas: ' + (g.Tugas || '-');
  document.getElementById('gtk_current_password').value = '';
  document.getElementById('gtk_new_password').value = '';
  document.getElementById('gtk_confirm_password').value = '';
}

function handleGantiPasswordGTK(e) {
  e.preventDefault();
  if (!currentUser || !currentUser.gtk) return;

  var currentPass = document.getElementById('gtk_current_password').value.trim();
  var newPass = document.getElementById('gtk_new_password').value.trim();
  var confirmPass = document.getElementById('gtk_confirm_password').value.trim();

  if (!currentPass || !newPass || !confirmPass) { Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Harap isi semua field password.' }); return; }
  if (newPass.length < 6) { Swal.fire({ icon: 'warning', title: 'Password Terlalu Pendek', text: 'Password minimal 6 karakter.' }); return; }
  if (newPass !== confirmPass) { Swal.fire({ icon: 'error', title: 'Password Tidak Cocok', text: 'Password baru dan konfirmasi harus sama.' }); return; }

  var nbm = String(currentUser.gtk.NBM).trim();
  showLoading();
  google.script.run
    .withSuccessHandler(function(msg) {
      hideLoading();
      Swal.fire({ icon: 'success', title: 'Berhasil!', text: msg, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      document.getElementById('gtk_current_password').value = '';
      document.getElementById('gtk_new_password').value = '';
      document.getElementById('gtk_confirm_password').value = '';
    })
    .withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon: 'error', title: 'Gagal Ganti Password', text: err.message }); })
    .gantiPasswordGTK(nbm, currentPass, newPass);
}

// =============================================
// RIPPLE EFFECT
// =============================================
function addRippleEffect() {
  if (window._rippleInitialized) return;
  window._rippleInitialized = true;

  document.addEventListener('click', function(e) {
    var link = e.target.closest('.sidebar-menu li a');
    if (!link) return;

    var ripple = document.createElement('span');
    ripple.className = 'ripple';

    var rect = link.getBoundingClientRect();
    var size = Math.max(rect.width, rect.height);
    var x = e.clientX - rect.left - size / 2;
    var y = e.clientY - rect.top - size / 2;

    ripple.style.width = ripple.style.height = size + 'px';
    ripple.style.left = x + 'px';
    ripple.style.top = y + 'px';

    link.appendChild(ripple);

    setTimeout(function() {
      if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
    }, 600);
  });
}

// =============================================
// GPS AKURAT — Multi-sampling
// =============================================
function getAccuratePosition() {
  return new Promise(function(resolve, reject) {
    if (!navigator.geolocation) {
      reject(new Error('GPS tidak didukung browser/perangkat'));
      return;
    }

    var samples = [];
    var bestReading = null;
    var attempts = 0;
    var maxAttempts = 5;
    var targetAccuracy = 25;
    var timeoutMs = 15000;
    var startTime = Date.now();
    var done = false;

    function finalize() {
      if (done) return;
      done = true;
      try { navigator.geolocation.clearWatch(watchId); } catch (e) {}

      if (bestReading) resolve(bestReading);
      else reject(new Error('GPS gagal terkunci. Coba di area terbuka dan tunggu beberapa detik.'));
    }

    var watchId = navigator.geolocation.watchPosition(
      function(pos) {
        var acc = pos.coords.accuracy;
        var reading = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          acc: acc,
          ts: pos.timestamp,
          samples: samples.length + 1
        };
        samples.push(reading);

        if (!bestReading || acc < bestReading.acc) bestReading = reading;
        attempts++;

        if (acc <= targetAccuracy) { finalize(); return; }
        if (attempts >= maxAttempts) { finalize(); return; }
        if (Date.now() - startTime > timeoutMs) { finalize(); return; }
      },
      function(err) {
        if (bestReading) { finalize(); return; }
        var msg = 'Gagal baca GPS.';
        if (err.code === 1) msg = 'Izin lokasi diblokir. Izinkan akses lokasi di browser.';
        else if (err.code === 2) msg = 'Sinyal GPS tidak ditemukan. Pastikan Lokasi HP aktif.';
        else if (err.code === 3) msg = 'Waktu pencarian GPS habis. Coba lagi.';
        finalize();
        reject(new Error(msg));
      },
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 0 }
    );

    setTimeout(function() {
      if (!done) finalize();
    }, timeoutMs + 1000);
  });
}

// =============================================
// LOGOUT
// =============================================
function logout() {
  if (typeof Swal === 'undefined') {
    if (confirm("Apakah Anda yakin ingin mengakhiri sesi?")) eksekusiLogout();
    return;
  }
  Swal.fire({
    title: 'Konfirmasi Keluar',
    text: 'Apakah Anda yakin ingin mengakhiri sesi?',
    icon: 'question', showCancelButton: true,
    confirmButtonText: 'Ya, Keluar', cancelButtonText: 'Batal',
    confirmButtonColor: '#ef4444', cancelButtonColor: '#64748b'
  }).then(function(r) { if (r.isConfirmed) eksekusiLogout(); });
}

function eksekusiLogout() {
  if (typeof closeWebcam === 'function') closeWebcam();

  if (typeof pklInfoSiswa !== 'undefined') pklInfoSiswa = null;
  if (typeof absenPKLHariIni !== 'undefined') absenPKLHariIni = null;
  if (typeof jurnalPKLHariIni !== 'undefined') jurnalPKLHariIni = null;
  var menuP = document.getElementById('menu-pkl-presensi');
  var menuJ = document.getElementById('menu-pkl-jurnal');
  if (menuP) menuP.classList.add('hidden');
  if (menuJ) menuJ.classList.add('hidden');

  currentUser = null;

  var sidebar = document.getElementById('sidebar');
  var overlay = document.querySelector('.overlay');
  if (sidebar) sidebar.classList.remove('active');
  if (overlay) overlay.classList.remove('active');
  document.body.style.overflow = '';

  var appLayout = document.getElementById('app-layout');
  var loginPage = document.getElementById('login-page');
  var loginDudiPage = document.getElementById('login-dudi-page');
  var pagePembimbing = document.getElementById('page-pembimbing');

  if (appLayout) appLayout.classList.add('hidden');
  if (loginDudiPage) loginDudiPage.classList.add('hidden');
  if (pagePembimbing) pagePembimbing.classList.add('hidden');
  if (loginPage) loginPage.classList.remove('hidden');

  ['username', 'password', 'nbm_login', 'password_gtk', 'nis_login', 'password_siswa', 'pemb_kode', 'pemb_pin'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });

  if (typeof destroyCharts === 'function') destroyCharts();
  if (typeof switchLoginTab === 'function') switchLoginTab('admin');
}

// =============================================
// LOGIN DUDI — Navigasi halaman
// =============================================
function showLoginDUDI() {
  var page = document.getElementById('login-dudi-page');
  var main = document.getElementById('login-page');
  if (main) main.classList.add('hidden');
  if (page) page.classList.remove('hidden');
  setTimeout(function() {
    var inp = document.getElementById('pemb_kode');
    if (inp && !inp.value) inp.focus();
  }, 200);
}

function showLoginUtama() {
  var page = document.getElementById('login-dudi-page');
  var main = document.getElementById('login-page');
  if (page) page.classList.add('hidden');
  if (main) main.classList.remove('hidden');
  if (typeof switchLoginTab === 'function') switchLoginTab('admin');
}

// =============================================
// EVENT LISTENERS
// =============================================
document.addEventListener('DOMContentLoaded', function() {
  initDOMCache();
  addRippleEffect();

  if (window.location.hash && window.location.hash.indexOf('#pembimbing=') === 0) {
    if (typeof cekHashPembimbing === 'function' && cekHashPembimbing()) return;
  }

  var tglAbsen = document.getElementById('tgl_absen');
  if (tglAbsen) tglAbsen.value = todayLocalISO();
  var dashDate = document.getElementById('dash_date');
  if (dashDate) dashDate.value = todayLocalISO();

  var searchInput = document.getElementById('admin_filter_tugas_search');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); loadTugasAdmin(); }
    });
  }
  var filterKelas = document.getElementById('admin_filter_tugas_kelas');
  if (filterKelas) filterKelas.addEventListener('change', function() { loadTugasAdmin(); });

  var waSearchInput = document.getElementById('admin_wa_filter_search');
  if (waSearchInput) {
    waSearchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); loadWhatsappAdmin(); }
    });
  }
  var waFilterKelas = document.getElementById('admin_wa_filter_kelas');
  if (waFilterKelas) waFilterKelas.addEventListener('change', function() { loadWhatsappAdmin(); });

  var mapSearchInput = document.getElementById('map_search_input');
  if (mapSearchInput) {
    mapSearchInput.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') { e.preventDefault(); searchLocation(); }
    });
  }
});
