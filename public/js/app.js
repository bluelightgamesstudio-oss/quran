const surahsList = ["الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس", "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه", "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم", "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق", "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس", "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد", "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص", "الفلق", "الناس"];
window.surahsList = surahsList;
window.recitersData = [];
window.surahPages = [];
window.surahPageIndex = 0;
const SURAH_PAGE_SIZE = 8;

const STORAGE = {
  get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
  set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch {} }
};

function showToast(msg, ms = 2600) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), ms);
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

function setLoading(el, text = 'جاري التحميل...') {
  if (typeof el === 'string') el = document.getElementById(el);
  if (el) el.innerHTML = `<div class="info-card"><span class="spinner"></span>${text}</div>`;
}

function switchPage(pageId, title, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('aside nav button').forEach(b => b.classList.remove('active'));
  const page = document.getElementById(pageId);
  if (page) page.classList.add('active');
  if (title) {
    const h = document.getElementById('headerTitle');
    if (h) h.innerText = title;
  }
  if (btn) btn.classList.add('active');
  STORAGE.set('lastPage', { pageId, title });
}

function fetchReciters() {
  const select = document.getElementById('reciterSelect');
  fetchJSON('https://mp3quran.net/api/v3/reciters?language=ar')
    .then(data => {
      window.recitersData = data.reciters || [];
      renderRecitersOptions(window.recitersData);
    })
    .catch(() => {
      if (select) select.innerHTML = '<option>تعذر التحميل</option>';
      showToast('تعذر تحميل قائمة القُرّاء');
    });
}

function renderRecitersOptions(list) {
  const select = document.getElementById('reciterSelect');
  if (!select) return;
  select.innerHTML = '';
  if (!list || !list.length) {
    select.innerHTML = '<option value="">لا توجد نتائج</option>';
    return;
  }
  list.forEach((reciter) => {
    const originalIndex = window.recitersData.indexOf(reciter);
    const opt = document.createElement('option');
    opt.value = originalIndex;
    opt.textContent = reciter.name;
    select.appendChild(opt);
  });
  loadReciterSurahs();
}

function filterReciters() {
  const input = document.getElementById('reciterSearchInput');
  const query = (input?.value || '').toLowerCase().trim();
  const filtered = window.recitersData.filter(r => (r.name || '').toLowerCase().includes(query));
  renderRecitersOptions(filtered);
}

function filterListenSurahs() {
  const query = (document.getElementById('listenSurahSearchInput')?.value || '').toLowerCase();
  const select = document.getElementById('surahSelect');
  if (!select) return;
  Array.from(select.options).forEach(opt => {
    opt.style.display = opt.text.toLowerCase().includes(query) ? '' : 'none';
  });
}

function filterReadSurahs() {
  const query = (document.getElementById('readSurahSearchInput')?.value || '').toLowerCase();
  const select = document.getElementById('readSurahSelect');
  if (!select) return;
  Array.from(select.options).forEach(opt => {
    opt.style.display = opt.text.toLowerCase().includes(query) ? '' : 'none';
  });
}

function loadReciterSurahs() {
  const index = document.getElementById('reciterSelect')?.value;
  const moshafContainer = document.getElementById('moshafSelectContainer');
  const moshafSelect = document.getElementById('moshafSelect');

  if (window.recitersData.length > 0 && window.recitersData[index] && window.recitersData[index].moshaf) {
    const moshafList = window.recitersData[index].moshaf;

    if (moshafList.length > 1) {
      if (moshafContainer) moshafContainer.style.display = 'block';
      if (moshafSelect) {
        moshafSelect.innerHTML = '';
        moshafList.forEach((m, mIndex) => {
          const opt = document.createElement('option');
          opt.value = mIndex;
          opt.textContent = m.name;
          moshafSelect.appendChild(opt);
        });
        let maxSurahsIndex = 0;
        let maxCount = 0;
        moshafList.forEach((m, mIndex) => {
          const count = (m.surah_list || '').split(',').filter(Boolean).length;
          if (count > maxCount) { maxCount = count; maxSurahsIndex = mIndex; }
        });
        moshafSelect.value = maxSurahsIndex;
      }
        } else {
          if (moshafContainer) moshafContainer.style.display = 'none';
          if (moshafSelect) {
            moshafSelect.innerHTML = '<option value="0"></option>';
            moshafSelect.value = 0;
          }
        }
    renderSurahListForSelectedMoshaf();
  }
}

