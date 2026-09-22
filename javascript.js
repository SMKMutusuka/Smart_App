// =============================================
// JAVASCRIPT UTAMA — Login, Navigasi, Dashboard
// =============================================

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

var paginationState = {
  tugasAdmin:    { page: 1, pageSize: 25, data: [] },
  laporan:       { page: 1, pageSize: 25, data: [] },
  waAdmin:       { page: 1, pageSize: 25, data: [] },
  studentHistory:{ page: 1, pageSize: 25, data: [] },
  studentTugas:  { page: 1, pageSize: 25, data: [] },
  gtkHistory:    { page: 1, pageSize: 25, data: [] }
};

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

function openWhatsApp(phoneNumber) {
  if (!phoneNumber) { 
    Swal.fire({ icon: 'warning', title: 'Nomor Tidak Tersedia', text: 'Siswa ini belum memiliki nomor WhatsApp.' }); 
    return; 
  }
  var formatted = formatWaNumber(phoneNumber);
  if (!formatted) { 
    Swal.fire({ icon: 'warning', title: 'Nomor Tidak Valid', text: 'Nomor WhatsApp tidak valid (minimal 10 digit).' }); 
    return; 
  }
  var url = 'https://wa.me/' + formatted;
  var isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  if (isMobile) { 
    window.open(url, '_blank'); 
  } else {
    Swal.fire({
      title: 'Buka WhatsApp?', 
      text: 'Anda akan diarahkan ke WhatsApp Web untuk menghubungi nomor ' + phoneNumber, 
      icon: 'question',
      showCancelButton: true, 
      confirmButtonText: 'Ya, Buka', 
      cancelButtonText: 'Batal', 
      confirmButtonColor: '#25D366'
    }).then(function(result) { 
      if (result.isConfirmed) window.open(url, '_blank'); 
    });
  }
}

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
        var reading = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: acc, ts: pos.timestamp, samples: samples.length + 1 };
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
    setTimeout(function() { if (!done) finalize(); }, timeoutMs + 1000);
  });
}

function buildWaMessage(namaSiswa, namaKelas, tanggal, status, keterangan, namaSekolah) {
  var sekolah = namaSekolah || 'SMK Muhammadiyah 1 Surakarta';
  var statusText = status || 'Tidak Hadir';
  var ket = (keterangan && keterangan.trim() !== '') ? keterangan.trim() : '-';
  return "Assalamu'alaikum Warahmatullahi Wabarakatuh,\n\nKami informasikan bahwa siswa berikut tidak hadir hari ini:\n\n📌 Nama   : " + namaSiswa + "\n🏫 Kelas  : " + namaKelas + "\n📅 Tanggal: " + tanggal + "\n❗ Status : " + statusText + "\n📝 Ket.   : " + ket + "\n\nMohon konfirmasi kepada pihak sekolah.\n\nTerima kasih.\n- " + sekolah;
}

function kirimWaKeNomor(nomor, pesan) {
  if (!nomor) { 
    Swal.fire({ icon: 'warning', title: 'Nomor Kosong', text: 'Nomor WhatsApp belum terdaftar.' }); 
    return; 
  }
  var formatted = formatWaNumber(nomor);
  if (!formatted) { 
    Swal.fire({ icon: 'warning', title: 'Nomor Tidak Valid', text: 'Nomor WA minimal 10 digit angka.' }); 
    return; 
  }
  var url = 'https://wa.me/' + formatted + '?text=' + encodeURIComponent(pesan);
  window.open(url, '_blank');
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
      kirimWaKeNomor(waWali, msg);
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
      kirimWaKeNomor(waSiswa, msg);
    })
    .withFailureHandler(function(err) { 
      hideLoading(); 
      Swal.fire({ icon:Selisih jumlah baris data yang mencapai hampir setengahnya merupakan anomali yang sangat signifikan. Apakah kendala ketidaksesuaian data ini terjadi pada modul atau laporan spesifik yang sedang dievaluasi dalam dokumen "PERBAIKAN APLIKASI SMART"?

Perbedaan drastis semacam ini umumnya dipicu oleh beberapa faktor teknis:

* **Perbedaan Parameter Filter:** Satu sisi data mungkin menerapkan filter tertentu (seperti rentang tanggal, status aktif/non-aktif, atau menyembunyikan data yang di-*soft-delete*), sementara sisi referensi lainnya menarik seluruh data mentah tanpa batasan.
* **Masalah *Query* atau Duplikasi:** Terdapat kesalahan relasi antar tabel (*JOIN*) pada tingkat *database* yang membuat baris data berganda, atau sebaliknya, ada fungsi pengelompokan (*GROUP BY*) tidak tepat yang menyembunyikan detail data.
* **Kegagalan Sinkronisasi atau Limitasi *Load*:** Proses penarikan (*load*), ekspor, atau integrasi terputus (misalnya karena *timeout* atau batasan memori), sehingga sistem hanya berhasil memproses separuh dari total data sebenarnya.

Untuk memfokuskan pengecekan, data apa tepatnya yang sedang Anda bandingkan saat ini (misalnya, antara tampilan tabel di aplikasi dengan hasil *export* Excel, atau antara sistem SMART dengan *database* pusat)?
