/* tabs/market/market.js */

window.Market = (() => {
  let vouchFilter = 30;

  function renderMarket() {
    const APP = State.getApp();
    const bal = State.totalPool();
    const vp  = document.getElementById('v-pool-pts'); if (vp) vp.textContent = bal;
    Boot.updateFloatingStar();
    const el = document.getElementById('market-grid'); if (!el) return;
    el.innerHTML = (APP.marketplace || []).map(item => {
      const cost = State.itemCost(item), can = bal >= cost;
      return `<div class="market-item">
        <button class="admin-edit" onclick="Admin.editMarket('${item.id}');event.stopPropagation()">✏️</button>
        <div class="market-icon">${item.icon}</div>
        <div class="market-name">${item.name}</div>
        <button class="buy-btn" onclick="Market.buy('${item.id}')" ${can ? '' : 'disabled'}>${cost} ⭐</button>
      </div>`;
    }).join('');
  }

  function renderVouchers() {
    const APP = State.getApp();
    const el  = document.getElementById('voucher-grid'); if (!el) return;
    const now = new Date();
    const show = (APP.vouch || []).filter(v => {
      if (v.status === 'active') return true;
      return (now - new Date(v.redeemDate)) / 86400000 <= vouchFilter;
    });
    if (!show.length) {
      el.innerHTML = `<div style="grid-column:1/-1;text-align:center;color:#c8a060;font-size:1.8rem;padding:20px;">No vouchers yet! 🎟️</div>`;
      return;
    }
    el.innerHTML = show.map(v => `
      <div class="voucher-item ${v.status}">
        <div class="voucher-top">${v.icon}</div>
        <div class="voucher-body">
          <div class="v-name">${v.name}</div>
          <div class="v-meta">Bought ${new Date(v.date).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</div>
          ${v.status === 'active'
            ? `<button class="use-btn" onclick="Market.redeem(${v.id})">Mum: Mark Used ✓</button>`
            : `<div class="v-meta">✅ Used ${new Date(v.redeemDate).toLocaleString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' })}</div>`}
          <button class="admin-del-vouch" onclick="Market.deleteVouch(${v.id})">🗑 Delete</button>
        </div>
      </div>`).join('');
  }

  function buy(id) {
    const APP  = State.getApp();
    const item = (APP.marketplace || []).find(m => m.id === id);
    const cost = State.itemCost(item);
    if (State.totalPool() < cost) { alert('Not enough stars! Keep going! 💪'); return; }
    if (!confirm(`Buy "${item.name}" for ${cost} ⭐?`)) return;
    APP.spent = (APP.spent || 0) + cost;
    if (!APP.vouch) APP.vouch = [];
    APP.vouch.push({ id: Date.now(), name: item.name, icon: item.icon, status: 'active', date: new Date().toISOString() });
    State.save(); renderMarket(); renderVouchers();
  }

  function redeem(id) {
    const APP = State.getApp();
    if (!confirm('Mum: Mark this as done?')) return;
    const v = (APP.vouch || []).find(x => x.id === id);
    v.status = 'done'; v.redeemDate = new Date().toISOString();
    State.save(); renderVouchers();
  }

  function deleteVouch(id) {
    const APP = State.getApp();
    if (!Boot.isAdmin() || !confirm('Delete voucher?')) return;
    APP.vouch = (APP.vouch || []).filter(x => x.id !== id);
    State.save(); renderVouchers();
  }

  function setFilter(val) {
    vouchFilter = parseInt(val);
    renderVouchers();
  }

  return { renderMarket, renderVouchers, buy, redeem, deleteVouch, setFilter };
})();