function renderSurahListForSelectedMoshaf() {
  const index = document.getElementById('reciterSelect')?.value;
  const moshafSelect = document.getElementById('moshafSelect');
  const surahSelect = document.getElementById('surahSelect');
  if (!surahSelect) return;
  surahSelect.innerHTML = '';

  if (window.recitersData[index] && window.recitersData[index].moshaf) {
    const mIndex = (moshafSelect && moshafSelect.value) || 0;
    const moshaf = (window.recitersData[index].moshaf || [])[mIndex] || (window.recitersData[index].moshaf || [])[0];
    if (!moshaf) return;
    (moshaf.surah_list || '').split(',').filter(Boolean).forEach(sNum => {
      const opt = document.createElement('option');
      opt.value = String(sNum).padStart(3, '0');
      opt.textContent = `${parseInt(sNum)} - ${surahsList[parseInt(sNum)-1]}`;
      surahSelect.appendChild(opt);
    });
  }
}

function searchQuranVerse() {
  const input = document.getElementById('verseSearchInput');
  const text = (input?.value || '').trim();
  const container = document.getElementById('searchResultsContainer');
  if (!text) { showToast('أدخل نصاً للبحث'); return; }
  if (container) container.innerHTML = '<div class="info-card"><span class="spinner"></span>جاري البحث...</div>';

  fetchJSON(`https://api.alquran.cloud/v1/search/${encodeURIComponent(text)}/all/ar`)
    .then(data => {
      if (data.code === 200 && data.data && data.data.count > 0) {
        let html = `<div class="info-card"><strong>نتائج البحث (${data.data.count} آية):</strong></div>`;
        data.data.matches.forEach(m => {
          html += `
            <div class="box" style="margin-top:10px;">
              <h4 style="color:var(--primary); margin:0 0 5px 0;">سورة ${m.surah.name} (${m.numberInSurah})</h4>
              <p style="font-family:'Amiri', serif; font-size:18px; margin:0;">${m.text}</p>
            </div>
          `;
        });
        if (container) container.innerHTML = html;
      } else {
        if (container) container.innerHTML = '<div class="info-card">لم يتم العثور على نتائج.</div>';
      }
    })
    .catch(() => {
      if (container) container.innerHTML = '<div class="info-card">حدث خطأ في الاتصال.</div>';
      showToast('فشل البحث');
    });
}

function playAudio() {
  const index = document.getElementById('reciterSelect')?.value;
  const moshafSelect = document.getElementById('moshafSelect');
  const surahSelect = document.getElementById('surahSelect');
  const player = document.getElementById('audioPlayer');
  if (!player) return;

  if (window.recitersData.length > 0 && window.recitersData[index]) {
    const mIndex = (moshafSelect && moshafSelect.value) || 0;
    const moshaf = window.recitersData[index].moshaf[mIndex] || window.recitersData[index].moshaf[0];
    player.src = moshaf.server + surahSelect.value + '.mp3';
    player.style.display = 'block';
    const p = player.play();
    if (p && typeof p.catch === 'function') p.catch(() => showToast('تعذر تشغيل التلاوة'));
  }
}

const CITY_COUNTRY = {
  Casablanca:'Morocco', Rabat:'Morocco', Marrakesh:'Morocco', Fez:'Morocco',
  Algiers:'Algeria', Tunis:'Tunisia', Tripoli:'Libya', Nouakchott:'Mauritania',
  Mecca:'Saudi Arabia', Riyadh:'Saudi Arabia', Cairo:'Egypt', Dubai:'United Arab Emirates',
  Doha:'Qatar', Kuwait:'Kuwait', Muscat:'Oman', Manama:'Bahrain', Amman:'Jordan',
  Jerusalem:'Palestine', Beirut:'Lebanon', Damascus:'Syria', Baghdad:'Iraq',
  Istanbul:'Turkey', Paris:'France', London:'United Kingdom', Berlin:'Germany',
  Madrid:'Spain', Rome:'Italy', Amsterdam:'Netherlands', Brussels:'Belgium',
  Washington:'United States', 'New York':'United States', Montreal:'Canada'
};

