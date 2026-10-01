/* =========================================================
   LOCAL STORAGE & ROSTER DATA MANAGEMENT (BLUE ARCHIVE SIK)
   ========================================================= */

window.SIKData = window.SIKData || {};

(function (exports) {
  "use strict";

  var STORAGE_KEY = "sik-roster-ba-v1";
  var DEFAULT_STUDENTS = [
    { nim: "2401001", nama: "Shiroko Sunaookami", nilai: 88 },
    { nim: "2401002", nama: "Hoshino Takanashi", nilai: 95 },
    { nim: "2401003", nama: "Yuuka Hayase", nilai: 100 },
    { nim: "2401004", nama: "Hina Sorasaki", nilai: 98 },
    { nim: "2401005", nama: "Aris Tendou", nilai: 85 },
    { nim: "2401006", nama: "Mika Misono", nilai: 92 },
    { nim: "2401007", nama: "Aru Rikuhachima", nilai: 68 },
    { nim: "2401008", nama: "Koharu Shimoe", nilai: 74 },
    { nim: "2401009", nama: "Asuna Ichinose", nilai: 82 },
    { nim: "2401010", nama: "Azusa Shirasu", nilai: 90 }
  ];

  var state = { students: [], appliedSort: null };

  function loadState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.students) && parsed.students.length > 0) {
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

  function resetState() {
    state.students = DEFAULT_STUDENTS.slice();
    state.appliedSort = null;
    saveState();
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  exports.state = state;
  exports.DEFAULT_STUDENTS = DEFAULT_STUDENTS;
  exports.loadState = loadState;
  exports.saveState = saveState;
  exports.resetState = resetState;
  exports.escapeHtml = escapeHtml;

})(window.SIKData);