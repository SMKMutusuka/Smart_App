// ⭐ KONSTANTA FRONTEND — Bulan Indonesia
var BULAN_INDONESIA = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];
var HARI_INDONESIA = [
  "Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"
];
// ⭐ Helper: Ambil jam saja dari string waktu
function formatJamSaja(waktu) {
  if (!waktu) return '-';
  var str = String(waktu).trim();

  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
    return str.length === 5 ? str + ':00' : str;
  }
  try {
    var d = new Date(str);
    if (!isNaN(d.getTime())) {
      var hh = String(d.getHours()).padStart(2, '0');
      var mm = String(d.getMinutes()).padStart(2, '0');
      var ss = String(d.getSeconds()).padStart(2, '0');
      return hh + ':' + mm + ':' + ss;
    }
  } catch (e) {}
  var match = str.match(/(\d{2}:\d{2}:\d{2})/);
  if (match) return match[1];

  return str;
}

// =============================================
// ⭐ SELFIE MULTI-DEVICE — HP (native camera) + PC (getUserMedia)
// Mode Kios: PC kamera langsung buka tanpa popup
// =============================================
var selfieWebcamStream = null;

function isDesktopDevice() {
  return !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function hasGetUserMedia() {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

/**
 * ⭐ Entry point — auto-detect device
 * - HP: pakai native camera (capture="user")
 * - PC: pakai getUserMedia (kios mode)
 */
function openSelfieCapture() {
  if (isDesktopDevice() && hasGetUserMedia()) {
    openWebcamLive();
    return;
  }

  // HP → native camera
  var input = document.getElementById('selfie_input');
  if (input) {
    input.setAttribute('capture', 'user');
    input.click();
  }
}

/**
 * ⭐ Buka webcam live (PC/Kios) — tanpa popup, langsung kamera
 */
function openWebcamLive() {
  var webcamContainer = document.getElementById('selfie-webcam-container');
  var previewContainer = document.getElementById('selfie-preview-container');
  var btnOpen = document.getElementById('btnOpenSelfie');

  if (!webcamContainer) {
    Swal.fire({
      icon: 'error',
      title: 'Error Sistem',
      text: 'Elemen kamera tidak ditemukan. Hubungi admin.'
    });
    return;
  }

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    Swal.fire({
      icon: 'error',
      title: 'Browser Tidak Support',
      text: 'Silakan update Chrome ke versi terbaru.'
    });
    return;
  }

  // Tampilkan loading
  webcamContainer.style.display = 'block';
  webcamContainer.innerHTML =
    '<div style="text-align:center;padding:40px;">' +
      '<i class="fas fa-spinner fa-spin" style="font-size:2.5em;color:var(--primary);"></i>' +
      '<p style="margin-top:14px;color:#64748b;font-weight:600;">Membuka kamera...</p>' +
      '<p style="font-size:11px;color:#94a3b8;margin-top:4px;">Klik "Allow" jika browser minta izin</p>' +
    '</div>';
  if (previewContainer) previewContainer.style.display = 'none';
  if (btnOpen) btnOpen.style.display = 'none';

  navigator.mediaDevices.getUserMedia({
    video: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 }
    },
    audio: false
  })
  .then(function(stream) {
    selfieWebcamStream = stream;

    // Ganti isi container dengan video + tombol
    webcamContainer.innerHTML =
      '<video id="selfie-video" autoplay playsinline muted ' +
        'style="width:100%;max-width:480px;border-radius:12px;background:#000;transform:scaleX(-1);">' +
      '</video>' +
      '<div style="margin-top:10px;display:flex;gap:8px;justify-content:center;">' +
        '<button type="button" class="btn btn-primary btn-sm" onclick="captureWebcamSnapshot()">' +
          '<i class="fas fa-camera"></i> Ambil Foto' +
        '</button>' +
        '<button type="button" class="btn btn-outline btn-sm" onclick="cancelWebcam()">' +
          '<i class="fas fa-times"></i> Batal' +
        '</button>' +
      '</div>';

    var newVideo = document.getElementById('selfie-video');
    if (newVideo) {
      newVideo.srcObject = stream;
      newVideo.onloadedmetadata = function() { newVideo.play(); };
    }
  })
  .catch(function(err) {
    console.error('[Kios Webcam] Error:', err);

    var pesan = 'Gagal akses kamera. ';
    if (err.name === 'NotAllowedError') {
      pesan += 'Klik ikon 🔒 di address bar → Allow kamera → refresh halaman.';
    } else if (err.name === 'NotFoundError') {
      pesan += 'Webcam tidak terdeteksi. Cek kabel USB webcam.';
    } else if (err.name === 'NotReadableError') {
      pesan += 'Webcam sedang dipakai aplikasi lain (Zoom/Meet/Teams). Tutup dulu.';
    } else {
      pesan += err.message || 'Unknown error';
    }

    webcamContainer.innerHTML =
      '<div style="padding:20px;text-align:center;background:#fef2f2;border-radius:12px;border:1.5px solid #fecaca;">' +
        '<i class="fas fa-video-slash" style="font-size:2.5em;color:#dc2626;margin-bottom:12px;"></i>' +
        '<div style="font-size:13px;color:#991b1b;line-height:1.6;font-weight:600;">' + pesan + '</div>' +
        '<div style="margin-top:14px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">' +
          '<button type="button" class="btn btn-primary btn-sm" onclick="openWebcamLive()">' +
            '<i class="fas fa-redo"></i> Coba Lagi' +
          '</button>' +
          '<button type="button" class="btn btn-outline btn-sm" onclick="cancelWebcam()">' +
            'Kembali' +
          '</button>' +
        '</div>' +
      '</div>';
  });
}

/**
 * ⭐ Capture snapshot dari webcam
 */
function captureWebcamSnapshot() {
  var video = document.getElementById('selfie-video');
  if (!video || !video.videoWidth) {
    Swal.fire({ icon: 'warning', title: 'Kamera Belum Siap', text: 'Tunggu 1-2 detik lagi.' });
    return;
  }

  var canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  var ctx = canvas.getContext('2d');

  // Mirror effect
  ctx.translate(canvas.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0);

  // ⭐ Kompres agresif biar < 30KB base64 (hindari redirect 302 Apps Script)
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
// Loop kompres kalau masih > 30000 char
var q = 0.5;
while (base64.length > 30000 && q > 0.15) {
  q -= 0.05;
  base64 = canvas.toDataURL('image/jpeg', q);
}
console.log('[Selfie Webcam] Size:', base64.length);

  var base64Input = document.getElementById('selfie_base64');
  if (base64Input) base64Input.value = base64;

  var preview = document.getElementById('selfie-preview');
  var placeholder = document.getElementById('selfie-placeholder');
  var previewContainer = document.getElementById('selfie-preview-container');
  var webcamContainer = document.getElementById('selfie-webcam-container');
  var btnOpen = document.getElementById('btnOpenSelfie');

  if (preview) { preview.src = base64; preview.style.display = 'block'; }
  if (placeholder) placeholder.style.display = 'none';
  if (previewContainer) previewContainer.style.display = 'block';
  if (webcamContainer) webcamContainer.style.display = 'none';
  if (btnOpen) {
    btnOpen.style.display = 'inline-flex';
    btnOpen.innerHTML = '<i class="fas fa-redo"></i> Ambil Ulang';
  }

  closeWebcam();

  Swal.fire({
    icon: 'success',
    title: 'Selfie Tersimpan!',
    text: 'Foto berhasil diambil.',
    timer: 1200,
    showConfirmButton: false,
    toast: true,
    position: 'top-end'
  });
}
 
function closeWebcam() {
  if (selfieWebcamStream) {
    selfieWebcamStream.getTracks().forEach(function(t) { t.stop(); });
    selfieWebcamStream = null;
  }
}

function cancelWebcam() {
  closeWebcam();

  var webcamContainer = document.getElementById('selfie-webcam-container');
  var previewContainer = document.getElementById('selfie-preview-container');
  var btnOpen = document.getElementById('btnOpenSelfie');

  if (webcamContainer) webcamContainer.style.display = 'none';
  if (previewContainer) previewContainer.style.display = 'block';
  if (btnOpen) {
    btnOpen.style.display = 'inline-flex';
    btnOpen.innerHTML = '<i class="fas fa-camera"></i> Ambil Selfie';
  }
}

/**
 * ⭐ Handle upload dari file input (HP native camera)
 */
function handleSelfieUpload(input) {
  var preview = document.getElementById('selfie-preview');
  var placeholder = document.getElementById('selfie-placeholder');
  var container = document.getElementById('selfie-container');

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
      console.log('[Selfie HP] Size:', base64.length);

      var base64Input = document.getElementById('selfie_base64');
      if (base64Input) base64Input.value = base64;
      if (preview) { preview.src = base64; preview.style.display = 'block'; }
      if (placeholder) placeholder.style.display = 'none';
      if (container) container.classList.add('has-selfie');

      var btnOpen = document.getElementById('btnOpenSelfie');
      if (btnOpen) btnOpen.innerHTML = '<i class="fas fa-redo"></i> Ambil Ulang';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
}

/**
 * ⭐ Cek apakah sudah ada selfie (webcam atau file)
 */
function hasSelfieCapture() {
  var base64Input = document.getElementById('selfie_base64');
  var hasWebcam = base64Input && base64Input.value && base64Input.value.indexOf('data:image') === 0;
  var fileInput = document.getElementById('selfie_input');
  var hasFile = fileInput && fileInput.files && fileInput.files[0];
  return hasWebcam || hasFile;
}

// =============================================
// INPUT ABSENSI ADMIN
// =============================================
function loadKelasDropdowns() {
  refreshAllKelasDropdowns();
}

