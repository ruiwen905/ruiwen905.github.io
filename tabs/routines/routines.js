/* tabs/routines/routines.js  (Habits tab — self-care + home-care) */

window.Routines = (() => {

  let CHORE_DATA = null;  // loaded from chores.json

  /* ── LOAD CHORE DATA ── */
  async function loadChoreData() {
    if (CHORE_DATA) return;
    try {
      const r = await fetch('/assets/data/chores.json');
      CHORE_DATA = r.ok ? await r.json() : {};
    } catch { CHORE_DATA = {}; }
  }

  /* ── ALL MEMBERS (kids + adults) ── */
  function allMembers() {
    const APP = State.getApp();
    const adults = APP.adults || [];
    return [...adults, ...APP.kids];
  }

  function isKid(key) {
    const APP = State.getApp();
    return APP.kids.some(k => k.key === key);
  }

  function getMember(key) {
    return allMembers().find(m => m.key === key);
  }

  /* ── MEMBER COLOR ── */
  const ADULT_COLORS = { papa:'#2c3e50', mama:'#8e44ad' };
  function memberColor(key) {
    if (ADULT_COLORS[key]) return ADULT_COLORS[key];
    return State.kidColor(key);
  }

  /* ── ROLE HELPERS ── */
  function getRole(key) {
    const APP = State.getApp();
    const member = getMember(key);
    return member ? (member.role || null) : null;
  }

  function getRoleDef(roleName) {
    if (!CHORE_DATA || !roleName) return null;
    return CHORE_DATA.ROLES && CHORE_DATA.ROLES[roleName] ? CHORE_DATA.ROLES[roleName] : null;
  }

  function getKidChoreDef(member) {
    if (!CHORE_DATA || !CHORE_DATA.KID_CHORES) return null;
    const age = member.age || 0;
    if (age <= 4) return CHORE_DATA.KID_CHORES['3-4'];
    return CHORE_DATA.KID_CHORES['5-6'];
  }

  /* ── BUILD BOARD ── */
  async function buildBoard() {
    await loadChoreData();
    const APP   = State.getApp();
    const board = document.getElementById('routines-board');
    const members = allMembers();

    board.innerHTML = members.map(m => {
      const isK = isKid(m.key);
      const col  = memberColor(m.key);
      const role = getRole(m.key);
      const roleDef = getRoleDef(role);
      const kidRole  = isK ? getKidChoreDef(m) : null;
      const roleInfo = roleDef || kidRole;

      return `<div class="member-panel" id="panel-${m.key}">
        <div class="panel-header" style="background:${col}">
          ${m.image
            ? `<img src="${m.image}" class="avatar-img" ondblclick="Boot.handleAdminTap(event)">`
            : `<div class="avatar-emoji" ondblclick="Boot.handleAdminTap(event)">${m.emoji || (m.gender==='girl'?'👧':'👦')}</div>`}
          <div class="panel-info">
            <div class="panel-name">${m.name}</div>
            <div class="panel-role">
              ${roleInfo ? `<span class="role-icon">${roleInfo.icon}</span>${role || (kidRole ? kidRole.role : '')}` : ''}
            </div>
            ${isK ? `<div class="panel-sub" id="sub-${m.key}">let's go! 🚀</div>` : ''}
            <button class="role-assign-btn" onclick="Routines.openRoleModal('${m.key}')">✏️ Role</button>
          </div>
          ${isK ? `<div class="star-badge">
            <span class="star-bg" id="starbg-${m.key}">⭐</span>
            <span class="star-count" id="starcnt-${m.key}" ondblclick="Boot.adminResetStars('${m.key}');event.stopPropagation()">0</span>
          </div>` : ''}
        </div>
        ${isK ? `<div id="road-${m.key}"></div>` : ''}
        <div class="panel-body" id="body-${m.key}"></div>
      </div>`;
    }).join('');

    members.forEach(m => renderMember(m.key));
  }

  /* ── RENDER ONE MEMBER ── */
  function renderMember(key) {
    const APP   = State.getApp();
    const isK   = isKid(key);
    if (isK) { renderRoad(key); renderBadge(key, false); renderSub(key); }
    renderBody(key);
  }

  /* ── RENDER BODY (self-care + home-care + countdown) ── */
  function renderBody(key) {
    const el = document.getElementById('body-' + key); if (!el) return;
    const APP = State.getApp();
    const isK = isKid(key);
    const hr  = new Date().getHours();
    const openM = hr >= 5 && hr <= 12;
    const openE = hr >= 16 && hr <= 23;

    let html = '';

    // ── SELF-CARE (kids only) ──
    if (isK) {
      const mDone = (APP.morning||[]).filter(t=>APP.tasks[key]&&APP.tasks[key][t.id]&&APP.tasks[key][t.id].done).length;
      const eDone = (APP.evening||[]).filter(t=>APP.tasks[key]&&APP.tasks[key][t.id]&&APP.tasks[key][t.id].done).length;
      html += `
        <details class="hab-block" ${openM?'open':''}>
          <summary><span class="sum-label">☀️ Morning</span><span class="sum-prog">${mDone}/${(APP.morning||[]).length}</span></summary>
          ${taskCards(APP.morning||[], key, 'morning')}
          <button class="add-task-btn" onclick="Admin.openAddTask('morning')">＋ Add</button>
        </details>
        <details class="hab-block" ${openE?'open':''}>
          <summary><span class="sum-label">🌙 Evening</span><span class="sum-prog">${eDone}/${(APP.evening||[]).length}</span></summary>
          ${taskCards(APP.evening||[], key, 'evening')}
          <button class="add-task-btn" onclick="Admin.openAddTask('evening')">＋ Add</button>
        </details>`;
    }

    // ── HOME-CARE (all members with a role) ──
    const role    = getRole(key);
    const member  = getMember(key);
    const roleDef = getRoleDef(role);
    const kidRole = isK ? getKidChoreDef(member) : null;
    const choreSrc = roleDef || kidRole;

    if (choreSrc && choreSrc.chores && choreSrc.chores.length) {
      const choreList = getChoreList(key, choreSrc.chores);
      const choreDone = choreList.filter(c => isDoneToday(key, c.id)).length;
      html += `
        <details class="hab-block" open>
          <summary><span class="sum-label">${choreSrc.icon} Home Chores</span><span class="sum-prog">${choreDone}/${choreList.length}</span></summary>
          ${choreList.map(c => choreCard(key, c)).join('')}
        </details>`;
    }

    // ── SPECIAL member chores (papa — fans + aircon) ──
    if (key === 'papa' && CHORE_DATA && CHORE_DATA.SPECIAL_CHORES) {
      html += `<details class="hab-block" open>
        <summary><span class="sum-label">🔧 Special Duties</span></summary>
        ${CHORE_DATA.SPECIAL_CHORES.map(c => countdownCard(key, c)).join('')}
      </details>`;
    }

    // ── SHARED COUNTDOWN (shoes – all members) ──
    if (CHORE_DATA && CHORE_DATA.SHARED_COUNTDOWN) {
      html += `<details class="hab-block" open>
        <summary><span class="sum-label">🔄 Monthly</span></summary>
        ${CHORE_DATA.SHARED_COUNTDOWN.map(c => countdownCard(key, c)).join('')}
      </details>`;
    }

    el.innerHTML = html;
  }

  /* ── TASK CARD HTML ── */
  function taskCards(list, key, type) {
    const APP = State.getApp();
    return list.map(t => {
      const done = APP.tasks[key] && APP.tasks[key][t.id] && APP.tasks[key][t.id].done;
      return `<div class="task-card ${done?'done':''}" onclick="Routines.toggle('${key}','${t.id}')">
        <div class="t-icon">${t.icon}</div>
        <div class="t-desc ${done?'strike':''}">${t.desc}</div>
        <div class="t-chk">${done?'✅':'⭕'}</div>
        <div class="task-admin-btns">
          <button onclick="Admin.editTask('${type}','${t.id}');event.stopPropagation()">✏️</button>
          <button class="del-btn" onclick="Admin.deleteTask('${type}','${t.id}',true);event.stopPropagation()">🗑</button>
        </div>
      </div>`;
    }).join('');
  }

  /* ── CHORE HELPERS ── */
  function getChoreList(key, baseList) {
    const APP = State.getApp();
    if (!APP.customChores) APP.customChores = {};
    const custom = APP.customChores[key] || [];
    return [...baseList, ...custom];
  }

  function isDoneToday(key, choreId) {
    const APP = State.getApp();
    const today = State.todayStr();
    return APP.tasks[key] && APP.tasks[key][choreId] && APP.tasks[key][choreId].done && APP.tasks[key][choreId].date === today;
  }

  function choreCard(key, c) {
    const done = isDoneToday(key, c.id);
    const freq = c.freq === 'daily' ? 'Daily' : c.freq === 'weekly' ? 'Weekly' : 'Monthly';
    return `<div class="chore-card ${done?'done':''}" onclick="Routines.toggleChore('${key}','${c.id}')">
      <div class="t-icon">${c.icon}</div>
      <div class="t-desc">
        <div class="${done?'strike':''}">${c.desc}</div>
        <div class="t-freq">${freq}</div>
      </div>
      <div class="t-chk">${done?'✅':'⬜'}</div>
    </div>`;
  }

  /* ── COUNTDOWN CARD ── */
  function countdownCard(key, c) {
    const APP = State.getApp();
    if (!APP.countdownDone) APP.countdownDone = {};
    const cdKey  = `${key}_${c.id}`;
    const last   = APP.countdownDone[cdKey] ? new Date(APP.countdownDone[cdKey]) : null;
    const today  = new Date();
    const daysSince = last ? Math.floor((today - last) / 86400000) : c.freqDays; // treat as overdue if never done
    const daysLeft  = c.freqDays - daysSince;
    const colorClass = daysLeft <= 2 ? 'cd-red' : daysLeft <= 7 ? 'cd-yellow' : 'cd-green';
    const daysLabel  = daysLeft <= 0
      ? `⚠️ Overdue by ${Math.abs(daysLeft)} day${Math.abs(daysLeft)!==1?'s':''}!`
      : daysLeft === 1 ? '1 day left'
      : `${daysLeft} days left`;
    const textColor = daysLeft <= 2 ? 'red' : daysLeft <= 7 ? 'yellow' : 'green';

    return `<div class="countdown-card ${colorClass}">
      <div class="cd-icon">${c.icon}</div>
      <div class="cd-info">
        <div class="cd-desc">${c.desc}</div>
        <div class="cd-days ${textColor}">${c.note ? c.note + ' · ' : ''}${daysLabel}</div>
      </div>
      <button class="cd-done-btn" onclick="Routines.markCountdown('${key}','${c.id}');event.stopPropagation()">✓ Done</button>
      <button class="cd-done-btn admin-edit" onclick="Routines.editCountdown('${key}','${c.id}');event.stopPropagation()">✏️</button>
    </div>`;
  }

  /* ── ROAD ── */
  function renderRoad(key) {
    const pct    = State.kidPct(key);
    const over80 = pct >= .8;
    const got    = State.getApp().sgiven[key] === State.todayStr();
    const el     = document.getElementById('road-' + key); if (!el) return;
    el.innerHTML = `<div class="road-wrap">
      <div class="road-label"><span>Self-care today</span><span>${State.kidDone(key)}/${State.allTasks().length}</span></div>
      <div class="road-outer">
        <div class="road-surface"></div><div class="road-stripe"></div>
        <div class="traffic-light">
          <div class="tl-dot ${over80?'':'red-on'}"></div>
          <div class="tl-dot" style="background:#bb7700"></div>
          <div class="tl-dot ${over80?'grn-on':''}"></div>
        </div>
        <div class="car" style="left:${7+pct*63}%">🚗</div>
        ${over80 ? `<div class="road-star">${got?'🌟':'⭐'}</div>` : ''}
      </div>
    </div>`;
  }

  function renderBadge(key, animate) {
    const n   = State.getStars(key);
    const cnt = document.getElementById('starcnt-' + key);
    const bg  = document.getElementById('starbg-' + key);
    if (cnt) cnt.textContent = n;
    if (animate && cnt && bg) {
      [cnt, bg].forEach(el => {
        el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
        setTimeout(() => el.classList.remove('pop'), 650);
      });
    }
  }

  function renderSub(key) {
    const pct = State.kidPct(key);
    const got = State.getApp().sgiven[key] === State.todayStr();
    const msg = pct===0 ? "let's go! 🚀" : pct<.5 ? "keep going! 💪" : pct<.8 ? "almost there! ✨" : got ? "⭐ star earned!" : "so close! 🌟";
    const el  = document.getElementById('sub-' + key); if (el) el.textContent = msg;
  }

  /* ── TOGGLE SELF-CARE ── */
  function toggle(key, tid) {
    const APP = State.getApp();
    if (!APP.tasks[key]) APP.tasks[key] = {};
    if (!APP.tasks[key][tid]) APP.tasks[key][tid] = { done: false, date: State.todayStr() };
    const was80 = State.kidPct(key) >= .8;
    APP.tasks[key][tid].done = !APP.tasks[key][tid].done;
    const now80 = State.kidPct(key) >= .8, today = State.todayStr();
    let gotStar = false;
    if (!was80 && now80 && APP.sgiven[key] !== today) {
      APP.stars[key] = (APP.stars[key] || 0) + 1;
      APP.sgiven[key] = today; gotStar = true;
    }
    State.save();
    renderRoad(key); renderBody(key); renderBadge(key, gotStar); renderSub(key);
    Boot.updateFloatingStar();
  }

  /* ── TOGGLE CHORE ── */
  function toggleChore(key, choreId) {
    const APP   = State.getApp();
    const today = State.todayStr();
    if (!APP.tasks[key]) APP.tasks[key] = {};
    const cur = APP.tasks[key][choreId];
    if (cur && cur.done && cur.date === today) {
      APP.tasks[key][choreId] = { done: false, date: today };
    } else {
      APP.tasks[key][choreId] = { done: true, date: today };
    }
    State.save(); renderBody(key);
  }

  /* ── COUNTDOWN ── */
  function markCountdown(key, id) {
    const APP = State.getApp();
    if (!APP.countdownDone) APP.countdownDone = {};
    APP.countdownDone[`${key}_${id}`] = new Date().toISOString();
    State.save(); renderBody(key);
  }

  function editCountdown(key, id) {
    // Admin can set the lastDone date manually
    const APP   = State.getApp();
    if (!APP.countdownDone) APP.countdownDone = {};
    const cdKey = `${key}_${id}`;
    const cur   = APP.countdownDone[cdKey] ? APP.countdownDone[cdKey].split('T')[0] : '';
    Admin.openModal('Edit Last Done Date',
      `<label>Last completed</label><input id="m-date" type="date" value="${cur}">`,
      `<button class="btn-save" onclick="Routines._saveCountdownDate('${key}','${id}')">Save</button>
       <button class="btn-cancel" onclick="Admin.closeModal()">Cancel</button>
       <button class="btn-danger" onclick="Routines._clearCountdown('${key}','${id}')">Reset to overdue</button>`
    );
  }

  window._saveCountdownDate = (key, id) => {
    const val = document.getElementById('m-date').value;
    const APP = State.getApp();
    if (!APP.countdownDone) APP.countdownDone = {};
    APP.countdownDone[`${key}_${id}`] = val ? new Date(val).toISOString() : null;
    State.save(); Admin.closeModal(); renderBody(key);
  };
  window._clearCountdown = (key, id) => {
    const APP = State.getApp();
    if (!APP.countdownDone) APP.countdownDone = {};
    delete APP.countdownDone[`${key}_${id}`];
    State.save(); Admin.closeModal(); renderBody(key);
  };

  /* ── ROLE MODAL ── */
  function openRoleModal(key) {
    const member  = getMember(key);
    const current = member ? (member.role || '') : '';
    const roleOpts = CHORE_DATA && CHORE_DATA.ROLES
      ? Object.keys(CHORE_DATA.ROLES).map(r =>
          `<option value="${r}" ${current===r?'selected':''}>${CHORE_DATA.ROLES[r].icon} ${r}</option>`
        ).join('')
      : '';
    Admin.openModal(`Assign Role — ${member ? member.name : key}`,
      `<label>Role</label>
       <select id="m-role"><option value="">— None —</option>${roleOpts}</select>`,
      `<button class="btn-save" onclick="Routines._saveRole('${key}')">Save</button>
       <button class="btn-cancel" onclick="Admin.closeModal()">Cancel</button>`
    );
  }

  window.Routines = window.Routines || {};
  window._saveRole = (key) => {
    const APP  = State.getApp();
    const role = document.getElementById('m-role').value;
    const member = getMember(key);
    if (member) member.role = role || null;
    State.save(); Admin.closeModal(); buildBoard();
  };

  /* ── ADULT MEMBERS ── */
  function ensureAdults() {
    const APP = State.getApp();
    if (!APP.adults) {
      const defaultAdults = CHORE_DATA && CHORE_DATA.ADULTS ? CHORE_DATA.ADULTS : [
        { key:'papa', name:'Papa', emoji:'👨', role:'Chef', image:null },
        { key:'mama', name:'Mama', emoji:'👩', role:'Hall Leader', image:null },
      ];
      APP.adults = JSON.parse(JSON.stringify(defaultAdults));
      State.save();
    }
  }

  return {
    buildBoard, renderMember, renderRoad, renderBadge, renderSub, renderBody,
    toggle, toggleChore, markCountdown, editCountdown, openRoleModal,
    allMembers, ensureAdults, isKid, getMember, memberColor,
  };
})();
