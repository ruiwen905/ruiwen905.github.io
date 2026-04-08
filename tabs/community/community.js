/* tabs/community/community.js */

window.Community = (() => {
  let _data  = null;
  let _selType = null;   // selected game type id
  let _selData = null;   // selected community game id
  let _added = new Set();
  let _searchQ = '', _filterAge = 'all';

  const GAME_TYPES = [
    { id:'song',              icon:'🎵', label:'Song',              desc:'Sing-along with lyrics & read-aloud' },
    { id:'story',             icon:'📖', label:'Story',             desc:'Story with a moral lesson' },
    { id:'concept',           icon:'💡', label:'Learn Card',        desc:'Educational concept cards' },
    { id:'game_phonics',      icon:'🔤', label:'Phonics – Digraphs',desc:'Tap words with the correct sound' },
    { id:'game_blends',       icon:'🔡', label:'Phonics – Blends',  desc:'Word family reveal game' },
    { id:'game_hfwords',      icon:'👁️', label:'Sight Words',       desc:'High-frequency word flashcards' },
    { id:'game_counting',     icon:'🔢', label:'Counting',          desc:'Count objects & choose the answer' },
    { id:'game_patterns',     icon:'🔷', label:'Patterns',          desc:'AB / ABC pattern completion' },
    { id:'game_days_spell',   icon:'📅', label:'Days Spelling',     desc:'Spell days of the week' },
    { id:'game_days_seq',     icon:'📅', label:'Days Sequence',     desc:'What day comes next?' },
    { id:'game_months_spell', icon:'🗓️', label:'Months Spelling',   desc:'Spell months of the year' },
    { id:'game_months_seq',   icon:'🗓️', label:'Months Sequence',   desc:'What month comes next?' },
    { id:'game_clock',        icon:'🕐', label:'Clock Reading',     desc:'Read SVG analog clock faces' },
    { id:'game_tracing_en',   icon:'✏️', label:'Trace English',     desc:'Finger-trace letters & words on canvas' },
    { id:'game_tracing_cn',   icon:'✏️', label:'Trace Chinese',     desc:'Finger-trace Chinese characters' },
    { id:'game_matching',     icon:'🃏', label:'Matching Cards',    desc:'Flip & match emoji–word pairs' },
    { id:'game_maze',         icon:'🌀', label:'Maze',              desc:'Navigate a randomly generated maze' },
    { id:'game_maze_phonics', icon:'🌀', label:'Phonics Maze',      desc:'Collect letters in order to spell a word' },
    { id:'game_puzzle',       icon:'🧩', label:'Word Puzzle',       desc:'Tap tiles to spell the target word' },
    { id:'game_snake',        icon:'🐍', label:'Snake',             desc:'Collect letters to spell words' },
    { id:'skill',             icon:'⭐', label:'Skill / Milestone', desc:'Add a skill progress tracker' },
  ];

  /* ── LOAD ── */
  async function load() {
    if (_data) return;
    try {
      const r = await fetch('/assets/data/community.json');
      _data = r.ok ? await r.json() : { games: [] };
    } catch { _data = { games: [] }; }
  }

  /* ── MAIN RENDER ── */
  async function render() {
    await load();
    const el = document.getElementById('community-content');
    if (!el) return;

    // Build age filter options once
    const af = document.getElementById('comm-age-filter');
    if (af && af.children.length <= 1) {
      const ages = [...new Set(_data.games.flatMap(g => g.ages))].sort((a,b)=>a-b);
      ages.forEach(a => {
        const o = document.createElement('option'); o.value = a; o.textContent = `Age ${a}`; af.appendChild(o);
      });
    }

    el.innerHTML = `
      <div class="comm-layout">
        <div class="comm-left">
          <div class="comm-col-title">1️⃣ Game Type</div>
          <div id="comm-type-list">${typeListHTML()}</div>
        </div>
        <div class="comm-right">
          <div class="comm-col-title">2️⃣ Content</div>
          <div id="comm-data-list">${dataListHTML()}</div>
        </div>
      </div>
      <div class="comm-preview-strip${_selType&&_selData?'':' hidden'}" id="comm-preview-strip">
        ${previewHTML()}
      </div>`;
  }

  function typeListHTML() {
    return GAME_TYPES.map(t => `
      <div class="comm-type-row${_selType===t.id?' active':''}" onclick="Community.pickType('${t.id}')">
        <span class="ctr-icon">${t.icon}</span>
        <div class="ctr-info">
          <div class="ctr-label">${t.label}</div>
          <div class="ctr-desc">${t.desc}</div>
        </div>
      </div>`).join('');
  }

  function dataListHTML() {
    if (!_selType) return `<div class="comm-data-empty">← Pick a game type first</div>`;
    const q  = _searchQ.toLowerCase();
    const af = _filterAge;
    const items = _data.games.filter(g => {
      if (g.type !== _selType) return false;
      if (af !== 'all' && !g.ages.includes(parseInt(af))) return false;
      if (q && !g.title.toLowerCase().includes(q) && !g.desc.toLowerCase().includes(q)) return false;
      return true;
    });
    if (!items.length) return `<div class="comm-data-empty">No content for this type / filter.</div>`;
    return items.map(g => `
      <div class="comm-data-row${_selData===g.id?' active':''}" onclick="Community.pickData('${g.id}')">
        <span class="cdr-icon">${g.icon}</span>
        <div class="cdr-info">
          <div class="cdr-title">${g.title}</div>
          <div class="cdr-meta">Age ${fmtAges(g.ages)} · ${g.lang==='cn'?'华文':'English'}</div>
          <div class="cdr-desc">${g.desc}</div>
        </div>
        ${_selData===g.id ? '<span class="cdr-check">✓</span>' : ''}
      </div>`).join('');
  }

  function previewHTML() {
    if (!_selType || !_selData) return '';
    const game = _data.games.find(g => g.id === _selData); if (!game) return '';
    const typ  = GAME_TYPES.find(t => t.id === _selType);  if (!typ)  return '';
    const APP  = State.getApp();
    const isSkill = _selType === 'skill';

    const kidBtns = APP.kids.map(k => {
      const key  = game.id + '_' + k.key;
      const done = _added.has(key);
      // Avatar: image tag if image exists, else emoji
      const av = k.image
        ? `<img src="${k.image}">`
        : `<span>${k.gender==='girl'?'👧':'👦'}</span>`;
      if (done) return `<div class="cp-kid-added">${av}<span>${k.name} ✅</span></div>`;
      return `<button class="cp-kid-btn${isSkill?' skill':''}" onclick="Community.${isSkill?'addSkill':'addGame'}('${game.id}','${k.key}')">
        ${av}<span>Add to ${k.name}</span>
      </button>`;
    }).join('');

    return `<div class="cp-inner">
      <div class="cp-game-info">
        <div class="cp-game-icon">${game.icon}</div>
        <div>
          <div class="cp-game-title">${game.title}</div>
          <div class="cp-game-sub">${typ.label} · Age ${fmtAges(game.ages)}</div>
        </div>
      </div>
      <div class="cp-actions">
        ${isSkill ? '' : `<button class="cp-preview-btn" onclick="Community.preview('${game.id}')">👁 Preview</button>`}
        <div style="width:1px;background:#eee;height:36px;flex-shrink:0"></div>
        <span style="font-size:1.5rem;font-weight:800;color:#aaa;white-space:nowrap">Add to:</span>
        ${kidBtns}
      </div>
    </div>`;
  }

  /* ── PICK ── */
  function pickType(id) {
    _selType = id; _selData = null;
    const tl = document.getElementById('comm-type-list'); if (tl) tl.innerHTML = typeListHTML();
    const dl = document.getElementById('comm-data-list'); if (dl) dl.innerHTML = dataListHTML();
    const ps = document.getElementById('comm-preview-strip');
    if (ps) { ps.classList.add('hidden'); ps.innerHTML = ''; }
  }

  function pickData(id) {
    _selData = id;
    const dl = document.getElementById('comm-data-list'); if (dl) dl.innerHTML = dataListHTML();
    const ps = document.getElementById('comm-preview-strip');
    if (ps) { ps.classList.remove('hidden'); ps.innerHTML = previewHTML(); }
  }

  /* ── ADD GAME ── */
  function addGame(gameId, kidKey) {
    const APP  = State.getApp();
    const game = _data.games.find(g => g.id === gameId); if (!game) return;
    const kid  = APP.kids.find(k => k.key === kidKey);   if (!kid)  return;
    if (!APP.customPlay) APP.customPlay = {};
    if (!APP.customPlay[kidKey]) APP.customPlay[kidKey] = [];
    if (!APP.customPlay[kidKey].find(i => i.id === gameId)) {
      APP.customPlay[kidKey].push({ id:gameId, type:game.type, title:game.title, sub:game.desc, icon:game.icon, data:game.data });
    }
    _added.add(gameId + '_' + kidKey);
    State.save();
    toast(`"${game.title}" added to ${kid.name}'s Play tab! 🎉`);
    const ps = document.getElementById('comm-preview-strip');
    if (ps) ps.innerHTML = previewHTML();
  }

  function addSkill(gameId, kidKey) {
    const APP  = State.getApp();
    const game = _data.games.find(g => g.id === gameId); if (!game || game.type !== 'skill') return;
    const kid  = APP.kids.find(k => k.key === kidKey);   if (!kid)  return;
    if (!APP.skills[kidKey]) APP.skills[kidKey] = [];
    const newId = (game.data.skill.name + '_' + kidKey).replace(/\s+/g,'_').toLowerCase();
    if (!APP.skills[kidKey].find(s => s.name === game.data.skill.name)) {
      APP.skills[kidKey].push({ ...game.data.skill, id: newId });
    }
    _added.add(gameId + '_' + kidKey);
    State.save(); Skills.renderCol(kidKey);
    toast(`"${game.data.skill.name}" added to ${kid.name}'s Skills! ⭐`);
    const ps = document.getElementById('comm-preview-strip');
    if (ps) ps.innerHTML = previewHTML();
  }

  /* ── PREVIEW OVERLAY ── */
  function preview(gameId) {
    const game = _data.games.find(g => g.id === gameId); if (!game) return;
    document.getElementById('cc-preview-title').textContent = game.title;
    document.getElementById('cc-preview-body').innerHTML = GameRegistry.render({ type:game.type, data:game.data, title:game.title });
    document.getElementById('cc-preview-overlay').classList.add('open');
  }
  function closePreview() {
    document.getElementById('cc-preview-overlay').classList.remove('open');
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    window._gState = {};
  }

  /* ── SEARCH / FILTER ── */
  function onSearch(q)    { _searchQ = q; const dl=document.getElementById('comm-data-list'); if(dl) dl.innerHTML=dataListHTML(); }
  function onAgeFilter(v) { _filterAge = v; const dl=document.getElementById('comm-data-list'); if(dl) dl.innerHTML=dataListHTML(); }

  function fmtAges(ages) {
    if (!ages||!ages.length) return '?';
    const s = [...ages].sort((a,b)=>a-b);
    return s[0]===s[s.length-1] ? s[0] : `${s[0]}–${s[s.length-1]}`;
  }

  function toast(msg) {
    let t = document.getElementById('comm-toast');
    if (!t) {
      t = document.createElement('div'); t.id = 'comm-toast';
      t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#27ae60;color:white;padding:12px 24px;border-radius:20px;font-family:Fredoka One,cursive;font-size:1.8rem;z-index:3000;opacity:0;transition:all .3s;pointer-events:none;white-space:nowrap;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(t._t);
    t._t = setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(20px)'; }, 2600);
  }

  return { render, pickType, pickData, addGame, addSkill, preview, closePreview, onSearch, onAgeFilter };
})();