function loadFormAbsen() {
  var tgl = document.getElementById('tgl_absen').value;
  var kelas = document.getElementById('kelas_absen').value;
  if (!tgl || !kelas) {
    Swal.fire({ icon: 'warning', title: 'Lengkapi Data', text: 'Pilih tanggal dan kelas terlebih dahulu.' });
    return;
  }

  showLoading();
  google.script.run
    .withSuccessHandler(function(existingData) {
      google.script.run
        .withSuccessHandler(function(siswaList) {
          hideLoading();
          var safeExisting = Array.isArray(existingData) ? existingData : [];
          var safeSiswaList = Array.isArray(siswaList) ? siswaList : [];

          var kelasObj = dataKelasCache.find(function(k) {
            return String(k.ID_Kelas).trim() === String(kelas).trim();
          });
          var kelasNama = kelasObj ? kelasObj.Nama_Kelas : kelas;
          var infoAbsen = document.getElementById('info_absen_kelas');
          if (infoAbsen) infoAbsen.textContent = kelasNama + ' — ' + formatDateDisplay(tgl);

          var unabsendedSiswa = safeSiswaList.filter(function(s) {
            var sNis = String(s.NIS).trim();
            return !safeExisting.some(function(e) {
              return String(e.NIS).trim() === sNis;
            });
          });

          var totalSiswa = safeSiswaList.length;
          var countSudah = safeExisting.length;

          var bannerEl = document.getElementById('info_sudah_absen_banner');
          var bannerText = document.getElementById('text_sudah_absen_banner');

          if (countSudah > 0) {
            if (bannerEl) bannerEl.classList.remove('hidden');
            if (bannerText) bannerText.textContent = countSudah + ' dari ' + totalSiswa + ' siswa di kelas ini sudah melakukan absen mandiri / tercatat dan disembunyikan dari list.';
          } else {
            if (bannerEl) bannerEl.classList.add('hidden');
          }

          var container = document.getElementById('list_siswa_absen');
          var submitBtnContainer = document.getElementById('container_btn_submit_absen');
          if (!container) return;
          container.innerHTML = '';

          if (unabsendedSiswa.length === 0) {
            container.innerHTML = '<div class="card" style="text-align:center;padding:32px 18px;">' +
              '<i class="fas fa-check-double" style="font-size:3em;color:var(--primary);margin-bottom:10px;"></i>' +
              '<h3 style="font-size:16px;font-weight:800;color:#0f172a;">Semua Siswa Sudah Absen</h3>' +
              '<p style="font-size:12.5px;color:var(--text-muted);margin-top:4px;">' +
              'Seluruh ' + totalSiswa + ' siswa di kelas <strong>' + escapeHtml(kelasNama) + '</strong> sudah melakukan absensi (mandiri/tercatat) untuk tanggal <strong>' + formatDateDisplay(tgl) + '</strong>.' +
              '</p></div>';
            if (submitBtnContainer) submitBtnContainer.classList.add('hidden');
          } else {
            if (submitBtnContainer) submitBtnContainer.classList.remove('hidden');

            unabsendedSiswa.sort(function(a, b) { return (a.Nomor_Absen || 999) - (b.Nomor_Absen || 999); });
            var htmlBuffer = new Array(unabsendedSiswa.length);
            for (var i = 0; i < unabsendedSiswa.length; i++) {
              var s = unabsendedSiswa[i];
              var sNisClean = String(s.NIS).trim();
              var nomorAbsen = s.Nomor_Absen ? '#' + s.Nomor_Absen : '';

              htmlBuffer[i] = '<div class="siswa-absen-card" data-nama="' + escapeHtml(s.Nama_Siswa) + '">' +
                '<div class="siswa-row">' +
                  '<div class="siswa-info">' +
                    '<div class="siswa-name">' + escapeHtml(s.Nama_Siswa) + ' ' + nomorAbsen + '</div>' +
                    '<div class="siswa-nis">NIS: ' + escapeHtml(sNisClean) + '</div>' +
                  '</div>' +
                  '<div class="absen-options">' +
                    '<label class="radio-btn"><input type="radio" name="absen_' + sNisClean + '" value="Hadir" checked> <i class="fas fa-check-circle"></i> Hadir</label>' +
                    '<label class="radio-btn"><input type="radio" name="absen_' + sNisClean + '" value="Sakit"> <i class="fas fa-thermometer-half"></i> Sakit</label>' +
                    '<label class="radio-btn"><input type="radio" name="absen_' + sNisClean + '" value="Izin"> <i class="fas fa-envelope"></i> Izin</label>' +
                    '<label class="radio-btn"><input type="radio" name="absen_' + sNisClean + '" value="Alpa"> <i class="fas fa-user-times"></i> Alpa</label>' +
                  '</div>' +
                  '<div class="siswa-actions">' +
                    '<input type="text" class="ket-input" name="ket_' + sNisClean + '" placeholder="Keterangan...">' +
                    '<div class="file-upload-wrapper">' +
                      '<label class="file-label" for="file_' + sNisClean + '"><i class="fas fa-paperclip"></i> Pilih File</label>' +
                      '<input type="file" id="file_' + sNisClean + '" name="file_' + sNisClean + '" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onchange="updateFileName(this, \'' + sNisClean + '\')">' +
                      '<span class="file-name" id="file_name_' + sNisClean + '">Tidak ada file</span>' +
                    '</div>' +
                    '<input type="hidden" name="oldlink_' + sNisClean + '" value="">' +
                    '<input type="hidden" name="hasfile_' + sNisClean + '" value="false">' +
                  '</div>' +
                '</div></div>';
            }
            container.innerHTML = htmlBuffer.join('');
          }

          var areaForm = document.getElementById('area-form-absen');
          if (areaForm) areaForm.classList.remove('hidden');
        })
        .withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon:'error', title:'Error', text: err.message }); })
        .getSiswaByKelas(kelas);
    })
    .withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon:'error', title:'Error', text: err.message }); })
    .cekAbsensi(tgl, kelas);
}

function updateFileName(input, nis) {
  var nisClean = String(nis).trim();
  var fileNameSpan = document.getElementById('file_name_' + nisClean);
  var hasFileInput = document.querySelector('input[name="hasfile_' + nisClean + '"]');
  if (!fileNameSpan) return;

  if (input.files && input.files[0]) {
    var name = input.files[0].name;
    var size = (input.files[0].size / 1024).toFixed(1);
    var displayName = name.length > 20 ? name.substring(0, 17) + '...' : name;
    fileNameSpan.textContent = '📎 ' + displayName + ' (' + size + 'KB)';
    fileNameSpan.className = 'file-name has-file';
    if (hasFileInput) hasFileInput.value = 'true';
  } else {
    fileNameSpan.textContent = 'Tidak ada file';
    fileNameSpan.className = 'file-name';
    if (hasFileInput) hasFileInput.value = 'false';
  }
}

function submitDataAbsen(e) {
  e.preventDefault();
  var tgl = document.getElementById('tgl_absen').value;
  var kelas = document.getElementById('kelas_absen').value;
  var cards = document.querySelectorAll('.siswa-absen-card');
  if (cards.length === 0) return;

  var payload = [];
  var allSelected = true;
  var hasFileUpload = false;

  cards.forEach(function(card) {
    var radioName = card.querySelector('input[type="radio"]').name;
    var nis = radioName.replace('absen_', '');
    var radio = card.querySelector('input[name="' + radioName + '"]:checked');
    var ket = card.querySelector('input[name="ket_' + nis + '"]').value.trim();
    var oldLink = card.querySelector('input[name="oldlink_' + nis + '"]').value;
    var hasFile = card.querySelector('input[name="hasfile_' + nis + '"]').value === 'true';
    var nama = card.dataset.nama;
    var fileInput = document.getElementById('file_' + nis);

    if (!radio) { allSelected = false; return; }

    var fileBase64 = '';
    var fileObject = null;
    if (fileInput && fileInput.files && fileInput.files[0]) {
      fileBase64 = 'FILE_TO_PROCESS_' + nis;
      fileObject = fileInput.files[0];
      hasFileUpload = true;
    }

    payload.push({ nis: nis, nama: nama, status: radio.value, keterangan: ket, fileBase64: fileBase64, fileObject: fileObject, oldLink: oldLink, hasFile: hasFile });
  });

  if (!allSelected) {
    Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Pastikan semua siswa sudah dipilih statusnya.' });
    return;
  }

  var confirmMessage = 'Simpan absensi untuk ' + cards.length + ' siswa ini? Setelah disimpan, siswa tidak dapat mengubah absensinya.';
  if (hasFileUpload) confirmMessage += '\n\n⚠️ Terdapat file yang akan diupload ke Google Drive.';

  Swal.fire({
    title: 'Konfirmasi Simpan',
    text: confirmMessage,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Simpan',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#10b981'
  }).then(function(result) {
    if (result.isConfirmed) processFilesAndSubmit(tgl, kelas, payload);
  });
}

function processFilesAndSubmit(tgl, kelas, payload) {
  showLoading();
  var btnSubmit = document.getElementById('btnSubmitAbsen');
  var btnText = document.getElementById('btnSubmitText');
  if (btnText) btnText.textContent = 'Mengupload file...';
  if (btnSubmit) btnSubmit.disabled = true;

  var processedCount = 0;
  var totalWithFiles = payload.filter(function(p) { return p.fileObject !== null; }).length;

  if (totalWithFiles === 0) {
    submitFinalAbsensi(tgl, kelas, payload);
    return;
  }

  payload.forEach(function(p) {
    if (p.fileObject) {
      var reader = new FileReader();
      reader.onload = function(e) {
        try {
          p.fileBase64 = e.target.result;
          p.fileObject = null;
          processedCount++;
          if (btnText) btnText.textContent = 'Mengupload file... (' + processedCount + '/' + totalWithFiles + ')';
          if (processedCount === totalWithFiles) submitFinalAbsensi(tgl, kelas, payload);
        } catch (err) {
          hideLoading();
          if (btnText) btnText.textContent = 'Simpan Absensi Kelas';
          if (btnSubmit) btnSubmit.disabled = false;
          Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal memproses file: ' + err.message });
        }
      };
      reader.readAsDataURL(p.fileObject);
    }
  });
}

