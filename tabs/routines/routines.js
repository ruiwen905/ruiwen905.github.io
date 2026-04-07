/* tabs/routines/routines.js */

window.Routines = (() => {

  function buildBoard() {
    const APP   = State.getApp();
    const board = document.getElementById('routines-board');
    board.innerHTML = APP.kids.map(k => `
      <div class="member-panel" id="panel-${k.key}">
        <div class="panel-header" style="background:${State.kidColor(k.key)}">
          ${k.image
            ? `<img src="${k.image}" class="avatar-img" ondblclick="Boot.handleAdminTap(event)">`
            : `<div class="avatar-emoji" ondblclick="Boot.handleAdminTap(event)">${k.gender === 'girl' ? '👧' : '👦'}</div>`}
          <div class="panel-info">
            <div class="panel-name">${k.name}</div>
            <div class="panel-sub" id="sub-${k.key}">let's go! 🚀</div>
          </div>
          <div class="star-badge">
            <span class="star-bg"   id="starbg-${k.key}">⭐</span>
            <span class="star-count" id="starcnt-${k.key}" ondblclick="Boot.adminResetStars('${k.key}');event.stopPropagation()">0</span>
          </div>
        </div>
        <div id="road-${k.key}"></div>
        <div class="routines" id="routines-${k.key}"></div>
      </div>`).join('');
  }

  function renderRoad(key) {
    const pct    = State.kidPct(key);
    const over80 = pct >= .8;
    const got    = State.getApp().sgiven[key] === State.todayStr();
    const el     = document.getElementById('road-' + key); if (!el) return;
    el.innerHTML = `<div class="road-wrap">
      <div class="road-label"><span>Today</span><span>${State.kidDone(key)}/${State.allTasks().length}</span></div>
      <div class="road-outer">
        <div class="road-surface"></div><div class="road-stripe"></div>
        <div class="traffic-light">
          <div class="tl-dot ${over80 ? '' : 'red-on'}"></div>
          <div class="tl-dot" style="background:#bb7700;"></div>
          <div class="tl-dot ${over80 ? 'grn-on' : ''}"></div>
        </div>
        <div class="car" style="left:${7 + pct * 63}%">🚗</div>
        ${over80 ? `<div class="road-star">${got ? '🌟' : '⭐'}</div>` : ''}
      </div></div>`;
  }

  function renderRoutines(key) {
    const APP  = State.getApp();
    const hr   = new Date().getHours();
    const openM = hr >= 5  && hr <= 12;
    const openE = hr >= 16 && hr <= 23;
    const mD   = (APP.morning || []).filter(t => APP.tasks[key] && APP.tasks[key][t.id] && APP.tasks[key][t.id].done).length;
    const eD   = (APP.evening || []).filter(t => APP.tasks[key] && APP.tasks[key][t.id] && APP.tasks[key][t.id].done).length;

    const cards = (list, type) => list.map(t => {
      const done = APP.tasks[key] && APP.tasks[key][t.id] && APP.tasks[key][t.id].done;
      return `<div class="task-card ${done ? 'done' : ''}" onclick="Routines.toggle('${key}','${t.id}')">
        <div class="t-icon">${t.icon}</div>
        <div class="t-desc ${done ? 'strike' : ''}">${t.desc}</div>
        <div class="t-chk">${done ? '✅' : '⭕'}</div>
        <div class="task-admin-btns">
          <button onclick="Admin.editTask('${type}','${t.id}');event.stopPropagation()">✏️</button>
          <button class="del-btn" onclick="Admin.deleteTask('${type}','${t.id}',true);event.stopPropagation()">🗑</button>
        </div></div>`;
    }).join('');

    const el = document.getElementById('routines-' + key); if (!el) return;
    el.innerHTML = `
      <details class="routine-block" ${openM ? 'open' : ''}>
        <summary><span class="sum-label">☀️ Morning Routine</span><span class="sum-prog">${mD}/${(APP.morning||[]).length}</span></summary>
        ${cards(APP.morning || [], 'morning')}
        <button class="add-task-btn" onclick="Admin.openAddTask('morning')">＋ Add Task</button>
      </details>
      <details class="routine-block" ${openE ? 'open' : ''}>
        <summary><span class="sum-label">🌙 Evening Routine</span><span class="sum-prog">${eD}/${(APP.evening||[]).length}</span></summary>
        ${cards(APP.evening || [], 'evening')}
        <button class="add-task-btn" onclick="Admin.openAddTask('evening')">＋ Add Task</button>
      </details>`;
  }

  function renderBadge(key, animate) {
    const n   = State.getStars(key);
    const cnt = document.getElementById('starcnt-' + key);
    const bg  = document.getElementById('starbg-'  + key);
    if (cnt) cnt.textContent = n;
    if (animate && cnt && bg) {
      [cnt, bg].forEach(el => { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); setTimeout(() => el.classList.remove('pop'), 650); });
    }
  }

  function renderSub(key) {
    const pct = State.kidPct(key);
    const got = State.getApp().sgiven[key] === State.todayStr();
    const msg = pct === 0 ? "let's go! 🚀" : pct < .5 ? "keep going! 💪" : pct < .8 ? "almost there! ✨" : got ? "⭐ star earned!" : "so close! 🌟";
    const el  = document.getElementById('sub-' + key); if (el) el.textContent = msg;
  }

  function toggle(key, tid) {
    const APP = State.getApp();
    if (!APP.tasks[key]) APP.tasks[key] = {};
    if (!APP.tasks[key][tid]) APP.tasks[key][tid] = { done: false, date: State.todayStr() };
    const was80 = State.kidPct(key) >= .8;
    APP.tasks[key][tid].done = !APP.tasks[key][tid].done;
    const now80 = State.kidPct(key) >= .8;
    const today = State.todayStr();
    let gotStar = false;
    if (!was80 && now80 && APP.sgiven[key] !== today) {
      APP.stars[key] = (APP.stars[key] || 0) + 1;
      APP.sgiven[key] = today;
      gotStar = true;
    }
    State.save();
    renderRoad(key); renderRoutines(key); renderBadge(key, gotStar); renderSub(key);
    Boot.updateFloatingStar();
  }

  return { buildBoard, renderRoad, renderRoutines, renderBadge, renderSub, toggle };
})();

// Global shortcuts
window.Routines = window.Routines;
