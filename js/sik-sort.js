(function () {
  "use strict";

  var SIKData = window.SIKData;
  var state = SIKData.state;
  var escapeHtml = SIKData.escapeHtml;

  /* ================= ROSTER CRUD UI ================= */
  var rosterBody = document.getElementById("rosterBody");
  var rosterCount = document.getElementById("rosterCount");
  var appliedTagWrap = document.getElementById("appliedTagWrap");
  var btnResetDefault = document.getElementById("btnResetDefault");

  function renderRoster() {
    if (!rosterBody) return;
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
    if (rosterCount) rosterCount.textContent = state.students.length + " mahasiswa";
    if (appliedTagWrap) {
      appliedTagWrap.innerHTML = state.appliedSort
        ? '<span class="applied-tag">Urutan diterapkan: ' + escapeHtml(state.appliedSort) + '</span>'
        : "";
    }

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

  if (btnResetDefault) {
    btnResetDefault.addEventListener("click", function () {
      if (confirm("Reset daftar mahasiswa ke data karakter Blue Archive bawaan?")) {
        SIKData.resetState();
        renderRoster();
      }
    });
  }

  var addForm = document.getElementById("addForm");
  var formError = document.getElementById("formError");

  if (addForm) {
    addForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var nim = document.getElementById("inNim").value.trim();
      var nama = document.getElementById("inNama").value.trim();
      var nilaiRaw = document.getElementById("inNilai").value.trim();
      if (formError) formError.textContent = "";

      if (!nim || !nama || nilaiRaw === "") {
        if (formError) formError.textContent = "NIM, nama, dan nilai wajib diisi."; return;
      }
      var nilai = Number(nilaiRaw);
      if (isNaN(nilai) || nilai < 0 || nilai > 100) {
        if (formError) formError.textContent = "Nilai harus berupa angka 0 - 100."; return;
      }
      if (state.students.some(function (s) { return s.nim === nim; })) {
        if (formError) formError.textContent = "NIM " + nim + " sudah terdaftar."; return;
      }

      state.students.push({ nim: nim, nama: nama, nilai: nilai });
      state.appliedSort = null;
      SIKData.saveState();
      renderRoster();
      addForm.reset();
    });
  }

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
      Object.keys(views).forEach(function (k) {
        if (views[k]) views[k].classList.remove("active");
      });
      var targetView = views[btn.getAttribute("data-view")];
      if (targetView) targetView.classList.add("active");
    });
  });

  /* ================= LOGIKA PENGURUTAN (STEP GENERATORS) ================= */
  function cmp(a, b, key, order) {
    var res;
    if (key === "nama") res = a.nama.localeCompare(b.nama, "id");
    else res = a[key] - b[key];
    return order === "desc" ? -res : res;
  }

  /* 1. BUBBLE SORT */
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

    snap({ line: 0, note: "Mulai Bubble Sort — bandingkan pasangan elemen bersebelahan dari kiri ke kanan." });
    for (var i = 0; i < n - 1; i++) {
      for (var j = 0; j < n - i - 1; j++) {
        comparisons++;
        var willSwap = cmp(arr[j], arr[j + 1], key, order) > 0;
        snap({
          line: 4, compare: [j, j + 1],
          note: "Bandingkan posisi " + j + " (" + escapeHtml(arr[j][key]) + ") dengan posisi " + (j + 1) + " (" + escapeHtml(arr[j + 1][key]) + ")."
        });
        if (willSwap) {
          var t = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = t; swaps++;
          snap({ line: 5, swap: [j, j + 1], note: "Tukar posisi " + j + " dan " + (j + 1) + "." });
        }
      }
      sortedIdx.push(n - 1 - i);
      snap({ line: 6, sorted: sortedIdx.slice(), note: "Posisi " + (n - 1 - i) + " sudah pasti berada di tempat akhir." });
    }
    sortedIdx = arr.map(function (_, idx) { return idx; });
    snap({ line: 7, sorted: sortedIdx.slice(), note: "Selesai — seluruh data terurut." });
    return { steps: steps, comparisons: comparisons, swaps: swaps, result: arr };
  }

  /* 2. INSERTION SORT */
  function insertionSortSteps(dataArr, key, order) {
    var arr = dataArr.slice(); var n = arr.length;
    var comparisons = 0, swaps = 0;
    var steps = [];

    function snap(sortedIdx, extra) {
      var s = {
        array: arr.slice(), sorted: sortedIdx.slice(), comparisons: comparisons, swaps: swaps,
        compare: [], swap: [], active: null, note: "", line: 0
      };
      Object.assign(s, extra);
      steps.push(s);
    }

    snap([0], { line: 2, note: "Elemen pertama dianggap sudah berada di bagian terurut." });
    for (var i = 1; i < n; i++) {
      var keyVal = arr[i]; var j = i - 1;
      var sortedRange = [];
      for (var k = 0; k < i; k++) sortedRange.push(k);
      snap(sortedRange, { line: 4, active: i, note: "Ambil kunci dari posisi " + i + " (" + escapeHtml(keyVal[key]) + ")." });
      while (j >= 0) {
        comparisons++;
        var cond = cmp(arr[j], keyVal, key, order) > 0;
        snap(sortedRange, { line: 6, active: i, compare: [j], note: "Bandingkan posisi " + j + " (" + escapeHtml(arr[j][key]) + ") dengan kunci." });
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

  /* 3. SELECTION SORT */
  function selectionSortSteps(dataArr, key, order) {
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

    snap({ line: 0, note: "Mulai Selection Sort — cari elemen terekstrem untuk ditempatkan ke posisi awal." });
    for (var i = 0; i < n - 1; i++) {
      var minIdx = i;
      snap({ line: 2, active: i, note: "Mulai i = " + i + ". Anggap sementara posisi " + i + " adalah minimum." });
      for (var j = i + 1; j < n; j++) {
        comparisons++;
        var isBetter = cmp(arr[j], arr[minIdx], key, order) < 0;
        snap({
          line: 4, active: minIdx, compare: [j, minIdx],
          note: "Bandingkan posisi " + j + " (" + escapeHtml(arr[j][key]) + ") dengan minimum sementara di posisi " + minIdx + " (" + escapeHtml(arr[minIdx][key]) + ")."
        });
        if (isBetter) {
          minIdx = j;
          snap({ line: 5, active: minIdx, note: "Ditemukan nilai lebih kecil di posisi " + minIdx + "." });
        }
      }
      if (minIdx !== i) {
        var t = arr[i]; arr[i] = arr[minIdx]; arr[minIdx] = t; swaps++;
        snap({ line: 7, swap: [i, minIdx], note: "Tukar posisi " + i + " dengan minimum di posisi " + minIdx + "." });
      }
      sortedIdx.push(i);
      snap({ line: 8, sorted: sortedIdx.slice(), note: "Posisi " + i + " sudah pasti benar dan terurut." });
    }
    sortedIdx = arr.map(function (_, idx) { return idx; });
    snap({ line: 9, sorted: sortedIdx.slice(), note: "Selesai — seluruh data terurut." });
    return { steps: steps, comparisons: comparisons, swaps: swaps, result: arr };
  }

  /* 4. SHELL SORT */
  function shellSortSteps(dataArr, key, order) {
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

    snap({ line: 0, note: "Mulai Shell Sort — pengurutan berbasis interval gap bertahap." });
    for (var gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
      snap({ line: 2, note: "Gunakan gap interval = " + gap + "." });
      for (var i = gap; i < n; i++) {
        var temp = arr[i];
        var j = i;
        snap({ line: 4, active: i, note: "Ambil data posisi " + i + " (" + escapeHtml(temp[key]) + ") untuk perbandingan gap." });
        while (j >= gap) {
          comparisons++;
          var cond = cmp(arr[j - gap], temp, key, order) > 0;
          snap({ line: 6, active: i, compare: [j - gap, j], note: "Bandingkan jarak gap " + gap + ": posisi " + (j - gap) + " dengan " + j + "." });
          if (!cond) break;
          arr[j] = arr[j - gap]; swaps++;
          snap({ line: 7, swap: [j, j - gap], note: "Geser posisi " + (j - gap) + " ke " + j + "." });
          j -= gap;
        }
        arr[j] = temp;
        snap({ line: 9, swap: [j], note: "Tempatkan data ke posisi " + j + "." });
      }
    }
    sortedIdx = arr.map(function (_, idx) { return idx; });
    snap({ line: 10, sorted: sortedIdx.slice(), note: "Selesai — seluruh data terurut." });
    return { steps: steps, comparisons: comparisons, swaps: swaps, result: arr };
  }

  /* ALGORITHM REGISTRY */
  var ALGO_DEFS = {
    bubble: {
      name: "Bubble Sort",
      swapLabel: "Tukar",
      code: [
        "function bubbleSort(data, kunci, arah):",
        "  n ← panjang(data)",
        "  untuk i dari 0 sampai n-2:",
        "    untuk j dari 0 sampai n-i-2:",
        "      jika data[j] > data[j+1]:",
        "        tukar(data[j], data[j+1])",
        "    // posisi n-i-1 sudah terurut",
        "  kembalikan data"
      ],
      run: bubbleSortSteps
    },
    insertion: {
      name: "Insertion Sort",
      swapLabel: "Geser",
      code: [
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
      ],
      run: insertionSortSteps
    },
    selection: {
      name: "Selection Sort",
      swapLabel: "Tukar",
      code: [
        "function selectionSort(data, kunci, arah):",
        "  n ← panjang(data)",
        "  untuk i dari 0 sampai n-2:",
        "    idx_min ← i",
        "    untuk j dari i+1 sampai n-1:",
        "      jika data[j] < data[idx_min]:",
        "        idx_min ← j",
        "    jika idx_min ≠ i:",
        "      tukar(data[i], data[idx_min])",
        "    // posisi i sudah terurut",
        "  kembalikan data"
      ],
      run: selectionSortSteps
    },
    shell: {
      name: "Shell Sort",
      swapLabel: "Geser",
      code: [
        "function shellSort(data, kunci, arah):",
        "  n ← panjang(data)",
        "  gap ← ⌊n / 2⌋",
        "  selama gap > 0:",
        "    untuk i dari gap sampai n-1:",
        "      temp ← data[i]",
        "      j ← i",
        "      selama j ≥ gap dan data[j-gap] > temp:",
        "        data[j] ← data[j-gap]",
        "        j ← j - gap",
        "      data[j] ← temp",
        "    gap ← ⌊gap / 2⌋",
        "  kembalikan data"
      ],
      run: shellSortSteps
    }
  };

  /* ================= PANEL VISUALISASI RACE ================= */
  var selKey = document.getElementById("selKey");
  var selOrder = document.getElementById("selOrder");
  var selAlgo1 = document.getElementById("selAlgo1");
  var selAlgo2 = document.getElementById("selAlgo2");
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

  var col1 = {
    key: "bubble",
    nameEl: document.getElementById("nameCol1"),
    code: document.getElementById("codeBox1"),
    slotsBox: document.getElementById("slotsBox1"),
    colEl: document.getElementById("col1"),
    finBadge: document.getElementById("fin1"),
    crown: document.getElementById("crown1"),
    statComp: document.getElementById("statComp1"),
    statSwap: document.getElementById("statSwap1"),
    lblSwap: document.getElementById("lblSwap1"),
    slotEls: [], run: null, label: "Bubble Sort"
  };

  var col2 = {
    key: "insertion",
    nameEl: document.getElementById("nameCol2"),
    code: document.getElementById("codeBox2"),
    slotsBox: document.getElementById("slotsBox2"),
    colEl: document.getElementById("col2"),
    finBadge: document.getElementById("fin2"),
    crown: document.getElementById("crown2"),
    statComp: document.getElementById("statComp2"),
    statSwap: document.getElementById("statSwap2"),
    lblSwap: document.getElementById("lblSwap2"),
    slotEls: [], run: null, label: "Insertion Sort"
  };

  var masterIndex = 0, maxLen = 0, playing = false, playTimer = null;
  var lastResult = null, lastLabel = "";

  function getSikDelay() {
    if (!speedInput) return 400;
    var min = Number(speedInput.min) || 200;
    var max = Number(speedInput.max) || 1500;
    return (max + min) - Number(speedInput.value);
  }

  function renderCode(col, lines) {
    if (!col.code) return;
    col.code.innerHTML = "";
    lines.forEach(function (text, i) {
      var row = document.createElement("div");
      row.className = "line"; row.dataset.line = i;
      row.innerHTML = '<span class="ln">' + (i + 1) + '</span><span>' + escapeHtml(text) + '</span>';
      col.code.appendChild(row);
    });
  }

  function highlightLine(col, lineIdx) {
    if (!col.code) return;
    var rows = col.code.children;
    for (var i = 0; i < rows.length; i++) {
      rows[i].classList.toggle("hl", i === lineIdx);
    }
  }

  function ensureSlots(col, count) {
    if (!col.slotsBox) return;
    col.slotsBox.innerHTML = "";
    col.slotEls = [];
    for (var i = 0; i < count; i++) {
      var row = document.createElement("div");
      row.className = "slot-row";
      row.innerHTML =
        '<span class="pos">' + (i + 1) + '</span>' +
        '<span class="nim"></span>' +
        '<span class="nama"></span>' +
        '<span class="nilai"></span>' +
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

  function renderStep(col, step) {
    if (!step || !col.slotEls.length) return;
    var n = step.array.length;
    for (var i = 0; i < n; i++) {
      var s = step.array[i];
      var el = col.slotEls[i];
      if (!el) continue;
      el.nim.textContent = s.nim;
      el.nama.textContent = s.nama;
      el.nilai.textContent = s.nilai;

      var stateAttr = "";
      var tagText = "";
      if (step.sorted && step.sorted.indexOf(i) !== -1) {
        stateAttr = "sorted"; tagText = "OK";
      }
      if (step.compare && step.compare.indexOf(i) !== -1) {
        stateAttr = "compare"; tagText = "CMP";
      }
      if (step.swap && step.swap.indexOf(i) !== -1) {
        stateAttr = "swap"; tagText = col.key === "insertion" || col.key === "shell" ? "SHIFT" : "SWAP";
      }
      if (step.active === i) {
        stateAttr = "active"; tagText = "KEY";
      }
      if (stateAttr) el.row.setAttribute("data-state", stateAttr);
      else el.row.removeAttribute("data-state");
      el.tag.textContent = tagText;
    }
    highlightLine(col, step.line);
    if (col.statComp) col.statComp.textContent = step.comparisons;
    if (col.statSwap) col.statSwap.textContent = step.swaps;
  }

  function updateWinnerUI() {
    if (!col1.run || !col2.run) return;
    var done1 = masterIndex >= col1.run.steps.length - 1;
    var done2 = masterIndex >= col2.run.steps.length - 1;

    if (col1.finBadge) col1.finBadge.classList.toggle("show", done1);
    if (col2.finBadge) col2.finBadge.classList.toggle("show", done2);

    var fullyDone = masterIndex >= maxLen - 1;
    if (fullyDone) {
      var ops1 = col1.run.comparisons + col1.run.swaps;
      var ops2 = col2.run.comparisons + col2.run.swaps;
      if (ops1 < ops2) {
        if (col1.crown) col1.crown.classList.add("show");
        if (col1.colEl) col1.colEl.classList.add("winner");
        if (winnerBanner) {
          winnerBanner.innerHTML = "🏆 <b>" + escapeHtml(col1.label) + " MENANG!</b> Selesai dalam " + col1.run.steps.length + " langkah (" + ops1 + " total operasi), lebih hemat daripada " + escapeHtml(col2.label) + " (" + ops2 + " operasi).";
        }
      } else if (ops2 < ops1) {
        if (col2.crown) col2.crown.classList.add("show");
        if (col2.colEl) col2.colEl.classList.add("winner");
        if (winnerBanner) {
          winnerBanner.innerHTML = "🏆 <b>" + escapeHtml(col2.label) + " MENANG!</b> Selesai dalam " + col2.run.steps.length + " langkah (" + ops2 + " total operasi), lebih hemat daripada " + escapeHtml(col1.label) + " (" + ops1 + " operasi).";
        }
      } else {
        if (winnerBanner) {
          winnerBanner.innerHTML = "🏁 <b>HASIL IMBANG!</b> Kedua algoritma selesai dengan efisiensi yang sama (" + ops1 + " total operasi).";
        }
      }
      if (winnerBanner) winnerBanner.classList.add("show");
      if (btnApply) btnApply.disabled = false;
    } else {
      if (col1.crown) col1.crown.classList.remove("show");
      if (col2.crown) col2.crown.classList.remove("show");
      if (col1.colEl) col1.colEl.classList.remove("winner");
      if (col2.colEl) col2.colEl.classList.remove("winner");
      if (winnerBanner) winnerBanner.classList.remove("show");
      if (btnApply) btnApply.disabled = true;
    }
  }

  function goTo(idx) {
    if (!col1.run || !col2.run) return;
    masterIndex = Math.max(0, Math.min(maxLen - 1, idx));
    var s1 = col1.run.steps[Math.min(masterIndex, col1.run.steps.length - 1)];
    var s2 = col2.run.steps[Math.min(masterIndex, col2.run.steps.length - 1)];
    renderStep(col1, s1);
    renderStep(col2, s2);

    if (noteBar) {
      noteBar.innerHTML =
        "<div><b>" + escapeHtml(col1.label) + ":</b> " + (s1 ? s1.note : "") + "</div>" +
        "<div><b>" + escapeHtml(col2.label) + ":</b> " + (s2 ? s2.note : "") + "</div>";
    }
    if (progressEl) progressEl.textContent = (masterIndex + 1) + " / " + maxLen;
    if (btnPrev) btnPrev.disabled = masterIndex <= 0;
    if (btnNext) btnNext.disabled = masterIndex >= maxLen - 1;
    updateWinnerUI();
  }

  function stepForward() {
    if (masterIndex >= maxLen - 1) { pause(); return false; }
    masterIndex++;
    goTo(masterIndex);
    return true;
  }

  function stepBack() {
    if (masterIndex <= 0) return;
    masterIndex--;
    goTo(masterIndex);
  }

  function tick() {
    if (!playing) return;
    var ok = stepForward();
    if (!ok) return;
    playTimer = setTimeout(tick, getSikDelay());
  }

  function play() {
    if (masterIndex >= maxLen - 1) masterIndex = 0;
    playing = true;
    if (btnPlay) btnPlay.textContent = "⏸ JEDA";
    clearTimeout(playTimer);
    playTimer = setTimeout(tick, getSikDelay());
  }

  function pause() {
    playing = false;
    if (btnPlay) btnPlay.textContent = "▶ PUTAR";
    clearTimeout(playTimer);
  }

  function setupCol(col, algoKey, nameEl, lblSwap) {
    var def = ALGO_DEFS[algoKey] || ALGO_DEFS.bubble;
    col.key = algoKey;
    col.label = def.name;
    if (nameEl) nameEl.textContent = def.name;
    if (lblSwap) lblSwap.textContent = def.swapLabel;
    renderCode(col, def.code);
  }

  function runVisualization() {
    pause();
    if (state.students.length < 2) {
      if (chipStatus) chipStatus.textContent = "Butuh minimal 2 mahasiswa";
      return;
    }
    var key = selKey.value, order = selOrder.value;
    var a1 = selAlgo1 ? selAlgo1.value : "bubble";
    var a2 = selAlgo2 ? selAlgo2.value : "insertion";

    setupCol(col1, a1, col1.nameEl, col1.lblSwap);
    setupCol(col2, a2, col2.nameEl, col2.lblSwap);

    col1.run = ALGO_DEFS[a1].run(state.students, key, order);
    col2.run = ALGO_DEFS[a2].run(state.students, key, order);

    maxLen = Math.max(col1.run.steps.length, col2.run.steps.length);
    lastResult = col1.run.result;

    var keyLabel = key === "nilai" ? "Nilai" : (key === "nama" ? "Nama" : "NIM");
    var orderLabel = order === "asc" ? "naik" : "turun";
    lastLabel = keyLabel + " " + orderLabel;

    ensureSlots(col1, state.students.length);
    ensureSlots(col2, state.students.length);

    if (chipStatus) {
      chipStatus.textContent = col1.label + ": " + col1.run.steps.length + " langkah • " + col2.label + ": " + col2.run.steps.length + " langkah";
    }
    if (applyNote) applyNote.textContent = "";
    goTo(0);
  }

  if (btnRun) btnRun.addEventListener("click", runVisualization);
  if (btnPlay) btnPlay.addEventListener("click", function () { playing ? pause() : play(); });
  if (btnNext) btnNext.addEventListener("click", function () { pause(); stepForward(); });
  if (btnPrev) btnPrev.addEventListener("click", function () { pause(); stepBack(); });
  if (btnReset) btnReset.addEventListener("click", function () { pause(); if (col1.run) goTo(0); });
  if (speedInput) {
    speedInput.addEventListener("input", function () {
      if (playing) {
        clearTimeout(playTimer);
        playTimer = setTimeout(tick, getSikDelay());
      }
    });
  }

  if (btnApply) {
    btnApply.addEventListener("click", function () {
      if (!lastResult) return;
      state.students = lastResult.map(function (s) { return { nim: s.nim, nama: s.nama, nilai: s.nilai }; });
      state.appliedSort = lastLabel;
      SIKData.saveState();
      renderRoster();
      if (applyNote) applyNote.textContent = "Urutan berhasil diterapkan ke Data Mahasiswa (" + lastLabel + ").";
    });
  }

  /* ================= VIEW BANDINGKAN (4 ALGORITMA) ================= */
  var cmpKey = document.getElementById("cmpKey");
  var cmpOrder = document.getElementById("cmpOrder");
  var btnCompareRun = document.getElementById("btnCompareRun");
  var resultGrid = document.getElementById("resultGrid");
  var resultVerdict = document.getElementById("resultVerdict");

  var compareCards = {
    bubble: {
      card: document.getElementById("cardBubbleResult"),
      tag: document.getElementById("tagBubbleWin"),
      barComp: document.getElementById("bBarComp"),
      barSwap: document.getElementById("bBarSwap"),
      barTotal: document.getElementById("bBarTotal"),
      numComp: document.getElementById("bNumComp"),
      numSwap: document.getElementById("bNumSwap"),
      numTotal: document.getElementById("bNumTotal"),
      name: "Bubble Sort"
    },
    insertion: {
      card: document.getElementById("cardInsertionResult"),
      tag: document.getElementById("tagInsertionWin"),
      barComp: document.getElementById("iBarComp"),
      barSwap: document.getElementById("iBarSwap"),
      barTotal: document.getElementById("iBarTotal"),
      numComp: document.getElementById("iNumComp"),
      numSwap: document.getElementById("iNumSwap"),
      numTotal: document.getElementById("iNumTotal"),
      name: "Insertion Sort"
    },
    selection: {
      card: document.getElementById("cardSelectionResult"),
      tag: document.getElementById("tagSelectionWin"),
      barComp: document.getElementById("sBarComp"),
      barSwap: document.getElementById("sBarSwap"),
      barTotal: document.getElementById("sBarTotal"),
      numComp: document.getElementById("sNumComp"),
      numSwap: document.getElementById("sNumSwap"),
      numTotal: document.getElementById("sNumTotal"),
      name: "Selection Sort"
    },
    shell: {
      card: document.getElementById("cardShellResult"),
      tag: document.getElementById("tagShellWin"),
      barComp: document.getElementById("shBarComp"),
      barSwap: document.getElementById("shBarSwap"),
      barTotal: document.getElementById("shBarTotal"),
      numComp: document.getElementById("shNumComp"),
      numSwap: document.getElementById("shNumSwap"),
      numTotal: document.getElementById("shNumTotal"),
      name: "Shell Sort"
    }
  };

  if (btnCompareRun) {
    btnCompareRun.addEventListener("click", function () {
      if (state.students.length < 2) {
        if (resultVerdict) resultVerdict.textContent = "Butuh minimal 2 data mahasiswa untuk menjalankan perbandingan.";
        if (resultGrid) resultGrid.style.display = "none";
        return;
      }
      var key = cmpKey.value, order = cmpOrder.value;

      var res = {
        bubble: bubbleSortSteps(state.students, key, order),
        insertion: insertionSortSteps(state.students, key, order),
        selection: selectionSortSteps(state.students, key, order),
        shell: shellSortSteps(state.students, key, order)
      };

      var totals = {
        bubble: res.bubble.comparisons + res.bubble.swaps,
        insertion: res.insertion.comparisons + res.insertion.swaps,
        selection: res.selection.comparisons + res.selection.swaps,
        shell: res.shell.comparisons + res.shell.swaps
      };

      var maxVal = Math.max(
        totals.bubble, totals.insertion, totals.selection, totals.shell,
        res.bubble.comparisons, res.insertion.comparisons, res.selection.comparisons, res.shell.comparisons,
        1
      );

      var minTotal = Math.min(totals.bubble, totals.insertion, totals.selection, totals.shell);
      var winners = [];

      Object.keys(compareCards).forEach(function (k) {
        var c = compareCards[k];
        var r = res[k];
        var tot = totals[k];

        if (c.numComp) c.numComp.textContent = r.comparisons;
        if (c.numSwap) c.numSwap.textContent = r.swaps;
        if (c.numTotal) c.numTotal.textContent = tot;

        if (c.barComp) c.barComp.style.width = ((r.comparisons / maxVal) * 100) + "%";
        if (c.barSwap) c.barSwap.style.width = ((r.swaps / maxVal) * 100) + "%";
        if (c.barTotal) c.barTotal.style.width = ((tot / maxVal) * 100) + "%";

        var isWin = tot === minTotal;
        if (isWin) winners.push(c.name);

        if (c.card) c.card.classList.toggle("winner-card", isWin);
        if (c.tag) c.tag.classList.toggle("show", isWin);
      });

      if (resultGrid) resultGrid.style.display = "grid";

      if (resultVerdict) {
        if (winners.length === 1) {
          resultVerdict.innerHTML = "🏆 Untuk " + state.students.length + " data mahasiswa saat ini, <b>" + escapeHtml(winners[0]) + " adalah yang paling efisien</b> dengan hanya " + minTotal + " total operasi (perbandingan + tukar/geser).";
        } else {
          resultVerdict.innerHTML = "🏁 Untuk " + state.students.length + " data mahasiswa saat ini, terjadi hasil imbang antara <b>" + escapeHtml(winners.join(" &amp; ")) + "</b> dengan masing-masing " + minTotal + " total operasi.";
        }
      }
    });
  }

  /* ================= LOCAL THEME TOGGLE & SYNC ================= */
  var themeToggle = document.getElementById("themeToggle");
  var THEME_KEY = "sik-theme";

  function systemPrefersDark() {
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function isDarkActive() {
    var attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark") return true;
    if (attr === "light") return false;
    return systemPrefersDark();
  }

  function loadThemePref() {
    try {
      return localStorage.getItem(THEME_KEY) || localStorage.getItem("shell-theme");
    } catch (e) {
      return null;
    }
  }

  function saveThemePref(t) {
    try {
      localStorage.setItem(THEME_KEY, t);
      localStorage.setItem("shell-theme", t);
    } catch (e) { }
  }

  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") document.documentElement.setAttribute("data-theme", theme);
    else document.documentElement.removeAttribute("data-theme");
    if (themeToggle) {
      themeToggle.textContent = isDarkActive() ? "☀️" : "🌙";
      themeToggle.title = isDarkActive() ? "Ganti ke Tema Arona (Light)" : "Ganti ke Tema Plana (Dark)";
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      var next = isDarkActive() ? "light" : "dark";
      applyTheme(next);
      saveThemePref(next);
      try {
        window.parent.postMessage({ type: "THEME_CHANGE", theme: next }, "*");
      } catch (e) { }
    });
  }

  window.addEventListener("message", function (e) {
    if (e.data && e.data.type === "THEME_CHANGE" && e.data.theme) {
      applyTheme(e.data.theme);
      saveThemePref(e.data.theme);
    }
  });

  window.addEventListener("storage", function (e) {
    if ((e.key === THEME_KEY || e.key === "shell-theme") && e.newValue) {
      applyTheme(e.newValue);
    }
  });

  applyTheme(loadThemePref());

  /* ================= INIT ================= */
  SIKData.loadState();
  renderRoster();
  setupCol(col1, "bubble", col1.nameEl, col1.lblSwap);
  setupCol(col2, "insertion", col2.nameEl, col2.lblSwap);
})();