function submitFinalAbsensi(tgl, kelas, payload) {
  var btnSubmit = document.getElementById('btnSubmitAbsen');
  var btnText = document.getElementById('btnSubmitText');
  if (btnText) btnText.textContent = 'Menyimpan data...';

  var cleanPayload = payload.map(function(p) {
    return { nis: p.nis, nama: p.nama, status: p.status, keterangan: p.keterangan, fileBase64: p.fileBase64, oldLink: p.oldLink, hasFile: p.hasFile };
  });

  google.script.run
    .withSuccessHandler(function(msg) {
      hideLoading();
      if (btnText) btnText.textContent = 'Simpan Absensi Kelas';
      if (btnSubmit) btnSubmit.disabled = false;

      Swal.fire({ icon: 'success', title: 'Berhasil!', text: msg, timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
      var areaForm = document.getElementById('area-form-absen');
      if (areaForm) areaForm.classList.add('hidden');
      isEditAbsenMode = false;
      loadDashboardCharts();
    })
    .withFailureHandler(function(err) {
      hideLoading();
      if (btnText) btnText.textContent = 'Simpan Absensi Kelas';
      if (btnSubmit) btnSubmit.disabled = false;
      Swal.fire({ icon: 'error', title: 'Error', text: 'Gagal menyimpan absensi: ' + err.message });
    })
    .submitAbsensi(tgl, kelas, cleanPayload, isEditAbsenMode);
}

// =============================================
// ABSEN MANDIRI SISWA
// =============================================
function prepareStudentAbsenPage() {
  if (!currentUser || !currentUser.student) return;
  
  // ⭐ BLOKIR kalau siswa PKL aktif
  if (typeof pklInfoSiswa !== 'undefined' && pklInfoSiswa) {
    var container = document.getElementById('student-absen-page-content');
    if (container) {
      container.innerHTML =
        '<div class="card" style="text-align:center;padding:36px 18px;">' +
          '<div style="font-size:3.5em;color:#f59e0b;margin-bottom:12px;"><i class="fas fa-briefcase"></i></div>' +
          '<h3 style="font-size:18px;font-weight:800;color:#0f172a;margin-bottom:6px;">Anda Sedang PKL</h3>' +
          '<p style="font-size:13px;color:var(--text-muted);line-height:1.5;max-width:440px;margin:0 auto 20px;">' +
            'Absensi sekolah tidak tersedia selama PKL. Silakan gunakan menu <strong>Presensi PKL</strong> untuk absen di DUDI.' +
          '</p>' +
          '<button type="button" class="btn btn-primary" onclick="showPage(\'page-pkl-presensi\', document.getElementById(\'menu-pkl-presensi\').querySelector(\'a\'))">' +
            '<i class="fas fa-briefcase"></i> Ke Presensi PKL' +
          '</button>' +
        '</div>';
    }
    return;
  }
  
  var todayStr = todayLocalISO();
  var studentNisClean = String(currentUser.student.NIS).trim();

  showLoading();
  google.script.run
    .withSuccessHandler(function(records) {
      hideLoading();
      var safeRecords = Array.isArray(records) ? records : [];
      var existing = safeRecords.find(function(r) {
        return String(r.NIS).trim() === studentNisClean && String(r.Tanggal).slice(0,10) === todayStr;
      });
      var container = document.getElementById('student-absen-page-content');
      if (!container) return;

      if (existing) {
        renderStudentAbsenLocked(container, todayStr, existing);
      } else {
        renderStudentAbsenForm(todayStr);
      }
    })
    .withFailureHandler(function(err) { hideLoading(); console.error(err); })
    .cekAbsensi(todayStr, currentUser.student.ID_Kelas);
}

function renderStudentAbsenLocked(container, todayStr, existing) {
  var badgeClass = { 'Hadir': 'badge-hadir', 'Sakit': 'badge-sakit', 'Izin': 'badge-izin', 'Alpa': 'badge-alpa' }[existing.Status] || 'badge-hadir';
  var approvalMap = {
    'Pending': 'badge-approval-pending',
    'Approved': 'badge-approval-approved',
    'Rejected': 'badge-approval-rejected'
  };
  var approvalStatus = existing.Status_Approval || 'Approved';
  var approvalText = approvalStatus === 'Pending' ? '⏳ Menunggu Approval' :
                     approvalStatus === 'Approved' ? '✅ Disetujui' :
                     '❌ Ditolak';

  var sudahPulang = existing.Waktu_Pulang && String(existing.Waktu_Pulang).trim() !== '';
  var bisaPulang = existing.Status === 'Hadir' && !sudahPulang;

  // Kartu info absen masuk
  var infoCard =
    '<div class="card" style="background:var(--primary-light);border:1px solid var(--primary-border);margin-bottom:16px;">' +
      '<div style="font-size:15px;font-weight:800;color:var(--primary-dark);"><i class="far fa-calendar-check"></i> Absensi Hari Ini: ' + formatDateDisplay(todayStr) + '</div>' +
    '</div>';

  // Kartu status masuk
  var statusMasukCard =
    '<div class="card" style="text-align:center;padding:24px 18px;margin-bottom:16px;">' +
      '<div style="font-size:2.5em;color:var(--primary);margin-bottom:8px;">' +
        '<i class="fas fa-check-circle"></i>' +
      '</div>' +
      '<h3 style="font-size:16px;font-weight:800;color:#0f172a;margin-bottom:6px;">Absen Masuk Tercatat</h3>' +
      '<p style="font-size:12.5px;color:var(--text-muted);line-height:1.5;max-width:440px;margin:0 auto 16px;">' +
        'Absensi masuk Anda hari ini sudah tercatat di sistem.' +
      '</p>' +
      '<div style="display:inline-block;padding:14px 22px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:14px;text-align:left;min-width:280px;">' +
        '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:8px;flex-wrap:wrap;">' +
          '<span class="badge-status-table ' + badgeClass + '" style="font-size:13px;padding:6px 16px;"><i class="fas fa-check-circle"></i> ' + existing.Status + '</span>' +
          '<span class="' + (approvalMap[approvalStatus] || 'badge-approval-approved') + '" style="font-size:11px;padding:4px 14px;">' + approvalText + '</span>' +
        '</div>' +
        '<div style="font-size:12px;color:#475569;margin-top:8px;">' +
          '<strong>Jam Masuk:</strong> ' + (existing.Waktu_Masuk || '-') +
        '</div>' +
        (existing.Jarak_Meter ? '<div style="font-size:11px;color:var(--text-muted);margin-top:4px;">📏 ' + existing.Jarak_Meter + 'm dari sekolah</div>' : '') +
        (existing.Keterangan ? '<div style="font-size:11px;color:#475569;border-top:1px dashed #e2e8f0;padding-top:6px;margin-top:6px;"><strong>Ket:</strong> ' + escapeHtml(existing.Keterangan) + '</div>' : '') +
      '</div>' +
    '</div>';

  var pulangCard = '';

  if (bisaPulang) {
    // ⭐ Siswa sudah Hadir, belum Pulang → tombol Absen Pulang
    pulangCard =
      '<div class="card" style="text-align:center;padding:24px 18px;">' +
        '<div style="font-size:2.5em;color:#f59e0b;margin-bottom:8px;">' +
          '<i class="fas fa-sign-out-alt"></i>' +
        '</div>' +
        '<h3 style="font-size:16px;font-weight:800;color:#0f172a;margin-bottom:6px;">Absen Pulang</h3>' +
        '<p style="font-size:12.5px;color:var(--text-muted);line-height:1.5;max-width:440px;margin:0 auto 16px;">' +
          'Klik tombol di bawah untuk mencatat waktu pulang Anda.<br>' +
          '<span style="color:#10b981;font-weight:700;">Tidak perlu selfie.</span>' +
        '</p>' +
        '<button type="button" class="btn btn-primary" onclick="konfirmAbsenPulang()" style="min-height:46px;padding:0 32px;">' +
          '<i class="fas fa-sign-out-alt"></i> Absen Pulang Sekarang' +
        '</button>' +
      '</div>';
  } else if (sudahPulang) {
    // ⭐ Sudah absen pulang → tampilkan info
    pulangCard =
      '<div class="card" style="text-align:center;padding:24px 18px;background:#f0fdf4;border:1px solid var(--primary-border);">' +
        '<div style="font-size:2.5em;color:var(--primary);margin-bottom:8px;">' +
          '<i class="fas fa-check-double"></i>' +
        '</div>' +
        '<h3 style="font-size:16px;font-weight:800;color:#065f46;margin-bottom:6px;">Absen Pulang Tercatat</h3>' +
        '<p style="font-size:13px;color:#065f46;line-height:1.5;">' +
          'Jam Pulang: <strong style="font-size:16px;">' + String(existing.Waktu_Pulang) + '</strong>' +
        '</p>' +
        '<p style="font-size:12px;color:var(--text-muted);margin-top:8px;">' +
          'Terima kasih sudah disiplin hari ini. 🎉' +
        '</p>' +
      '</div>';
  }

  container.innerHTML = infoCard + statusMasukCard + pulangCard;
}

function renderStudentAbsenForm(todayStr) {
  var container = document.getElementById('student-absen-page-content');
  if (!container) return;

  container.innerHTML =
    '<div class="card" style="background:var(--primary-light);border:1px solid var(--primary-border);margin-bottom:16px;">' +
      '<div style="font-size:15px;font-weight:800;color:var(--primary-dark);"><i class="far fa-calendar-check"></i> Absensi Hari Ini: ' + formatDateDisplay(todayStr) + '</div>' +
      '<div style="font-size:12.5px;color:#065f46;margin-top:4px;">' +
        'Silakan tentukan status kehadiran Anda. ' +
        '<strong style="color:var(--primary-dark);">✅ Hadir: wajib GPS + Selfie</strong> | ' +
        '<strong style="color:#3b82f6;">📄 Sakit/Izin: wajib upload surat</strong>' +
      '</div>' +
    '</div>' +

    '<div class="card" style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px 18px;margin-bottom:16px;">' +
      '<div style="font-size:12.5px;color:#78350f;line-height:1.5;">' +
        '<i class="fas fa-info-circle" style="color:#d97706;"></i> <strong>Info:</strong> ' +
        'GPS digunakan sebagai indikator lokasi. Jika GPS perangkat Anda lemah/tidak akurat, ' +
        '<strong>Anda tetap bisa absen</strong>. Guru akan memverifikasi kehadiran Anda melalui foto selfie.' +
      '</div>' +
    '</div>' +

    '<div class="card">' +
      '<form id="formStudentSelfAbsen" onsubmit="submitStudentSelfAbsen(event)">' +

        // GPS Section
        '<div class="form-group" id="gps-group">' +
          '<label><i class="fas fa-satellite"></i> Lokasi GPS <span style="color:var(--primary-dark);font-weight:700;">(Wajib untuk Hadir)</span></label>' +
          '<div id="gps-status-container">' +
            '<button type="button" class="btn btn-outline btn-sm" onclick="getStudentLocation()" style="min-height:36px;">' +
              '<i class="fas fa-location-dot"></i> Dapatkan Lokasi Saya' +
            '</button>' +
            '<span id="gps-status-text" style="margin-left:10px;font-size:12px;color:var(--text-muted);">Belum diambil</span>' +
          '</div>' +
          '<div id="gps-info" style="font-size:11px;color:var(--text-muted);margin-top:6px;">Klik tombol untuk deteksi lokasi. GPS opsional — bisa lanjut tanpa GPS.</div>' +
          '<input type="hidden" id="student_latitude" value="">' +
          '<input type="hidden" id="student_longitude" value="">' +
          '<input type="hidden" id="student_gps_accuracy" value="">' +
        '</div>' +

        // Selfie Section — MULTI-DEVICE
        '<div class="form-group" id="selfie-group">' +
          '<label><i class="fas fa-camera"></i> Selfie <span style="color:var(--primary-dark);font-weight:700;">(Wajib untuk Hadir)</span></label>' +
          '<div class="selfie-container" id="selfie-container" style="padding:16px;background:#f8fafc;border-radius:12px;border:2px dashed var(--border);">' +

            // Preview foto
            '<div id="selfie-preview-container" style="text-align:center;">' +
              '<img id="selfie-preview" class="selfie-preview" src="" alt="Selfie preview" style="display:none;max-width:280px;border-radius:12px;">' +
              '<div id="selfie-placeholder" style="padding:20px;text-align:center;color:var(--text-muted);">' +
                '<i class="fas fa-camera" style="font-size:2.5em;display:block;margin-bottom:10px;color:#94a3b8;"></i>' +
                '<span>Klik tombol di bawah untuk buka kamera</span>' +
              '</div>' +
            '</div>' +

            // Live webcam (PC/Kios)
            '<div id="selfie-webcam-container" style="display:none;text-align:center;"></div>' +

            // File input (HP native camera)
            '<input type="file" id="selfie_input" accept="image/*" capture="user" style="display:none;" onchange="handleSelfieUpload(this)">' +
            '<input type="hidden" id="selfie_base64" value="">' +

            // Tombol
            '<div style="text-align:center;margin-top:12px;">' +
              '<button type="button" class="btn btn-outline btn-sm selfie-btn" id="btnOpenSelfie" onclick="openSelfieCapture()">' +
                '<i class="fas fa-camera"></i> Ambil Selfie' +
              '</button>' +
            '</div>' +

          '</div>' +
          '<div style="font-size:11px;color:var(--text-muted);margin-top:6px;">' +
            '<i class="fas fa-info-circle"></i> Selfie adalah bukti utama kehadiran Anda.' +
          '</div>' +
        '</div>' +

        // Status
        '<div class="form-group">' +
          '<label><i class="fas fa-check-square"></i> Status Kehadiran</label>' +
          '<div class="absen-options-personal" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:6px;">' +
            '<label class="radio-btn"><input type="radio" name="student_status" value="Hadir" checked onchange="toggleAbsenFields()"> <i class="fas fa-check-circle"></i> Hadir</label>' +
            '<label class="radio-btn"><input type="radio" name="student_status" value="Sakit" onchange="toggleAbsenFields()"> <i class="fas fa-thermometer-half"></i> Sakit</label>' +
            '<label class="radio-btn"><input type="radio" name="student_status" value="Izin" onchange="toggleAbsenFields()"> <i class="fas fa-envelope"></i> Izin</label>' +
          '</div>' +
        '</div>' +

        // Keterangan
        '<div class="form-group">' +
          '<label for="student_keterangan"><i class="fas fa-sticky-note"></i> Keterangan</label>' +
          '<input type="text" id="student_keterangan" class="form-control" placeholder="Contoh: Demam tinggi / Acara keluarga">' +
          '<div id="keterangan-hint" style="font-size:11px;color:#f59e0b;margin-top:4px;display:none;">' +
            '<i class="fas fa-exclamation-triangle"></i> <strong>Wajib diisi</strong> jika GPS tidak terdeteksi.' +
          '</div>' +
        '</div>' +

        // Surat Upload
        '<div class="form-group" id="surat-upload-group" style="display:none;">' +
          '<label><i class="fas fa-paperclip"></i> Upload Surat Keterangan <span style="color:#3b82f6;font-weight:700;">(Wajib untuk Sakit/Izin)</span></label>' +
          '<div class="personal-file-upload">' +
            '<label class="file-label" for="file_surat_siswa"><i class="fas fa-cloud-upload-alt"></i> Upload Surat</label>' +
            '<input type="file" id="file_surat_siswa" accept=".pdf,.jpg,.jpeg,.png" onchange="updateStudentFileName(this)">' +
            '<span class="file-name" id="file_surat_name" style="margin-left:8px;">Belum ada file dipilih</span>' +
          '</div>' +
        '</div>' +

        '<button type="submit" class="btn btn-primary" style="width:100%;margin-top:12px;min-height:46px;" id="btnSubmitAbsenSiswa">' +
          '<i class="fas fa-paper-plane"></i> Kirim Absensi Saya' +
        '</button>' +
      '</form>' +
    '</div>';

  loadStudentKelasInfo();
  toggleAbsenFields();
}

function toggleAbsenFields() {
  var status = document.querySelector('input[name="student_status"]:checked');
  var gpsGroup = document.getElementById('gps-group');
  var selfieGroup = document.getElementById('selfie-group');
  var suratGroup = document.getElementById('surat-upload-group');
  var ketHint = document.getElementById('keterangan-hint');

  if (status) {
    if (status.value === 'Hadir') {
      if (gpsGroup) gpsGroup.style.display = 'block';
      if (selfieGroup) selfieGroup.style.display = 'block';
      if (suratGroup) suratGroup.style.display = 'none';
      if (ketHint) ketHint.style.display = 'none';
    } else {
      if (gpsGroup) gpsGroup.style.display = 'none';
      if (selfieGroup) selfieGroup.style.display = 'none';
      if (suratGroup) suratGroup.style.display = 'block';
      if (ketHint) ketHint.style.display = 'none';
    }
  }
}

function getStudentLocation() {
  var status = document.querySelector('input[name="student_status"]:checked');
  if (status && status.value !== 'Hadir') {
    Swal.fire({ icon: 'info', title: 'Tidak Perlu GPS', text: 'GPS hanya diperlukan untuk status HADIR.' });
    return;
  }

  var statusText = document.getElementById('gps-status-text');
  var infoDiv = document.getElementById('gps-info');
  var latInput = document.getElementById('student_latitude');
  var lngInput = document.getElementById('student_longitude');

  if (!navigator.geolocation) {
    if (statusText) statusText.innerHTML = '<span class="gps-status inactive"><span class="gps-dot"></span> GPS tidak didukung</span>';
    if (infoDiv) infoDiv.innerHTML = '💡 Anda tetap bisa absen. Isi keterangan alasan GPS tidak bisa diakses.';
    return;
  }

  if (statusText) statusText.innerHTML = '<span class="gps-status loading"><span class="gps-dot"></span> Mendeteksi lokasi (multi-sampling)...</span>';
  if (infoDiv) infoDiv.innerHTML = '⏳ Membaca GPS beberapa kali untuk akurasi terbaik...';

  getAccuratePosition()
    .then(function(reading) {
      latInput.value = reading.lat;
      lngInput.value = reading.lng;
      var accInput = document.getElementById('student_gps_accuracy');
      if (accInput) accInput.value = reading.acc;

      if (statusText) statusText.innerHTML = '<span class="gps-status active"><span class="gps-dot"></span> Lokasi didapat ✓</span>';
      if (infoDiv) {
        var quality = reading.acc <= 30 ? '🟢 Bagus' : reading.acc <= 80 ? '🟡 Sedang' : '🔴 Rendah';
        infoDiv.innerHTML = 'Lat: ' + reading.lat.toFixed(6) +
                            ' | Lng: ' + reading.lng.toFixed(6) +
                            ' | Akurasi: <strong>±' + Math.round(reading.acc) + 'm</strong> ' + quality +
                            ' <small>(' + reading.samples + ' sampel)</small>';
        if (reading.acc > 80) {
          infoDiv.innerHTML += '<br><span style="color:#f59e0b;font-weight:700;">⚠️ Akurasi rendah — guru akan verifikasi via selfie.</span>';
        }
      }

      checkDistanceToClass(reading.lat, reading.lng, reading.acc);
    })
    .catch(function(err) {
      if (statusText) statusText.innerHTML = '<span class="gps-status inactive"><span class="gps-dot"></span> Gagal deteksi GPS</span>';
      if (infoDiv) {
        infoDiv.innerHTML = '<span style="color:#ef4444;">' + err.message + '</span><br>' +
                            '💡 <strong>Anda tetap bisa absen!</strong> Ambil selfie, isi keterangan alasan, dan absensi menunggu verifikasi guru.';
      }
      var ketHint = document.getElementById('keterangan-hint');
      if (ketHint) ketHint.style.display = 'block';
    });
}

function checkDistanceToClass(lat, lng, accuracy) {
  if (!currentUser || !currentUser.student) return;

  google.script.run
    .withSuccessHandler(function(lokasi) {
      var infoDiv = document.getElementById('gps-info');
      if (!lokasi || !lokasi.Latitude || !lokasi.Longitude) {
        if (infoDiv) infoDiv.innerHTML += '<br><span style="color:#f59e0b;">⚠️ Lokasi sekolah belum diatur admin. Absensi menunggu verifikasi guru.</span>';
        return;
      }

      var R = 6371000;
      var dLat = (lokasi.Latitude - lat) * Math.PI / 180;
      var dLon = (lokasi.Longitude - lng) * Math.PI / 180;
      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat * Math.PI / 180) * Math.cos(lokasi.Latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      var jarak = R * c;
      var radius = lokasi.Radius_Meter || 100;
      var radiusToleransi = radius * 2;

      var status, color;
      if (jarak <= radius) {
        status = '✅ Dalam area sekolah (auto-approve)';
        color = '#10b981';
      } else if (jarak <= radiusToleransi) {
        status = '⚠️ Di luar area (dalam toleransi, perlu approval)';
        color = '#f59e0b';
      } else {
        status = '❌ Jauh dari sekolah (perlu approval guru)';
        color = '#ef4444';
      }

      if (infoDiv) {
        infoDiv.innerHTML += '<br><strong style="color:' + color + ';">Jarak dari sekolah: ' +
          Math.round(jarak) + 'm (radius ' + radius + 'm) — ' + status + '</strong>';
      }
    })
    .withFailureHandler(function(err) { console.error(err); })
    .getLokasiSekolah();
}

function loadStudentKelasInfo() {
  if (!currentUser || !currentUser.student) return;

  google.script.run
    .withSuccessHandler(function(lokasi) {
      var infoDiv = document.getElementById('gps-info');
      if (infoDiv) {
        if (lokasi && lokasi.Latitude && lokasi.Longitude) {
          infoDiv.innerHTML = '📍 Lokasi sekolah: <strong>' + (lokasi.Nama_Sekolah || 'SMK') + '</strong>' +
            ' (Radius ' + (lokasi.Radius_Meter || 100) + 'm) <br>' +
            '<span style="color:#64748b;">GPS opsional — bisa lanjut tanpa GPS dengan verifikasi guru.</span>';
        } else {
          infoDiv.innerHTML = '⚠️ Lokasi sekolah belum diatur admin. Anda tetap bisa absen, guru akan verifikasi via selfie.';
          infoDiv.style.color = '#f59e0b';
        }
      }
    })
    .withFailureHandler(function(err) { console.error(err); })
    .getLokasiSekolah();
}

function updateStudentFileName(input) {
  var nameSpan = document.getElementById('file_surat_name');
  if (!nameSpan) return;
  if (input.files && input.files[0]) {
    var name = input.files[0].name;
    nameSpan.textContent = '📎 ' + (name.length > 22 ? name.substring(0, 19) + '...' : name);
    nameSpan.style.color = 'var(--primary-dark)';
    nameSpan.style.fontWeight = '700';
  } else {
    nameSpan.textContent = 'Belum ada file dipilih';
    nameSpan.style.color = 'var(--text-muted)';
  }
}

// =============================================
// SUBMIT ABSEN SISWA
// =============================================
function submitStudentSelfAbsen(e) {
  e.preventDefault();
  if (!currentUser || !currentUser.student) return;

  var statusRadio = document.querySelector('input[name="student_status"]:checked');
  var status = statusRadio ? statusRadio.value : 'Hadir';
  var keterangan = document.getElementById('student_keterangan')
    ? document.getElementById('student_keterangan').value.trim() : '';
  var fileInput = document.getElementById('file_surat_siswa');
  var selfieInput = document.getElementById('selfie_input');
  var latInput = document.getElementById('student_latitude');
  var lngInput = document.getElementById('student_longitude');
  var accInput = document.getElementById('student_gps_accuracy');
  var s = currentUser.student;

  // Validasi
  if (status === 'Hadir') {
    if (!hasSelfieCapture()) {
      Swal.fire({ icon: 'warning', title: 'Selfie Wajib',
                  text: 'Silakan ambil foto selfie sebagai bukti kehadiran.' });
      return;
    }
    if ((!latInput.value || !lngInput.value) && !keterangan) {
      Swal.fire({
        icon: 'info',
        title: 'GPS Tidak Terdeteksi',
        html: 'Tidak masalah! Anda tetap bisa absen.<br><br>' +
              '<strong>Mohon isi kolom Keterangan</strong> dengan alasan ' +
              '(contoh: "GPS HP error, saya di kelas XI TSM").<br><br>' +
              'Guru akan verifikasi kehadiran Anda via selfie.'
      });
      document.getElementById('student_keterangan').focus();
      return;
    }
  } else if (status === 'Sakit' || status === 'Izin') {
    if (!keterangan) {
      Swal.fire({ icon: 'warning', title: 'Keterangan Wajib',
                  text: 'Mohon isi keterangan untuk status ' + status + '.' });
      return;
    }
    if (!fileInput.files || !fileInput.files[0]) {
      Swal.fire({ icon: 'warning', title: 'Surat Wajib',
                  text: 'Untuk status ' + status + ', wajib upload surat.' });
      return;
    }
  }

  // Konfirmasi
  var confirmMsg = 'Kirim absensi (' + status + ') untuk hari ini?';
  if (status === 'Hadir' && (!latInput.value || !lngInput.value)) {
    confirmMsg += '\n\n⚠️ Tanpa GPS, absensi akan menunggu verifikasi guru.';
  }

  Swal.fire({
    title: 'Konfirmasi Absensi',
    text: confirmMsg,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Kirim',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#10b981'
  }).then(function(res) {
    if (res.isConfirmed) {
      var btnSubmit = document.getElementById('btnSubmitAbsenSiswa');
      if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...'; }

      showLoading();
      var suratBase64 = '';
      var selfieBase64 = '';
      var filesProcessed = 0;
      var totalFiles = 1;

      function finish() {
        filesProcessed++;
        if (filesProcessed >= totalFiles) {
          google.script.run
            .withSuccessHandler(function(msg) {
  hideLoading();
  if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Absensi Saya'; }
      Swal.fire({ icon: 'success', title: 'Absensi Terkirim!', text: msg }).then(function() {
      // ⭐ Sequential — hindari paralel request (biar tidak hang)
      prepareStudentAbsenPage();
      setTimeout(function() { loadStudentDashboard(); }, 1200);
      setTimeout(function() { loadApprovalStatsOnly(); }, 2400);
      // ⭐ Fallback: paksa hide loading setelah 1.5 detik
      setTimeout(function() {
        var loader = document.getElementById('global-loader');
        if (loader) loader.classList.add('hidden');
      }, 1500);
    });
  })
            .withFailureHandler(function(err) {
              hideLoading();
              if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Absensi Saya'; }
              Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
            })
            .submitAbsenWithGPS(
              String(s.NIS).trim(),
              status,
              keterangan,
              suratBase64,
              selfieBase64,
              latInput.value,
              lngInput.value,
              accInput ? accInput.value : ''
            );
        }
      }

      if (status === 'Hadir') {
        var selfieBase64Input = document.getElementById('selfie_base64');
        if (selfieBase64Input && selfieBase64Input.value && selfieBase64Input.value.indexOf('data:image') === 0) {
          selfieBase64 = selfieBase64Input.value;
          finish();
        } else if (selfieInput.files && selfieInput.files[0]) {
          var readerSelfie = new FileReader();
          readerSelfie.onload = function(evt) { selfieBase64 = evt.target.result; finish(); };
          readerSelfie.readAsDataURL(selfieInput.files[0]);
        } else {
          finish();
        }
      } else {
        var readerSurat = new FileReader();
        readerSurat.onload = function(evt) { suratBase64 = evt.target.result; finish(); };
        readerSurat.readAsDataURL(fileInput.files[0]);
      }
    }
  });
}

// =============================================
// PRESENSI GTK
// =============================================
function handleGTKStatusChange(status) {
  var hadirSec = document.getElementById('gtk-hadir-section');
  var suratSec = document.getElementById('gtk-surat-section');
  var btnSubmit = document.getElementById('btnSubmitGTK');

  if (status === 'Hadir' || status === 'Pulang') {
    if (hadirSec) hadirSec.classList.remove('hidden');
    if (suratSec) suratSec.classList.add('hidden');

    if (btnSubmit) {
      if (status === 'Pulang') {
        btnSubmit.innerHTML = '<i class="fas fa-sign-out-alt"></i> Kirim Presensi Pulang';
        btnSubmit.className = 'btn btn-danger';
      } else {
        btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Presensi GTK';
        btnSubmit.className = 'btn btn-primary';
      }
    }

    getGTKLocation();
  } else if (status === 'Sakit' || status === 'Izin') {
    if (hadirSec) hadirSec.classList.add('hidden');
    if (suratSec) suratSec.classList.remove('hidden');

    if (btnSubmit) {
      btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Presensi GTK';
      btnSubmit.className = 'btn btn-primary';
    }
  }
}

function fetchGTKCoordinates() {
  return new Promise(function(resolve, reject) {
    if (!navigator.geolocation) {
      reject(new Error("Browser atau perangkat HP tidak mendukung fitur lokasi GPS."));
      return;
    }

    var options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      function(pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        var acc = Math.round(pos.coords.accuracy);

        if (acc > 100) {
          var statusText = document.getElementById('gtk-gps-status');
          if (statusText) {
            statusText.innerHTML = '<span style="color:#ef4444;font-size:11px;">⚠️ Sinyal GPS lemah (Akurasi ±' + acc + 'm). Harap keluar ruangan/tunggu beberapa detik lalu klik Refresh GPS.</span>';
          }
          reject(new Error("Sinyal GPS belum akurat (terbaca ±" + acc + " meter). Harap aktifkan GPS Akurasi Tinggi di HP Anda dan klik Refresh GPS."));
          return;
        }

        document.getElementById('gtk_latitude').value = lat;
        document.getElementById('gtk_longitude').value = lng;
        var statusText = document.getElementById('gtk-gps-status');
        if (statusText) {
          statusText.innerHTML = '<span class="gps-status active"><span class="gps-dot"></span> GPS Terkunci Presisi (' + lat.toFixed(6) + ', ' + lng.toFixed(6) + ' ±' + acc + 'm)</span>';
        }
        resolve({ lat: lat, lng: lng });
      },
      function(err) {
        var msg = "Gagal membaca GPS.";
        if (err.code === 1) msg = "Izin lokasi diblokir browser. Izinkan akses lokasi di Chrome.";
        else if (err.code === 2) msg = "Sinyal GPS tidak ditemukan. Pastikan Lokasi HP aktif.";
        else if (err.code === 3) msg = "Waktu pencarian GPS habis. Silakan klik Refresh GPS.";
        reject(new Error(msg));
      },
      options
    );
  });
}

function getGTKLocation() {
  var statusText = document.getElementById('gtk-gps-status');
  if (statusText) {
    statusText.innerHTML = '<span class="gps-status loading"><span class="gps-dot"></span> Membaca sinyal GPS...</span>';
  }
  fetchGTKCoordinates().catch(function(err) {
    if (statusText) {
      statusText.innerHTML = '<span style="color:#ef4444;font-size:11px;">⚠️ ' + err.message + '</span>';
    }
  });
}

function compressImageStrict(file, targetMaxBytes, callback) {
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      var maxDim = (targetMaxBytes <= 1024) ? 130 : 180;
      var width = img.width;
      var height = img.height;
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      var quality = 0.4;
      var base64 = canvas.toDataURL('image/jpeg', quality);
      while (base64.length > targetMaxBytes && quality > 0.05) {
        quality -= 0.05;
        base64 = canvas.toDataURL('image/jpeg', quality);
      }
      while (base64.length > targetMaxBytes && canvas.width > 50) {
        canvas.width = Math.round(canvas.width * 0.7);
        canvas.height = Math.round(canvas.height * 0.7);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        base64 = canvas.toDataURL('image/jpeg', 0.12);
      }
      callback(base64);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function autoProcessSelfieGTK(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var statusEl = document.getElementById('gtk_selfie_status');
  var preview = document.getElementById('gtk-preview-selfie');
  statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengompres foto selfie...';

  compressImageStrict(file, 51200, function(compressedBase64) {
    document.getElementById('gtk_selfie_base64').value = compressedBase64;
    if (preview) {
      preview.src = compressedBase64;
      preview.style.display = 'block';
    }
    var sizeKB = (compressedBase64.length / 1024).toFixed(1);
    statusEl.innerHTML = '<span style="color:var(--primary-dark);font-weight:700;">✅ Foto Selfie Tersimpan (' + sizeKB + ' KB).</span>';
  });
}

function autoProcessSuratGTK(input) {
  if (!input.files || !input.files[0]) return;
  var file = input.files[0];
  var statusEl = document.getElementById('gtk_surat_status');
  var preview = document.getElementById('gtk-preview-surat');
  statusEl.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengompres surat...';

  if (file.type.indexOf('image') !== -1) {
    compressImageStrict(file, 102400, function(compressedBase64) {
      document.getElementById('gtk_surat_base64').value = compressedBase64;
      if (preview) {
        preview.src = compressedBase64;
        preview.style.display = 'block';
      }
      var sizeKB = (compressedBase64.length / 1024).toFixed(1);
      statusEl.innerHTML = '<span style="color:#065f46;font-weight:700;">✅ Foto Surat Tersimpan (' + sizeKB + ' KB).</span>';
    });
  } else {
    var reader = new FileReader();
    reader.onload = function(evt) {
      document.getElementById('gtk_surat_base64').value = evt.target.result;
      var sizeKB = (evt.target.result.length / 1024).toFixed(1);
      if (preview) preview.style.display = 'none';
      statusEl.innerHTML = '<span style="color:#065f46;font-weight:700;">📎 File ' + escapeHtml(file.name) + ' Tersimpan (' + sizeKB + ' KB).</span>';
    };
    reader.readAsDataURL(file);
  }
}

function handlePresensiGTK(e) {
  if (e) e.preventDefault();

  if (!currentUser || !currentUser.gtk) {
    Swal.fire({ icon: 'error', title: 'Sesi Habis', text: 'Data akun GTK tidak terbaca. Silakan keluar dan login kembali.' });
    return;
  }

  var statusRadio = document.querySelector('input[name="gtk_status"]:checked');
  var status = statusRadio ? statusRadio.value : 'Hadir';
  var ket = document.getElementById('gtk_keterangan') ? document.getElementById('gtk_keterangan').value.trim() : '';
  var lat = document.getElementById('gtk_latitude') ? document.getElementById('gtk_latitude').value : '';
  var lng = document.getElementById('gtk_longitude') ? document.getElementById('gtk_longitude').value : '';
  var selfieBase64 = document.getElementById('gtk_selfie_base64') ? document.getElementById('gtk_selfie_base64').value : '';
  var suratBase64 = document.getElementById('gtk_surat_base64') ? document.getElementById('gtk_surat_base64').value : '';

  if (status === 'Hadir' || status === 'Pulang') {
    if (!lat || !lng || lat == "0" || lng == "0") {
      Swal.fire({ icon: 'warning', title: 'GPS Belum Terkunci', text: 'Titik GPS belum terkunci. Klik tombol Refresh GPS dan pastikan GPS aktif.' });
      return;
    }
    if (!selfieBase64) {
      Swal.fire({ icon: 'warning', title: 'Foto Selfie Diperlukan', text: 'Silakan ambil foto selfie kamera depan untuk presensi ' + status + '!' });
      return;
    }
  } else if (status === 'Sakit' || status === 'Izin') {
    if (!suratBase64) {
      Swal.fire({ icon: 'warning', title: 'Bukti Diperlukan', text: 'Silakan ambil foto surat atau pilih berkas bukti dokter/izin terlebih dahulu!' });
      return;
    }
  }

  showLoading();
  var btn = document.getElementById('btnSubmitGTK');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Mengirim data...';
  }

  google.script.run
    .withSuccessHandler(function(msg) {
      hideLoading();
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Presensi GTK';
      }
      Swal.fire({ icon: 'success', title: 'Presensi Sukses', text: msg, confirmButtonColor: '#10b981' });

      document.getElementById('formPresensiGTK').reset();
      if (document.getElementById('gtk_selfie_base64')) document.getElementById('gtk_selfie_base64').value = '';
      if (document.getElementById('gtk_surat_base64')) document.getElementById('gtk_surat_base64').value = '';
      if (document.getElementById('gtk_input_selfie')) document.getElementById('gtk_input_selfie').value = '';

      var previewSelfie = document.getElementById('gtk-preview-selfie');
      var previewSurat = document.getElementById('gtk-preview-surat');
      if (previewSelfie) { previewSelfie.src = ''; previewSelfie.style.display = 'none'; }
      if (previewSurat) { previewSurat.src = ''; previewSurat.style.display = 'none'; }

      var statusSelfie = document.getElementById('gtk_selfie_status');
      if (statusSelfie) statusSelfie.textContent = 'Kamera siap...';
      var statusSurat = document.getElementById('gtk_surat_status');
      if (statusSurat) statusSurat.textContent = 'Jika sakit dg Surat Dokter, jika izin dengan bukti kegiatan';

      handleGTKStatusChange('Hadir');

      if (typeof loadGTKDashboard === 'function') {
        loadGTKDashboard();
        // ⭐ Fallback: paksa hide loading setelah 1.5 detik
setTimeout(function() {
  var loader = document.getElementById('global-loader');
  if (loader) loader.classList.add('hidden');
}, 1500);
      }
    })
    .withFailureHandler(function(err) {
      hideLoading();
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-paper-plane"></i> Kirim Presensi GTK';
      }
      Swal.fire({ icon: 'error', title: 'Gagal Presensi', text: err.message, confirmButtonColor: '#10b981' });
    })
    .submitAbsensiGTK(currentUser.gtk.NBM, status, ket, lat, lng, selfieBase64, suratBase64);
}

