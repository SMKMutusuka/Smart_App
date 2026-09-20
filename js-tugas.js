// =============================================
// JAVASCRIPT TUGAS — Upload & Penilaian
// File: JS_Tugas.html
// =============================================

// =============================================
// ADMIN/GURU: LOAD TUGAS
// =============================================
function loadTugasAdmin() {
  showLoading();
  var idKelas = document.getElementById('admin_filter_tugas_kelas')
    ? document.getElementById('admin_filter_tugas_kelas').value : '';
  var searchKey = document.getElementById('admin_filter_tugas_search')
    ? document.getElementById('admin_filter_tugas_search').value : '';

  google.script.run
    .withSuccessHandler(function(list) {
      hideLoading();
      paginationState.tugasAdmin.data = Array.isArray(list) ? list : [];
      paginationState.tugasAdmin.page = 1;
      renderTugasAdminTable();
    })
    .withFailureHandler(function(err) {
      hideLoading();
      Swal.fire({ icon: 'error', title: 'Error', text: err.message });
    })
    .getSemuaTugasAdmin(idKelas, searchKey);
}

function renderTugasAdminTable() {
  renderPaginationControls('tugasAdmin', function(pageData, startIdx) {
    var tbody = DOM.tbodyTugasAdmin || document.getElementById('tbodyTugasAdmin');
    if (!tbody) return;

    if (pageData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:24px;color:var(--text-muted);font-style:italic;">Belum ada tugas yang diunggah.</td></tr>';
      return;
    }

    var htmlBuffer = new Array(pageData.length);
    for (var i = 0; i < pageData.length; i++) {
      var t = pageData[i];
      var timeStr = t.Waktu_Upload ? String(t.Waktu_Upload) : '';
      var dateDisplay = timeStr.length >= 10 ? shortDate(timeStr.slice(0,10)) : '-';
      var clockDisplay = timeStr.length >= 16 ? timeStr.slice(11,16) : '';

      var statusBadge = (t.Nilai !== null && t.Nilai !== undefined && t.Nilai !== '')
        ? '<span class="badge-kirim dinilai">Nilai: ' + t.Nilai + '</span>'
        : '<span class="badge-kirim belum">Belum Dinilai</span>';

      htmlBuffer[i] = '<tr>' +
        '<td>' + (startIdx + i) + '</td>' +
        '<td>' + dateDisplay + ' ' + clockDisplay + '</td>' +
        '<td><span class="chart-badge">' + escapeHtml(t.Nama_Kelas) + '</span></td>' +
        '<td style="text-align:left;"><strong>' + escapeHtml(t.Nama_Siswa) + '</strong><br><small style="color:var(--text-muted);">NIS: ' + escapeHtml(t.NIS) + '</small></td>' +
        '<td style="font-weight:700;color:var(--primary-dark);">' + escapeHtml(t.Mapel) + '</td>' +
        '<td style="text-align:left;">' + escapeHtml(t.Judul_Catatan) + '</td>' +
        '<td><a href="' + escapeHtml(t.Link_File) + '" target="_blank" class="link-surat"><i class="fas fa-file-download"></i> Unduh</a></td>' +
        '<td>' + statusBadge + '<br><small style="color:#64748b;">' + escapeHtml(t.Catatan_Guru || '-') + '</small></td>' +
        '<td><div class="col-aksi">' +
          '<button class="btn btn-outline btn-sm" onclick="modalBeriNilaiDirect(\'' + t.ID_Upload + '\',\'' + escapeHtml(t.Nama_Siswa) + '\',\'' + (t.Nilai !== null && t.Nilai !== undefined ? t.Nilai : '') + '\',\'' + escapeHtml((t.Catatan_Guru || '').replace(/'/g, "\\'")) + '\')" title="Beri Nilai"><i class="fas fa-pen"></i></button>' +
          '<button class="btn btn-danger btn-sm" onclick="hapusDirectTugas(\'' + t.ID_Upload + '\')" title="Hapus"><i class="fas fa-trash"></i></button>' +
        '</div></td>' +
      '</tr>';
    }
    tbody.innerHTML = htmlBuffer.join('');
  });
}

function resetFilterTugasAdmin() {
  if (document.getElementById('admin_filter_tugas_kelas')) document.getElementById('admin_filter_tugas_kelas').value = '';
  if (document.getElementById('admin_filter_tugas_search')) document.getElementById('admin_filter_tugas_search').value = '';
  loadTugasAdmin();
}

// =============================================
// MODAL BERI NILAI
// =============================================
function modalBeriNilaiDirect(idUpload, namaSiswa, nilaiLama, catatanLama) {
  Swal.fire({
    title: 'Penilaian Tugas - ' + namaSiswa,
    html: '<div style="text-align:left;">' +
      '<label style="font-size:11px;font-weight:700;text-transform:uppercase;color:#334155;">Nilai Angka (0-100)</label>' +
      '<input type="number" id="swal_nilai" class="swal2-input" min="0" max="100" value="' + nilaiLama + '" placeholder="Contoh: 85" style="margin-top:4px;">' +
      '<label style="font-size:11px;font-weight:700;text-transform:uppercase;color:#334155;margin-top:12px;display:block;">Catatan Guru / Evaluasi</label>' +
      '<input type="text" id="swal_catatan" class="swal2-input" value="' + catatanLama + '" placeholder="Pujian atau saran perbaikan..." style="margin-top:4px;">' +
    '</div>',
    showCancelButton: true,
    confirmButtonText: 'Simpan Nilai',
    confirmButtonColor: '#10b981',
    preConfirm: function() {
      var val = document.getElementById('swal_nilai').value;
      if (val === '' || isNaN(val) || val < 0 || val > 100) {
        Swal.showValidationMessage('Masukkan nilai angka 0 - 100');
        return false;
      }
      return {
        nilai: val,
        catatan: document.getElementById('swal_catatan').value
      };
    }
  }).then(function(res) {
    if (res.isConfirmed) {
      showLoading();
      google.script.run
        .withSuccessHandler(function(msg) {
          hideLoading();
          Swal.fire({ icon: 'success', title: 'Berhasil', text: msg, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
          loadTugasAdmin();
        })
        .withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon: 'error', title: 'Error', text: err.message }); })
        .simpanNilaiDirectTugas(idUpload, res.value.nilai, res.value.catatan);
    }
  });
}