function getPrayerTimes() {
  const city = document.getElementById('citySelect')?.value || 'Casablanca';
  const statusDiv = document.getElementById('gpsStatus');
  if (statusDiv) statusDiv.innerText = '';
  const country = CITY_COUNTRY[city] || '';

  fetchJSON(`https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(city)}&country=${encodeURIComponent(country)}&method=3`)
    .then(data => {
      if (data.code === 200) {
        const t = data.data.timings;
        const h = data.data.date.hijri;
        const set = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };
        set('fajr', t.Fajr);
        set('sunrise', t.Sunrise);
        set('dhuhr', t.Dhuhr);
        set('asr', t.Asr);
        set('maghrib', t.Maghrib);
        set('isha', t.Isha);
        set('hijriDate', `${h.day} ${h.month.ar} ${h.year} هـ`);
        STORAGE.set('lastCity', city);
      } else {
        showToast('تعذر جلب مواقيت المدينة');
      }
    })
    .catch(() => showToast('حدث خطأ في الاتصال بشبكة الإنترنت.'));
}

function getLocationByGPS() {
  const statusDiv = document.getElementById('gpsStatus');
  if (!navigator.geolocation) {
    showToast('خاصية تحديد الموقع غير مدعومة.');
    return;
  }
  if (statusDiv) statusDiv.innerText = '⏳ جاري تحديد موقعك عبر GPS...';

  navigator.geolocation.getCurrentPosition(
    position => {
      fetchJSON(`https://api.aladhan.com/v1/timings?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&method=3`)
        .then(data => {
          if (data.code === 200) {
            const t = data.data.timings;
            const h = data.data.date.hijri;
            const set = (id, v) => { const e = document.getElementById(id); if (e) e.innerText = v; };
            set('fajr', t.Fajr);
            set('sunrise', t.Sunrise);
            set('dhuhr', t.Dhuhr);
            set('asr', t.Asr);
            set('maghrib', t.Maghrib);
            set('isha', t.Isha);
            set('hijriDate', `${h.day} ${h.month.ar} ${h.year} هـ`);
            if (statusDiv) statusDiv.innerText = '✅ تم تحديث المواقيت حسب موقعك الحالي بنجاح!';
            showToast('تم تحديث المواقيت حسب موقعك');
          }
        })
        .catch(() => {
          if (statusDiv) statusDiv.innerText = '❌ فشل جلب المواقيت للإحداثيات الحالية.';
          showToast('فشل جلب المواقيت');
        });
    },
    error => {
      if (statusDiv) statusDiv.innerText = '❌ تم رفض إذن الوصول للموقع الجغرافي.';
      showToast('تم رفض إذن الموقع');
    },
    { timeout: 10000, enableHighAccuracy: true }
  );
}

function loadAzkarContent() {
  const data = {
    morning: "• أصبحنا وأصبح الملك لله، والحمد لله...<br>• اللهم بك أصبحنا وبك أمسينا وبك نحيا وبك نموت وإليك النشور.",
    evening: "• أمسينا وأمسى الملك لله، والحمد لله...<br>• اللهم بك أمسينا وبك أصبحنا وبك نحيا وبك نموت وإليك المصير.",
    sleep: "• باسمك ربي وضعت جنبي وبك أرفعه..."
  };
  const el = document.getElementById('azkarContent');
  const sel = document.getElementById('azkarSelect');
  if (el && sel) el.innerHTML = data[sel.value] || '';
}