// =============================================
// DASHBOARD GTK
// =============================================
function loadGTKDashboard() {
  if (!currentUser || !currentUser.gtk) {
    console.warn('[GTK Dashboard] currentUser.gtk tidak ada');
    return;
  }

  var nbm = String(currentUser.gtk.NBM).trim();
  if (!nbm) return;

  var container = document.getElementById('gtk-dashboard-stats');
  if (!container) return;

  container.classList.remove('hidden');

  var bulanEl = document.getElementById('gtk_filter_bulan');
  var tahunEl = document.getElementById('gtk_filter_tahun');
  var bulan = bulanEl ? bulanEl.value : '';
  var tahun = tahunEl ? tahunEl.value : '';

  showLoading();

  google.script.run
    .withSuccessHandler(function(data) {
      hideLoading();
      if (!data || !data.success) {
        console.error('[GTK Dashboard] Data gagal:', data);
        return;
      }
      renderGTKDashboard(data);
    })
    .withFailureHandler(function(err) {
      hideLoading();
      console.error('[GTK Dashboard] Error:', err);
    })
    .getDashboardGTK(nbm, bulan, tahun);
}

function resetFilterGTK() {
  var bulanEl = document.getElementById('gtk_filter_bulan');
  var tahunEl = document.getElementById('gtk_filter_tahun');
  if (bulanEl) bulanEl.value = '';
  if (tahunEl) tahunEl.value = '';
  loadGTKDashboard();
}

