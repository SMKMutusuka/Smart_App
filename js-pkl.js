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
