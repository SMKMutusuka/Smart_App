// =============================================
// JAVASCRIPT MAPS — Single Point Lokasi Sekolah
// File: JS_Maps.html
// ⭐ 3-Layer CDN Fallback + Mode Manual jika peta gagal
// =============================================

var mapInstance = null;
var markerInstance = null;
var circleInstance = null;
var currentMapLat = -7.592981;    // ⭐ geser 20m selatan
var currentMapLng = 110.824800;
var currentRadius = 100;           // ⭐ default 100m
var isCoordLocked = false;
var isMapInitialized = false;

// =============================================
// INIT LOKASI PAGE
// =============================================
function initLokasiPage() {
  loadLokasiSekolah();

  // Tunggu Leaflet siap (retry max 10x)
  var tryInit = function() {
    if (typeof L === 'undefined') {
      if (!tryInit._count) tryInit._count = 0;
      tryInit._count++;
      if (tryInit._count < 10) {
        setTimeout(tryInit, 500);
      } else {
        initMap(); // akan tampilkan pesan error + fallback manual
      }
      return;
    }
    initMap();
  };
  setTimeout(tryInit, 300);

  // Listener input manual
  var latInput = document.getElementById('lokasi_lat');
  var lngInput = document.getElementById('lokasi_lng');
  var radiusInput = document.getElementById('lokasi_radius');

  if (latInput && !latInput.dataset.listenerAttached) {
    latInput.dataset.listenerAttached = '1';
    latInput.addEventListener('change', function() {
      if (!isCoordLocked) {
        var lat = parseFloat(this.value);
        var lng = parseFloat(document.getElementById('lokasi_lng').value);
        if (!isNaN(lat) && !isNaN(lng)) updateMapLocation(lat, lng);
      }
    });
  }
  if (lngInput && !lngInput.dataset.listenerAttached) {
    lngInput.dataset.listenerAttached = '1';
    lngInput.addEventListener('change', function() {
      if (!isCoordLocked) {
        var lat = parseFloat(document.getElementById('lokasi_lat').value);
        var lng = parseFloat(this.value);
        if (!isNaN(lat) && !isNaN(lng)) updateMapLocation(lat, lng);
      }
    });
  }
  if (radiusInput && !radiusInput.dataset.listenerAttached) {
    radiusInput.dataset.listenerAttached = '1';
    radiusInput.addEventListener('input', function() {
      currentRadius = parseFloat(this.value) || 100;
      updateRadius();
    });
  }
}