function populateTahunGTK(riwayat) {
  var tahunEl = document.getElementById('gtk_filter_tahun');
  if (!tahunEl) return;

  var tahunBerjalan = String(new Date().getFullYear());
  var tahunSet = {};
  tahunSet[tahunBerjalan] = true;

  (riwayat || []).forEach(function(r) {
    var tgl = String(r.Tanggal || '');
    if (tgl.length >= 4) {
      var th = tgl.substring(0, 4);
      if (/^\d{4}$/.test(th)) tahunSet[th] = true;
    }
  });

  var tahunList = Object.keys(tahunSet).sort().reverse();
  var currentVal = tahunEl.value;

  var html = '<option value="">-- Semua Tahun --</option>';
  tahunList.forEach(function(t) {
    var selected = (t === tahunBerjalan) ? ' selected' : '';
    html += '<option value="' + t + '"' + selected + '>' + t + '</option>';
  });
  tahunEl.innerHTML = html;

  if (currentVal && tahunList.indexOf(currentVal) !== -1) {
    tahunEl.value = currentVal;
  }
}

function renderGTKDashboard(data) {
  populateTahunGTK(data.riwayat);

  var persenEl = document.getElementById('gtk-persen-info');
  if (persenEl) {
    var filterInfo = '';
    if (data.filterBulan > 0 || data.filterTahun > 0) {
      var bulanNama = data.filterBulan > 0 ? BULAN_INDONESIA[data.filterBulan - 1] : 'Semua Bulan';
      var tahunNama = data.filterTahun > 0 ? data.filterTahun : 'Semua Tahun';
      filterInfo = ' | Filter: ' + bulanNama + ' ' + tahunNama;
    }
    persenEl.textContent = (data.persenKehadiran || 0) + '% kehadiran (' +
                            (data.totalHadir || 0) + ' dari ' +
                            (data.totalHari || 0) + ' hari)' + filterInfo;
  }

  renderGTKChartPersonal(
    data.rekap.Hadir || 0,
    data.rekap.Sakit || 0,
    data.rekap.Izin || 0,
    data.rekap.Alpa || 0
  );

  renderGTKTodayStatus(data.statusHariIni);

  paginationState.gtkHistory.data = data.riwayat || [];
  paginationState.gtkHistory.page = 1;
  renderGTKHistoryTable();
}

