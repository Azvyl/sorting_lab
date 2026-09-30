(function () {
  "use strict";

  var SIKData = window.SIKData;
  var state = SIKData.state;
  var escapeHtml = SIKData.escapeHtml;

  /* ================= ROSTER CRUD UI ================= */
  var rosterBody = document.getElementById("rosterBody");
  var rosterCount = document.getElementById("rosterCount");
  var appliedTagWrap = document.getElementById("appliedTagWrap");

  function renderRoster() {
    rosterBody.innerHTML = "";
    if (state.students.length === 0) {
      var tr = document.createElement("tr");
      tr.className = "empty-row";
      tr.innerHTML = '<td colspan="5">Belum ada data mahasiswa. Tambahkan dari form di atas.</td>';
      rosterBody.appendChild(tr);
    } else {
      state.students.forEach(function (s, idx) {
        var tr = document.createElement("tr");
        tr.innerHTML =
          '<td>' + (idx + 1) + '</td>' +
          '<td class="nim">' + escapeHtml(s.nim) + '</td>' +
          '<td>' + escapeHtml(s.nama) + '</td>' +
          '<td class="nilai">' + escapeHtml(String(s.nilai)) + '</td>' +
          '<td><button class="del-btn" data-nim="' + escapeHtml(s.nim) + '">Hapus</button></td>';
        rosterBody.appendChild(tr);
      });
    }
    rosterCount.textContent = state.students.length + " mahasiswa";
    appliedTagWrap.innerHTML = state.appliedSort
      ? '<span class="applied-tag">Urutan diterapkan: ' + escapeHtml(state.appliedSort) + '</span>'
      : "";

    Array.prototype.forEach.call(rosterBody.querySelectorAll(".del-btn"), function (btn) {
      btn.addEventListener("click", function () {
        var nim = btn.getAttribute("data-nim");
        state.students = state.students.filter(function (s) { return s.nim !== nim; });
        state.appliedSort = null;
        SIKData.saveState();
        renderRoster();
      });
    });
  }

  var addForm = document.getElementById("addForm");
  var formError = document.getElementById("formError");

  addForm.addEventListener("submit", function (e) {
    e.preventDefault();
    var nim = document.getElementById("inNim").value.trim();
    var nama = document.getElementById("inNama").value.trim();
    var nilaiRaw = document.getElementById("inNilai").value.trim();
    formError.textContent = "";

    if (!nim || !nama || nilaiRaw === "") {
      formError.textContent = "NIM, nama, dan nilai wajib diisi."; return;
    }
    var nilai = Number(nilaiRaw);
    if (isNaN(nilai) || nilai < 0 || nilai > 100) {
      formError.textContent = "Nilai harus berupa angka 0 - 100."; return;
    }
    if (state.students.some(function (s) { return s.nim === nim; })) {
      formError.textContent = "NIM " + nim + " sudah terdaftar."; return;
    }

    state.students.push({ nim: nim, nama: nama, nilai: nilai });
    state.appliedSort = null;
    SIKData.saveState();
    renderRoster();
    addForm.reset();
  });

  /* ================= NAVIGASI VIEW ================= */
  var navButtons = document.querySelectorAll(".cover nav button");
  var views = {
    data: document.getElementById("view-data"),
    sort: document.getElementById("view-sort"),
    compare: document.getElementById("view-compare")
  };

  navButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      pause();
      navButtons.forEach(function (b) { b.classList.remove("active"); });
      btn.classList.add("active");
      Object.keys(views).forEach(function (k) { views[k].classList.remove("active"); });
      views[btn.getAttribute("data-view")].classList.add("active");
    });
  });

  /* ================= LOGIKA PENGURUTAN ================= */
  function cmp(a, b, key, order) {
    var res;
    if (key === "nama") res = a.nama.localeCompare(b.nama, "id");
    else res = a[key] - b[key];
    return order === "desc" ? -res : res;
  }

  var BUBBLE_CODE = [
    "function bubbleSort(data, kunci, arah):",
    "  n ← panjang(data)",
    "  untuk i dari 0 sampai n-2:",
    "    untuk j dari 0 sampai n-i-2:",
    "      jika data[j] > data[j+1]:",
    "        tukar(data[j], data[j+1])",
    "    // posisi n-i-1 sudah terurut",
    "  kembalikan data"
  ];

  var INSERTION_CODE = [
    "function insertionSort(data, kunci, arah):",
    "  n ← panjang(data)",
    "  // data[0] dianggap sudah terurut",
    "  untuk i dari 1 sampai n-1:",
    "    kunci_baris ← data[i]",
    "    j ← i - 1",
    "    selama j ≥ 0 dan data[j] > kunci_baris:",
    "      data[j+1] ← data[j]",
    "      j ← j - 1",
    "    data[j+1] ← kunci_baris",
    "  kembalikan data"
  ];

  function bubbleSortSteps(dataArr, key, order) {
    var arr = dataArr.slice(); var n = arr.length;
    var comparisons = 0, swaps = 0, sortedIdx = [];
    var steps = [];

    function snap(extra) {
      var s = {
        array: arr.slice(), sorted: sortedIdx.slice(), comparisons: comparisons, swaps: swaps,
        compare: [], swap: [], active: null, note: "", line: 0
      };
      Object.assign(s, extra);
      steps.push(s);
    }

    snap({ line: 0, note: "Mulai — bandingkan pasangan elemen bersebelahan dari kiri ke kanan." });
    for (var i = 0; i < n - 1; i++) {
      for (var j = 0; j < n - i - 1; j++) {
        comparisons++;
        var willSwap = cmp(arr[j], arr[j + 1], key, order) > 0;
        snap({
          line: 4, compare: [j, j + 1],
          note: "Bandingkan posisi " + j + " dengan posisi " + (j + 1) + "."
        });
        if (willSwap) {
          var t = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = t; swaps++;
          snap({ line: 5, swap: [j, j + 1], note: "Tukar posisi " + j + " dan " + (j + 1) + "." });
        }
      }
      sortedIdx.push(n - 1 - i);
      snap({ line: 6, sorted: sortedIdx.slice(), note: "Posisi " + (n - 1 - i) + " sudah pasti benar." });
    }
    sortedIdx = arr.map(function (_, idx) { return idx; });
    snap({ line: 7, sorted: sortedIdx.slice(), note: "Selesai — seluruh data terurut." });
    return { steps: steps, comparisons: comparisons, swaps: swaps, result: arr };
  }

  function insertionSortSteps(dataArr, key, order) {
    var arr = dataArr.slice(); var n = arr.length;
    var comparisons = 0, swaps = 0;
    var steps = [];

    function snap(sortedIdx, extra) {
      var s = {
        array: arr.slice(), sorted: sortedIdx, comparisons: comparisons, swaps: swaps,
        compare: [], swap: [], active: null, note: "", line: 0
      };
      Object.assign(s, extra);
      steps.push(s);
    }

    snap([0], { line: 2, note: "Elemen pertama dianggap sudah terurut." });
    for (var i = 1; i < n; i++) {
      var keyVal = arr[i]; var j = i - 1;
      var sortedRange = [];
      for (var k = 0; k < i; k++) sortedRange.push(k);
      snap(sortedRange, { line: 4, active: i, note: "Ambil kunci dari posisi " + i + "." });
      while (j >= 0) {
        comparisons++;
        var cond = cmp(arr[j], keyVal, key, order) > 0;
        snap(sortedRange, { line: 6, active: i, compare: [j], note: "Bandingkan posisi " + j + " dengan kunci." });
        if (!cond) break;
        arr[j + 1] = arr[j]; swaps++;
        snap(sortedRange, { line: 7, active: i, swap: [j + 1], note: "Geser data dari posisi " + j + " ke " + (j + 1) + "." });
        j--;
      }
      arr[j + 1] = keyVal;
      var newSorted = [];
      for (var m = 0; m <= i; m++) newSorted.push(m);
      snap(newSorted, { line: 9, swap: [j + 1], note: "Sisipkan kunci di posisi " + (j + 1) + "." });
    }
    var full = []; for (var p = 0; p < n; p++) full.push(p);
    snap(full, { line: 10, note: "Selesai — seluruh data terurut." });
    return { steps: steps, comparisons: comparisons, swaps: swaps, result: arr };
  }

  /* ================= PANEL VISUALISASI RACE ================= */
  var selKey = document.getElementById("selKey");
  var selOrder = document.getElementById("selOrder");
  var btnRun = document.getElementById("btnRun");
  var chipStatus = document.getElementById("chipStatus");
  var noteBar = document.getElementById("noteBar");
  var progressEl = document.getElementById("progressEl");
  var btnPrev = document.getElementById("btnPrev");
  var btnNext = document.getElementById("btnNext");
  var btnPlay = document.getElementById("btnPlay");
  var btnReset = document.getElementById("btnReset");
  var speedInput = document.getElementById("speedInput");
  var btnApply = document.getElementById("btnApply");
  var applyNote = document.getElementById("applyNote");
  var winnerBanner = document.getElementById("winnerBanner");

  var cols = {
    bubble: {
      code: document.getElementById("codeBoxBubble"),
      slotsBox: document.getElementById("slotsBoxBubble"),
      colEl: document.getElementById("colBubble"),
      finBadge: document.getElementById("finBubble"),
      crown: document.getElementById("crownBubble"),
      statComp: document.getElementById("statCompBubble"),
      statSwap: document.getElementById("statSwapBubble"),
      slotEls: [], run: null, label: "Bubble Sort"
    },
    insertion: {
      code: document.getElementById("codeBoxInsertion"),
      slotsBox: document.getElementById("slotsBoxInsertion"),
      colEl: document.getElementById("colInsertion"),
      finBadge: document.getElementById("finInsertion"),
      crown: document.getElementById("crownInsertion"),
      statComp: document.getElementById("statCompInsertion"),
      statSwap: document.getElementById("statSwapInsertion"),
      slotEls: [], run: null, label: "Insertion Sort"
    }
  };

  var masterIndex = 0, maxLen = 0, playing = false, playTimer = null;
  var lastResult = null, lastLabel = "";

  function renderCode(col, lines) {
    col.code.innerHTML = "";
    lines.forEach(function (text, i) {
      var row = document.createElement("div");
      row.className = "line"; row.dataset.line = i;
      row.innerHTML = '<span class="ln">' + (i + 1) + '</span><span>' + escapeHtml(text) + '</span>';
      col.code.appendChild(row);
    });
  }

  function highlightLine(col, idx) {
    var rows = col.code.children;
    for (var i = 0; i < rows.length; i++) { rows[i].classList.toggle("hl", i === idx); }
    if (rows[idx]) rows[idx].scrollIntoView({ block: "nearest" });
  }

  var TAG_TEXT = { compare: "dibandingkan", swap: "geser/tukar", active: "kunci", sorted: "terurut" };

  function ensureSlots(col, n) {
    col.slotsBox.innerHTML = ""; col.slotEls = [];
    for (var i = 0; i < n; i++) {
      var row = document.createElement("div");
      row.className = "slot-row";
      row.innerHTML =
        '<span class="pos">#' + i + '</span>' +
        '<span class="nim"></span><span class="nama"></span><span class="nilai"></span>' +
        '<span class="tag"></span>';
      col.slotsBox.appendChild(row);
      col.slotEls.push({
        row: row,
        nim: row.querySelector(".nim"),
        nama: row.querySelector(".nama"),
        nilai: row.querySelector(".nilai"),
        tag: row.querySelector(".tag")
      });
    }
  }

  function renderColumnStep(col, step) {
    for (var i = 0; i < step.array.length; i++) {
      var stu = step.array[i]; var el = col.slotEls[i];
      el.nim.textContent = stu.nim;
      el.nama.textContent = stu.nama;
      el.nilai.textContent = stu.nilai;
      var st = "";
      if (step.sorted.indexOf(i) !== -1) st = "sorted";
      if (step.compare.indexOf(i) !== -1) st = "compare";
      if (step.active === i) st = "active";
      if (step.swap.indexOf(i) !== -1) st = "swap";
      el.row.dataset.state = st;
      el.tag.textContent = st ? TAG_TEXT[st] : "";
    }
    highlightLine(col, step.line);
    col.statComp.textContent = step.comparisons;
    col.statSwap.textContent = step.swaps;
  }

  function render() {
    var stepB = cols.bubble.run.steps[Math.min(masterIndex, cols.bubble.run.steps.length - 1)];
    var stepI = cols.insertion.run.steps[Math.min(masterIndex, cols.insertion.run.steps.length - 1)];
    renderColumnStep(cols.bubble, stepB);
    renderColumnStep(cols.insertion, stepI);

    var bubbleDone = masterIndex >= cols.bubble.run.steps.length - 1;
    var insertionDone = masterIndex >= cols.insertion.run.steps.length - 1;

    cols.bubble.finBadge.classList.toggle("show", bubbleDone);
    cols.insertion.finBadge.classList.toggle("show", insertionDone);
    cols.bubble.finBadge.textContent = "selesai di langkah " + cols.bubble.run.steps.length;
    cols.insertion.finBadge.textContent = "selesai di langkah " + cols.insertion.run.steps.length;

    noteBar.innerHTML =
      '<div><b>Bubble Sort:</b> ' + stepB.note + '</div>' +
      '<div><b>Insertion Sort:</b> ' + stepI.note + '</div>';

    progressEl.textContent = (masterIndex + 1) + " / " + maxLen;
    btnPrev.disabled = masterIndex <= 0;
    btnNext.disabled = masterIndex >= maxLen - 1;
    btnApply.disabled = false;

    var atEnd = masterIndex >= maxLen - 1;
    cols.bubble.colEl.classList.remove("winner");
    cols.insertion.colEl.classList.remove("winner");
    cols.bubble.crown.classList.remove("show");
    cols.insertion.crown.classList.remove("show");

    if (atEnd) {
      showWinnerBanner();
    } else {
      winnerBanner.classList.remove("show");
    }
  }

  function showWinnerBanner() {
    var opsB = cols.bubble.run.comparisons + cols.bubble.run.swaps;
    var opsI = cols.insertion.run.comparisons + cols.insertion.run.swaps;
    var stepsB = cols.bubble.run.steps.length;
    var stepsI = cols.insertion.run.steps.length;
    var html;

    if (opsB === opsI) {
      html = "🏁 <b>Sama cepat</b> — Bubble Sort dan Insertion Sort sama-sama melakukan " + opsB + " operasi (perbandingan + tukar/geser) untuk data ini.";
    } else {
      var winnerCol = opsI < opsB ? cols.insertion : cols.bubble;
      var loserCol = opsI < opsB ? cols.bubble : cols.insertion;
      var opsWin = Math.min(opsB, opsI), opsLose = Math.max(opsB, opsI);
      winnerCol.colEl.classList.add("winner");
      winnerCol.crown.classList.add("show");
      html = "🏆 <b>" + winnerCol.label + " lebih cepat</b> pada data ini — " + opsWin + " operasi, dibanding " +
        loserCol.label + " yang butuh " + opsLose + " operasi (langkah animasi: Bubble " + stepsB + ", Insertion " + stepsI + ").";
    }
    winnerBanner.innerHTML = html;
    winnerBanner.classList.add("show");
  }

  function goTo(idx) {
    masterIndex = Math.max(0, Math.min(maxLen - 1, idx));
    render();
  }

  function stepForward() {
    if (masterIndex >= maxLen - 1) { pause(); return false; }
    masterIndex++; render(); return true;
  }

  function stepBack() { if (masterIndex > 0) { masterIndex--; render(); } }

  function tick() {
    if (!playing) return;
    var ok = stepForward();
    if (!ok) return;
    playTimer = setTimeout(tick, Number(speedInput.value));
  }

  function play() {
    if (!cols.bubble.run) return;
    if (masterIndex >= maxLen - 1) masterIndex = 0;
    playing = true; btnPlay.textContent = "⏸ Jeda";
    clearTimeout(playTimer);
    playTimer = setTimeout(tick, Number(speedInput.value));
  }

  function pause() {
    playing = false; btnPlay.textContent = "▶ Putar"; clearTimeout(playTimer);
  }

  function runVisualization() {
    pause();
    if (state.students.length < 2) {
      chipStatus.textContent = "Butuh minimal 2 mahasiswa";
      return;
    }
    var key = selKey.value, order = selOrder.value;
    cols.bubble.run = bubbleSortSteps(state.students, key, order);
    cols.insertion.run = insertionSortSteps(state.students, key, order);
    maxLen = Math.max(cols.bubble.run.steps.length, cols.insertion.run.steps.length);
    lastResult = cols.bubble.run.result;
    var keyLabel = key === "nilai" ? "Nilai" : (key === "nama" ? "Nama" : "NIM");
    var orderLabel = order === "asc" ? "naik" : "turun";
    lastLabel = keyLabel + " " + orderLabel;

    renderCode(cols.bubble, BUBBLE_CODE);
    renderCode(cols.insertion, INSERTION_CODE);
    ensureSlots(cols.bubble, state.students.length);
    ensureSlots(cols.insertion, state.students.length);
    chipStatus.textContent = "Bubble: " + cols.bubble.run.steps.length + " langkah • Insertion: " + cols.insertion.run.steps.length + " langkah";
    applyNote.textContent = "";
    goTo(0);
  }

  btnRun.addEventListener("click", runVisualization);
  btnPlay.addEventListener("click", function () { playing ? pause() : play(); });
  btnNext.addEventListener("click", function () { pause(); stepForward(); });
  btnPrev.addEventListener("click", function () { pause(); stepBack(); });
  btnReset.addEventListener("click", function () { pause(); if (cols.bubble.run) goTo(0); });
  btnApply.addEventListener("click", function () {
    if (!lastResult) return;
    state.students = lastResult.map(function (s) { return { nim: s.nim, nama: s.nama, nilai: s.nilai }; });
    state.appliedSort = lastLabel;
    SIKData.saveState();
    renderRoster();
    applyNote.textContent = "Urutan diterapkan ke Data Mahasiswa (" + lastLabel + ").";
  });

  /* ================= VIEW BANDINGKAN ================= */
  var cmpKey = document.getElementById("cmpKey");
  var cmpOrder = document.getElementById("cmpOrder");
  var btnCompareRun = document.getElementById("btnCompareRun");
  var resultGrid = document.getElementById("resultGrid");
  var resultVerdict = document.getElementById("resultVerdict");
  var cardBubbleResult = document.getElementById("cardBubbleResult");
  var cardInsertionResult = document.getElementById("cardInsertionResult");
  var tagBubbleWin = document.getElementById("tagBubbleWin");
  var tagInsertionWin = document.getElementById("tagInsertionWin");

  btnCompareRun.addEventListener("click", function () {
    if (state.students.length < 2) {
      resultVerdict.textContent = "Butuh minimal 2 mahasiswa untuk membandingkan.";
      resultGrid.style.display = "none";
      return;
    }
    var key = cmpKey.value, order = cmpOrder.value;
    var rb = bubbleSortSteps(state.students, key, order);
    var ri = insertionSortSteps(state.students, key, order);
    var totalB = rb.comparisons + rb.swaps;
    var totalI = ri.comparisons + ri.swaps;

    resultGrid.style.display = "grid";
    var maxVal = Math.max(rb.comparisons, rb.swaps, totalB, ri.comparisons, ri.swaps, totalI, 1);

    document.getElementById("bNumComp").textContent = rb.comparisons;
    document.getElementById("bNumSwap").textContent = rb.swaps;
    document.getElementById("bNumTotal").textContent = totalB;
    document.getElementById("iNumComp").textContent = ri.comparisons;
    document.getElementById("iNumSwap").textContent = ri.swaps;
    document.getElementById("iNumTotal").textContent = totalI;

    document.getElementById("bBarComp").style.width = (rb.comparisons / maxVal * 100) + "%";
    document.getElementById("bBarSwap").style.width = (rb.swaps / maxVal * 100) + "%";
    document.getElementById("bBarTotal").style.width = (totalB / maxVal * 100) + "%";
    document.getElementById("iBarComp").style.width = (ri.comparisons / maxVal * 100) + "%";
    document.getElementById("iBarSwap").style.width = (ri.swaps / maxVal * 100) + "%";
    document.getElementById("iBarTotal").style.width = (totalI / maxVal * 100) + "%";

    cardBubbleResult.classList.remove("winner-card");
    cardInsertionResult.classList.remove("winner-card");
    tagBubbleWin.classList.remove("show");
    tagInsertionWin.classList.remove("show");

    if (totalB === totalI) {
      resultVerdict.innerHTML = "🏁 Untuk " + state.students.length + " data mahasiswa saat ini, <b>kedua algoritma sama cepat</b>: masing-masing melakukan " + totalB + " total operasi (perbandingan + tukar/geser).";
    } else {
      var winnerIsInsertion = totalI < totalB;
      var winCard = winnerIsInsertion ? cardInsertionResult : cardBubbleResult;
      var winTag = winnerIsInsertion ? tagInsertionWin : tagBubbleWin;
      var winName = winnerIsInsertion ? "Insertion Sort" : "Bubble Sort";
      var opsWin = Math.min(totalB, totalI), opsLose = Math.max(totalB, totalI);

      winCard.classList.add("winner-card");
      winTag.classList.add("show");
      resultVerdict.innerHTML = "🏆 Untuk " + state.students.length + " data mahasiswa saat ini, <b>" + winName + " lebih cepat</b> — hanya " + opsWin + " total operasi, dibanding " + opsLose + " operasi pada algoritma satunya. Hasil ini bisa berbeda tergantung seberapa acak susunan data awal.";
    }
  });

  /* ================= LOCAL THEME TOGGLE ================= */
  var themeToggle = document.getElementById("themeToggle");
  var THEME_KEY = "sik-theme";

  function systemPrefersDark() { return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches); }
  function isDarkActive() {
    var attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark") return true;
    if (attr === "light") return false;
    return systemPrefersDark();
  }

  function loadThemePref() { try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; } }
  function saveThemePref(t) { try { localStorage.setItem(THEME_KEY, t); } catch (e) { } }

  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") document.documentElement.setAttribute("data-theme", theme);
    else document.documentElement.removeAttribute("data-theme");
    themeToggle.textContent = isDarkActive() ? "☀️" : "🌙";
  }

  themeToggle.addEventListener("click", function () {
    var next = isDarkActive() ? "light" : "dark";
    applyTheme(next); saveThemePref(next);
  });

  applyTheme(loadThemePref());

  /* ================= INIT ================= */
  SIKData.loadState();
  renderRoster();
  renderCode(cols.bubble, BUBBLE_CODE);
  renderCode(cols.insertion, INSERTION_CODE);
})();