// =============================================
// INIT MAP — DENGAN FALLBACK MODE MANUAL
// =============================================
function initMap() {
  var container = document.getElementById('map');
  if (!container) return;

  // ===== DETEKSI: Leaflet tidak ada → fallback manual =====
  if (typeof L === 'undefined') {
    console.warn('⚠️ Leaflet tidak termuat. Beralih ke mode input manual.');

    var wrapper = document.getElementById('map-container');
    if (wrapper) {
      wrapper.innerHTML =
        '<div style="padding:24px 20px;text-align:center;">' +
          '<i class="fas fa-exclamation-triangle" style="font-size:2.5em;color:#f59e0b;margin-bottom:12px;"></i>' +
          '<div style="font-weight:800;color:#0f172a;font-size:14px;margin-bottom:6px;">Peta Tidak Dapat Dimuat</div>' +
          '<div style="font-size:12px;color:#64748b;line-height:1.6;margin-bottom:14px;">' +
            'Library peta gagal dimuat (kemungkinan jaringan/CDN diblokir).<br>' +
            '<strong>Anda tetap bisa menyimpan lokasi dengan input manual di bawah.</strong>' +
          '</div>' +
          '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">' +
            '<button type="button" class="btn btn-primary btn-sm" onclick="location.reload();">' +
              '<i class="fas fa-redo"></i> Refresh Halaman' +
            '</button>' +
          '</div>' +
        '</div>';
    }
    return;
  }

  // ===== JIKA LEAFLET ADA =====
  if (mapInstance) {
    try { mapInstance.invalidateSize(); } catch (e) {}
    return;
  }

  try {
    container.style.position = 'relative';
    container.style.zIndex = '1';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.minHeight = '350px';

    mapInstance = L.map('map', {
      center: [currentMapLat, currentMapLng],
      zoom: 17,
      zoomControl: true,
      dragging: true,
      scrollWheelZoom: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
      minZoom: 10
    }).addTo(mapInstance);

    var icon = L.divIcon({
      className: 'custom-div-icon',
      html: '<div style="font-size:32px;color:#ef4444;text-shadow:0 2px 8px rgba(0,0,0,0.3);">📍</div>',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    markerInstance = L.marker([currentMapLat, currentMapLng], {
      draggable: true,
      icon: icon
    }).addTo(mapInstance);

    markerInstance.on('dragend', function() {
      if (isCoordLocked) {
        markerInstance.setLatLng([currentMapLat, currentMapLng]);
        Swal.fire({ icon: 'info', title: 'Koordinat Terkunci', text: 'Buka kunci terlebih dahulu.', timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
        return;
      }
      var pos = markerInstance.getLatLng();
      updateMapLocation(pos.lat, pos.lng);
    });

    circleInstance = L.circle([currentMapLat, currentMapLng], {
      radius: currentRadius,
      color: '#10b981',
      fillColor: '#10b981',
      fillOpacity: 0.12,
      weight: 2,
      dashArray: '5, 5'
    }).addTo(mapInstance);

    mapInstance.on('click', function(e) {
      if (isCoordLocked) {
        Swal.fire({ icon: 'info', title: 'Koordinat Terkunci', text: 'Buka kunci terlebih dahulu.', timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
        return;
      }
      markerInstance.setLatLng(e.latlng);
      updateMapLocation(e.latlng.lat, e.latlng.lng);
    });

    isMapInitialized = true;

    // Invalidate size beberapa kali
    setTimeout(function() { try { mapInstance.invalidateSize(); } catch (e) {} }, 100);
    setTimeout(function() { try { mapInstance.invalidateSize(); } catch (e) {} }, 500);
    setTimeout(function() { try { mapInstance.invalidateSize(); } catch (e) {} }, 1000);

  } catch (err) {
    console.error('Error initMap:', err);
    container.innerHTML =
      '<div style="display:flex;height:100%;align-items:center;justify-content:center;flex-direction:column;padding:20px;text-align:center;color:#64748b;">' +
        '<i class="fas fa-exclamation-triangle" style="font-size:2.5em;color:#ef4444;margin-bottom:10px;"></i>' +
        '<div style="font-weight:700;color:#0f172a;">Gagal Inisialisasi Peta</div>' +
        '<div style="font-size:12px;margin-top:4px;">' + String(err.message || err) + '</div>' +
        '<div style="font-size:11px;margin-top:8px;color:#64748b;">Gunakan input koordinat manual di bawah.</div>' +
      '</div>';
  }
}

// =============================================
// UPDATE LOCATION
// =============================================
function updateMapLocation(lat, lng) {
  currentMapLat = lat;
  currentMapLng = lng;

  var latEl = document.getElementById('lokasi_lat');
  var lngEl = document.getElementById('lokasi_lng');
  if (latEl) latEl.value = lat.toFixed(6);
  if (lngEl) lngEl.value = lng.toFixed(6);

  var dispLat = document.getElementById('map_lat_display');
  var dispLng = document.getElementById('map_lng_display');
  if (dispLat) dispLat.textContent = lat.toFixed(6);
  if (dispLng) dispLng.textContent = lng.toFixed(6);

  if (markerInstance) markerInstance.setLatLng([lat, lng]);
  updateRadius();
  if (mapInstance) mapInstance.panTo([lat, lng]);
}

function updateRadius() {
  var radiusInput = document.getElementById('lokasi_radius');
  var radius = radiusInput ? (parseFloat(radiusInput.value) || 100) : 100;
  currentRadius = radius;

  var dispRadius = document.getElementById('map_radius_display');
  if (dispRadius) dispRadius.textContent = radius;

  if (circleInstance) {
    circleInstance.setRadius(radius);
    circleInstance.setLatLng([currentMapLat, currentMapLng]);
  }
}

// =============================================
// SEARCH LOCATION
// =============================================
function searchLocation() {
  var address = document.getElementById('map_search_input').value.trim();
  if (!address) {
    Swal.fire({ icon: 'warning', title: 'Masukkan Alamat', text: 'Silakan masukkan alamat/nama gedung.' });
    return;
  }

  showLoading();
  google.script.run
    .withSuccessHandler(function(result) {
      hideLoading();
      if (result && result.latitude && result.longitude) {
        updateMapLocation(result.latitude, result.longitude);
        document.getElementById('map_search_input').value = result.display_name || '';
        Swal.fire({ icon: 'success', title: 'Lokasi Ditemukan', text: result.display_name, timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
      } else {
        Swal.fire({ icon: 'error', title: 'Tidak Ditemukan', text: 'Alamat tidak ditemukan.' });
      }
    })
    .withFailureHandler(function(err) {
      hideLoading();
      Swal.fire({ icon: 'error', title: 'Gagal Mencari', text: err.message || 'Coba kata kunci lain.' });
    })
    .geocodeAddress(address);
}

// =============================================
// TOGGLE LOCK
// =============================================
function toggleLockCoord() {
  isCoordLocked = !isCoordLocked;
  var btn = document.getElementById('btnLockCoord');
  var text = document.getElementById('lock-text');

  if (isCoordLocked) {
    if (btn) btn.classList.add('active');
    if (text) text.textContent = 'Buka Kunci';
    if (markerInstance && markerInstance.dragging) markerInstance.dragging.disable();
    Swal.fire({ icon: 'success', title: 'Koordinat Terkunci', text: 'Klik lagi untuk membuka.', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
  } else {
    if (btn) btn.classList.remove('active');
    if (text) text.textContent = 'Kunci Koordinat';
    if (markerInstance && markerInstance.dragging) markerInstance.dragging.enable();
    Swal.fire({ icon: 'info', title: 'Koordinat Dibuka', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
  }
}

// =============================================
// RESET MAP
// =============================================
function resetMapToDefault() {
  if (isCoordLocked) {
    Swal.fire({ icon: 'warning', title: 'Koordinat Terkunci', text: 'Buka kunci terlebih dahulu.' });
    return;
  }
  updateMapLocation(-7.592981, 110.824800);
  document.getElementById('map_search_input').value = '';
  document.getElementById('lokasi_radius').value = 100;
  updateRadius();
  Swal.fire({ icon: 'info', title: 'Peta Direset', text: 'Kembali ke lokasi default sekolah.', timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
}

// =============================================
// LOAD LOKASI SEKOLAH
// =============================================
function loadLokasiSekolah() {
  showLoading();
  google.script.run
    .withSuccessHandler(function(lokasi) {
      hideLoading();
      if (!lokasi) return;

      currentMapLat = lokasi.Latitude || -7.592981;
      currentMapLng = lokasi.Longitude || 110.824800;
      currentRadius = lokasi.Radius_Meter || 100;

      var namaEl = document.getElementById('lokasi_nama_sekolah');
      var latEl = document.getElementById('lokasi_lat');
      var lngEl = document.getElementById('lokasi_lng');
      var radEl = document.getElementById('lokasi_radius');
      var alamatEl = document.getElementById('map_search_input');

      if (namaEl) namaEl.value = lokasi.Nama_Sekolah || '';
      if (latEl) latEl.value = (lokasi.Latitude || 0).toFixed(6);
      if (lngEl) lngEl.value = (lokasi.Longitude || 0).toFixed(6);
      if (radEl) radEl.value = lokasi.Radius_Meter || 100;
      if (alamatEl && lokasi.Alamat) alamatEl.value = lokasi.Alamat;

      if (mapInstance) {
        updateMapLocation(currentMapLat, currentMapLng);
      }

      renderLokasiInfo(lokasi);
    })
    .withFailureHandler(function(err) {
      hideLoading();
      console.error('Gagal load lokasi sekolah:', err);
    })
    .getLokasiSekolah();
}

function renderLokasiInfo(lokasi) {
  var container = document.getElementById('lokasi-info-card');
  if (!container) return;

  var hasLokasi = lokasi && lokasi.Latitude && lokasi.Longitude;
  var statusIcon = hasLokasi ? '✅' : '❌';
  var statusText = hasLokasi ? 'Aktif' : 'Belum Diatur';
  var statusColor = hasLokasi ? 'var(--primary-dark)' : '#ef4444';

  container.innerHTML = '<div class="lokasi-card">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
      '<div>' +
        '<div style="font-weight:800;font-size:15px;"><i class="fas fa-school"></i> ' + escapeHtml(lokasi.Nama_Sekolah || '-') + '</div>' +
        '<div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Titik lokasi utama untuk presensi semua siswa & GTK</div>' +
      '</div>' +
      '<div>' +
        '<span class="radius-badge"><i class="fas fa-expand"></i> Radius: ' + (lokasi.Radius_Meter || 100) + 'm</span>' +
        ' <span style="font-weight:700;color:' + statusColor + ';">' + statusIcon + ' ' + statusText + '</span>' +
      '</div>' +
    '</div>' +
    '<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;">' +
      '<span class="koordinat">📍 ' + (lokasi.Latitude || 0).toFixed(6) + ', ' + (lokasi.Longitude || 0).toFixed(6) + '</span>' +
      (lokasi.Alamat ? ' <span style="font-size:12px;color:#475569;">🏠 ' + escapeHtml(lokasi.Alamat) + '</span>' : '') +
      (lokasi.Updated_At ? ' <span style="font-size:11px;color:var(--text-muted);">Update: ' + lokasi.Updated_At + '</span>' : '') +
    '</div>' +
  '</div>';
}

// =============================================
// SAVE LOKASI SEKOLAH
// =============================================
function saveLokasiSekolah(e) {
  if (e && e.preventDefault) e.preventDefault();

  var lat = document.getElementById('lokasi_lat').value.trim();
  var lng = document.getElementById('lokasi_lng').value.trim();
  var radius = document.getElementById('lokasi_radius').value.trim();
  var alamat = document.getElementById('map_search_input').value.trim();
  var namaSekolah = document.getElementById('lokasi_nama_sekolah')
    ? document.getElementById('lokasi_nama_sekolah').value.trim() : '';

  if (!lat || !lng) {
    Swal.fire({ icon: 'warning', title: 'Koordinat Kosong', text: 'Tentukan titik lokasi di peta atau isi manual.' });
    return;
  }
  if (isNaN(lat) || isNaN(lng)) {
    Swal.fire({ icon: 'warning', title: 'Koordinat Tidak Valid', text: 'Masukkan angka valid.' });
    return;
  }
  if (!radius || isNaN(radius) || radius < 5) {
    Swal.fire({ icon: 'warning', title: 'Radius Tidak Valid', text: 'Radius minimal 5 meter.' });
    return;
  }

  Swal.fire({
    title: 'Simpan Lokasi Sekolah?',
    html: 'Koordinat ini akan digunakan untuk <strong>semua presensi siswa & GTK</strong>.<br><br>' +
          'Latitude: <strong>' + lat + '</strong><br>' +
          'Longitude: <strong>' + lng + '</strong><br>' +
          'Radius: <strong>' + radius + ' meter</strong>',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Simpan',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#10b981'
  }).then(function(res) {
    if (!res.isConfirmed) return;

    showLoading();
    google.script.run
      .withSuccessHandler(function(msg) {
        hideLoading();
        Swal.fire({ icon: 'success', title: 'Berhasil', text: msg, timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
        loadLokasiSekolah();
      })
      .withFailureHandler(function(err) {
        hideLoading();
        Swal.fire({ icon: 'error', title: 'Error', text: err.message });
      })
      .saveLokasiSekolah(lat, lng, radius, alamat, namaSekolah);
  });
}

// =============================================
// GET CURRENT LOCATION — Multi-sampling akurat
// =============================================
function getCurrentLocation() {
  if (!navigator.geolocation) {
    Swal.fire({ icon: 'error', title: 'GPS Tidak Didukung', text: 'Browser Anda tidak mendukung GPS.' });
    return;
  }

  if (isCoordLocked) {
    Swal.fire({ icon: 'warning', title: 'Koordinat Terkunci', text: 'Buka kunci terlebih dahulu.' });
    return;
  }

  Swal.fire({
    title: 'Mendapatkan Lokasi',
    html: 'Harap izinkan akses lokasi.<br><br><small>Membaca GPS beberapa kali untuk hasil terbaik...</small>',
    icon: 'info',
    showConfirmButton: false,
    allowOutsideClick: false
  });

  // Panggil fungsi multi-sampling dari JavaScript.html
  var getPos = (typeof getAccuratePosition === 'function')
    ? getAccuratePosition()
    : new Promise(function(resolve, reject) {
        navigator.geolocation.getCurrentPosition(
          function(pos) {
            resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy, samples: 1 });
          },
          function(err) { reject(new Error(err.message)); },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      });

  getPos
    .then(function(reading) {
      updateMapLocation(reading.lat, reading.lng);

      google.script.run
        .withSuccessHandler(function(alamat) {
          if (alamat) document.getElementById('map_search_input').value = alamat;
        })
        .withFailureHandler(function(err) { console.error(err); })
        .reverseGeocode(reading.lat, reading.lng);

      Swal.fire({
        icon: 'success',
        title: 'Lokasi Didapatkan',
        html: 'Lat: <strong>' + reading.lat.toFixed(6) + '</strong><br>' +
              'Lng: <strong>' + reading.lng.toFixed(6) + '</strong><br>' +
              'Akurasi: <strong>±' + Math.round(reading.acc) + 'm</strong>',
        timer: 2500,
        showConfirmButton: false
      });
    })
    .catch(function(err) {
      Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
    });
}