function renderGTKChartPersonal(h, s, i, a) {
  if (window.chartGTKPersonalInstance) {
    window.chartGTKPersonalInstance.destroy();
  }

  var canvas = document.getElementById('chartGTKPersonal');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var total = h + s + i + a;
  var values = [h, s, i, a];
  var colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
  var labels = ['Hadir', 'Sakit', 'Izin', 'Alpa'];

  window.chartGTKPersonalInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{ data: values, backgroundColor: colors, borderWidth: 2, borderColor: '#ffffff' }]
    },
    options: { responsive: true, maintainAspectRatio: true, cutout: '70%', plugins: { legend: { display: false } } }
  });

  var legendEl = document.getElementById('doughnutLegendGTK');
  if (legendEl) {
    legendEl.innerHTML = '';
    labels.forEach(function(label, idx) {
      var pct = total > 0 ? ((values[idx] / total) * 100).toFixed(1) : '0.0';
      legendEl.innerHTML +=
        '<div class="doughnut-legend-item">' +
          '<span class="doughnut-legend-dot" style="background:' + colors[idx] + ';"></span>' +
          '<span>' + label + '</span>' +
          '<span class="doughnut-legend-val">' + values[idx] +
            ' <small style="font-weight:500;color:#94a3b8;">(' + pct + '%)</small>' +
          '</span>' +
        '</div>';
    });
  }
}