function loadSurahText() {
  const num = document.getElementById('readSurahSelect')?.value;
  if (!num) return;
  const name = surahsList[parseInt(num) - 1];
  const container = document.getElementById('quranTextContent');
  if (!container) return;
  container.innerHTML = `<div class="info-card"><span class="spinner"></span>جاري التحميل...</div>`;

  fetchJSON(`https://api.alquran.cloud/v1/surah/${num}`)
    .then(data => {
      if (data.code === 200) {
        const verses = data.data.ayahs.map(a => `${a.text} ﴿${a.numberInSurah}﴾`);
        const pages = [];
        for (let i = 0; i < verses.length; i += SURAH_PAGE_SIZE) {
          pages.push(verses.slice(i, i + SURAH_PAGE_SIZE));
        }
        window.surahPages = pages;
        window.surahPageIndex = 0;
        window.currentSurahName = name;
        renderSurahPage();
      }
    })
    .catch(() => {
      container.innerHTML = '<div class="info-card">حدث خطأ في التحميل.</div>';
      showToast('فشل تحميل السورة');
    });
}

function renderSurahPage() {
  const container = document.getElementById('quranTextContent');
  const info = document.getElementById('surahPageInfo');
  if (!container) return;
  const pages = window.surahPages || [];
  if (!pages.length) {
    container.innerHTML = '<div class="info-card">اختر سورة لعرضها...</div>';
    if (info) info.textContent = 'صفحة 0 / 0';
    return;
  }
  const idx = Math.max(0, Math.min(window.surahPageIndex, pages.length - 1));
  window.surahPageIndex = idx;
  const verses = pages[idx].join(' ');
  container.innerHTML = `<h4 style="text-align:center; color:var(--primary);">سورة ${window.currentSurahName} — صفحة ${idx + 1} / ${pages.length}</h4><p>${verses}</p>`;
  if (info) info.textContent = `صفحة ${idx + 1} / ${pages.length}`;
  container.scrollTop = 0;
}

function nextSurahPage() {
  if (!window.surahPages || !window.surahPages.length) return;
  if (window.surahPageIndex < window.surahPages.length - 1) {
    window.surahPageIndex++;
    renderSurahPage();
  } else {
    showToast('آخر صفحة');
  }
}

function prevSurahPage() {
  if (!window.surahPages || !window.surahPages.length) return;
  if (window.surahPageIndex > 0) {
    window.surahPageIndex--;
    renderSurahPage();
  } else {
    showToast('أول صفحة');
  }
}

function loadSurahInfo() {
  const num = document.getElementById('infoSurahSelect')?.value;
  if (!num) return;
  const container = document.getElementById('surahInfoContent');
  if (!container) return;
  container.innerHTML = '<div class="info-card"><span class="spinner"></span>جاري التحميل...</div>';

  fetchJSON(`https://api.alquran.cloud/v1/surah/${num}`)
    .then(data => {
      if (data.code === 200) {
        const s = data.data;
        container.innerHTML = `
          <h4 style="color:var(--primary); margin-top:0;">سورة ${s.name} (${s.englishName})</h4>
          <p><strong>الترتيب:</strong> ${s.number} / 114</p>
          <p><strong>النوع:</strong> ${s.revelationType === 'Meccan' ? 'مكية 🕋' : 'مدنية 🕌'}</p>
          <p><strong>عدد الآيات:</strong> ${s.numberOfAyahs} آية</p>
        `;
      }
    })
    .catch(() => {
      container.innerHTML = '<div class="info-card">حدث خطأ في التحميل.</div>';
    });
}

function changeTheme() {
  const theme = document.getElementById('themeSelect')?.value || 'light';
  document.body.className = '';
  if (theme === 'dark') document.body.classList.add('dark-theme');
  else if (theme === 'emerald') document.body.classList.add('emerald-theme');
  STORAGE.set('theme', theme);
}

function changeFontSize() {
  const val = document.getElementById('fontSizeInput')?.value || 22;
  document.documentElement.style.setProperty('--quran-font-size', val + 'px');
  STORAGE.set('fontSize', val);
}

function isTvScreen() { return window.innerWidth >= 1200 || window.innerHeight >= 1200; }

function changeTvMode() {
  const mode = document.getElementById('tvModeSelect')?.value || 'auto';
  STORAGE.set('tvMode', mode);
  applyTvMode(mode);
}

function applyTvMode(mode) {
  const on = mode === 'on' || (mode === 'auto' && isTvScreen());
  document.body.classList.toggle('tv-mode', on);
}