// =============================================
// HAPUS TUGAS
// =============================================
function hapusDirectTugas(idUpload) {
  Swal.fire({
    title: 'Hapus Tugas?', text: 'File pengumpulan tugas siswa ini akan dihapus.',
    icon: 'warning', showCancelButton: true,
    confirmButtonText: 'Ya, Hapus', cancelButtonText: 'Batal',
    confirmButtonColor: '#ef4444'
  }).then(function(r) {
    if (r.isConfirmed) {
      showLoading();
      google.script.run
        .withSuccessHandler(function(msg) {
          hideLoading();
          Swal.fire({ icon: 'success', title: 'Berhasil', text: msg, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
          loadTugasAdmin();
        })
        .withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon: 'error', title: 'Error', text: err.message }); })
        .hapusDirectTugas(idUpload);
    }
  });
}

// =============================================
// SISWA: LOAD TUGAS
// =============================================
function loadTugasSiswa() {
  if (!currentUser || !currentUser.student) return;
  showLoading();
  google.script.run
    .withSuccessHandler(function(list) {
      hideLoading();
      paginationState.studentTugas.data = Array.isArray(list) ? list : [];
      paginationState.studentTugas.page = 1;
      renderStudentTugasTable();
    })
    .withFailureHandler(function(err) { hideLoading(); console.error(err); })
    .getDirectTugasSiswa(String(currentUser.student.NIS).trim());
}