function renderGTKTodayStatus(status) {
  var box = document.getElementById('gtk-today-status-box');
  if (!box) return;

  if (!status) {
    box.innerHTML = '<p style="color:#94a3b8;">Data tidak tersedia</p>';
    return;
  }

  if (!status.sudahMasuk) {
    box.innerHTML =
      '<div style="font-size:3em;color:#f59e0b;margin-bottom:10px;"><i class="fas fa-clock"></i></div>' +
      '<div style="font-size:15px;font-weight:800;color:#0f172a;margin-bottom:6px;">Belum Presensi Hari Ini</div>' +
      '<div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">Segera isi form presensi di bawah</div>' +
      '<button type="button" class="btn btn-primary btn-sm" onclick="document.getElementById(\'formPresensiGTK\').scrollIntoView({behavior:\'smooth\'})">' +
        '<i class="fas fa-arrow-down"></i> Ke Form Presensi' +
      '</button>';
    return;
  }

  var statusMap = {
    'Hadir': { badge: 'badge-hadir', icon: 'fa-check-circle' },
    'Sakit': { badge: 'badge-sakit', icon: 'fa-thermometer-half' },
    'Izin':  { badge: 'badge-izin',  icon: 'fa-envelope' },
    'Pulang': { badge: 'badge-hadir', icon: 'fa-walking' }
  };

  var badgeInfo = statusMap[status.status] || { badge: 'badge-hadir', icon: 'fa-check' };

  var html =
    '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px;">Status Hari Ini</div>' +
    '<div style="margin-bottom:12px;">' +
      '<span class="badge-status-table ' + badgeInfo.badge + '" style="font-size:14px;padding:6px 18px;">' +
        '<i class="fas ' + badgeInfo.icon + '"></i> ' + status.status +
      '</span>' +
    '</div>';

  html += '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:12px;">';

  if (status.waktuMasuk) {
    html +=
      '<div style="background:#ecfdf5;padding:8px 16px;border-radius:8px;">' +
        '<div style="font-size:10px;color:#047857;font-weight:700;text-transform:uppercase;">Masuk</div>' +
        '<div style="font-size:16px;font-weight:800;color:#065f46;">' + formatJamSaja(status.waktuMasuk) + '</div>' +
      '</div>';
  }

  if (status.sudahPulang) {
    html +=
      '<div style="background:#e0e7ff;padding:8px 16px;border-radius:8px;">' +
        '<div style="font-size:10px;color:#3730a3;font-weight:700;text-transform:uppercase;">Pulang</div>' +
        '<div style="font-size:16px;font-weight:800;color:#312e81;">' + formatJamSaja(status.waktuPulang) + '</div>' +
      '</div>';
  } else if (status.status === 'Hadir') {
    html +=
      '<div style="background:#fef3c7;padding:8px 16px;border-radius:8px;">' +
        '<div style="font-size:10px;color:#92400e;font-weight:700;text-transform:uppercase;">Pulang</div>' +
        '<div style="font-size:12px;font-weight:700;color:#78350f;">Belum</div>' +
      '</div>';
  }

  html += '</div>';

  if (status.detail) {
    var selfieLinks = [];
    if (status.detail.Selfie_Url) {
      selfieLinks.push('<a href="' + escapeHtml(status.detail.Selfie_Url) + '" target="_blank" class="link-surat" style="font-size:11px;"><i class="fas fa-camera"></i> Selfie Masuk</a>');
    }
    if (status.detail.Selfie_Pulang) {
      selfieLinks.push('<a href="' + escapeHtml(status.detail.Selfie_Pulang) + '" target="_blank" class="link-surat" style="font-size:11px;background:#e0e7ff;color:#3730a3;border-color:#a5b4fc;"><i class="fas fa-camera"></i> Selfie Pulang</a>');
    }
    if (selfieLinks.length > 0) {
      html += '<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">' + selfieLinks.join(' ') + '</div>';
    }
  }

  box.innerHTML = html;
}

