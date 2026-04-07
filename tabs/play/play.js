/* tabs/play/play.js */

window.Play = (() => {
  const DAILY_TARGET = 3;

  function buildBoard() {
    const APP = State.getApp();
    const board = document.getElementById('play-board');
    board.innerHTML = APP.kids.map(k => `
      <div class="kid-play-col">
        <div class="kid-play-header" style="background:${State.kidColor(k.key)}">
          ${k.image ? `<img src="${k.image}" class="avatar-img">` : `<div class="avatar-emoji">${k.gender==='girl'?'👧':'👦'}</div>`}
          <div>
            <div class="kid-play-name">${k.name}</div>
            <div class="kid-play-level">${State.kidLevelLabel(k.key)}</div>
          </div>
        </div>
        <div class="play-progress-wrap" id="play-prog-${k.key}"></div>
        <div class="lang-tabs">
          <button class="lang-tab active" id="lt-${k.key}-en" onclick="Play.switchLang('${k.key}','en')">🇬🇧 English</button>
          <button class="lang-tab"        id="lt-${k.key}-cn" onclick="Play.switchLang('${k.key}','cn')">华文</button>
        </div>
        <div class="play-cats" id="pcats-${k.key}"></div>
      </div>`).join('');
  }

  function getKidProgress(key) {
    const APP = State.getApp();
    const today = State.todayStr();
    if (!APP.playProgress) APP.playProgress = {};
    let kp = APP.playProgress[key];
    if (!kp || kp.date !== today) {
      kp = { date: today, count: 0, starGiven: false };
      APP.playProgress[key] = kp;
    }
    return kp;
  }

  function renderProgress(key) {
    const el = document.getElementById('play-prog-' + key); if (!el) return;
    const kp   = getKidProgress(key);
    const pct  = Math.min(100, Math.round((kp.count / DAILY_TARGET) * 100));
    const done = kp.count >= DAILY_TARGET;
    el.innerHTML = `<div class="play-prog-inner">
      <div class="play-prog-label">
        <span>Today's Play</span>
        <span>${kp.count} / ${DAILY_TARGET}${done ? ' ⭐' : ''}</span>
      </div>
      <div class="play-prog-bar-bg">
        <div class="play-prog-bar-fill ${done ? 'done' : ''}" style="width:${pct}%"></div>
      </div>
      <div class="play-prog-hint">${done
        ? '🌟 Star earned! Great learning today!'
        : `Play ${DAILY_TARGET - kp.count} more game${DAILY_TARGET-kp.count!==1?'s':''} to earn ⭐`
      }</div>
    </div>`;
  }

  function recordPlay(kidKey) {
    const APP   = State.getApp();
    const kp    = getKidProgress(kidKey);
    kp.count++;
    if (kp.count >= DAILY_TARGET && !kp.starGiven) {
      kp.starGiven = true;
      APP.stars[kidKey] = (APP.stars[kidKey] || 0) + 1;
      setTimeout(() => { Routines.renderBadge(kidKey, true); Boot.updateFloatingStar(); }, 300);
    }
    State.save();
    renderProgress(kidKey);
  }

  function renderCol(key) {
    const lang   = (window._langPref || {})[key] || 'en';
    const sylKey = State.kidSyllabusKey(key);
    const syl    = State.getSyllabus()[sylKey];
    const APP    = State.getApp();
    const el     = document.getElementById('pcats-' + key); if (!el) return;

    let cats = (syl && syl[lang]) ? [...syl[lang]] : [];
    const custom = (APP.customPlay && APP.customPlay[key]) || [];
    if (custom.length) cats = [...cats, { id:'community_'+key, name:'Community Picks', icon:'🌟', items:custom }];

    if (!cats.length) {
      el.innerHTML = `<div style="padding:20px;text-align:center;color:#aaa;font-size:1.6rem;">Syllabus loading…<br>Make sure the server is running.</div>`;
      renderProgress(key);
      return;
    }

    el.innerHTML = cats.map(cat => `
      <div class="play-cat" id="pcat-${key}-${cat.id}">
        <div class="play-cat-head" onclick="Play.toggleCat('${key}','${cat.id}')">
          <span class="play-cat-icon">${cat.icon}</span>
          <span class="play-cat-name">${cat.name}</span>
          <span class="play-cat-arrow">▶</span>
        </div>
        <div class="play-items-list">
          ${cat.items.map(item => `
            <div class="play-item" onclick="Play.openOverlay('${key}','${cat.id}','${item.id}')">
              <div class="play-item-icon">${GameRegistry.icon(item.type)}</div>
              <div class="play-item-info">
                <div class="play-item-title">${item.title}</div>
                <div class="play-item-sub">${item.sub||''}</div>
              </div>
              <span class="play-item-type type-${item.type}">${GameRegistry.label(item.type)}</span>
            </div>`).join('')}
        </div>
      </div>`).join('');

    renderProgress(key);
  }

  function switchLang(key, lang) {
    window._langPref = window._langPref || {};
    _langPref[key] = lang;
    ['en','cn'].forEach(l => { const el=document.getElementById('lt-'+key+'-'+l); if(el) el.classList.toggle('active',l===lang); });
    renderCol(key);
  }

  function toggleCat(key, catId) {
    const el = document.getElementById('pcat-'+key+'-'+catId); if(el) el.classList.toggle('open');
  }

  function openOverlay(key, catId, itemId) {
    const lang   = (window._langPref || {})[key] || 'en';
    const sylKey = State.kidSyllabusKey(key);
    const syl    = State.getSyllabus()[sylKey];
    const APP    = State.getApp();
    let item     = null;

    if (syl && syl[lang]) {
      const cat = syl[lang].find(c => c.id === catId);
      if (cat) item = cat.items.find(i => i.id === itemId);
    }
    if (!item) {
      const custom = (APP.customPlay && APP.customPlay[key]) || [];
      item = custom.find(i => i.id === itemId);
    }
    if (!item) return;

    recordPlay(key);
    document.getElementById('pm-title').textContent = item.title;
    document.getElementById('pm-body').innerHTML    = GameRegistry.render(item);
    document.getElementById('play-overlay').classList.add('open');
  }

  function closeOverlay() {
    document.getElementById('play-overlay').classList.remove('open');
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    window._gState = {};
  }

  return { buildBoard, renderCol, renderProgress, recordPlay, switchLang, toggleCat, openOverlay, closeOverlay };
})();

window.closePlayOverlay = () => Play.closeOverlay();
