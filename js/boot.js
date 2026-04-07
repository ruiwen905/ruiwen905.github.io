/* js/boot.js
   App boot, view routing, floating star. */

window.Boot = (() => {

  let curView = 'routines';
  let isAdmin = false;

  async function boot() {
    document.getElementById('loading').classList.remove('hidden');
    await State.loadSyllabus();
    const data = await State.load();
    if (data && data.kids && data.kids.length > 0) {
      State.setApp(data);
      startApp();
    } else {
      document.getElementById('loading').classList.add('hidden');
      Onboarding.show();
    }
    document.getElementById('loading').classList.add('hidden');
  }

  function startApp() {
    const APP = State.getApp();
    APP.kids.forEach(k => { window._langPref = window._langPref || {}; _langPref[k.key] = _langPref[k.key] || 'en'; });
    State.initTasks();
    document.getElementById('onboarding').classList.add('hidden');
    document.getElementById('app').classList.add('visible');
    document.getElementById('loading').classList.add('hidden');
    Routines.buildBoard();
    Play.buildBoard();
    Skills.buildBoard();
    renderAll();
  }

  function renderAll() {
    const APP = State.getApp();
    APP.kids.forEach(k => {
      Routines.renderRoad(k.key);
      Routines.renderRoutines(k.key);
      Routines.renderBadge(k.key, false);
      Routines.renderSub(k.key);
    });
    updateFloatingStar();
  }

  function switchView(v) {
    curView = v;
    ['routines', 'market', 'play', 'skills', 'community'].forEach(n => {
      document.getElementById('view-' + n).classList.toggle('active', n === v);
      const ni = document.getElementById('nav-' + n);  if (ni) ni.classList.toggle('active', n === v);
      const mi = document.getElementById('mob-' + n);  if (mi) mi.classList.toggle('active', n === v);
    });
    if (v === 'market')    { Market.renderMarket(); Market.renderVouchers(); }
    if (v === 'play')      { State.getApp().kids.forEach(k => Play.renderCol(k.key)); }
    if (v === 'skills')    { State.getApp().kids.forEach(k => Skills.renderCol(k.key)); }
    if (v === 'community') { Community.render(); }
  }

  function updateFloatingStar() {
    const el = document.getElementById('fs-pts');
    if (el) el.textContent = State.totalPool();
    // Also update market pool if visible
    const vp = document.getElementById('v-pool-pts');
    if (vp) vp.textContent = State.totalPool();
  }

  function toggleAdmin() {
    isAdmin = !isAdmin;
    document.body.classList.toggle('admin-mode', isAdmin);
  }

  function handleAdminTap(e) {
    if (e && e.detail === 2) toggleAdmin();
  }

  async function confirmReset() {
    if (!confirm('Reset ALL app data? This cannot be undone.')) return;
    await State.reset();
    location.reload();
  }

  function adminResetStars(key) {
    if (!isAdmin || !confirm('Reset this child\'s stars?')) return;
    const APP = State.getApp();
    APP.stars[key] = 0; APP.sgiven[key] = null;
    State.save();
    Routines.renderBadge(key, false);
    updateFloatingStar();
  }

  return { boot, startApp, switchView, updateFloatingStar, toggleAdmin, handleAdminTap, confirmReset, adminResetStars, isAdmin: () => isAdmin, curView: () => curView };
})();

// Global shortcuts for onclick= attributes
window.switchView      = (v) => Boot.switchView(v);
window.toggleAdmin     = ()  => Boot.toggleAdmin();
window.handleAdminTap  = (e) => Boot.handleAdminTap(e);
window.confirmReset    = ()  => Boot.confirmReset();
window.adminResetStars = (k) => Boot.adminResetStars(k);