function renderGTKHistoryTable() {
  renderPaginationControls('gtkHistory', function(pageData) {
    var tbody = document.getElementById('gtkHistoryTbody');
    if (!tbody) return;

    if (pageData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:18px;color:var(--text-muted);">Belum ada riwayat presensi.</td></tr>';
      return;
    }

    var badgeMap = {
      'Hadir': 'badge-hadir',
      'Sakit': 'badge-sakit',
      'Izin':  'badge-izin',
      'Alpa':  'badge-alpa',
      'Pulang': 'badge-hadir'
    };

    var htmlBuffer = new Array(pageData.length);
    for (var i = 0; i < pageData.length; i++) {
      var r = pageData[i];

      var selfieMasuk = r.Selfie_Url
        ? '<a href="' + escapeHtml(r.Selfie_Url) + '" target="_blank" class="link-surat" style="font-size:10px;padding:2px 6px;" title="Selfie Masuk"><i class="fas fa-camera"></i> Masuk</a>'
        : '<span style="color:#94a3b8;font-size:10px;">-</span>';

      var selfiePulang = r.Selfie_Pulang
        ? '<a href="' + escapeHtml(r.Selfie_Pulang) + '" target="_blank" class="link-surat" style="font-size:10px;padding:2px 6px;background:#e0e7ff;color:#3730a3;border-color:#a5b4fc;" title="Selfie Pulang"><i class="fas fa-camera"></i> Pulang</a>'
        : '<span style="color:#94a3b8;font-size:10px;">-</span>';

      htmlBuffer[i] =
        '<tr>' +
          '<td>' + shortDate(r.Tanggal) + '</td>' +
          '<td><span class="badge-status-table ' + (badgeMap[r.Status] || '') + '">' + r.Status + '</span></td>' +
          '<td>' + formatJamSaja(r.Waktu_Masuk) + '</td>' +
          '<td>' + formatJamSaja(r.Waktu_Pulang) + '</td>' +
          '<td>' + (escapeHtml(r.Keterangan) || '-') + '</td>' +
          '<td>' + (r.Jarak_Meter ? r.Jarak_Meter + 'm' : '-') + '</td>' +
          '<td>' + selfieMasuk + '</td>' +
          '<td>' + selfiePulang + '</td>' +
        '</tr>';
    }
    tbody.innerHTML = htmlBuffer.join('');
  });
}

// =============================================
// EXPORT LAPORAN PRESENSI GTK KE PDF (SERVER-SIDE)
// =============================================
function exportLaporanGTKPDF() {
  if (!currentUser || !currentUser.gtk) {
    Swal.fire({ icon: 'error', title: 'Error', text: 'Data GTK tidak ditemukan.' });
    return;
  }

  var gtk = currentUser.gtk;
  var nbm = String(gtk.NBM).trim();

  var bulanEl = document.getElementById('gtk_filter_bulan');
  var tahunEl = document.getElementById('gtk_filter_tahun');
  var bulan = bulanEl ? parseInt(bulanEl.value, 10) : 0;
  var tahun = tahunEl ? parseInt(tahunEl.value, 10) : 0;

  var bulanLabel = bulan > 0 ? BULAN_INDONESIA[bulan - 1] : 'Semua Bulan';
  var tahunLabel = tahun > 0 ? tahun : 'Semua Tahun';

  Swal.fire({
    title: 'Export Laporan PDF?',
    html: 'Anda akan mengunduh laporan presensi:<br>' +
          '<strong>' + bulanLabel + ' ' + tahunLabel + '</strong><br><br>' +
          '<span style="font-size:11px;color:#64748b;">PDF akan dibuat di server & disimpan ke Google Drive.</span>',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Ya, Buat PDF',
    cancelButtonText: 'Batal',
    confirmButtonColor: '#dc2626'
  }).then(function(result) {
    if (!result.isConfirmed) return;

    showLoading();

    google.script.run
      .withSuccessHandler(function(res) {
        hideLoading();

        if (!res || !res.success) {
          Swal.fire({ icon: 'error', title: 'Gagal', text: res.error || 'PDF gagal dibuat.' });
          return;
        }

        Swal.fire({
          icon: 'success',
          title: 'PDF Berhasil Dibuat!',
          html: 'File PDF sudah tersimpan di Google Drive.<br><br>' +
                '<a href="' + res.url + '" target="_blank" ' +
                'style="display:inline-flex;align-items:center;gap:6px;text-decoration:none;padding:10px 20px;border-radius:8px;background:#10b981;color:#fff;font-weight:700;">' +
                '<i class="fas fa-download"></i> Download / Buka PDF' +
                '</a>' +
                '<br><br>' +
                '<span style="font-size:11px;color:#64748b;">PDF terbuka di tab baru. Klik ikon Download untuk simpan ke lokal.</span>',
          showCancelButton: true,
          confirmButtonText: '<i class="fas fa-external-link-alt"></i> Buka Sekarang',
          cancelButtonText: 'Tutup',
          confirmButtonColor: '#10b981'
        }).then(function(res2) {
          if (res2.isConfirmed) {
            window.open(res.url, '_blank');
          }
        });

      })
      .withFailureHandler(function(err) {
        hideLoading();
        Swal.fire({ icon: 'error', title: 'Gagal', text: err.message });
      })
      .generateLaporanGTKPDF(nbm, bulan, tahun);
  });
}

function openGTKSelfie() {
  // Prioritas 1: Coba webcam live (getUserMedia)
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    openGTKSelfieWebcam();
    return;
  }

  // Prioritas 2: Fallback ke input file (browser kuno)
  var input = document.getElementById('gtk_input_selfie');
  if (input) input.click();
}

// ⭐ Fungsi terpisah — khusus webcam live
function openGTKSelfieWebcam() {
  var gtkPreview = document.getElementById('gtk-preview-selfie');
  if (!gtkPreview) {
    Swal.fire({ icon: 'error', title: 'Error', text: 'Elemen preview tidak ada.' });
    return;
  }

  // Buat container webcam kalau belum ada
  var existingWebcam = document.getElementById('gtk-selfie-webcam-container');
  if (!existingWebcam) {
    var container = document.createElement('div');
    container.id = 'gtk-selfie-webcam-container';
    container.style.marginTop = '10px';
    container.style.textAlign = 'center';
    gtkPreview.parentNode.insertBefore(container, gtkPreview);
    existingWebcam = container;
  }

  existingWebcam.style.display = 'block';
  existingWebcam.innerHTML =
    '<div style="text-align:center;padding:20px;">' +
      '<i class="fas fa-spinner fa-spin" style="font-size:2em;color:var(--primary);"></i>' +
      '<p style="margin-top:10px;color:#64748b;font-weight:600;">Membuka kamera...</p>' +
      '<p style="font-size:11px;color:#94a3b8;">Klik "Allow" jika browser minta izin</p>' +
    '</div>';

  if (selfieWebcamStream) closeWebcam();

  navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
    audio: false
  })
  .then(function(stream) {
    selfieWebcamStream = stream;

    existingWebcam.innerHTML =
      '<video id="gtk-selfie-video" autoplay playsinline muted ' +
        'style="width:100%;max-width:400px;border-radius:12px;background:#000;transform:scaleX(-1);">' +
      '</video>' +
      '<div style="margin-top:10px;display:flex;gap:8px;justify-content:center;">' +
        '<button type="button" class="btn btn-primary btn-sm" onclick="captureGTKSelfie()">' +
          '<i class="fas fa-camera"></i> Ambil Foto' +
        '</button>' +
        '<button type="button" class="btn btn-outline btn-sm" onclick="cancelGTKSelfie()">' +
          '<i class="fas fa-times"></i> Batal' +
        '</button>' +
      '</div>';

    var video = document.getElementById('gtk-selfie-video');
    if (video) {
      video.srcObject = stream;
      video.onloadedmetadata = function() { video.play(); };
    }
  })
  .catch(function(err) {
    console.error('[GTK Webcam] Error:', err);
    
    // ⭐ Tawarkan fallback ke input file
    var pesan = 'Gagal akses kamera: ' + (err.message || err.name);
    if (err.name === 'NotAllowedError') pesan = 'Izin kamera ditolak.';
    else if (err.name === 'NotReadableError') pesan = 'Kamera sedang dipakai aplikasi lain (Zoom/Meet).';
    else if (err.name === 'NotFoundError') pesan = 'Kamera tidak terdeteksi.';

    Swal.fire({
      icon: 'warning',
      title: 'Kamera Tidak Bisa Diakses',
      html: pesan + '<br><br>Ingin pilih foto dari file?',
      showCancelButton: true,
      confirmButtonText: '<i class="fas fa-folder-open"></i> Pilih File',
      cancelButtonText: 'Tutup',
      confirmButtonColor: '#10b981'
    }).then(function(r) {
      if (r.isConfirmed) {
        var input = document.getElementById('gtk_input_selfie');
        if (input) input.click();
      }
      cancelGTKSelfie();
    });
  });
}

function captureGTKSelfie() {
  var video = document.getElementById('gtk-selfie-video');
  if (!video || !video.videoWidth) {
    Swal.fire({ icon: 'warning', title: 'Kamera Belum Siap', text: 'Tunggu 1-2 detik lagi.' });
    return;
  }

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

  console.log('[GTK Selfie] Size:', base64.length);

  document.getElementById('gtk_selfie_base64').value = base64;
  var preview = document.getElementById('gtk-preview-selfie');
  if (preview) { preview.src = base64; preview.style.display = 'block'; }
  var statusEl = document.getElementById('gtk_selfie_status');
  if (statusEl) statusEl.innerHTML = '<span style="color:var(--primary-dark);font-weight:700;">✅ Foto Selfie tersimpan</span>';

  closeWebcam();
  var webcamCont = document.getElementById('gtk-selfie-webcam-container');
  if (webcamCont) webcamCont.style.display = 'none';

  Swal.fire({ icon: 'success', title: 'Foto Diambil!', timer: 1200, showConfirmButton: false, toast: true, position: 'top-end' });
}

function cancelGTKSelfie() {
  closeWebcam();
  var webcamCont = document.getElementById('gtk-selfie-webcam-container');
  if (webcamCont) { webcamCont.style.display = 'none'; webcamCont.innerHTML = ''; }
}
