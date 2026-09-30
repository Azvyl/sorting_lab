/* =========================================================
   LOCAL STORAGE & ROSTER DATA MANAGEMENT
   ========================================================= */

window.SIKData = window.SIKData || {};

(function (exports) {
  "use strict";

  var STORAGE_KEY = "sik-roster-v2";
  var DEFAULT_STUDENTS = [
    { nim: "2401001", nama: "Rangga Saputra", nilai: 78 },
    { nim: "2401002", nama: "Ayu Lestari", nilai: 92 },
    { nim: "2401003", nama: "Budi Santoso", nilai: 65 },
    { nim: "2401004", nama: "Citra Dewi Pratiwi", nilai: 88 },
    { nim: "2401005", nama: "Dimas Prakoso", nilai: 71 },
    { nim: "2401006", nama: "Elang Nugraha", nilai: 83 },
    { nim: "2401007", nama: "Fitriani Handayani", nilai: 59 },
    { nim: "2401008", nama: "Gilang Ramadhan", nilai: 95 },
  ];

  var state = { students: [], appliedSort: null };

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.students)) {
          state.students = parsed.students;
          state.appliedSort = parsed.appliedSort || null;
          return;
        }
      }
    } catch (e) { /* fallback jika error */ }
    state.students = DEFAULT_STUDENTS.slice();
    state.appliedSort = null;
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { }
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  exports.state = state;
  exports.loadState = loadState;
  exports.saveState = saveState;
  exports.escapeHtml = escapeHtml;

})(window.SIKData);