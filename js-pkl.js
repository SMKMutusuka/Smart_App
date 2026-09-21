// =============================================
// MODUL PKL — Frontend
// File: js-pkl.js
// =============================================
 
var dudiCache = [];

// ⭐ Load semua DUDI
function loadDUDI() {
  showLoading();
  google.script.run
    .withSuccessHandler(function(list) {
      hideLoading();
      dudiCache = Array.isArray(list) ? list : [];
      renderDUDITable();
    })
    .withFailureHandler(function(err) {
      hideLoading();
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    })
    .getAllDUDI();
}

function renderDUDITable() {
  var tbody = document.getElementById('tbodyDUDI');
  if (!tbody) return;

  if (dudiCache.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-muted);">Belum ada data DUDI.</td></tr>';
    return;
  }

  var htmlBuffer = dudiCache.map(function(d) {
    var link = location.origin + location.pathname + '#pembimbing=' + encodeURIComponent(d.Kode_Akses);
    return '<tr>' +
      '<td>' + escapeHtml(d.ID_DUDI) + '</td>' +
      '<td style="text-align:left;"><strong>' + escapeHtml(d.Nama_DUDI) + '</strong></td>' +
      '<td>' + (escapeHtml(d.Nama_Pembimbing) || '-') + '</td>' +
      '<td style="font-size:10.5px;font-family:monospace;">' + (parseFloat(d.Latitude).toFixed(6)) + ', ' + (parseFloat(d.Longitude).toFixed(6)) + '</td>' +
      '<td>' + (d.Radius_Meter || 20) + 'm</td>' +
      '<td><span class="chart-badge" style="cursor:pointer;" onclick="copyKode(\'' + escapeHtml(d.Kode_Akses) + '\')">' + escapeHtml(d.Kode_Akses) + ' <i class="fas fa-copy"></i></span></td>' +
      '<td><button class="btn btn-outline btn-sm" onclick="copyLinkPembimbing(\'' + escapeHtml(d.Kode_Akses) + '\')"><i class="fas fa-link"></i> Copy Link</button></td>' +
      '<td>' +
  (d.WA_Pembimbing ? '<button class="btn btn-wa btn-sm" onclick="kirimLinkPembimbingWA(\'' + d.ID_DUDI + '\')" title="Kirim Link via WA"><i class="fab fa-whatsapp"></i></button> ' : '') +
  '<button class="btn btn-outline btn-sm" onclick="editDUDI(\'' + d.ID_DUDI + '\')"><i class="fas fa-edit"></i></button> ' +
  '<button class="btn btn-danger btn-sm" onclick="hapusDUDI(\'' + d.ID_DUDI + '\')"><i class="fas fa-trash"></i></button>' +
'</td>' +
    '</tr>';
  });
  tbody.innerHTML = htmlBuffer.join('');
}

// ⭐ Simpan DUDI
function simpanDUDI(e) {
  e.preventDefault();
  var data = {
    ID_DUDI: document.getElementById('dudi_id').value.trim(),
    Nama_DUDI: document.getElementById('dudi_nama').value.trim(),
    Alamat: document.getElementById('dudi_alamat').value.trim(),
    Latitude: parseFloat(document.getElementById('dudi_lat').value),
    Longitude: parseFloat(document.getElementById('dudi_lng').value),
    Radius_Meter: parseInt(document.getElementById('dudi_radius').value, 10),
    Kode_Akses: document.getElementById('dudi_kode').value.trim(),
    Nama_Pembimbing: document.getElementById('dudi_pembimbing').value.trim(),
    WA_Pembimbing: document.getElementById('dudi_wa').value.trim()
  };

  if (!data.Nama_DUDI || !data.Latitude || !data.Longitude || !data.Kode_Akses) {
    Swal.fire({ icon: 'warning', title: 'Lengkapi Data', text: 'Nama, koordinat, dan kode akses wajib.' });
    return;
  }

  showLoading();
  google.script.run
    .withSuccessHandler(function(res) {
      hideLoading();
      Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      resetFormDUDI();
      loadDUDI();
    })
    .withFailureHandler(function(err) {
      hideLoading();
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    })
    .saveDUDI(data);
}

// ⭐ Edit DUDI
function editDUDI(idDudi) {
  var d = dudiCache.find(function(x) { return String(x.ID_DUDI) === String(idDudi); });
  if (!d) return;
  
  document.getElementById('dudi_id').value = d.ID_DUDI;
  document.getElementById('dudi_nama').value = d.Nama_DUDI || '';
  document.getElementById('dudi_alamat').value = d.Alamat || '';
  document.getElementById('dudi_lat').value = d.Latitude || '';
  document.getElementById('dudi_lng').value = d.Longitude || '';
  document.getElementById('dudi_radius').value = d.Radius_Meter || 20;
  document.getElementById('dudi_kode').value = d.Kode_Akses || '';
  document.getElementById('dudi_pembimbing').value = d.Nama_Pembimbing || '';
  document.getElementById('dudi_wa').value = d.WA_Pembimbing || '';
  
  document.getElementById('formDUDI').scrollIntoView({ behavior: 'smooth' });
}

// ⭐ Hapus DUDI
function hapusDUDI(idDudi) {
  Swal.fire({
    title: 'Hapus DUDI?',
    text: 'DUDI ' + idDudi + ' akan dihapus permanen.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, Hapus',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#ef4444'
  }).then(function(r) {
    if (r.isConfirmed) {
      showLoading();
      google.script.run
        .withSuccessHandler(function(res) {
          hideLoading();
          Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
          loadDUDI();
        })
        .withFailureHandler(function(err) {
          hideLoading();
          Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
        })
        .deleteDUDI(idDudi);
    }
  });
}

