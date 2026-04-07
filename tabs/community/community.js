/* tabs/community/community.js
   Admin-only Community tab — browse, search, preview and add games/skills to kids. */

window.Community = (() => {
  let _data = null;           // full community.json
  let _searchQ = '';
  let _filterAge = 'all';
  let _filterCat = 'all';
  let _added = new Set();     // track what was added this session (gameId_kidKey)

  /* ── LOAD ── */
  async function load() {
    if (_data) return;
    try {
      const r = await fetch('/assets/data/community.json');
      if (r.ok) _data = await r.json();
      else _data = { games: [] };
    } catch { _data = { games: [] }; }
  }

  /* ── RENDER ── */
  async function render() {
    await load();
    const el = document.getElementById('community-content');
    if (!el) return;

    const APP = State.getApp();
    const cats = [...new Set(_data.games.map(g => g.category))].sort();
    const ages = [...new Set(_data.games.flatMap(g => g.ages))].sort((a,b)=>a-b);

    // Update age filter options
    const af = document.getElementById('comm-age-filter');
    if (af && af.children.length <= 1) {
      ages.forEach(a => { const o = document.createElement('option'); o.value = a; o.textContent = `Age ${a}`; af.appendChild(o); });
    }
    // Update cat filter options
    const cf = document.getElementById('comm-cat-filter');
    if (cf && cf.children.length <= 1) {
      cats.forEach(c => { const o = document.createElement('option'); o.value = c; o.textContent = c; cf.appendChild(o); });
    }

    // Filter games
    const q = _searchQ.toLowerCase();
    const filtered = _data.games.filter(g => {
      const matchQ   = !q || g.title.toLowerCase().includes(q) || g.category.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q);
      const matchAge = _filterAge === 'all' || g.ages.includes(parseInt(_filterAge));
      const matchCat = _filterCat === 'all' || g.category === _filterCat;
      return matchQ && matchAge && matchCat;
    });

    // Group by category
    const byCat = {};
    filtered.forEach(g => { if (!byCat[g.category]) byCat[g.category] = []; byCat[g.category].push(g); });

    if (filtered.length === 0) {
      el.innerHTML = `<div class="community-empty"><div class="ce-icon">🔍</div><p>No items match your search.<br>Try a different age or category.</p></div>`;
      return;
    }

    const typeLabel = { song:'Song', story:'Story', concept:'Learn', game_phonics:'Phonics', game_blends:'Blends', game_hfwords:'Sight Words', game_counting:'Counting', game_patterns:'Patterns', game_days_spell:'Spelling', game_days_seq:'Sequence', game_months_spell:'Spelling', game_months_seq:'Sequence', game_clock:'Clock', skill:'Skill' };

    el.innerHTML = Object.entries(byCat).sort(([a],[b])=>a.localeCompare(b)).map(([cat, items]) => `
      <div class="community-section">
        <div class="community-section-title">
          ${catIcon(cat)} ${cat}
          <span class="community-count">${items.length}</span>
        </div>
        <div class="community-grid">
          ${items.map(g => {
            const tLabel = typeLabel[g.type] || g.type;
            const ageStr = formatAges(g.ages);
            const isSkill = g.type === 'skill';

            const addBtns = APP.kids.map(k => {
              const key = g.id + '_' + k.key;
              const done = _added.has(key);
              if (done) return `<span class="cc-added">✅ Added to ${k.name}</span>`;
              if (isSkill) {
                return `<button class="cc-add-btn skill" onclick="Community.addSkill('${g.id}','${k.key}')">＋ ${k.name}</button>`;
              }
              return `<button class="cc-add-btn" onclick="Community.addGame('${g.id}','${k.key}')">＋ ${k.name}</button>`;
            }).join('');

            return `<div class="community-card" id="cc-${g.id}">
              <div class="cc-top">
                <div class="cc-icon">${g.icon}</div>
                <div class="cc-info">
                  <div class="cc-title">${g.title}</div>
                  <div class="cc-desc">${g.desc}</div>
                  <div class="cc-badges">
                    <span class="cc-badge cc-badge-type">${tLabel}</span>
                    <span class="cc-badge cc-badge-lang">${g.lang === 'cn' ? '华文' : 'English'}</span>
                    <span class="cc-badge cc-badge-age">Age ${ageStr}</span>
                  </div>
                </div>
              </div>
              <div class="cc-bottom">
                <div class="cc-add-row">
                  ${!isSkill ? `<button class="cc-add-btn" style="background:#888" onclick="Community.preview('${g.id}')">👁 Preview</button>` : ''}
                  <div class="cc-add-label">Add to:</div>
                  ${addBtns}
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>`).join('');
  }

  function catIcon(cat) {
    const m = { Songs:'🎵', Stories:'📖', Phonics:'🔤', Numeracy:'🔢', Calendar:'📅', Time:'🕐', Skills:'⭐', 'Social Skills':'🤝' };
    return m[cat] || '🎮';
  }

  function formatAges(ages) {
    if (!ages || !ages.length) return '?';
    const sorted = [...ages].sort((a,b)=>a-b);
    return sorted[0] === sorted[sorted.length-1] ? sorted[0] : `${sorted[0]}–${sorted[sorted.length-1]}`;
  }

  /* ── ADD GAME TO KID'S SYLLABUS ── */
  function addGame(gameId, kidKey) {
    const APP  = State.getApp();
    const game = _data.games.find(g => g.id === gameId); if (!game) return;
    const kid  = APP.kids.find(k => k.key === kidKey); if (!kid) return;

    // Get or create kid's custom play list in APP
    if (!APP.customPlay) APP.customPlay = {};
    if (!APP.customPlay[kidKey]) APP.customPlay[kidKey] = [];

    // Avoid duplicates
    if (APP.customPlay[kidKey].find(i => i.id === gameId)) {
      _added.add(gameId + '_' + kidKey);
      render(); return;
    }

    APP.customPlay[kidKey].push({
      id:    gameId,
      type:  game.type,
      title: game.title,
      sub:   game.desc,
      icon:  game.icon,
      data:  game.data,
    });

    _added.add(gameId + '_' + kidKey);
    State.save();
    render();
    showToast(`Added "${game.title}" to ${kid.name}'s Play tab!`);
  }

  /* ── ADD SKILL TO KID ── */
  function addSkill(gameId, kidKey) {
    const APP  = State.getApp();
    const game = _data.games.find(g => g.id === gameId); if (!game || game.type !== 'skill') return;
    const kid  = APP.kids.find(k => k.key === kidKey); if (!kid) return;

    if (!APP.skills[kidKey]) APP.skills[kidKey] = [];

    const newId = game.data.skill.name.replace(/\s+/g,'_').toLowerCase() + '_' + kidKey;
    if (APP.skills[kidKey].find(s => s.name === game.data.skill.name)) {
      _added.add(gameId + '_' + kidKey);
      render(); return;
    }

    APP.skills[kidKey].push({ ...game.data.skill, id: newId });
    _added.add(gameId + '_' + kidKey);
    State.save();
    render();
    // Refresh skills col if visible
    Skills.renderCol(kidKey);
    showToast(`Added "${game.data.skill.name}" to ${kid.name}'s Skills!`);
  }

  /* ── PREVIEW ── */
  function preview(gameId) {
    const game = _data.games.find(g => g.id === gameId); if (!game) return;
    document.getElementById('cc-preview-title').textContent = game.title;
    document.getElementById('cc-preview-body').innerHTML  = GameRegistry.render({ type: game.type, data: game.data, title: game.title });
    document.getElementById('cc-preview-overlay').classList.add('open');
  }
  function closePreview() {
    document.getElementById('cc-preview-overlay').classList.remove('open');
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    window._gState = {};
  }

  /* ── SEARCH / FILTER ── */
  function onSearch(q) { _searchQ = q; render(); }
  function onAgeFilter(v) { _filterAge = v; render(); }
  function onCatFilter(v) { _filterCat = v; render(); }

  /* ── TOAST ── */
  function showToast(msg) {
    let t = document.getElementById('community-toast');
    if (!t) { t = document.createElement('div'); t.id='community-toast'; t.style.cssText='position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(20px);background:#27ae60;color:white;padding:12px 24px;border-radius:20px;font-family:Fredoka One,cursive;font-size:1.8rem;z-index:3000;opacity:0;transition:all .3s;pointer-events:none;'; document.body.appendChild(t); }
    t.textContent = msg;
    t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(-50%) translateY(20px)'; }, 2500);
  }

  return { render, addGame, addSkill, preview, closePreview, onSearch, onAgeFilter, onCatFilter };
})();
