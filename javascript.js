// ⭐ OPTIMASI: 1 call untuk semua data approval
function getApprovalDashboardData(id_kelas) {
  return {
    kelasList: getKelasForFilter(),
    stats: getApprovalStats(),
    pending: getPendingApprovals(id_kelas)
  };
}

// ⭐ BATCH APPROVE
function approveAbsensiBatch(idAbsenArray) {
  if (!Array.isArray(idAbsenArray) || idAbsenArray.length === 0) {
    throw new Error("Tidak ada data yang dipilih!");
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(S_ABSENSI);
  if (!sheet) throw new Error("Sheet Absensi tidak ditemukan!");

  var colApproval   = ensureColumnExists(sheet, "Status_Approval");
  var colKeterangan = ensureColumnExists(sheet, "Keterangan");
  var colWaktuMasuk = ensureColumnExists(sheet, "Waktu_Masuk");

  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var colIDAbsen = headers.indexOf("ID_Absen") + 1;
  var colStatus  = headers.indexOf("Status") + 1;

  var idSet = {};
  idAbsenArray.forEach(function(id) { idSet[String(id).trim()] = true; });

  var timeZone = Session.getScriptTimeZone();
  var nowStr = Utilities.formatDate(new Date(), timeZone, "dd/MM/yyyy HH:mm");
  var nowJam = Utilities.formatDate(new Date(), timeZone, "HH:mm:ss");

  var count = 0;
  for (var i = 1; i < allData.length; i++) {
    var rowId = String(allData[i][colIDAbsen - 1] || "").trim();
    if (!idSet[rowId]) continue;

    var statusLama = String(allData[i][colStatus - 1] || "").trim();

    if (statusLama === "Alpa") {
      sheet.getRange(i + 1, colStatus).setValue("Hadir");
      if (colKeterangan > 0) {
        var ketLama = String(allData[i][colKeterangan - 1] || "").trim();
        var ketBaru = (ketLama ? ketLama + " | " : "") + "✅ Approved massal oleh guru pada " + nowStr;
        sheet.getRange(i + 1, colKeterangan).setValue(ketBaru);
      }
      if (colWaktuMasuk > 0 && !String(allData[i][colWaktuMasuk - 1] || "").trim()) {
        sheet.getRange(i + 1, colWaktuMasuk).setValue(nowJam);
      }
    }

    sheet.getRange(i + 1, colApproval).setValue("Approved");
    count++;
  }

  return "✅ " + count + " absensi berhasil disetujui!";
}

// ⭐ BATCH REJECT
function rejectAbsensiBatch(idAbsenArray) {
  if (!Array.isArray(idAbsenArray) || idAbsenArray.length === 0) {
    throw new Error("Tidak ada data yang dipilih!");
  }

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(S_ABSENSI);
  if (!sheet) throw new Error("Sheet Absensi tidak ditemukan!");

  var colApproval = ensureColumnExists(sheet, "Status_Approval");
  var allData = sheet.getDataRange().getValues();
  var headers = allData[0];
  var colIDAbsen = headers.indexOf("ID_Absen") + 1;
  var colStatus  = headers.indexOf("Status") + 1;

  var idSet = {};
  idAbsenArray.forEach(function(id) { idSet[String(id).trim()] = true; });

  var rowsToDelete = [];
  var rowsToUpdate = [];

  for (var i = 1; i < allData.length; i++) {
    var rowId = String(allData[i][colIDAbsen - 1] || "").trim();
    if (!idSet[rowId]) continue;

    var statusLama = String(allData[i][colStatus - 1] || "").trim();

    if (statusLama === "Alpa") {
      rowsToDelete.push(i + 1);
    } else {
      rowsToUpdate.push(i + 1);
    }
  }

  rowsToDelete.sort(function(a, b) { return b - a; });
  rowsToDelete.forEach(function(r) { sheet.deleteRow(r); });

  rowsToUpdate.forEach(function(r) {
    sheet.getRange(r, colStatus).setValue("Alpa");
    sheet.getRange(r, colApproval).setValue("Rejected");
  });

  var total = rowsToDelete.length + rowsToUpdate.length;
  return "❌ " + total + " absensi ditolak (auto-Alpa dihapus, absen mandiri jadi Alpa).";
}