// ⭐ Reset form
function resetFormDUDI() {
  ['dudi_id', 'dudi_nama', 'dudi_alamat', 'dudi_lat', 'dudi_lng', 'dudi_kode', 'dudi_pembimbing', 'dudi_wa'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('dudi_radius').value = 20;
}

// ⭐ Generate kode akses
function generateKode() {
  showLoading();
  google.script.run
    .withSuccessHandler(function(kode) {
      hideLoading();
      document.getElementById('dudi_kode').value = kode;
    })
    .withFailureHandler(function(err) {
      hideLoading();
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    })
    .generateKodeAksesDUDI();
}

// ⭐ Copy kode
function copyKode(kode) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(kode).then(function() {
      Swal.fire({ icon: 'success', title: 'Kode dicopy!', text: kode, timer: 1200, showConfirmButton: false, toast: true, position: 'top-end' });
    });
  }
}

// ⭐ Copy link pembimbing
function copyLinkPembimbing(kode) {
  var link = location.origin + location.pathname + '#pembimbing=' + encodeURIComponent(kode);
  if (navigator.clipboard) {
    navigator.clipboard.writeText(link).then(function() {
      Swal.fire({
        icon: 'success',
        title: 'Link Tercopy!',
        html: 'Kirim link ini ke pembimbing:<br><br><code style="font-size:11px;word-break:break-all;">' + link + '</code>',
        confirmButtonColor: '#10b981'
      });
    });
  }
}
function kirimLinkPembimbingWA(idDudi) {
  var d = dudiCache.find(function(x) { return String(x.ID_DUDI) === String(idDudi); });
  if (!d) {
    Swal.fire({ icon: 'error', title: 'Error', text: 'Data DUDI tidak ditemukan.' });
    return;
  }

  if (!d.WA_Pembimbing) {
    Swal.fire({ icon: 'warning', title: 'WA Kosong', text: 'Nomor WA pembimbing belum diisi. Edit DUDI dulu.' });
    return;
  }

  if (!d.PIN_Pembimbing) {
    Swal.fire({
      icon: 'warning',
      title: 'PIN Belum Ada',
      html: 'DUDI ini belum punya PIN.<br>Silakan <strong>Edit DUDI</strong> dan simpan ulang untuk auto-generate PIN.'
    });
    return;
  }

  // ⭐ Deklarasi link — WAJIB ADA
  var link = location.origin + location.pathname + '#pembimbing=' + encodeURIComponent(d.Kode_Akses);

  var pesan =
    "Assalamu'alaikum Bapak/Ibu " + (d.Nama_Pembimbing || 'Pembimbing') + ",\n\n" +
    "Anda ditunjuk sebagai Pembimbing PKL siswa SMK Muhammadiyah 1 Surakarta di:\n" +
    "🏢 *" + d.Nama_DUDI + "*\n\n" +
    "Untuk mengakses Dashboard Pembimbing, gunakan informasi berikut:\n\n" +
    "🔗 *Link Dashboard:*\n" + link + "\n\n" +
    "🔑 *Kode Akses:* " + d.Kode_Akses + "\n" +
    "🔒 *PIN:* " + d.PIN_Pembimbing + "\n\n" +
    "Melalui dashboard ini Bapak/Ibu dapat:\n" +
    "• Melihat daftar siswa PKL di DUDI\n" +
    "• Menyetujui (approve) absensi harian siswa\n" +
    "• Menyetujui (approve) jurnal kegiatan siswa\n\n" +
    "⚠️ *Penting:* Jangan bagikan Kode Akses & PIN kepada siapa pun.\n\n" +
    "Simpan pesan ini. Terima kasih.\n" +
    "- SMK Muhammadiyah 1 Surakarta";

  var nomor = formatWaNumber(d.WA_Pembimbing);
  if (!nomor) {
    Swal.fire({ icon: 'error', title: 'Nomor Tidak Valid', text: 'Nomor WA minimal 10 digit.' });
    return;
  }

  var waMeUrl = 'https://wa.me/' + nomor + '?text=' + encodeURIComponent(pesan);
  var isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    window.open(waMeUrl, '_blank');
  } else {
    Swal.fire({
      title: 'Kirim Link ke WA?',
      html: 'Pesan akan dikirim ke <strong>' + d.Nama_Pembimbing + '</strong><br>(' + d.WA_Pembimbing + ')',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '<i class="fab fa-whatsapp"></i> Buka WhatsApp',
      cancelButtonText: 'Batal',
      confirmButtonColor: '#25D366'
    }).then(function(r) {
      if (r.isConfirmed) window.open(waMeUrl, '_blank');
    });
  }
}
// ⭐ Cari lokasi lewat geocode
function searchDUDILocation() {
  var q = document.getElementById('dudi_search_input').value.trim();
  if (!q) return;

  showLoading();
  google.script.run
    .withSuccessHandler(function(res) {
      hideLoading();
      if (res && res.latitude && res.longitude) {
        document.getElementById('dudi_lat').value = res.latitude.toFixed(6);
        document.getElementById('dudi_lng').value = res.longitude.toFixed(6);
        document.getElementById('dudi_alamat').value = res.display_name || q;
        Swal.fire({ icon: 'success', title: 'Lokasi Ditemukan', text: res.display_name, timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
      }
    })
    .withFailureHandler(function(err) {
      hideLoading();
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    })
    .geocodeAddress(q);
}

// ⭐ Pakai lokasi sekarang
function useCurrentLocationForDUDI() {
  if (!navigator.geolocation) {
    Swal.fire({ icon: 'error', title: 'GPS Tidak Didukung', text: 'Browser tidak support GPS.' });
    return;
  }
  Swal.fire({
    title: 'Mendapatkan Lokasi...',
    html: 'Mohon izinkan akses lokasi.',
    icon: 'info',
    showConfirmButton: false,
    allowOutsideClick: false
  });

  navigator.geolocation.getCurrentPosition(
    function(pos) {
      document.getElementById('dudi_lat').value = pos.coords.latitude.toFixed(6);
      document.getElementById('dudi_lng').value = pos.coords.longitude.toFixed(6);
      Swal.fire({ icon: 'success', title: 'Lokasi Didapat', html: 'Lat: ' + pos.coords.latitude.toFixed(6) + '<br>Lng: ' + pos.coords.longitude.toFixed(6), timer: 2000, showConfirmButton: false });
    },
    function(err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
}
// =============================================
// ASSIGN PKL — Frontend
// =============================================
var pklCache = [];
var siswaXIICache = [];
var dudiListCache = [];

function loadAssignPKL() {
  showLoading();
  google.script.run
    .withSuccessHandler(function(list) {
      hideLoading();
      pklCache = Array.isArray(list) ? list : [];
      renderPKLTable();
      loadDropdownsPKL();
    })
    .withFailureHandler(function(err) {
      hideLoading();
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    })
    .getAllPKL();
}

function loadDropdownsPKL() {
  // Load siswa XII (dengan filter kelas)
  google.script.run
    .withSuccessHandler(function(res) {
      var siswaList = (res && res.siswa) ? res.siswa : [];
      var kelasList = (res && res.kelasList) ? res.kelasList : [];
      
      siswaXIICache = siswaList;
      
      // Isi dropdown FILTER KELAS
      var selKelas = document.getElementById('pkl_filter_kelas');
      if (selKelas) {
        selKelas.innerHTML = '<option value="">-- Semua Kelas XII --</option>';
        kelasList.forEach(function(k) {
          var opt = document.createElement('option');
          opt.value = k;
          opt.textContent = k;
          selKelas.appendChild(opt);
        });
      }
      
      // Isi dropdown SISWA (semua dulu)
      populateDropdownSiswa(siswaList);
      
      console.log('[PKL] Siswa XII:', siswaList.length, '| Kelas:', kelasList.length);
    })
    .withFailureHandler(function(err) {
      console.error('Gagal load siswa XII:', err);
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    })
    .getSiswaXII();

  // Load DUDI
  google.script.run
    .withSuccessHandler(function(list) {
      dudiListCache = Array.isArray(list) ? list : [];
      var sel = document.getElementById('pkl_dudi');
      if (!sel) return;
      sel.innerHTML = '<option value="">-- Pilih DUDI --</option>';
      dudiListCache.forEach(function(d) {
        var opt = document.createElement('option');
        opt.value = d.ID_DUDI;
        opt.textContent = d.Nama_DUDI + ' (' + d.ID_DUDI + ')';
        sel.appendChild(opt);
      });
    })
    .withFailureHandler(function(err) { console.error(err); })
    .getAllDUDI();
}

// ⭐ Isi dropdown siswa (bisa difilter berdasarkan kelas)
function populateDropdownSiswa(siswaList) {
  var sel = document.getElementById('pkl_siswa');
  if (!sel) return;
  
  var currentVal = sel.value;
  sel.innerHTML = '<option value="">-- Pilih Siswa XII --</option>';
  
  siswaList.forEach(function(s) {
    var opt = document.createElement('option');
    opt.value = s.NIS;
    opt.textContent = s.Nama_Kelas + ' | ' + s.NIS + ' — ' + s.Nama_Siswa;
    sel.appendChild(opt);
  });
  
  if (currentVal) sel.value = currentVal;
}

// ⭐ Filter siswa berdasarkan kelas (dipanggil saat dropdown kelas berubah)
function filterSiswaByKelas() {
  var selKelas = document.getElementById('pkl_filter_kelas');
  var kelasDipilih = selKelas ? selKelas.value : '';
  
  if (!kelasDipilih) {
    populateDropdownSiswa(siswaXIICache);
    return;
  }
  
  var filtered = siswaXIICache.filter(function(s) {
    return s.Nama_Kelas === kelasDipilih;
  });
  
  populateDropdownSiswa(filtered);
}

function simpanAssignPKL(e) {
  e.preventDefault();
  var data = {
    NIS: document.getElementById('pkl_siswa').value,
    ID_DUDI: document.getElementById('pkl_dudi').value,
    Tanggal_Mulai: document.getElementById('pkl_mulai').value,
    Tanggal_Selesai: document.getElementById('pkl_selesai').value,
    Status: document.getElementById('pkl_status').value
  };

  if (!data.NIS || !data.ID_DUDI || !data.Tanggal_Mulai || !data.Tanggal_Selesai) {
    Swal.fire({ icon: 'warning', title: 'Lengkapi Data', text: 'Semua field wajib diisi.' });
    return;
  }

  showLoading();
  google.script.run
    .withSuccessHandler(function(res) {
      hideLoading();
      Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      resetFormPKL();
      loadAssignPKL();
    })
    .withFailureHandler(function(err) {
      hideLoading();
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    })
    .savePKL(data);
}

function editPKL(nis) {
  var p = pklCache.find(function(x) { return String(x.NIS) === String(nis); });
  if (!p) return;

  document.getElementById('pkl_siswa').value = p.NIS;
  document.getElementById('pkl_dudi').value = p.ID_DUDI;
  document.getElementById('pkl_mulai').value = p.Tanggal_Mulai;
  document.getElementById('pkl_selesai').value = p.Tanggal_Selesai;
  document.getElementById('pkl_status').value = p.Status;
  document.getElementById('pkl_edit_mode').value = 'true';
  document.getElementById('formAssignPKL').scrollIntoView({ behavior: 'smooth' });
}

function hapusPKL(nis) {
  Swal.fire({
    title: 'Hapus Data PKL?',
    text: 'Siswa NIS ' + nis + ' akan dihapus dari daftar PKL.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Ya, Hapus',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#ef4444'
  }).then(function(r) {
    if (r.isConfirmed) {
      showLoading();
      google.script.run
        .withSuccessHandler(function(res) {
          hideLoading();
          Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
          loadAssignPKL();
        })
        .withFailureHandler(function(err) {
          hideLoading();
          Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
        })
        .deletePKL(nis);
    }
  });
}

function resetFormPKL() {
  ['pkl_siswa', 'pkl_dudi', 'pkl_mulai', 'pkl_selesai', 'pkl_filter_kelas'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
  document.getElementById('pkl_status').value = 'Aktif';
  document.getElementById('pkl_edit_mode').value = 'false';
  
  // Reset dropdown siswa ke semua
  populateDropdownSiswa(siswaXIICache);
}
// ⭐ Render tabel daftar siswa PKL
function renderPKLTable() {
  var tbody = document.getElementById('tbodyPKL');
  if (!tbody) return;

  if (pklCache.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--text-muted);">Belum ada siswa PKL.</td></tr>';
    return;
  }

  var htmlBuffer = pklCache.map(function(p) {
    var periode = (p.Tanggal_Mulai || '-') + ' s/d ' + (p.Tanggal_Selesai || '-');
    var statusBadge = p.Status === 'Aktif'
      ? '<span class="badge-status-table badge-hadir">Aktif</span>'
      : '<span class="badge-status-table badge-alpa">Selesai</span>';
    return '<tr>' +
      '<td>' + escapeHtml(p.NIS) + '</td>' +
      '<td style="text-align:left;"><strong>' + escapeHtml(p.Nama_Siswa) + '</strong></td>' +
      '<td>' + escapeHtml(p.Nama_Kelas) + '</td>' +
      '<td style="text-align:left;">' + escapeHtml(p.Nama_DUDI) + '</td>' +
      '<td style="font-size:11px;">' + periode + '</td>' +
      '<td>' + statusBadge + '</td>' +
      '<td>' +
        '<button class="btn btn-outline btn-sm" onclick="editPKL(\'' + p.NIS + '\')"><i class="fas fa-edit"></i></button> ' +
        '<button class="btn btn-danger btn-sm" onclick="hapusPKL(\'' + p.NIS + '\')"><i class="fas fa-trash"></i></button>' +
      '</td>' +
    '</tr>';
  });
  tbody.innerHTML = htmlBuffer.join('');
}
// =============================================
// SISWA PKL — Presensi & Jurnal
// =============================================
var pklInfoSiswa = null;
var absenPKLHariIni = null;
var jurnalPKLHariIni = null;

// ⭐ Init halaman PKL siswa saat login
function initPKLSiswa(pklInfo) {
  pklInfoSiswa = pklInfo;
  
  // Tampilkan menu PKL di sidebar
  var menuPresensi = document.getElementById('menu-pkl-presensi');
  var menuJurnal = document.getElementById('menu-pkl-jurnal');
  if (menuPresensi) menuPresensi.classList.remove('hidden');
  if (menuJurnal) menuJurnal.classList.remove('hidden');
}

// ⭐ Cek PKL aktif saat login siswa
function checkPKLSiswaAktif(nis, callback) {
  google.script.run
    .withSuccessHandler(function(pklInfo) {
      if (pklInfo) {
        initPKLSiswa(pklInfo);
        if (callback) callback(pklInfo);
      } else {
        if (callback) callback(null);
      }
    })
    .withFailureHandler(function(err) {
      console.error('Gagal cek PKL:', err);
      if (callback) callback(null);
    })
    .getPKLByNIS(nis);
}

// ⭐ Load halaman presensi PKL
function loadPKLPresensiPage() {
  if (!currentUser || !currentUser.student) return;
  var nis = String(currentUser.student.NIS).trim();
  
  var container = document.getElementById('pkl-presensi-content');
  if (!container) return;
  
  container.innerHTML = '<div style="text-align:center;padding:32px;"><i class="fas fa-spinner fa-spin" style="font-size:2em;color:var(--primary);"></i></div>';
  
  // Refresh info PKL + cek absen hari ini
  google.script.run
    .withSuccessHandler(function(pklInfo) {
      if (!pklInfo) {
        container.innerHTML = '<div class="card" style="text-align:center;padding:32px;">' +
          '<i class="fas fa-exclamation-triangle" style="font-size:3em;color:#ef4444;"></i>' +
          '<h3 style="font-size:16px;font-weight:800;color:#0f172a;margin-top:10px;">Tidak Ada PKL Aktif</h3>' +
          '<p style="font-size:12.5px;color:var(--text-muted);margin-top:4px;">Hubungi admin untuk info PKL.</p>' +
        '</div>';
        return;
      }
      
      pklInfoSiswa = pklInfo;
      
      google.script.run
        .withSuccessHandler(function(absen) {
          absenPKLHariIni = absen;
          renderPKLPresensiPage(container, pklInfo, absen);
        })
        .withFailureHandler(function(err) {
          container.innerHTML = '<div class="card" style="background:#fee2e2;padding:18px;">' + err.message + '</div>';
        })
        .cekAbsenPKLHariIni(nis);
    })
    .withFailureHandler(function(err) {
      container.innerHTML = '<div class="card" style="background:#fee2e2;padding:18px;">' + err.message + '</div>';
    })
    .getPKLByNIS(nis);
}

function renderPKLPresensiPage(container, pklInfo, absen) {
  var today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  
  var infoCard = 
    '<div class="card" style="background:var(--primary-light);border:1px solid var(--primary-border);margin-bottom:16px;">' +
      '<div style="font-size:15px;font-weight:800;color:var(--primary-dark);"><i class="fas fa-building"></i> ' + escapeHtml(pklInfo.Nama_DUDI) + '</div>' +
      '<div style="font-size:12.5px;color:#065f46;margin-top:4px;">' +
        '<i class="fas fa-user-tie"></i> Pembimbing: <strong>' + escapeHtml(pklInfo.Nama_Pembimbing || '-') + '</strong>' +
        ' | Radius: <strong>' + (pklInfo.Radius_Meter || 20) + 'm</strong>' +
      '</div>' +
      '<div style="font-size:12.5px;color:#065f46;margin-top:2px;">' +
        '<i class="far fa-calendar"></i> ' + today +
      '</div>' +
    '</div>';
  
  var sudahMasuk = absen && absen.Jam_Masuk;
  var sudahPulang = absen && absen.Jam_Pulang;
  
  var statusCard =
    '<div class="card" style="margin-bottom:16px;">' +
      '<div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:10px;"><i class="fas fa-info-circle" style="color:var(--primary);"></i> Status Hari Ini</div>' +
      '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
        '<div style="flex:1;min-width:120px;padding:12px;background:' + (sudahMasuk ? '#ecfdf5' : '#f1f5f9') + ';border-radius:10px;">' +
          '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;">Masuk</div>' +
          '<div style="font-size:16px;font-weight:800;color:' + (sudahMasuk ? '#065f46' : '#94a3b8') + ';">' + (sudahMasuk ? absen.Jam_Masuk : 'Belum') + '</div>' +
        '</div>' +
        '<div style="flex:1;min-width:120px;padding:12px;background:' + (sudahPulang ? '#e0e7ff' : '#f1f5f9') + ';border-radius:10px;">' +
          '<div style="font-size:10px;color:#64748b;font-weight:700;text-transform:uppercase;">Pulang</div>' +
          '<div style="font-size:16px;font-weight:800;color:' + (sudahPulang ? '#3730a3' : '#94a3b8') + ';">' + (sudahPulang ? absen.Jam_Pulang : 'Belum') + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  
  // Form Absen Masuk / Pulang
  var formCard = '<div class="card">';
  if (!sudahMasuk) {
    formCard +=
      '<div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:14px;"><i class="fas fa-sign-in-alt" style="color:var(--primary);"></i> Absen Masuk</div>' +
      buildPKLAbsenForm('masuk');
  } else if (!sudahPulang) {
    formCard +=
      '<div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:14px;"><i class="fas fa-sign-out-alt" style="color:#ef4444;"></i> Absen Pulang</div>' +
      buildPKLAbsenForm('pulang');
  } else {
    formCard +=
      '<div style="text-align:center;padding:24px;">' +
        '<i class="fas fa-check-circle" style="font-size:3em;color:var(--primary);"></i>' +
        '<h3 style="font-size:16px;font-weight:800;color:#0f172a;margin-top:10px;">Absen Hari Ini Lengkap</h3>' +
        '<p style="font-size:12.5px;color:var(--text-muted);">Terima kasih sudah disiplin.</p>' +
      '</div>';
  }
  formCard += '</div>';
  
  // Riwayat
  var riwayatCard = 
    '<div class="card" style="margin-top:16px;">' +
      '<div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:12px;"><i class="fas fa-history" style="color:var(--primary);"></i> Riwayat Absen PKL</div>' +
      '<div id="pkl-riwayat-container" style="text-align:center;padding:16px;color:var(--text-muted);">Memuat...</div>' +
    '</div>';
  
  container.innerHTML = infoCard + statusCard + formCard + riwayatCard;
  
  // Load riwayat
  var nis = String(currentUser.student.NIS).trim();
  google.script.run
    .withSuccessHandler(function(list) {
      renderPKLRiwayat(list);
    })
    .withFailureHandler(function(err) { console.error(err); })
    .getRiwayatAbsenPKL(nis);
}

function buildPKLAbsenForm(tipe) {
  return '<div>' +
    '<div class="form-group">' +
      '<label><i class="fas fa-satellite"></i> Lokasi GPS</label>' +
      '<button type="button" class="btn btn-outline btn-sm" onclick="getPKLLocation()" id="btn-pkl-gps" style="width:100%;">' +
        '<i class="fas fa-location-dot"></i> Dapatkan Lokasi' +
      '</button>' +
      '<div id="pkl-gps-info" style="font-size:11px;color:var(--text-muted);margin-top:6px;">Klik untuk mendeteksi lokasi. Radius wajib ≤ ' + (pklInfoSiswa ? pklInfoSiswa.Radius_Meter : 20) + 'm.</div>' +
      '<input type="hidden" id="pkl_lat" value="">' +
      '<input type="hidden" id="pkl_lng" value="">' +
      '<input type="hidden" id="pkl_jarak" value="">' +
    '</div>' +
    '<div class="form-group">' +
      '<label><i class="fas fa-camera"></i> Foto Selfie (Wajib)</label>' +
      '<button type="button" class="btn btn-outline btn-sm" onclick="openPKLSelfieCapture()" style="width:100%;">' +
        '<i class="fas fa-camera"></i> Ambil Selfie' +
      '</button>' +
      '<input type="file" id="pkl_selfie_input" accept="image/*" capture="user" style="display:none;" onchange="handlePKLSelfieUpload(this)">' +
      '<input type="hidden" id="pkl_selfie_base64" value="">' +
      '<img id="pkl-selfie-preview" src="" style="display:none;max-width:150px;border-radius:10px;margin-top:8px;">' +
    '</div>' +
    '<div class="form-group">' +
      '<label><i class="fas fa-sticky-note"></i> Keterangan (opsional)</label>' +
      '<input type="text" id="pkl_keterangan" class="form-control" placeholder="Catatan tambahan...">' +
    '</div>' +
    '<button type="button" class="btn btn-primary" onclick="submitPKLAbsen(\'' + tipe + '\')" style="width:100%;min-height:46px;" id="btn-submit-pkl">' +
      '<i class="fas fa-paper-plane"></i> Kirim Absen ' + (tipe === 'masuk' ? 'Masuk' : 'Pulang') +
    '</button>' +
  '</div>';
}

// ⭐ GPS PKL
function getPKLLocation() {
  if (!pklInfoSiswa) {
    Swal.fire({ icon: 'error', title: 'Error', text: 'Info PKL tidak tersedia.' });
    return;
  }
  
  var infoDiv = document.getElementById('pkl-gps-info');
  if (infoDiv) infoDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mendeteksi lokasi...';
  
  getAccuratePosition()
    .then(function(reading) {
      var R = 6371000;
      var dLat = (parseFloat(pklInfoSiswa.Latitude) - reading.lat) * Math.PI / 180;
      var dLon = (parseFloat(pklInfoSiswa.Longitude) - reading.lng) * Math.PI / 180;
      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(reading.lat * Math.PI / 180) * Math.cos(parseFloat(pklInfoSiswa.Latitude) * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      var jarak = Math.round(R * c);
      
      document.getElementById('pkl_lat').value = reading.lat;
      document.getElementById('pkl_lng').value = reading.lng;
      document.getElementById('pkl_jarak').value = jarak;
      
      var radius = parseFloat(pklInfoSiswa.Radius_Meter) || 20;
      var color = jarak <= radius ? '#10b981' : '#ef4444';
      var status = jarak <= radius ? '✅ Dalam radius' : '⚠️ Di luar radius - perlu approval';
      
      if (infoDiv) {
        infoDiv.innerHTML = '<strong style="color:' + color + ';">Jarak: ' + jarak + 'm dari DUDI (radius ' + radius + 'm)</strong><br>' + status +
                            '<br><small>Akurasi: ±' + Math.round(reading.acc) + 'm</small>';
      }
    })
    .catch(function(err) {
      if (infoDiv) infoDiv.innerHTML = '<span style="color:#ef4444;">' + err.message + '</span>';
    });
}

// ⭐ Selfie PKL
function openPKLSelfieCapture() {
  if (!isDesktopDevice()) {
    document.getElementById('pkl_selfie_input').click();
    return;
  }
  // Di PC pakai webcam
  openPKLWebcamLive();
}

function openPKLWebcamLive() {
  Swal.fire({
    title: 'Kamera',
    html: '<div id="pkl-webcam-container" style="text-align:center;">Memuat kamera...</div>',
    showConfirmButton: false,
    showCancelButton: true,
    cancelButtonText: 'Tutup',
    didOpen: function() {
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false })
        .then(function(stream) {
          var cont = document.getElementById('pkl-webcam-container');
          cont.innerHTML = '<video id="pkl-webcam-video" autoplay playsinline muted style="width:100%;max-width:400px;border-radius:12px;transform:scaleX(-1);"></video>' +
            '<div style="margin-top:10px;"><button type="button" class="swal2-confirm swal2-styled" onclick="capturePKLWebcam()" style="background:#10b981;">Ambil Foto</button></div>';
          var v = document.getElementById('pkl-webcam-video');
          v.srcObject = stream;
          window._pklWebcamStream = stream;
        })
        .catch(function(err) {
          document.getElementById('pkl-webcam-container').innerHTML = '<div style="color:#ef4444;">Gagal akses kamera: ' + err.message + '</div>';
        });
    },
    willClose: function() {
      if (window._pklWebcamStream) {
        window._pklWebcamStream.getTracks().forEach(function(t) { t.stop(); });
        window._pklWebcamStream = null;
      }
    }
  });
}

function capturePKLWebcam() {
  var video = document.getElementById('pkl-webcam-video');
  if (!video || !video.videoWidth) return;
  
  var canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  var ctx = canvas.getContext('2d');
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);
  
  // Kompres
  var maxDim = 320;
  var w = canvas.width, h = canvas.height;
  if (w > h && w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; }
  else if (h > maxDim) { w = Math.round(w * maxDim / h); h = maxDim; }
  if (w !== canvas.width) {
    var tmp = document.createElement('canvas');
    tmp.width = w; tmp.height = h;
    tmp.getContext('2d').drawImage(canvas, 0, 0, w, h);
    canvas = tmp;
  }
  var base64 = canvas.toDataURL('image/jpeg', 0.5);
  var q = 0.5;
  while (base64.length > 30000 && q > 0.15) {
    q -= 0.05;
    base64 = canvas.toDataURL('image/jpeg', q);
  }
  
  document.getElementById('pkl_selfie_base64').value = base64;
  var preview = document.getElementById('pkl-selfie-preview');
  preview.src = base64;
  preview.style.display = 'block';
  
  if (window._pklWebcamStream) {
    window._pklWebcamStream.getTracks().forEach(function(t) { t.stop(); });
    window._pklWebcamStream = null;
  }
  Swal.close();
}

function handlePKLSelfieUpload(input) {
  if (!input.files || !input.files[0]) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var cv = document.createElement('canvas');
      var maxDim = 320;
      var w = img.width, h = img.height;
      if (w > h && w > maxDim) { h = Math.round(h * maxDim / w); w = maxDim; }
      else if (h > maxDim) { w = Math.round(w * maxDim / h); h = maxDim; }
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      var base64 = cv.toDataURL('image/jpeg', 0.5);
      var q = 0.5;
      while (base64.length > 30000 && q > 0.15) {
        q -= 0.05;
        base64 = cv.toDataURL('image/jpeg', q);
      }
      document.getElementById('pkl_selfie_base64').value = base64;
      var preview = document.getElementById('pkl-selfie-preview');
      preview.src = base64;
      preview.style.display = 'block';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

// ⭐ Submit absen PKL
function submitPKLAbsen(tipe) {
  var lat = document.getElementById('pkl_lat').value;
  var lng = document.getElementById('pkl_lng').value;
  var jarak = document.getElementById('pkl_jarak').value;
  var selfie = document.getElementById('pkl_selfie_base64').value;
  var ket = document.getElementById('pkl_keterangan').value.trim();
  
  if (!selfie) {
    Swal.fire({ icon: 'warning', title: 'Selfie Wajib', text: 'Ambil foto selfie dulu.' });
    return;
  }
  if (!lat || !lng) {
    Swal.fire({
      icon: 'info',
      title: 'GPS Belum Diambil',
      html: 'Ambil lokasi dulu dengan tombol <strong>Dapatkan Lokasi</strong>.<br><br>' +
            'Kalau GPS tidak bisa, isi keterangan alasan.',
      confirmButtonColor: '#10b981'
    });
    return;
  }
  
  var nis = String(currentUser.student.NIS).trim();
  var btn = document.getElementById('btn-submit-pkl');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...'; }
  
  showLoading();
  google.script.run
    .withSuccessHandler(function(res) {
      hideLoading();
      Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
      setTimeout(function() { loadPKLPresensiPage(); }, 1000);
    })
    .withFailureHandler(function(err) {
      hideLoading();
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Absen ' + (tipe === 'masuk' ? 'Masuk' : 'Pulang'); }
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    })
    .submitAbsenPKL(nis, tipe, lat, lng, jarak, selfie, ket);
}

// ⭐ Render riwayat absen PKL
function renderPKLRiwayat(list) {
  var cont = document.getElementById('pkl-riwayat-container');
  if (!cont) return;
  
  if (!list || list.length === 0) {
    cont.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12.5px;">Belum ada riwayat absen PKL.</div>';
    return;
  }
  
  var html = '<div style="overflow-x:auto;"><table class="table-laporan" style="min-width:500px;">' +
    '<thead><tr><th>Tanggal</th><th>Masuk</th><th>Pulang</th><th>Status</th><th>Approval</th><th>Ket</th></tr></thead><tbody>';
  
  list.forEach(function(a) {
    var badge = a.Status_Approval === 'Approved' ? 'badge-approval-approved' : a.Status_Approval === 'Rejected' ? 'badge-approval-rejected' : 'badge-approval-pending';
    html += '<tr>' +
      '<td>' + (a.Tanggal || '-') + '</td>' +
      '<td>' + (a.Jam_Masuk || '-') + '</td>' +
      '<td>' + (a.Jam_Pulang || '-') + '</td>' +
      '<td>' + escapeHtml(a.Status || '-') + '</td>' +
      '<td><span class="' + badge + '" style="font-size:10px;padding:2px 8px;">' + a.Status_Approval + '</span></td>' +
      '<td style="font-size:11px;text-align:left;">' + (escapeHtml(a.Keterangan || '') || '-') + '</td>' +
    '</tr>';
  });
  
  html += '</tbody></table></div>';
  cont.innerHTML = html;
}

// ⭐ Load halaman jurnal PKL
function loadPKLJurnalPage() {
  if (!currentUser || !currentUser.student) return;
  var nis = String(currentUser.student.NIS).trim();
  
  var container = document.getElementById('pkl-jurnal-content');
  if (!container) return;
  
  container.innerHTML = '<div style="text-align:center;padding:32px;"><i class="fas fa-spinner fa-spin" style="font-size:2em;color:var(--primary);"></i></div>';
  
  google.script.run
    .withSuccessHandler(function(jurnal) {
      renderPKLJurnalPage(container, jurnal);
    })
    .withFailureHandler(function(err) {
      container.innerHTML = '<div class="card" style="background:#fee2e2;padding:18px;">' + err.message + '</div>';
    })
    .cekJurnalPKLHariIni(nis);
}

function renderPKLJurnalPage(container, jurnalHariIni) {
  var today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  
  var infoCard =
    '<div class="card" style="background:var(--primary-light);border:1px solid var(--primary-border);margin-bottom:16px;">' +
      '<div style="font-size:14px;font-weight:800;color:var(--primary-dark);"><i class="far fa-calendar-check"></i> ' + today + '</div>' +
    '</div>';
  
  var formCard;
  if (jurnalHariIni) {
    formCard =
      '<div class="card">' +
        '<div style="background:#d1fae5;border:1px solid #10b981;border-radius:8px;padding:12px;margin-bottom:14px;">' +
          '<div style="font-weight:800;color:#065f46;font-size:13px;"><i class="fas fa-check-circle"></i> Jurnal Hari Ini Sudah Diisi</div>' +
        '</div>' +
        '<div style="font-size:12px;color:#475569;line-height:1.6;background:#f8fafc;padding:14px;border-radius:8px;margin-bottom:14px;">' +
          '<strong>Kegiatan:</strong><br>' + escapeHtml(jurnalHariIni.Kegiatan).replace(/\n/g, '<br>') +
          (jurnalHariIni.Foto_Url ? '<br><br><strong>Foto:</strong> <a href="' + jurnalHariIni.Foto_Url + '" target="_blank" class="link-surat">Lihat Foto</a>' : '') +
          '<br><br><strong>Status:</strong> ' + jurnalHariIni.Status_Approval +
          (jurnalHariIni.Catatan_Pembimbing ? '<br><br><strong>Catatan Pembimbing:</strong> ' + escapeHtml(jurnalHariIni.Catatan_Pembimbing) : '') +
        '</div>' +
      '</div>';
  } else {
    formCard =
      '<div class="card">' +
        '<div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:14px;"><i class="fas fa-pen" style="color:var(--primary);"></i> Tulis Jurnal Hari Ini</div>' +
        '<div class="form-group">' +
  '<label><i class="fas fa-tasks"></i> Kegiatan Hari Ini — Deskripsikan minimal 10 kata</label>' +
  '<textarea id="pkl_jurnal_kegiatan" class="form-control" rows="5" placeholder="Contoh: Hari ini saya mengerjakan servis motor Honda Beat, mengganti oli mesin, membersihkan karburator, dan melakukan tune up ringan bersama pembimbing."></textarea>' +
  '<div id="pkl_jurnal_word_count" style="font-size:11px;color:#94a3b8;margin-top:4px;text-align:right;">' +
    '0 kata — minimal 10 kata' +
  '</div>' +
'</div>' +
        '<div class="form-group">' +
          '<label><i class="fas fa-camera"></i> Foto Dokumentasi (opsional)</label>' +
          '<button type="button" class="btn btn-outline btn-sm" onclick="openPKLJurnalFileDialog()" style="width:100%;">' +
            '<i class="fas fa-camera"></i> Ambil Foto / Pilih File' +
          '</button>' +
          '<input type="file" id="pkl_jurnal_foto_input" accept="image/*" style="display:none;" onchange="handlePKLJurnalFoto(this)">' +
          '<input type="hidden" id="pkl_jurnal_foto_base64" value="">' +
          '<img id="pkl-jurnal-foto-preview" src="" style="display:none;max-width:180px;border-radius:10px;margin-top:8px;">' +
        '</div>' +
        '<button type="button" class="btn btn-primary" onclick="submitPKLJurnal()" style="width:100%;min-height:46px;" id="btn-submit-jurnal">' +
          '<i class="fas fa-paper-plane"></i> Kirim Jurnal' +
        '</button>' +
      '</div>';
  }
  
  var riwayatCard =
    '<div class="card">' +
      '<div style="font-size:14px;font-weight:800;color:#0f172a;margin-bottom:12px;"><i class="fas fa-history" style="color:var(--primary);"></i> Riwayat Jurnal</div>' +
      '<div id="pkl-jurnal-riwayat" style="text-align:center;padding:16px;color:var(--text-muted);">Memuat...</div>' +
    '</div>';
  
  container.innerHTML = infoCard + formCard + riwayatCard;
  // ⭐ Live word counter untuk jurnal
var textareaJurnal = document.getElementById('pkl_jurnal_kegiatan');
var counterJurnal = document.getElementById('pkl_jurnal_word_count');
if (textareaJurnal && counterJurnal) {
  textareaJurnal.addEventListener('input', function() {
    var teks = this.value.trim();
    var jml = teks ? teks.split(/\s+/).filter(function(k) { return k.length > 0; }).length : 0;
    if (jml >= 10) {
      counterJurnal.textContent = jml + ' kata — siap dikirim ✅';
      counterJurnal.style.color = '#10b981';
      counterJurnal.style.fontWeight = '700';
    } else {
      counterJurnal.textContent = jml + ' kata — minimal 10 kata';
      counterJurnal.style.color = '#94a3b8';
      counterJurnal.style.fontWeight = '400';
    }
  });
}
  var nis = String(currentUser.student.NIS).trim();
  google.script.run
    .withSuccessHandler(function(list) { renderPKLJurnalRiwayat(list); })
    .withFailureHandler(function(err) { console.error(err); })
    .getRiwayatJurnalPKL(nis);
}

function openPKLJurnalFileDialog() {
  document.getElementById('pkl_jurnal_foto_input').click();
}

function handlePKLJurnalFoto(input) {
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
      var base64 = cv.toDataURL('image/jpeg', 0.5);
      var q = 0.5;
      while (base64.length > 50000 && q > 0.15) {
        q -= 0.05;
        base64 = cv.toDataURL('image/jpeg', q);
      }
      document.getElementById('pkl_jurnal_foto_base64').value = base64;
      var preview = document.getElementById('pkl-jurnal-foto-preview');
      preview.src = base64;
      preview.style.display = 'block';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

function submitPKLJurnal() {
  var kegiatan = document.getElementById('pkl_jurnal_kegiatan').value.trim();
  var foto = document.getElementById('pkl_jurnal_foto_base64').value;
  
  // ⭐ Hitung jumlah kata (pisah pakai whitespace, buang yang kosong)
  var jumlahKata = kegiatan.split(/\s+/).filter(function(k) { return k.length > 0; }).length;
  
  if (jumlahKata < 10) {
    Swal.fire({
      icon: 'warning',
      title: 'Deskripsi Terlalu Pendek',
      html: 'Jurnal minimal <strong>10 kata</strong>.<br>' +
            'Saat ini baru <strong>' + jumlahKata + ' kata</strong>.'
    });
    return;
  }
  
  var nis = String(currentUser.student.NIS).trim();
  var btn = document.getElementById('btn-submit-jurnal');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim...'; }
  
  showLoading();
  google.script.run
    .withSuccessHandler(function(res) {
      hideLoading();
      Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message });
      setTimeout(function() { loadPKLJurnalPage(); }, 1000);
    })
    .withFailureHandler(function(err) {
      hideLoading();
      if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Jurnal'; }
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    })
    .submitJurnalPKL(nis, kegiatan, foto);
}

function renderPKLJurnalRiwayat(list) {
  var cont = document.getElementById('pkl-jurnal-riwayat');
  if (!cont) return;
  
  if (!list || list.length === 0) {
    cont.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text-muted);font-size:12.5px;">Belum ada jurnal.</div>';
    return;
  }
  
  var html = '<div style="display:flex;flex-direction:column;gap:10px;">';
  list.forEach(function(j) {
    var badge = j.Status_Approval === 'Approved' ? 'badge-approval-approved' : j.Status_Approval === 'Rejected' ? 'badge-approval-rejected' : 'badge-approval-pending';
    html +=
      '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px;">' +
          '<strong style="color:#0f172a;font-size:12.5px;">' + j.Tanggal + '</strong>' +
          '<span class="' + badge + '" style="font-size:10px;padding:2px 8px;">' + j.Status_Approval + '</span>' +
        '</div>' +
        '<div style="font-size:12px;color:#475569;line-height:1.5;">' + escapeHtml(j.Kegiatan).replace(/\n/g, '<br>') + '</div>' +
        (j.Foto_Url ? '<div style="margin-top:6px;"><a href="' + j.Foto_Url + '" target="_blank" class="link-surat" style="font-size:10px;">Lihat Foto</a></div>' : '') +
        (j.Catatan_Pembimbing ? '<div style="margin-top:6px;font-size:11px;color:#0369a1;background:#e0f2fe;padding:6px 10px;border-radius:6px;"><strong>Pembimbing:</strong> ' + escapeHtml(j.Catatan_Pembimbing) + '</div>' : '') +
      '</div>';
  });
  html += '</div>';
  cont.innerHTML = html;
}
