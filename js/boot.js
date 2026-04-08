/* js/boot.js */

window.Boot = (() => {
  let curView = 'routines';
  let isAdmin = false;

  /* ── BOOT ── */
  async function boot() {
    document.getElementById('loading').classList.remove('hidden');
    await State.loadSyllabus();
    const data = await State.load();
    if (data && data.kids && data.kids.length > 0) {
      State.setApp(data);
      startApp(false);
    } else {
      document.getElementById('loading').classList.add('hidden');
      Onboarding.show();
    }
    document.getElementById('loading').classList.add('hidden');
  }

  /* ── START APP ──
     fromOnboarding = true → auto-enter admin + show coach mark */
  function startApp(fromOnboarding) {
    const APP = State.getApp();
    APP.kids.forEach(k => {
      window._langPref = window._langPref || {};
      _langPref[k.key] = _langPref[k.key] || 'en';
    });
    State.initTasks();
    document.getElementById('onboarding').classList.add('hidden');
    document.getElementById('app').classList.add('visible');
    document.getElementById('loading').classList.add('hidden');
    Routines.ensureAdults();
    Routines.buildBoard();
    Play.buildBoard();
    Skills.buildBoard();
    renderAll();

    if (fromOnboarding) {
      // Enter admin mode automatically
      isAdmin = true;
      document.body.classList.add('admin-mode');
      // Show coach mark after a short delay (board needs to render first)
      setTimeout(() => showCoach(), 500);
    }
  }

  /* ── COACH MARK ── */
  function showCoach() {
    const overlay = document.getElementById('coach-overlay');
    if (!overlay) return;

    // Find first avatar element to point at
    const APP = State.getApp();
    const firstKid = APP.kids[0];
    const avatarEl = firstKid
      ? document.querySelector(`#panel-${firstKid.key} .avatar-img, #panel-${firstKid.key} .avatar-emoji`)
      : null;

    const box   = document.getElementById('coach-box');
    const arrow = document.getElementById('coach-arrow');
    overlay.style.display = 'block';
    overlay.classList.add('active');

    if (avatarEl && box) {
      const r  = avatarEl.getBoundingClientRect();
      const bW = box.offsetWidth || 280;
      const bH = box.offsetHeight || 180;
      const vW = window.innerWidth;
      const vH = window.innerHeight;

      // Decide whether box goes below or above the avatar
      const spaceBelow = vH - r.bottom;
      const goBelow    = spaceBelow > 220 || r.top < 180;

      let left = r.left + r.width / 2 - bW / 2;
      left     = Math.max(10, Math.min(vW - bW - 10, left));

      if (goBelow) {
        box.style.top    = (r.bottom + 16) + 'px';
        box.style.left   = left + 'px';
        box.style.bottom = 'auto';
        arrow.className  = 'coach-arrow up';
        // Arrow horizontal pos relative to box
        arrow.style.left = (r.left + r.width / 2 - left - 14) + 'px';
        arrow.style.removeProperty('right');
      } else {
        box.style.bottom = (vH - r.top + 16) + 'px';
        box.style.top    = 'auto';
        box.style.left   = left + 'px';
        arrow.className  = 'coach-arrow down';
        arrow.style.left = (r.left + r.width / 2 - left - 14) + 'px';
        arrow.style.removeProperty('right');
      }

      // Spotlight: cut a hole around the avatar using box-shadow on backdrop
      const backdrop = overlay.querySelector('.coach-backdrop');
      if (backdrop) {
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const rad = Math.max(r.width, r.height) / 2 + 10;
        backdrop.style.background = 'transparent';
        backdrop.style.boxShadow  = `0 0 0 9999px rgba(0,0,0,.55)`;
        backdrop.style.borderRadius = '50%';
        backdrop.style.position   = 'absolute';
        backdrop.style.left  = (cx - rad) + 'px';
        backdrop.style.top   = (cy - rad) + 'px';
        backdrop.style.width  = (rad * 2) + 'px';
        backdrop.style.height = (rad * 2) + 'px';
      }
    } else {
      // No avatar found — centre the box
      if (box) {
        box.style.top    = '50%';
        box.style.left   = '50%';
        box.style.transform = 'translate(-50%,-50%)';
      }
      if (arrow) arrow.style.display = 'none';
    }
  }

  function dismissCoach() {
    const overlay = document.getElementById('coach-overlay');
    if (overlay) { overlay.style.display = 'none'; overlay.classList.remove('active'); }
  }

  /* ── RENDER ALL ── */
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

  /* ── VIEW SWITCH ── */
  function switchView(v) {
    curView = v;
    ['routines', 'market', 'play', 'skills', 'community'].forEach(n => {
      document.getElementById('view-' + n).classList.toggle('active', n === v);
      const ni = document.getElementById('nav-' + n); if (ni) ni.classList.toggle('active', n === v);
      const mi = document.getElementById('mob-' + n); if (mi) mi.classList.toggle('active', n === v);
    });
    if (v === 'market')    { Market.renderMarket(); Market.renderVouchers(); }
    if (v === 'play')      { State.getApp().kids.forEach(k => Play.renderCol(k.key)); }
    if (v === 'skills')    { State.getApp().kids.forEach(k => Skills.renderCol(k.key)); }
    if (v === 'community') { Community.render(); }
  }

  function updateFloatingStar() {
    const el = document.getElementById('fs-pts');
    if (el) el.textContent = State.totalPool();
    const vp = document.getElementById('v-pool-pts');
    if (vp) vp.textContent = State.totalPool();
  }

  /* ── ADMIN ── */
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
    if (!isAdmin || !confirm("Reset this child's stars?")) return;
    const APP = State.getApp();
    APP.stars[key] = 0; APP.sgiven[key] = null;
    State.save();
    Routines.renderBadge(key, false);
    updateFloatingStar();
  }

  return {
    boot, startApp, renderAll, switchView, updateFloatingStar,
    toggleAdmin, handleAdminTap, confirmReset, adminResetStars,
    showCoach, dismissCoach,
    isAdmin: () => isAdmin,
    curView: () => curView,
  };
})();

// Global shortcuts
window.switchView      = v  => Boot.switchView(v);
window.toggleAdmin     = () => Boot.toggleAdmin();
window.handleAdminTap  = e  => Boot.handleAdminTap(e);
window.confirmReset    = () => Boot.confirmReset();
window.adminResetStars = k  => Boot.adminResetStars(k);
