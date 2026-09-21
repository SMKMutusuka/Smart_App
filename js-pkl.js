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
// ⭐ Kirim link pembimbing via WhatsApp
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

  var link = location.origin + location.pathname + '#pembimbing=' + encodeURIComponent(d.Kode_Akses);
  var pesan = 
    "Assalamu'alaikum Bapak/Ibu " + (d.Nama_Pembimbing || 'Pembimbing') + ",\n\n" +
    "Berikut link untuk monitoring PKL siswa di *" + d.Nama_DUDI + "*:\n\n" +
    "🔗 " + link + "\n\n" +
    "Melalui link ini Bapak/Ibu dapat:\n" +
    "• Melihat daftar siswa PKL di DUDI\n" +
    "• Approve absensi harian siswa\n" +
    "• Approve jurnal kegiatan siswa\n\n" +
    "Simpan link ini ya. Terima kasih.\n" +
    "- SMK Muhammadiyah 1 Surakarta";

  var nomor = formatWaNumber(d.WA_Pembimbing);
  if (!nomor) {
    Swal.fire({ icon: 'error', title: 'Nomor Tidak Valid', text: 'Nomor WA minimal 10 digit.' });
    return;
  }

    var waMeUrl = 'https://wa.me/' + nomor + '?text=' + encodeURIComponent(pesan);
  var waProtocolUrl = 'whatsapp://send?phone=' + nomor + '&text=' + encodeURIComponent(pesan);
  var isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    window.open(waMeUrl, '_blank');
  } else {
    // ⭐ PC: coba buka WA Desktop dulu via protocol handler
    // Kalau WA Desktop tidak terinstall, fallback ke wa.me (web)
    var fallbackTimer = setTimeout(function() {
      // Kalau 1.5 detik tidak ada yang handle protocol → fallback ke wa.me
      window.open(waMeUrl, '_blank');
    }, 1500);

    // Trigger protocol handler whatsapp://
    var hiddenLink = document.createElement('a');
    hiddenLink.href = waProtocolUrl;
    hiddenLink.style.display = 'none';
    document.body.appendChild(hiddenLink);
    hiddenLink.click();
    document.body.removeChild(hiddenLink);

    // Kalau WA Desktop terbuka, browser akan blur → cancel fallback
    window.addEventListener('blur', function onBlur() {
      clearTimeout(fallbackTimer);
      window.removeEventListener('blur', onBlur);
    }, { once: true });
    Swal.fire({
      title: 'Kirim Link ke WA?',
      html: 'Link akan dikirim ke <strong>' + d.Nama_Pembimbing + '</strong><br>(' + d.WA_Pembimbing + ')',
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