function renderStudentTugasTable() {
  renderPaginationControls('studentTugas', function(pageData) {
    var tbody = DOM.tbodyStudentTugas || document.getElementById('studentTugasHistoryTbody');
    if (!tbody) return;

    if (pageData.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:24px;color:var(--text-muted);font-style:italic;">Belum ada tugas yang Anda upload.</td></tr>';
      return;
    }

    var htmlBuffer = new Array(pageData.length);
    for (var i = 0; i < pageData.length; i++) {
      var t = pageData[i];
      var timeStr = t.Waktu_Upload ? String(t.Waktu_Upload) : '';
      var dateDisplay = timeStr.length >= 10 ? shortDate(timeStr.slice(0,10)) : '-';
      var clockDisplay = timeStr.length >= 16 ? timeStr.slice(11,16) : '';

      var statusBadge = (t.Nilai !== null && t.Nilai !== undefined && t.Nilai !== '')
        ? '<span class="badge-kirim dinilai"><i class="fas fa-star"></i> Nilai: ' + t.Nilai + '</span>'
        : '<span class="badge-kirim sudah"><i class="fas fa-check-circle"></i> Terkirim</span>';

      htmlBuffer[i] = '<tr>' +
        '<td class="col-waktu">' + dateDisplay + ' ' + clockDisplay + '</td>' +
        '<td class="col-mapel">' + escapeHtml(t.Mapel) + '</td>' +
        '<td class="col-judul">' + escapeHtml(t.Judul_Catatan) + '</td>' +
        '<td class="col-file"><a href="' + escapeHtml(t.Link_File) + '" target="_blank" class="link-surat"><i class="fas fa-file"></i> File Tugas</a></td>' +
        '<td class="col-status">' + statusBadge + '</td>' +
        '<td class="col-catatan">' + (escapeHtml(t.Catatan_Guru) || '-') + '</td>' +
      '</tr>';
    }
    tbody.innerHTML = htmlBuffer.join('');
  });
}

function updateDirectTugasFileName(input) {
  var nameSpan = document.getElementById('file_direct_tugas_name');
  if (!nameSpan) return;
  if (input.files && input.files[0]) {
    var name = input.files[0].name;
    var size = (input.files[0].size / 1024).toFixed(1);
    nameSpan.textContent = '📎 Siap Upload: ' + name + ' (' + size + 'KB)';
    nameSpan.style.color = 'var(--primary-dark)';
    nameSpan.style.fontWeight = '700';
  } else {
    nameSpan.textContent = 'Belum ada file dipilih';
    nameSpan.style.color = 'var(--text-muted)';
  }
}

// =============================================
// SISWA: UPLOAD TUGAS
// =============================================
function handleDirectUploadTugas(e) {
  e.preventDefault();
  if (!currentUser || !currentUser.student) return;

  var mapel = document.getElementById('student_mapel').value.trim();
  var judulCatatan = document.getElementById('student_judul_catatan').value.trim();
  var fileInput = document.getElementById('file_direct_tugas');
  var nis = String(currentUser.student.NIS).trim();

  if (!mapel || !judulCatatan) {
    Swal.fire({ icon: 'warning', title: 'Lengkapi Form', text: 'Mohon isi Mata Pelajaran dan Judul / Catatan Tugas.' });
    return;
  }
  if (!fileInput.files || !fileInput.files[0]) {
    Swal.fire({ icon: 'warning', title: 'Pilih File', text: 'Silakan pilih file tugas terlebih dahulu.' });
    return;
  }

  var file = fileInput.files[0];
  if (file.size > 5 * 1024 * 1024) {
    Swal.fire({ icon: 'warning', title: 'File Terlalu Besar', text: 'Ukuran maksimal file 5 MB.' });
    return;
  }

  showLoading();
  var reader = new FileReader();
  reader.onload = function(evt) {
    google.script.run
      .withSuccessHandler(function(msg) {
        hideLoading();
        document.getElementById('formUploadTugasSiswa').reset();
        updateDirectTugasFileName(fileInput);
        Swal.fire({ icon: 'success', title: 'Berhasil Diunggah', text: msg, timer: 2000, showConfirmButton: false, toast: true, position: 'top-end' });
        loadTugasSiswa();
      })
      .withFailureHandler(function(err) {
        hideLoading();
        Swal.fire({ icon: 'error', title: 'Error', text: err.message });
      })
      .submitDirectTugasSiswa(nis, mapel, judulCatatan, evt.target.result);
  };
  reader.readAsDataURL(file);
}
