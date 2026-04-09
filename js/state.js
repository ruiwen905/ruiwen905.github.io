/* js/state.js
   Single source of truth for all runtime state.
   All modules read/write via this object. */

window.State = (() => {
  const API_URL = '/api/user-data';
  const LS_KEY  = 'kids_app_data_v2';
  const LEVEL_MAP = { 1:'infant', 2:'playgroup', 3:'nursery1', 4:'nursery1', 5:'kindergarten1', 6:'kindergarten1', 7:'kindergarten2' };
  const SYLLABUS_LEVEL = { nursery1: 'N1', kindergarten1: 'K1', kindergarten2: 'K1' };

  let APP = null;
  let SYLLABUS = {};
  let _saveTimer = null;

  /* ── Accessors ── */
  const getApp      = ()  => APP;
  const setApp      = (a) => { APP = a; };
  const getSyllabus = ()  => SYLLABUS;
  const setSyllabus = (s) => { SYLLABUS = s; };

  let _appLang = localStorage.getItem('kids_app_lang') || 'EN';
  const getAppLang = ()  => _appLang;
  const setAppLang = (l) => { _appLang = l; localStorage.setItem('kids_app_lang', l); };

  /* ── Derived helpers ── */
  const todayStr   = () => new Date().toLocaleDateString('en-SG');
  const allTasks   = () => [...(APP.morning || []), ...(APP.evening || [])];
  const itemCost   = (item) => item.days * (APP.kids.length);
  const kidDone    = (k) => allTasks().filter(t => APP.tasks[k] && APP.tasks[k][t.id] && APP.tasks[k][t.id].done).length;
  const kidPct     = (k) => { const tot = allTasks().length; return tot ? kidDone(k) / tot : 0; };
  const getStars   = (k) => APP.stars[k] || 0;
  const totalPool  = ()  => APP.kids.reduce((s, k) => s + getStars(k.key), 0) - (APP.spent || 0);

  const kidColor = (k) => {
    const colors = ['#7c6fcf', '#e8789a', '#4db89e', '#f39c12', '#e74c3c'];
    const idx = APP.kids.findIndex(x => x.key === k);
    return colors[idx % colors.length];
  };
  const kidSyllabusKey = (k) => {
    const kid = APP.kids.find(x => x.key === k);
    return kid ? (SYLLABUS_LEVEL[kid.level] || 'N1') : 'N1';
  };
  const kidLevelLabel = (k) => {
    const labels = { nursery1:'Nursery 1', kindergarten1:'Kindergarten 1', kindergarten2:'Kindergarten 2', playgroup:'Playgroup', infant:'Infant Care' };
    const kid = APP.kids.find(x => x.key === k);
    return kid ? (labels[kid.level] || kid.level) : 'Nursery 1';
  };

  /* ── Init ── */
  function initTasks() {
    const today = todayStr();
    APP.kids.forEach(k => {
      if (!APP.tasks[k.key]) APP.tasks[k.key] = {};
      allTasks().forEach(t => {
        const prev = APP.tasks[k.key][t.id];
        if (!prev || prev.date !== today) APP.tasks[k.key][t.id] = { done: false, date: today };
      });
      if (APP.sgiven[k.key] && APP.sgiven[k.key] !== today) APP.sgiven[k.key] = null;
    });
  }

  /* ── Persistence ── */
  async function save() {
    clearTimeout(_saveTimer);
    return new Promise(resolve => {
      _saveTimer = setTimeout(async () => {
        try {
          await fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(APP) });
        } catch { /* server not running */ }
        localStorage.setItem(LS_KEY, JSON.stringify(APP));
        resolve();
      }, 300);
    });
  }

  async function load() {
    try {
      const r = await fetch(API_URL);
      if (r.ok) { const d = await r.json(); if (d && d.kids) return d; }
    } catch {}
    const local = localStorage.getItem(LS_KEY);
    return local ? JSON.parse(local) : null;
  }

  async function loadSyllabus() {
    try {
      const r = await fetch('/assets/data/syllabus.json');
      if (r.ok) SYLLABUS = await r.json();
    } catch {}
  }

  async function reset() {
    try { await fetch('/api/user-data/reset', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' }); } catch {}
    localStorage.removeItem(LS_KEY);
  }

  /* ── Defaults ── */
  const defaultMorning = () => [
    { id:'mr1', desc:'Keep pillow & fold blanket', icon:'🛏️' },
    { id:'mr2', desc:'Brush teeth & pee',          icon:'🦷' },
    { id:'mr3', desc:'Change clothes',             icon:'👕' },
    { id:'mr4', desc:'Finish breakfast',           icon:'🥣' },
    { id:'mr5', desc:'Keep toys',                  icon:'🧸' },
  ];
  const defaultEvening = () => [
    { id:'ev1', desc:'Finish dinner',              icon:'🍽️' },
    { id:'ev2', desc:'Bath & wear clothes',        icon:'🛁' },
    { id:'ev3', desc:'Read book',                  icon:'📖' },
    { id:'ev4', desc:'Brush teeth & pee',          icon:'🦷' },
  ];
  const defaultMarket = () => [
    { id:'m1', name:'Ice Cream', icon:'🍦', days: 3 },
    { id:'m2', name:'Water Play', icon:'💦', days: 5 },
    { id:'m3', name:'Zoo', icon:'🦁', days: 12 },
  ];
  const defaultSkills = (gender) => [
    { id:'sk_potty', name:'Potty Training', icon:'🚽', target:20, current:0, mastered:false, color:'#f39c12', milestone:'Uses toilet independently' },
    { id:'sk_spoon', name:'Use a Spoon',    icon:'🥄', target:10, current:0, mastered:false, color:'#27ae60', milestone:'Eats independently' },
  ];

  return {
    getApp, setApp, getSyllabus, setSyllabus,
    getAppLang, setAppLang,
    todayStr, allTasks, itemCost,
    kidDone, kidPct, getStars, totalPool,
    kidColor, kidSyllabusKey, kidLevelLabel,
    initTasks, save, load, loadSyllabus, reset,
    defaultMorning, defaultEvening, defaultMarket, defaultSkills,
  };
})();
