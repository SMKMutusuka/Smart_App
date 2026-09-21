// =============================================
// APPROVAL JURNAL PKL — untuk GURU PEMBIMBING
// =============================================

var guruJurnalState = { semua: [], pending: [], filterSiswa: '', view: 'pending' };

function loadApprovalJurnalGuru() {
  if (!currentUser || !currentUser.gtk) return;
  var nbm = String(currentUser.gtk.NBM).trim();
  var c = document.getElementById('guru-jurnal-content');
  if (c) c.innerHTML = '<div style="text-align:center;padding:24px;"><i class="fas fa-spinner fa-spin" style="font-size:2em;color:var(--primary);"></i></div>';
  
  google.script.run.withSuccessHandler(function(pending) {
    guruJurnalState.pending = pending || [];
    google.script.run.withSuccessHandler(function(semua) {
      guruJurnalState.semua = semua || [];
      renderApprovalJurnalGuru();
    }).withFailureHandler(function(e) { console.error(e); }).getRiwayatJurnalGuru(nbm);
  }).withFailureHandler(function(err) {
    if (c) c.innerHTML = '<div class="card" style="background:#fee2e2;padding:18px;">' + escapeHtml(err.message) + '</div>';
  }).getJurnalPendingGuru(nbm);
}

function renderApprovalJurnalGuru() {
  var c = document.getElementById('guru-jurnal-content');
  if (!c) return;
  
  var listAll = guruJurnalState.semua;
  var listPending = guruJurnalState.pending;
  var list = guruJurnalState.view === 'pending' ? listPending : listAll;
  if (guruJurnalState.filterSiswa) {
    list = list.filter(function(j) { return String(j.NIS) === String(guruJurnalState.filterSiswa); });
  }
  
  // Daftar siswa binaan unik
  var siswaUnik = {};
  listAll.forEach(function(j) { siswaUnik[j.NIS] = j.Nama_Siswa + ' (' + j.Nama_Kelas + ')'; });
  
  var html = 
    '<div class="card" style="padding:12px;background:#f8fafc;border:1px solid var(--border);margin-bottom:14px;">' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center;">' +
        '<button class="btn ' + (guruJurnalState.view === 'pending' ? 'btn-primary' : 'btn-outline') + ' btn-sm" onclick="setGuruJurnalView(\'pending\')">Menunggu Saya (' + listPending.length + ')</button>' +
        '<button class="btn ' + (guruJurnalState.view === 'all' ? 'btn-primary' : 'btn-outline') + ' btn-sm" onclick="setGuruJurnalView(\'all\')">Semua Riwayat</button>' +
        '<select class="form-control" style="max-width:240px;min-height:34px;padding:4px 8px;font-size:12px;" onchange="guruJurnalState.filterSiswa=this.value; renderApprovalJurnalGuru();">' +
          '<option value="">-- Semua Siswa Binaan --</option>' +
          Object.keys(siswaUnik).map(function(nis) {
            return '<option value="' + nis + '"' + (guruJurnalState.filterSiswa === nis ? ' selected' : '') + '>' + escapeHtml(siswaUnik[nis]) + '</option>';
          }).join('') +
        '</select>' +
      '</div>' +
    '</div>';
  
  if (list.length === 0) {
    html += '<div class="card" style="text-align:center;padding:32px;">' +
      '<i class="fas fa-check-double" style="font-size:3em;color:var(--primary);"></i>' +
      '<h3 style="font-size:15px;font-weight:800;color:#0f172a;margin-top:10px;">Tidak ada jurnal</h3></div>';
    c.innerHTML = html;
    return;
  }
  
  html += '<div style="display:flex;flex-direction:column;gap:10px;">';
  list.forEach(function(j) {
    var badgeDUDI = badgeApproval(j.Approval_DUDI);
    var badgeSekolah = badgeApproval(j.Approval_Sekolah);
    var finalBadge = j.Status_Final === 'Approved' ? '<span class="badge-approval-approved" style="font-size:10px;padding:3px 10px;">✓ Final Approved</span>'
                   : j.Status_Final === 'Rejected' ? '<span class="badge-approval-rejected" style="font-size:10px;padding:3px 10px;">✗ Final Rejected</span>'
                   : '<span class="badge-approval-pending" style="font-size:10px;padding:3px 10px;">⏳ ' + j.Status_Final + '</span>';
    
    var showBtn = (j.Approval_Sekolah === 'Pending');
    
    html += '<div class="card" style="padding:14px;">' +
      '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">' +
        '<div>' +
          '<strong style="font-size:14px;">' + escapeHtml(j.Nama_Siswa) + '</strong>' +
          '<div style="font-size:11.5px;color:var(--text-muted);">NIS: ' + escapeHtml(j.NIS) + ' | ' + escapeHtml(j.Nama_Kelas) + ' | ' + escapeHtml(j.Nama_DUDI) + '</div>' +
        '</div>' +
        '<div style="font-size:11px;color:var(--text-muted);">' + escapeHtml(j.Tanggal) + '</div>' +
      '</div>' +
      '<div style="margin-top:8px;font-size:12.5px;color:#475569;line-height:1.5;background:#f8fafc;padding:10px;border-radius:8px;">' + escapeHtml(j.Kegiatan).replace(/\n/g, '<br>') + '</div>' +
      (j.Foto_Url ? '<a href="' + escapeHtml(j.Foto_Url) + '" target="_blank" class="link-surat" style="margin-top:8px;display:inline-block;font-size:11px;">📷 Lihat Foto</a>' : '') +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:center;">' +
        '<span style="font-size:10px;color:#64748b;font-weight:700;">DUDI:</span>' + badgeDUDI +
        '<span style="font-size:10px;color:#64748b;font-weight:700;margin-left:8px;">Sekolah:</span>' + badgeSekolah +
        '<span style="margin-left:auto;">' + finalBadge + '</span>' +
      '</div>' +
      (j.Catatan_DUDI ? '<div style="margin-top:8px;font-size:11px;color:#0369a1;background:#e0f2fe;padding:6px 10px;border-radius:6px;"><strong>DUDI:</strong> ' + escapeHtml(j.Catatan_DUDI) + '</div>' : '') +
      (j.Catatan_Sekolah ? '<div style="margin-top:6px;font-size:11px;color:#065f46;background:#d1fae5;padding:6px 10px;border-radius:6px;"><strong>Sekolah:</strong> ' + escapeHtml(j.Catatan_Sekolah) + '</div>' : '') +
      (showBtn ? '<div style="display:flex;gap:6px;justify-content:flex-end;margin-top:10px;">' +
        '<button class="btn btn-primary btn-sm" onclick="konfirmApproveJurnalSekolah(\'' + j.ID_Jurnal + '\')"><i class="fas fa-check"></i> Setujui</button>' +
        '<button class="btn btn-danger btn-sm" onclick="konfirmRejectJurnalSekolah(\'' + j.ID_Jurnal + '\')"><i class="fas fa-times"></i> Tolak</button>' +
      '</div>' : '') +
    '</div>';
  });
  html += '</div>';
  c.innerHTML = html;
}

