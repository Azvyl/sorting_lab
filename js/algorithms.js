/* =========================================================
   ALGORITHM DEFINITIONS & STEP BUILDERS
   ========================================================= */

window.SortingLab = window.SortingLab || {};

(function (exports) {
  "use strict";

  function cloneArr(a) { return a.slice(); }
  function range(n) { return Array.from({ length: n }, (_, i) => i); }

  function baseStep(a, sortedSet, n) {
    return {
      line: 0, array: a.slice(), compare: [], swap: [], shift: [], sorted: sortedSet.slice(),
      pivot: null, active: null, range: [0, n - 1], badge: null, vars: {}, note: "", hole: null
    };
  }

  const ALGORITHMS = {};

  /* ---- 1. Bubble Sort ---- */
  ALGORITHMS.bubble = {
    name: "Bubble Sort",
    desc: "Membandingkan pasangan elemen bersebelahan dan menukarnya jika urutannya salah, elemen terbesar “menggelembung” ke posisi akhir tiap putaran.",
    code: [
      "void bubble_sort(int a[], int n) {",
      "    for (int p = 0; p < n - 1; p++) {",
      "        bool swapped = false;",
      "        for (int i = 0; i < n - 1 - p; i++) {",
      "            if (a[i] > a[i + 1]) {",
      "                int temp = a[i];",
      "                a[i] = a[i + 1];",
      "                a[i + 1] = temp;",
      "                swapped = true;",
      "            }",
      "        }",
      "        if (!swapped) break;",
      "    }",
      "}"
    ],
    codePointer: [
      "void bubble_sort(int *a, int n) {",
      "    for (int pass = 0; pass < n - 1; pass++) {",
      "        bool swapped = false;",
      "        for (int *ptr = a; ptr < a + n - 1 - pass; ptr++) {",
      "            if (*ptr > *(ptr + 1)) {",
      "                int temp = *ptr;",
      "                *ptr = *(ptr + 1);",
      "                *(ptr + 1) = temp;",
      "                swapped = true;",
      "            }",
      "        }",
      "        if (!swapped) break;",
      "    }",
      "}"
    ],
    build(arr) {
      const a = cloneArr(arr), n = a.length, steps = [];
      let sortedSet = [];
      const push = (o) => steps.push(Object.assign(baseStep(a, sortedSet, n), o));
      for (let p = 0; p < n - 1; p++) {
        push({ line: 1, vars: { p }, note: `Mulai pass ke-${p + 1} (p = ${p}).` });
        let swapped = false;
        push({ line: 2, vars: { p }, note: "swapped diset false." });
        for (let i = 0; i < n - 1 - p; i++) {
          push({ line: 3, vars: { p, i }, note: `Periksa indeks i = ${i}.` });
          push({ line: 4, compare: [i, i + 1], vars: { p, i }, note: `Bandingkan a[${i}] = ${a[i]} dengan a[${i + 1}] = ${a[i + 1]}.` });
          if (a[i] > a[i + 1]) {
            push({ line: 5, compare: [i, i + 1], vars: { p, i }, note: "a[i] lebih besar — simpan sementara ke temp." });
            const t = a[i]; a[i] = a[i + 1]; a[i + 1] = t;
            push({ line: 7, swap: [i, i + 1], vars: { p, i }, note: `Tukar posisi: a[${i}] ↔ a[${i + 1}].` });
            swapped = true;
            push({ line: 8, vars: { p, i }, note: "swapped = true." });
          }
        }
        sortedSet = sortedSet.concat([n - 1 - p]);
        push({ line: 11, sorted: sortedSet.slice(), vars: { p }, note: swapped ? "Belum sepenuhnya terurut, lanjut ke pass berikutnya." : "Tidak ada penukaran — array sudah terurut, keluar lebih awal." });
        if (!swapped) {
          for (let k = 0; k < n - 1 - p; k++) if (!sortedSet.includes(k)) sortedSet.push(k);
          push({ line: 11, sorted: sortedSet.slice(), note: "break — keluar dari loop." });
          break;
        }
      }
      push({ line: 13, sorted: range(n), note: "Selesai! Array sudah terurut." });
      return steps;
    }
  };

  /* ---- 2. Exchange Sort ---- */
  ALGORITHMS.exchange = {
    name: "Exchange Sort",
    desc: "Setiap elemen a[i] dibandingkan langsung dengan semua elemen di sebelah kanannya, dan ditukar segera saat ditemukan nilai yang lebih kecil.",
    code: [
      "void exchange_sort(int a[], int n) {",
      "    for (int i = 0; i < n - 1; i++) {",
      "        for (int j = i + 1; j < n; j++) {",
      "            if (a[i] > a[j]) {",
      "                int temp = a[i];",
      "                a[i] = a[j];",
      "                a[j] = temp;",
      "            }",
      "        }",
      "    }",
      "}"
    ],
    codePointer: [
      "void exchange_sort(int *a, int n) {",
      "    for (int *pi = a; pi < a + n - 1; pi++) {",
      "        for (int *pj = pi + 1; pj < a + n; pj++) {",
      "            if (*pi > *pj) {",
      "                int temp = *pi;",
      "                *pi = *pj;",
      "                *pj = temp;",
      "            }",
      "        }",
      "    }",
      "}"
    ],
    build(arr) {
      const a = cloneArr(arr), n = a.length, steps = [];
      let sortedSet = [];
      const push = (o) => steps.push(Object.assign(baseStep(a, sortedSet, n), o));
      for (let i = 0; i < n - 1; i++) {
        push({ line: 1, vars: { i }, note: `Mulai i = ${i}.` });
        for (let j = i + 1; j < n; j++) {
          push({ line: 2, vars: { i, j }, note: `j = ${j}.` });
          push({ line: 3, compare: [i, j], vars: { i, j }, note: `Bandingkan a[${i}] = ${a[i]} dengan a[${j}] = ${a[j]}.` });
          if (a[i] > a[j]) {
            const t = a[i]; a[i] = a[j]; a[j] = t;
            push({ line: 6, swap: [i, j], vars: { i, j }, note: `a[${i}] > a[${j}] — tukar keduanya.` });
          }
        }
        sortedSet = sortedSet.concat([i]);
        push({ line: 9, sorted: sortedSet.slice(), vars: { i }, note: `a[${i}] kini nilai terkecil dari sisa data — posisi final.` });
      }
      push({ line: 10, sorted: range(n), note: "Selesai! Array sudah terurut." });
      return steps;
    }
  };

  /* ---- 3. Selection Sort ---- */
  ALGORITHMS.selection = {
    name: "Selection Sort",
    desc: "Mencari elemen terkecil dari sisa data yang belum terurut, lalu menukarnya ke posisi paling depan bagian yang belum terurut.",
    code: [
      "void selection_sort(int a[], int n) {",
      "    for (int i = 0; i < n - 1; i++) {",
      "        int min_idx = i;",
      "        for (int j = i + 1; j < n; j++) {",
      "            if (a[j] < a[min_idx]) {",
      "                min_idx = j;",
      "            }",
      "        }",
      "        int temp = a[i];",
      "        a[i] = a[min_idx];",
      "        a[min_idx] = temp;",
      "    }",
      "}"
    ],
    codePointer: [
      "void selection_sort(int *a, int n) {",
      "    for (int *pi = a; pi < a + n - 1; pi++) {",
      "        int *pmin = pi;",
      "        for (int *pj = pi + 1; pj < a + n; pj++) {",
      "            if (*pj < *pmin) {",
      "                pmin = pj;",
      "            }",
      "        }",
      "        int temp = *pi;",
      "        *pi = *pmin;",
      "        *pmin = temp;",
      "    }",
      "}"
    ],
    build(arr) {
      const a = cloneArr(arr), n = a.length, steps = [];
      let sortedSet = [];
      const push = (o) => steps.push(Object.assign(baseStep(a, sortedSet, n), o));
      for (let i = 0; i < n - 1; i++) {
        push({ line: 1, vars: { i }, note: `Mulai i = ${i}.` });
        let min_idx = i;
        push({ line: 2, active: min_idx, vars: { i, min_idx }, note: `Asumsikan sementara min_idx = i = ${i}.` });
        for (let j = i + 1; j < n; j++) {
          push({ line: 3, active: min_idx, vars: { i, j, min_idx }, note: `j = ${j}.` });
          push({ line: 4, compare: [j, min_idx], active: min_idx, vars: { i, j, min_idx }, note: `Bandingkan a[${j}] = ${a[j]} dengan a[min_idx] = ${a[min_idx]}.` });
          if (a[j] < a[min_idx]) {
            min_idx = j;
            push({ line: 5, active: min_idx, vars: { i, j, min_idx }, note: `Ditemukan nilai lebih kecil — min_idx = ${min_idx}.` });
          }
        }
        if (min_idx !== i) {
          const t = a[i]; a[i] = a[min_idx]; a[min_idx] = t;
          push({ line: 10, swap: [i, min_idx], vars: { i, min_idx }, note: `Tukar a[${i}] dengan a[${min_idx}] (nilai terkecil).` });
        } else {
          push({ line: 10, vars: { i, min_idx }, note: `a[${i}] sudah yang terkecil — tidak perlu ditukar.` });
        }
        sortedSet = sortedSet.concat([i]);
        push({ line: 11, sorted: sortedSet.slice(), vars: { i }, note: `Posisi ${i} final.` });
      }
      push({ line: 12, sorted: range(n), note: "Selesai! Array sudah terurut." });
      return steps;
    }
  };

  /* ---- 4. Insertion Sort ---- */
  ALGORITHMS.insertion = {
    name: "Insertion Sort",
    desc: "Mengambil satu elemen sebagai key, membandingkannya dengan elemen terurut di sebelah kirinya, lalu menggeser elemen yang lebih besar ke kanan hingga key disisipkan di posisi presisi.",
    code: [
      "void insertion_sort(int a[], int n) {",
      "    for (int i = 1; i < n; i++) {",
      "        int key = a[i];",
      "        int j = i - 1;",
      "        while (j >= 0 && a[j] > key) {",
      "            a[j + 1] = a[j];",
      "            j--;",
      "        }",
      "        a[j + 1] = key;",
      "    }",
      "}"
    ],
    codePointer: [
      "void insertion_sort(int *a, int n) {",
      "    for (int *pi = a + 1; pi < a + n; pi++) {",
      "        int key = *pi;",
      "        int *pj = pi - 1;",
      "        while (pj >= a && *pj > key) {",
      "            *(pj + 1) = *pj;",
      "            pj--;",
      "        }",
      "        *(pj + 1) = key;",
      "    }",
      "}"
    ],
    build(arr) {
      const a = cloneArr(arr), n = a.length, steps = [];
      const push = (o) => steps.push(Object.assign(baseStep(a, range(1), n), o));
      for (let i = 1; i < n; i++) {
        push({ line: 1, sorted: range(i), vars: { i }, note: `Mulai iterasi i = ${i}.` });
        const key = a[i];
        let hole = i;
        push({
          line: 2,
          sorted: range(i),
          hole: hole,
          vars: { i, key },
          note: `Angkat key = a[${i}] = ${key} ke memori sementara. Slot a[${i}] kini kosong.`
        });
        let j = i - 1;
        push({
          line: 3,
          sorted: range(i),
          hole: hole,
          vars: { i, j, key },
          note: `Inisialisasi penunjuk j = i - 1 = ${j}.`
        });
        while (j >= 0 && a[j] > key) {
          push({
            line: 4,
            sorted: range(i),
            compare: [j],
            hole: hole,
            vars: { j, key },
            note: `Bandingkan: a[${j}] = ${a[j]} > key (${key}) — Benar, persiapkan pergeseran a[${j}] ke kanan.`
          });
          a[hole] = a[j];
          hole = j;
          push({
            line: 5,
            sorted: range(i),
            shift: [j + 1],
            hole: hole,
            vars: { j, key },
            note: `Geser elemen ${a[j + 1]} dari indeks ${j} ke indeks ${j + 1}.`
          });
          j--;
          push({
            line: 6,
            sorted: range(i),
            hole: hole,
            vars: { j, key },
            note: `Mundurkan penunjuk j → j = ${j}.`
          });
        }
        if (j >= 0) {
          push({
            line: 4,
            sorted: range(i),
            compare: [j],
            hole: hole,
            vars: { j, key },
            note: `Bandingkan: a[${j}] = ${a[j]} <= key (${key}) — Kondisi dihentikan. Posisi sisip di indeks ${j + 1}.`
          });
        } else {
          push({
            line: 4,
            sorted: range(i),
            hole: hole,
            vars: { j, key },
            note: `j = ${j} < 0 — Mencapai awal array. Posisi sisip di indeks 0.`
          });
        }
        a[j + 1] = key;
        push({
          line: 8,
          sorted: range(i + 1),
          active: j + 1,
          vars: { j, key },
          note: `Sisipkan nilai key (${key}) ke posisi target a[${j + 1}]. Subarray [0..${i}] kini terurut.`
        });
      }
      push({ line: 10, sorted: range(n), note: "Selesai! Seluruh array berhasil diurutkan secara presisi." });
      return steps;
    }
  };

  /* ---- 5. Shell Sort ---- */
  ALGORITHMS.shell = {
    name: "Shell Sort",
    desc: "Membandingkan elemen dengan jarak (gap) tertentu; gap mengecil tiap putaran hingga akhirnya menjadi insertion sort biasa pada gap = 1.",
    code: [
      "void shell_sort(int a[], int n) {",
      "    for (int gap = n / 2; gap > 0; gap /= 2) {",
      "        for (int i = gap; i < n; i++) {",
      "            int temp = a[i];",
      "            int j = i;",
      "            while (j >= gap && a[j - gap] > temp) {",
      "                a[j] = a[j - gap];",
      "                j -= gap;",
      "            }",
      "            a[j] = temp;",
      "        }",
      "    }",
      "}"
    ],
    codePointer: [
      "void shell_sort(int *a, int n) {",
      "    for (int gap = n / 2; gap > 0; gap /= 2) {",
      "        for (int *pi = a + gap; pi < a + n; pi++) {",
      "            int temp = *pi;",
      "            int *pj = pi;",
      "            while (pj >= a + gap && *(pj - gap) > temp) {",
      "                *pj = *(pj - gap);",
      "                pj -= gap;",
      "            }",
      "            *pj = temp;",
      "        }",
      "    }",
      "}"
    ],
    build(arr) {
      const a = cloneArr(arr), n = a.length, steps = [];
      const push = (o) => steps.push(Object.assign(baseStep(a, [], n), o));
      for (let gap = Math.floor(n / 2); gap > 0; gap = Math.floor(gap / 2)) {
        push({ line: 1, vars: { gap }, note: `gap = ${gap}.` });
        for (let i = gap; i < n; i++) {
          push({ line: 2, vars: { gap, i }, note: `i = ${i}.` });
          const temp = a[i];
          push({ line: 3, active: i, vars: { gap, i, temp }, note: `temp = a[${i}] = ${temp}.` });
          let j = i;
          push({ line: 4, active: i, vars: { gap, i, j }, note: `j = ${j}.` });
          while (j >= gap && a[j - gap] > temp) {
            push({ line: 5, compare: [j - gap], active: i, vars: { gap, j, temp }, note: `a[${j - gap}] = ${a[j - gap]} > temp (${temp}) — geser.` });
            a[j] = a[j - gap];
            push({ line: 6, shift: [j - gap, j], vars: { gap, j, temp }, note: `a[${j}] = a[${j - gap}].` });
            j -= gap;
            push({ line: 7, vars: { gap, j, temp }, note: `j -= gap → j = ${j}.` });
          }
          a[j] = temp;
          push({ line: 9, vars: { gap, j, temp }, note: `Tempatkan temp (${temp}) di posisi ${j}.` });
        }
      }
      push({ line: 12, sorted: range(n), note: "Selesai! gap = 0, array sudah terurut." });
      return steps;
    }
  };

  /* ---- 6. Quick Sort ---- */
  ALGORITHMS.quick = {
    name: "Quick Sort",
    desc: "Memilih pivot, memindahkan elemen yang lebih kecil ke kiri dan yang lebih besar ke kanan, lalu mengurutkan tiap bagian secara rekursif.",
    code: [
      "void quick_sort(int a[], int low, int high) {",
      "    if (low < high) {",
      "        int pivot = a[high];",
      "        int i = low - 1;",
      "        for (int j = low; j < high; j++) {",
      "            if (a[j] < pivot) {",
      "                i++;",
      "                int temp = a[i];",
      "                a[i] = a[j];",
      "                a[j] = temp;",
      "            }",
      "        }",
      "        int temp = a[i + 1];",
      "        a[i + 1] = a[high];",
      "        a[high] = temp;",
      "        int pi = i + 1;",
      "        quick_sort(a, low, pi - 1);",
      "        quick_sort(a, pi + 1, high);",
      "    }",
      "}"
    ],
    codePointer: [
      "void quick_sort(int *a, int low, int high) {",
      "    if (low < high) {",
      "        int pivot = a[high];",
      "        int *iptr = a + low - 1;",
      "        for (int *jptr = a + low; jptr < a + high; jptr++) {",
      "            if (*jptr < pivot) {",
      "                iptr++;",
      "                int temp = *iptr;",
      "                *iptr = *jptr;",
      "                *jptr = temp;",
      "            }",
      "        }",
      "        int temp = *(iptr + 1);",
      "        *(iptr + 1) = a[high];",
      "        a[high] = temp;",
      "        int pi = (iptr - a) + 1;",
      "        quick_sort(a, low, pi - 1);",
      "        quick_sort(a, pi + 1, high);",
      "    }",
      "}"
    ],
    build(arr) {
      const a = cloneArr(arr), n = a.length, steps = [];
      let sortedSet = [];
      const push = (o) => steps.push(Object.assign(baseStep(a, sortedSet, n), o));
      function recurse(low, high) {
        push({ line: 1, range: [Math.max(low, 0), Math.min(high, n - 1)], vars: { low, high }, note: `Panggil quick_sort(low = ${low}, high = ${high}).` });
        if (low < high) {
          const pivot = a[high];
          push({ line: 2, range: [low, high], pivot: high, vars: { low, high, pivot }, note: `pivot = a[${high}] = ${pivot}.` });
          let i = low - 1;
          push({ line: 3, range: [low, high], pivot: high, vars: { low, high, i }, note: `i = ${i}.` });
          for (let j = low; j < high; j++) {
            push({ line: 4, range: [low, high], pivot: high, vars: { i, j }, note: `j = ${j}.` });
            push({ line: 5, range: [low, high], compare: [j, high], pivot: high, vars: { i, j, pivot }, note: `Bandingkan a[${j}] = ${a[j]} dengan pivot (${pivot}).` });
            if (a[j] < pivot) {
              i++;
              push({ line: 6, range: [low, high], pivot: high, vars: { i, j }, note: `Lebih kecil dari pivot — i++ → i = ${i}.` });
              const t = a[i]; a[i] = a[j]; a[j] = t;
              push({ line: 9, range: [low, high], swap: [i, j], pivot: high, vars: { i, j }, note: `Tukar a[${i}] dengan a[${j}].` });
            }
          }
          const t2 = a[i + 1]; a[i + 1] = a[high]; a[high] = t2;
          push({ line: 14, range: [low, high], swap: [i + 1, high], vars: { low, high }, note: `Tempatkan pivot ke posisi finalnya (${i + 1}).` });
          const pi = i + 1;
          sortedSet = sortedSet.concat([pi]);
          push({ line: 15, range: [low, high], sorted: sortedSet.slice(), vars: { pi }, note: `pi = ${pi} — posisi pivot sudah final.` });
          push({ line: 16, range: [low, high], sorted: sortedSet.slice(), vars: { low, high: pi - 1 }, note: `Rekursi ke bagian kiri (low = ${low}, high = ${pi - 1}).` });
          recurse(low, pi - 1);
          push({ line: 17, range: [low, high], sorted: sortedSet.slice(), vars: { low: pi + 1, high }, note: `Rekursi ke bagian kanan (low = ${pi + 1}, high = ${high}).` });
          recurse(pi + 1, high);
        } else if (low === high && low >= 0 && low < n) {
          sortedSet = sortedSet.concat([low]).filter((v, idx, arr2) => arr2.indexOf(v) === idx);
          push({ line: 1, sorted: sortedSet.slice(), vars: { low, high }, note: `Subarray tunggal (indeks ${low}) — sudah terurut.` });
        }
      }
      recurse(0, n - 1);
      push({ line: 19, sorted: range(n), range: [0, n - 1], note: "Selesai! Array sudah terurut." });
      return steps;
    }
  };

  /* ---- 7. Radix Sort ---- */
  ALGORITHMS.radix = {
    name: "Radix Sort",
    desc: "Mengurutkan angka berdasarkan tiap digit, dimulai dari digit satuan hingga digit paling signifikan, memakai counting sort sebagai langkah bantuan.",
    code: [
      "void radix_sort(int a[], int n) {",
      "    int max = get_max(a, n);",
      "    for (int exp = 1; max / exp > 0; exp *= 10) {",
      "        int output[n];",
      "        int count[10] = {0};",
      "        for (int i = 0; i < n; i++)",
      "            count[(a[i] / exp) % 10]++;",
      "        for (int i = 1; i < 10; i++)",
      "            count[i] += count[i - 1];",
      "        for (int i = n - 1; i >= 0; i--) {",
      "            int digit = (a[i] / exp) % 10;",
      "            output[count[digit] - 1] = a[i];",
      "            count[digit]--;",
      "        }",
      "        for (int i = 0; i < n; i++)",
      "            a[i] = output[i];",
      "    }",
      "}"
    ],
    codePointer: [
      "void radix_sort(int *a, int n) {",
      "    int max = get_max(a, n);",
      "    for (int exp = 1; max / exp > 0; exp *= 10) {",
      "        int output[n];",
      "        int count[10] = {0};",
      "        for (int *p = a; p < a + n; p++)",
      "            count[(*p / exp) % 10]++;",
      "        for (int *c = count + 1; c < count + 10; c++)",
      "            *c += *(c - 1);",
      "        for (int *p = a + n - 1; p >= a; p--) {",
      "            int digit = (*p / exp) % 10;",
      "            output[count[digit] - 1] = *p;",
      "            count[digit]--;",
      "        }",
      "        for (int *p = a, *q = output; p < a + n; p++, q++)",
      "            *p = *q;",
      "    }",
      "}"
    ],
    build(arr) {
      let a = cloneArr(arr); const n = a.length; const steps = [];
      const push = (o) => steps.push(Object.assign(baseStep(a, [], n), o));
      const max = Math.max(...a);
      push({ line: 1, vars: { max }, note: `Nilai maksimum = ${max} (menentukan jumlah digit).` });
      for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
        push({ line: 2, vars: { exp }, note: `Pass baru untuk digit dengan exp = ${exp}.` });
        const count = new Array(10).fill(0);
        push({ line: 4, vars: { exp }, note: "Inisialisasi count[0..9] = 0." });
        for (let i = 0; i < n; i++) {
          const digit = Math.floor(a[i] / exp) % 10;
          count[digit]++;
          push({ line: 6, active: i, badge: { index: i, text: String(digit) }, vars: { i, digit }, note: `Digit a[${i}] = ${a[i]} adalah ${digit} — count[${digit}]++.` });
        }
        for (let i = 1; i < 10; i++) count[i] += count[i - 1];
        push({ line: 8, note: "Akumulasi count menjadi prefix sum (posisi akhir tiap digit)." });
        const output = new Array(n);
        for (let i = n - 1; i >= 0; i--) {
          const digit = Math.floor(a[i] / exp) % 10;
          output[count[digit] - 1] = a[i];
          count[digit]--;
          push({ line: 11, active: i, badge: { index: i, text: String(digit) }, vars: { i, digit }, note: `Tempatkan a[${i}] = ${a[i]} (digit ${digit}) ke posisi output ke-${count[digit] + 1}.` });
        }
        a = output.slice();
        push({ line: 15, array: a.slice(), note: "Salin output kembali ke array a." });
      }
      push({ line: 16, array: a.slice(), sorted: range(n), note: "Selesai! Semua digit sudah diproses." });
      return steps;
    }
  };

  const ORDER = ["bubble", "exchange", "selection", "insertion", "shell", "quick", "radix"];

  const COMPARE = {
    bubble: {
      best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)",
      stable: true, inPlace: true, adaptive: true, speedRank: 5, usageRank: 1,
      plus: [
        "Sangat mudah dipahami dan diimplementasikan",
        "Ada deteksi dini (flag swapped) sehingga cepat jika data sudah hampir terurut",
        "Stabil — urutan elemen yang nilainya sama tidak berubah"
      ],
      minus: [
        "Sangat lambat untuk data besar karena banyak perbandingan & penukaran",
        "Jarang dipakai untuk kebutuhan produksi nyata",
        "Jumlah swap bisa jauh lebih banyak dibanding algoritma lain"
      ]
    },
    exchange: {
      best: "O(n²)", avg: "O(n²)", worst: "O(n²)", space: "O(1)",
      stable: false, inPlace: true, adaptive: false, speedRank: 7, usageRank: 7,
      plus: [
        "Konsep sederhana, mirip selection sort tapi langsung menukar",
        "Mudah dijelaskan untuk pembelajaran dasar struktur data",
        "Tidak butuh memori tambahan (in-place)"
      ],
      minus: [
        "Selalu O(n²) walau data sudah terurut, tidak ada early-exit",
        "Jumlah penukaran cenderung lebih banyak dari selection sort",
        "Tidak stabil"
      ]
    },
    selection: {
      best: "O(n²)", avg: "O(n²)", worst: "O(n²)", space: "O(1)",
      stable: false, inPlace: true, adaptive: false, speedRank: 6, usageRank: 3,
      plus: [
        "Jumlah penukaran minimal, maksimal (n−1) kali",
        "Cocok saat operasi tulis/tukar data mahal (mis. ke memori flash)",
        "In-place, tidak butuh memori tambahan"
      ],
      minus: [
        "Tetap O(n²) meski array sudah terurut, tidak ada early-exit",
        "Tidak stabil (bisa mengubah urutan elemen bernilai sama)",
        "Kurang efisien untuk data besar"
      ]
    },
    insertion: {
      best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)",
      stable: true, inPlace: true, adaptive: true, speedRank: 4, usageRank: 2,
      plus: [
        "Sangat efisien untuk data kecil atau yang sudah hampir terurut",
        "Stabil dan sederhana",
        "Sering dipakai sebagai bagian dari algoritma hybrid (mis. Timsort)"
      ],
      minus: [
        "Tidak efisien untuk data besar & acak karena banyak pergeseran elemen",
        "Kompleksitas rata-rata & terburuk tetap O(n²)"
      ]
    },
    shell: {
      best: "O(n log n)", avg: "≈O(n^1.3)", worst: "O(n²)", space: "O(1)",
      stable: false, inPlace: true, adaptive: false, speedRank: 3, usageRank: 5,
      plus: [
        "Lebih cepat dari insertion sort biasa karena elemen bisa “meloncat” lewat gap",
        "In-place, tidak butuh memori tambahan",
        "Performa cukup baik untuk data berukuran menengah"
      ],
      minus: [
        "Kompleksitas bergantung pada deret gap yang dipilih, sulit dianalisis pasti",
        "Tidak stabil",
        "Masih kalah cepat dari quick sort / merge sort untuk data besar"
      ]
    },
    quick: {
      best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", space: "O(log n)",
      stable: false, inPlace: true, adaptive: false, speedRank: 2, usageRank: 4,
      plus: [
        "Rata-rata sangat cepat, salah satu algoritma sort tercepat di praktik",
        "In-place, hanya butuh memori stack rekursi (hemat dibanding merge sort)",
        "Performa cache yang baik karena mengakses data secara lokal"
      ],
      minus: [
        "Worst-case O(n²) jika pivot yang dipilih selalu buruk",
        "Tidak stabil",
        "Rekursi dalam bisa berisiko stack overflow pada data sangat besar"
      ]
    },
    radix: {
      best: "O(d·(n+k))", avg: "O(d·(n+k))", worst: "O(d·(n+k))", space: "O(n+k)",
      stable: true, inPlace: false, adaptive: false, speedRank: 1, usageRank: 6,
      plus: [
        "Bisa lebih cepat dari O(n log n) untuk integer dengan jumlah digit terbatas",
        "Stabil",
        "Tidak berbasis perbandingan, sehingga tidak terikat batas bawah O(n log n)"
      ],
      minus: [
        "Hanya cocok untuk data seperti integer/string dengan format tetap, tidak general-purpose",
        "Butuh memori tambahan untuk array output & count",
        "Efisiensi bergantung pada jumlah digit (d) dan basis (k) yang dipakai"
      ]
    }
  };

  exports.ALGORITHMS = ALGORITHMS;
  exports.ORDER = ORDER;
  exports.COMPARE = COMPARE;

})(window.SortingLab);