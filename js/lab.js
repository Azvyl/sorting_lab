(function () {
  "use strict";

  const { ALGORITHMS, ORDER, COMPARE } = window.SortingLab;

  /* ---------- Utils ---------- */
  function randomArray(n) {
    const arr = [];
    for (let i = 0; i < n; i++) arr.push(10 + Math.floor(Math.random() * 89));
    return arr;
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  /* ---------- App State ---------- */
  const N = 8;
  let baseArray = randomArray(N);
  let currentKey = "bubble";
  let steps = [];
  let stepIndex = 0;
  let playing = false;
  let playTimer = null;

  /* ---------- DOM References ---------- */
  const menuEl = document.getElementById("menu");
  const codeBox = document.getElementById("codeBox");
  const barsEl = document.getElementById("bars");
  const varsRow = document.getElementById("varsRow");
  const noteBar = document.getElementById("noteBar");
  const algoTitle = document.getElementById("algoTitle");
  const algoDesc = document.getElementById("algoDesc");
  const progressEl = document.getElementById("progress");
  const btnPlay = document.getElementById("btnPlay");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const btnReset = document.getElementById("btnReset");
  const btnShuffle = document.getElementById("btnShuffle");
  const speedInput = document.getElementById("speed");
  const customArrayInput = document.getElementById("customArrayInput");
  const btnApplyCustom = document.getElementById("btnApplyCustom");
  const algoViewEl = document.getElementById("algoView");
  const compareViewEl = document.getElementById("compareView");

  /* ---------- Build Menu ---------- */
  ORDER.forEach((key, idx) => {
    const btn = document.createElement("button");
    btn.dataset.key = key;
    btn.innerHTML = `<span class="num">${String(idx + 1).padStart(2, "0")}</span><span>${ALGORITHMS[key].name}</span>`;
    btn.addEventListener("click", () => selectAlgo(key));
    menuEl.appendChild(btn);
  });

  const menuSep = document.createElement("div");
  menuSep.className = "menu-sep";
  menuEl.appendChild(menuSep);

  const compareBtn = document.createElement("button");
  compareBtn.className = "compare-btn";
  compareBtn.dataset.key = "compare";
  compareBtn.innerHTML = `<span class="num">★</span><span>Perbandingan</span>`;
  compareBtn.addEventListener("click", () => selectAlgo("compare"));
  menuEl.appendChild(compareBtn);

  function updateMenuActive() {
    Array.from(menuEl.children).forEach(btn => {
      if (btn.dataset) btn.classList.toggle("active", btn.dataset.key === currentKey);
    });
  }

  /* ---------- Code Panel ---------- */
  let codeMode = "array";
  const codeModeToggle = document.querySelector(".code-mode-toggle");
  if (codeModeToggle) {
    codeModeToggle.addEventListener("click", (e) => {
      const btn = e.target.closest(".mode-btn");
      if (!btn || btn.dataset.mode === codeMode) return;
      codeMode = btn.dataset.mode;
      Array.from(codeModeToggle.children).forEach(b => b.classList.toggle("active", b === btn));
      renderCode();
      if (steps[stepIndex]) highlightLine(steps[stepIndex].line);
    });
  }

  function renderCode() {
    const algo = ALGORITHMS[currentKey];
    if (!algo) return;
    const lines = (codeMode === "pointer" && algo.codePointer) ? algo.codePointer : algo.code;
    codeBox.innerHTML = "";
    lines.forEach((text, i) => {
      const row = document.createElement("div");
      row.className = "line";
      row.dataset.line = i;
      row.innerHTML = `<span class="ln">${i + 1}</span><span>${escapeHtml(text)}</span>`;
      codeBox.appendChild(row);
    });
  }

  function highlightLine(lineIdx) {
    const rows = codeBox.children;
    for (let i = 0; i < rows.length; i++) {
      rows[i].classList.toggle("hl", i === lineIdx);
    }
    if (rows[lineIdx]) {
      rows[lineIdx].scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  /* ---------- Bars Panel ---------- */
  let barEls = [];
  function ensureBars(n) {
    barsEl.innerHTML = "";
    barEls = [];
    for (let i = 0; i < n; i++) {
      const slot = document.createElement("div");
      slot.className = "bar-slot";
      slot.innerHTML = `
        <div class="bar-badge"></div>
        <div class="bar-value"></div>
        <div class="bar-fill" style="height:10px"></div>
        <div class="bar-index">${i}</div>
      `;
      barsEl.appendChild(slot);
      barEls.push({
        slot,
        badge: slot.querySelector(".bar-badge"),
        value: slot.querySelector(".bar-value"),
        fill: slot.querySelector(".bar-fill")
      });
    }
  }

  function renderStep(step) {
    const maxVal = Math.max(...step.array, 1);
    const n = step.array.length;
    for (let i = 0; i < n; i++) {
      const v = step.array[i];
      const el = barEls[i];
      if (step.hole === i) {
        el.slot.classList.add("empty");
        el.value.textContent = "-";
        el.fill.style.height = "10px";
        el.fill.dataset.state = "default";
      } else {
        el.slot.classList.remove("empty");
        el.value.textContent = v;
        el.fill.style.height = Math.max(10, (v / maxVal) * 220) + "px";
        let state = "default";
        if (step.sorted.includes(i)) state = "sorted";
        if (step.compare.includes(i)) state = "compare";
        if (step.active === i) state = "active";
        if (step.pivot === i) state = "pivot";
        if (step.swap && step.swap.includes(i)) state = "swap";
        if (step.shift && step.shift.includes(i)) state = "shift";
        el.fill.dataset.state = state;
      }
      const inRange = step.range ? (i >= step.range[0] && i <= step.range[1]) : true;
      el.slot.classList.toggle("dim", !inRange);
      if (step.badge && step.badge.index === i) {
        el.badge.textContent = step.badge.text;
        el.badge.classList.add("show");
      } else {
        el.badge.classList.remove("show");
      }
    }
    highlightLine(step.line);
    varsRow.innerHTML = "";
    Object.keys(step.vars || {}).forEach(k => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = `${k} = ${step.vars[k]}`;
      varsRow.appendChild(chip);
    });
    noteBar.innerHTML = step.note || "";
    progressEl.textContent = `${stepIndex + 1} / ${steps.length}`;
    btnPrev.disabled = stepIndex <= 0;
    btnNext.disabled = stepIndex >= steps.length - 1;
  }

  /* ---------- Playback Controls ---------- */
  function goTo(idx) {
    stepIndex = Math.max(0, Math.min(steps.length - 1, idx));
    renderStep(steps[stepIndex]);
  }

  function stepForward() {
    if (stepIndex >= steps.length - 1) { pause(); return false; }
    stepIndex++;
    renderStep(steps[stepIndex]);
    return true;
  }

  function stepBack() {
    if (stepIndex <= 0) return;
    stepIndex--;
    renderStep(steps[stepIndex]);
  }

  function tick() {
    if (!playing) return;
    const ok = stepForward();
    if (!ok) return;
    playTimer = setTimeout(tick, Number(speedInput.value));
  }

  function play() {
    if (stepIndex >= steps.length - 1) stepIndex = 0;
    playing = true;
    btnPlay.textContent = "⏸ Jeda";
    clearTimeout(playTimer);
    playTimer = setTimeout(tick, Number(speedInput.value));
  }

  function pause() {
    playing = false;
    btnPlay.textContent = "▶ Putar";
    clearTimeout(playTimer);
  }

  /* ---------- Compare Render Helpers ---------- */
  const COMPARE_ORDER = ORDER.slice().sort((a, b) => COMPARE[a].usageRank - COMPARE[b].usageRank);

  function tickHtml(bool) {
    return bool
      ? `<span class="tick yes">✓</span>`
      : `<span class="tick no">✗</span>`;
  }

  function speedIllusHtml(rank) {
    const pct = Math.max(30, 100 - (rank - 1) * 11.67);
    const tier = rank <= 2 ? "fast" : (rank <= 4 ? "mid" : "slow");
    return `
      <div class="speed-illus">
        <div class="track"><div class="fill ${tier}" style="width:${pct.toFixed(0)}%"></div></div>
        <span class="label">#${rank}</span>
      </div>`;
  }

  function renderCompareTable() {
    const body = document.getElementById("compareTableBody");
    if (!body || body.children.length) return;
    COMPARE_ORDER.forEach((key, idx) => {
      const algo = ALGORITHMS[key];
      const c = COMPARE[key];
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="mono-cell">#${idx + 1}</td>
        <td class="algo-name">${algo.name}</td>
        <td>${speedIllusHtml(c.speedRank)}</td>
        <td class="center">${tickHtml(c.stable)}</td>
        <td class="center">${tickHtml(c.inPlace)}</td>
        <td class="center">${tickHtml(c.adaptive)}</td>
      `;
      body.appendChild(tr);
    });
  }

  function renderCompareGrid() {
    renderCompareTable();
    const grid = document.getElementById("compareGrid");
    if (!grid || grid.children.length) return;
    COMPARE_ORDER.forEach((key, idx) => {
      const algo = ALGORITHMS[key];
      const c = COMPARE[key];
      const card = document.createElement("div");
      card.className = "compare-card";
      card.innerHTML = `
        <div class="compare-card-head">
          <h3>${algo.name}</h3>
          <span class="rank-badge">#${idx + 1}</span>
        </div>
        <div class="compare-speed-row">
          <span class="speed-label">Kecepatan relatif*</span>
          ${speedIllusHtml(c.speedRank)}
        </div>
        <div class="compare-chips">
          <span class="chip"><b>Stabil</b> ${c.stable ? "Ya" : "Tidak"}</span>
          <span class="chip"><b>In-place</b> ${c.inPlace ? "Ya" : "Tidak"}</span>
          <span class="chip"><b>Adaptif</b> ${c.adaptive ? "Ya" : "Tidak"}</span>
        </div>
        <div class="pm-grid">
          <div class="pm-col plus">
            <h4>Kelebihan</h4>
            <ul>${c.plus.map(t => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
          </div>
          <div class="pm-col minus">
            <h4>Kekurangan</h4>
            <ul>${c.minus.map(t => `<li>${escapeHtml(t)}</li>`).join("")}</ul>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  /* ---------- Algo Switching ---------- */
  function selectAlgo(key) {
    pause();
    currentKey = key;
    updateMenuActive();
    if (key === "compare") {
      algoViewEl.style.display = "none";
      compareViewEl.style.display = "flex";
      renderCompareGrid();
      return;
    }
    compareViewEl.style.display = "none";
    algoViewEl.style.display = "block";
    const algo = ALGORITHMS[key];
    algoTitle.textContent = algo.name;
    algoDesc.textContent = algo.desc;
    renderCode();
    steps = algo.build(baseArray);
    ensureBars(baseArray.length);
    goTo(0);
  }

  function reshuffle() {
    if (currentKey === "compare") return;
    pause();
    baseArray = randomArray(N);
    customArrayInput.value = baseArray.join(", ");
    steps = ALGORITHMS[currentKey].build(baseArray);
    ensureBars(baseArray.length);
    goTo(0);
  }

  /* ---------- Custom Array Input ---------- */
  function applyCustomArray() {
    const val = customArrayInput.value.trim();
    if (!val) return;
    const parsed = val.split(/[\s,]+/).map(Number).filter(n => !isNaN(n) && n > 0);
    if (parsed.length < 2) {
      alert("Masukkan minimal 2 angka valid yang dipisahkan koma.");
      return;
    }
    pause();
    baseArray = parsed;
    if (currentKey !== "compare") {
      steps = ALGORITHMS[currentKey].build(baseArray);
      ensureBars(baseArray.length);
      goTo(0);
    }
  }

  btnApplyCustom.addEventListener("click", applyCustomArray);
  customArrayInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyCustomArray();
  });

  /* ---------- Wire Controls ---------- */
  btnPlay.addEventListener("click", () => playing ? pause() : play());
  btnNext.addEventListener("click", () => { pause(); stepForward(); });
  btnPrev.addEventListener("click", () => { pause(); stepBack(); });
  btnReset.addEventListener("click", () => { pause(); goTo(0); });
  btnShuffle.addEventListener("click", reshuffle);

  /* ---------- Local Theme Toggle ---------- */
  const themeToggle = document.getElementById("themeToggle");
  const THEME_KEY = "sorting-lab-theme";

  function systemPrefersDark() {
    return !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  }

  function isDarkActive() {
    const attr = document.documentElement.getAttribute("data-theme");
    if (attr === "dark") return true;
    if (attr === "light") return false;
    return systemPrefersDark();
  }

  function loadThemePref() {
    try { return localStorage.getItem(THEME_KEY); } catch (e) { return null; }
  }

  function saveThemePref(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { }
  }

  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    themeToggle.textContent = isDarkActive() ? "☀️" : "🌙";
  }

  themeToggle.addEventListener("click", () => {
    const next = isDarkActive() ? "light" : "dark";
    applyTheme(next);
    saveThemePref(next);
  });

  applyTheme(loadThemePref());

  /* ---------- Init ---------- */
  customArrayInput.value = baseArray.join(", ");
  selectAlgo("bubble");
})();