function badgeApproval(status) {
  if (status === 'Approved') return '<span class="badge-approval-approved" style="font-size:10px;padding:3px 10px;">✓ Approved</span>';
  if (status === 'Rejected') return '<span class="badge-approval-rejected" style="font-size:10px;padding:3px 10px;">✗ Rejected</span>';
  return '<span class="badge-approval-pending" style="font-size:10px;padding:3px 10px;">⏳ Pending</span>';
}

function setGuruJurnalView(v) { guruJurnalState.view = v; renderApprovalJurnalGuru(); }

function konfirmApproveJurnalSekolah(idJurnal) {
  Swal.fire({ title: 'Setujui Jurnal?', input: 'textarea', inputLabel: 'Catatan (opsional)', showCancelButton: true, confirmButtonText: 'Setujui', cancelButtonText: 'Batal', confirmButtonColor: '#10b981' })
    .then(function(r) { if (!r.isConfirmed) return;
      showLoading();
      google.script.run.withSuccessHandler(function(res) {
        hideLoading();
        Swal.fire({ icon: 'success', title: 'Berhasil', text: res.message, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
        loadApprovalJurnalGuru();
      }).withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon: 'error', title: 'Gagal', text: err.message }); })
        .approveJurnalSekolah(String(currentUser.gtk.NBM).trim(), idJurnal, r.value || '');
    });
}

function konfirmRejectJurnalSekolah(idJurnal) {
  Swal.fire({ title: 'Tolak Jurnal?', input: 'textarea', inputLabel: 'Alasan', showCancelButton: true, confirmButtonText: 'Tolak', cancelButtonText: 'Batal', confirmButtonColor: '#ef4444',
    inputValidator: function(v) { if (!v || v.length < 5) return 'Alasan minimal 5 karakter.'; }
  }).then(function(r) { if (!r.isConfirmed) return;
    showLoading();
    google.script.run.withSuccessHandler(function(res) {
      hideLoading();
      Swal.fire({ icon: 'success', title: 'Ditolak', text: res.message, timer: 1500, showConfirmButton: false, toast: true, position: 'top-end' });
      loadApprovalJurnalGuru();
    }).withFailureHandler(function(err) { hideLoading(); Swal.fire({ icon: 'error', title: 'Gagal', text: err.message }); })
      .rejectJurnalSekolah(String(currentUser.gtk.NBM).trim(), idJurnal, r.value);
  });
}
