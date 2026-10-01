(function () {
  "use strict";

  var SIK_THEME_KEY = "sik-theme";
  var LAB_THEME_KEY = "sorting-lab-theme";
  var SHELL_THEME_KEY = "shell-theme";

  function systemPrefersDark() {
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }

  function isDarkActive() {
    var attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'dark') return true;
    if (attr === 'light') return false;
    return systemPrefersDark();
  }

  function loadPref(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }

  function savePref(key, v) {
    try { localStorage.setItem(key, v); } catch (e) { }
  }

  var desiredTheme = loadPref(SHELL_THEME_KEY);
  var effectiveTheme = desiredTheme || (systemPrefersDark() ? 'dark' : 'light');

  savePref(SIK_THEME_KEY, effectiveTheme);
  savePref(LAB_THEME_KEY, effectiveTheme);

  var frames = {};

  function initFrame(key, frameId, loadingId) {
    var frame = document.getElementById(frameId);
    var loading = document.getElementById(loadingId);
    frames[key] = { frame: frame, loading: loading, ready: false };

    frame.addEventListener('load', function () {
      if (loading) loading.style.display = 'none';
      frames[key].ready = true;
      hideInnerThemeButton(frame);
      var currentTheme = isDarkActive() ? 'dark' : 'light';
      pushThemeToFrame(key, key === 'sik' ? SIK_THEME_KEY : LAB_THEME_KEY, currentTheme);
    });
  }

  function hideInnerThemeButton(frame) {
    try {
      var btn = frame.contentDocument && frame.contentDocument.getElementById('themeToggle');
      if (btn) btn.style.display = 'none';
    } catch (e) { /* fallback jika cross-origin */ }
  }

  initFrame('lab', 'frame-lab', 'loading-lab');
  initFrame('sik', 'frame-sik', 'loading-sik');

  /* ---------- Tab Switching ---------- */
  var tabs = document.querySelectorAll('.tabs button');
  var panes = document.querySelectorAll('.frame-wrap');

  tabs.forEach(function (btn) {
    btn.addEventListener('click', function () {
      tabs.forEach(function (b) {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      panes.forEach(function (p) {
        p.classList.remove('active');
      });

      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      var target = document.getElementById(btn.getAttribute('data-target'));
      if (target) target.classList.add('active');
    });
  });

  /* ---------- Synced Theme Toggle ---------- */
  var themeBtn = document.getElementById('shellTheme');

  function updateButtonDisplay() {
    if (!themeBtn) return;
    var dark = isDarkActive();
    themeBtn.textContent = dark ? '☀️' : '🌙';
    themeBtn.title = dark ? 'Ganti ke Tema Light' : 'Ganti ke Tema Dark';
  }

  function applyTheme(t) {
    if (t === 'light' || t === 'dark') {
      document.documentElement.setAttribute('data-theme', t);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    updateButtonDisplay();
  }

  function pushThemeToFrame(key, storageKey, theme) {
    var entry = frames[key];
    if (!entry || !entry.ready) return;
    try {
      var doc = entry.frame.contentDocument;
      if (doc) doc.documentElement.setAttribute('data-theme', theme);
      var win = entry.frame.contentWindow;
      if (win) {
        if (win.localStorage) win.localStorage.setItem(storageKey, theme);
        win.postMessage({ type: 'THEME_CHANGE', theme: theme }, '*');
      }
    } catch (e) { /* fallback jika cross-origin */ }
  }

  function broadcastTheme(next) {
    applyTheme(next);
    savePref(SHELL_THEME_KEY, next);
    savePref(SIK_THEME_KEY, next);
    savePref(LAB_THEME_KEY, next);
    pushThemeToFrame('sik', SIK_THEME_KEY, next);
    pushThemeToFrame('lab', LAB_THEME_KEY, next);
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = isDarkActive() ? 'light' : 'dark';
      broadcastTheme(next);
    });
  }

  // Listen for theme change from child iframe
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'THEME_CHANGE' && e.data.theme) {
      if (e.data.theme !== (isDarkActive() ? 'dark' : 'light')) {
        broadcastTheme(e.data.theme);
      }
    }
  });

  // Listen for storage change across tabs
  window.addEventListener('storage', function (e) {
    if (e.key === SHELL_THEME_KEY && e.newValue) {
      broadcastTheme(e.newValue);
    }
  });

  applyTheme(effectiveTheme);
})();