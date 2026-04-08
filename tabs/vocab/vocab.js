/* tabs/vocab/vocab.js — Vocab & Phonics Book view */

window.VocabBook = (() => {
  let _kidKey = null;
  let _catFilter = 'all';
  let _searchQ = '';

  const CAT_LABELS = { all:'All', phonics:'Phonics', sight:'Sight Words', calendar:'Calendar', vocab:'Vocabulary' };
  const CAT_ICONS  = { phonics:'🔤', sight:'👁️', calendar:'📅', vocab:'📝', all:'📚' };

  const STAGE_INFO = [
    { label:'New',     dot:'#ccc',    textColor:'#bbb'    },
    { label:'Learning',dot:'#aaa',    textColor:'#888'    },
    { label:'Review',  dot:'#f5c842', textColor:'#b89030' },
    { label:'Weekly',  dot:'#f39c12', textColor:'#996000' },
    { label:'Monthly', dot:'#e67e22', textColor:'#7a4800' },
    { label:'Mastered',dot:'#27ae60', textColor:'#27ae60' },
  ];

  function render() {
    const APP   = State.getApp();
    const el    = document.getElementById('vocab-content');
    if (!el) return;

    // Default to first kid
    if (!_kidKey || !APP.kids.find(k => k.key === _kidKey)) {
      _kidKey = APP.kids[0] ? APP.kids[0].key : null;
    }
    if (!_kidKey) { el.innerHTML = `<div class="vocab-empty"><div class="ve-icon">📚</div><p>No kids found</p></div>`; return; }

    VocabTracker.tickAll();

    const kid  = APP.kids.find(k => k.key === _kidKey);
    const book = VocabTracker.getBook(_kidKey);
    const today = VocabBook.todayWords();

    // ── Kid tabs ──
    const kidTabs = APP.kids.map(k => {
      const av = k.image ? `<img src="${k.image}">` : `<span>${k.gender==='girl'?'👧':'👦'}</span>`;
      return `<button class="vkt${k.key===_kidKey?' active':''}" onclick="VocabBook.switchKid('${k.key}')">${av}${k.name}</button>`;
    }).join('');

    // ── Stats ──
    const total   = book.length;
    const newW    = book.filter(e=>e.stage===0).length;
    const inProg  = book.filter(e=>e.stage>0&&!e.mastered&&VocabTracker.stageColor(e)==='yellow').length;
    const green   = book.filter(e=>!e.mastered&&VocabTracker.stageColor(e)==='green').length;
    const mastered= book.filter(e=>e.mastered).length;

    // ── Category filter ──
    const cats = ['all',...[...new Set(book.map(e=>e.category).filter(Boolean))]];
    const catBar = cats.map(c =>
      `<button class="vocab-cat-btn${_catFilter===c?' active':''}" onclick="VocabBook.setCat('${c}')">${CAT_ICONS[c]||'📌'} ${CAT_LABELS[c]||c}</button>`
    ).join('');

    // ── Filter words ──
    const q = _searchQ.toLowerCase();
    let filtered = book.filter(e => {
      if (_catFilter !== 'all' && e.category !== _catFilter) return false;
      if (q && !e.word.toLowerCase().includes(q)) return false;
      return true;
    });
    filtered.sort((a,b) => {
      // Sort: mastered last, then by stage desc, then alpha
      if (a.mastered && !b.mastered) return 1;
      if (!a.mastered && b.mastered) return -1;
      if (b.stage !== a.stage) return b.stage - a.stage;
      return a.word.localeCompare(b.word);
    });

    // ── Today's review ──
    const todayBanner = today.length ? `
      <div class="vocab-today-banner">
        <div class="vtb-icon">📅</div>
        <div class="vtb-text">
          <div class="vtb-title">Today's Review — up to 10 words</div>
          <div class="vtb-sub">These words are due for practice today</div>
          <div class="vtb-words">${today.map(e=>`<span class="vtb-word">${e.word}</span>`).join('')}</div>
        </div>
      </div>` : '';

    // ── Group by stage ──
    const stageGroups = {};
    filtered.forEach(e => {
      const key = e.mastered ? 'mastered' : String(e.stage);
      if (!stageGroups[key]) stageGroups[key] = [];
      stageGroups[key].push(e);
    });

    const stageOrder = ['1','2','3','4','mastered','0'];
    const stageNames = { '0':'New Words','1':'Learning (Stage 1)','2':'Review — Tomorrow (Stage 2)',
      '3':'Weekly Review (Stage 3)','4':'Monthly Review (Stage 4)','mastered':'✓ Mastered' };
    const stageDotCol = { '0':'#ccc','1':'#888','2':'#f5c842','3':'#f39c12','4':'#e67e22','mastered':'#7c6fcf' };

    let gridHTML = '';
    stageOrder.forEach(sk => {
      const grp = stageGroups[sk];
      if (!grp || !grp.length) return;
      gridHTML += `
        <div class="vocab-stage-header">
          <div class="vocab-stage-dot" style="background:${stageDotCol[sk]}"></div>
          ${stageNames[sk]}
          <span class="vocab-stage-count">${grp.length}</span>
        </div>
        <div class="vocab-grid">
          ${grp.map(e => wordCardHTML(e)).join('')}
        </div>`;
    });

    if (!gridHTML) gridHTML = `<div class="vocab-empty"><div class="ve-icon">🔍</div><p>No words match</p></div>`;

    el.innerHTML = `
      <div class="vocab-kid-tabs">${kidTabs}</div>
      <div class="vocab-stats">
        <div class="vs-card grey-card"><div class="vs-num" style="color:#bbb">${newW}</div><div class="vs-lbl">New</div></div>
        <div class="vs-card yellow-card"><div class="vs-num" style="color:#c9a000">${inProg}</div><div class="vs-lbl">In Progress</div></div>
        <div class="vs-card green-card"><div class="vs-num" style="color:#27ae60">${green}</div><div class="vs-lbl">Stage Complete</div></div>
        <div class="vs-card master-card"><div class="vs-num" style="color:#7c6fcf">${mastered}</div><div class="vs-lbl">Mastered</div></div>
      </div>
      ${todayBanner}
      <div class="vocab-cat-bar">
        ${catBar}
        <input class="vocab-search" placeholder="🔍 Search…" value="${_searchQ}" oninput="VocabBook.search(this.value)">
      </div>
      ${gridHTML}`;
  }

  function wordCardHTML(e) {
    const color  = VocabTracker.stageColor(e);
    const pct    = VocabTracker.progressPct(e);
    const lbl    = VocabTracker.stageLabel(e);
    const cls    = e.mastered ? 'wc-master' : `wc-${color}`;
    const stageN = e.mastered ? '✓' : `S${e.stage}`;
    const nextInfo = e.nextStageAvailable && !e.mastered
      ? `<div style="font-size:1.1rem;color:#aaa;margin-top:3px">Review ${fmtDate(e.nextStageAvailable)}</div>` : '';
    return `<div class="word-card ${cls}" title="${lbl}">
      ${e.mastered ? '<div class="wc-tick">✅</div>' : ''}
      <div class="wc-word">${e.display || e.word}</div>
      <div class="wc-bar-wrap"><div class="wc-bar-fill" style="width:${pct}%"></div></div>
      <div class="wc-meta">
        <span class="wc-stage">${stageN}</span>
        <span>${e.score}/${5}</span>
      </div>
      <div class="wc-cat">${e.category||''}</div>
      ${nextInfo}
    </div>`;
  }

  function fmtDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const today = new Date();
    const diff = Math.round((d - today) / 86400000);
    if (diff <= 0) return 'today';
    if (diff === 1) return 'tomorrow';
    if (diff < 7) return `in ${diff} days`;
    if (diff < 30) return `in ${Math.round(diff/7)} wk`;
    return `in ${Math.round(diff/30)} mo`;
  }

  function todayWords() {
    return VocabTracker.todayWords(_kidKey);
  }

  function switchKid(key) { _kidKey = key; render(); }
  function setCat(cat)     { _catFilter = cat; render(); }
  function search(q)       { _searchQ = q; render(); }

  return { render, switchKid, setCat, search, todayWords };
})();