function populateStaticSelects() {
  const sRead = document.getElementById('readSurahSelect');
  const sInfo = document.getElementById('infoSurahSelect');
  if (sRead) sRead.innerHTML = '';
  if (sInfo) sInfo.innerHTML = '';
  surahsList.forEach((name, index) => {
    if (sRead) {
      const o = document.createElement('option');
      o.value = index + 1; o.textContent = `${index + 1} - ${name}`;
      sRead.appendChild(o);
    }
    if (sInfo) {
      const o = document.createElement('option');
      o.value = index + 1; o.textContent = `${index + 1} - ${name}`;
      sInfo.appendChild(o);
    }
  });
}

function toggleSidebar() {
  if (window.innerWidth < 768) return;
  document.body.classList.toggle('sidebar-collapsed');
  STORAGE.set('sidebarCollapsed', document.body.classList.contains('sidebar-collapsed'));
}

function changeLanguage(lang) {
  const root = document.getElementById('htmlRoot');
  if (root) {
    root.lang = lang;
    root.dir = (lang === 'ar') ? 'rtl' : 'ltr';
  }
  STORAGE.set('lang', lang);
}

function restoreSettings() {
  const theme = STORAGE.get('theme', 'light');
  const ts = document.getElementById('themeSelect');
  if (ts) { ts.value = theme; changeTheme(); }

  const fs = STORAGE.get('fontSize', 22);
  const fi = document.getElementById('fontSizeInput');
  if (fi) { fi.value = fs; changeFontSize(); }

  const lang = STORAGE.get('lang', 'ar');
  const gl = document.getElementById('globalLangSelect');
  if (gl) { gl.value = lang; changeLanguage(lang); }

  const city = STORAGE.get('lastCity', null);
  const cs = document.getElementById('citySelect');
  if (city && cs) cs.value = city;

  if (STORAGE.get('sidebarCollapsed', false) && window.innerWidth >= 768) {
    document.body.classList.add('sidebar-collapsed');
  }

  const tvMode = STORAGE.get('tvMode', 'auto');
  const tvSel = document.getElementById('tvModeSelect');
  if (tvSel) tvSel.value = tvMode;
  applyTvMode(tvMode);
}

window.onload = function() {
  populateStaticSelects();
  restoreSettings();
  fetchReciters();
  getPrayerTimes();
  loadSurahText();
  loadSurahInfo();
  loadAzkarContent();

  const last = STORAGE.get('lastPage', null);
  if (last && last.pageId) {
    const btn = document.getElementById('btn-' + last.pageId.replace('Page','Page'));
    switchPage(last.pageId, last.title, btn || null);
  }
  const activeBtn = document.querySelector('aside nav button.active');
  if (activeBtn) activeBtn.focus();

  // enter key for verse search
  const vs = document.getElementById('verseSearchInput');
  if (vs) vs.addEventListener('keydown', e => { if (e.key === 'Enter') searchQuranVerse(); });

  // TV/remote keyboard navigation
  document.addEventListener('keydown', e => {
    const navBtns = Array.from(document.querySelectorAll('aside nav button'));
    const active = document.activeElement;
    const idx = navBtns.indexOf(active);
    if (e.key === 'ArrowDown' && idx >= 0 && idx < navBtns.length - 1) {
      e.preventDefault(); navBtns[idx + 1].focus();
    } else if (e.key === 'ArrowUp' && idx > 0) {
      e.preventDefault(); navBtns[idx - 1].focus();
    } else if (e.key === 'Enter' && idx >= 0) {
      e.preventDefault(); navBtns[idx].click();
    } else if (e.key === 'ArrowRight') {
      const rp = document.getElementById('readPage');
      if (rp && rp.classList.contains('active')) { e.preventDefault(); nextSurahPage(); }
    } else if (e.key === 'ArrowLeft') {
      const rp = document.getElementById('readPage');
      if (rp && rp.classList.contains('active')) { e.preventDefault(); prevSurahPage(); }
    }
  });

  window.addEventListener('resize', () => {
    const mode = STORAGE.get('tvMode', 'auto');
    if (mode === 'auto') applyTvMode(mode);
  });
};