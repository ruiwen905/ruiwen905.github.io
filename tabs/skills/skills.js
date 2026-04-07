/* tabs/skills/skills.js */

window.Skills = (() => {
  const COLORS = ['#7c6fcf','#e8789a','#4db89e','#f39c12','#e74c3c','#3498db','#9b59b6'];

  function buildBoard() {
    const APP   = State.getApp();
    const board = document.getElementById('skills-board');
    board.innerHTML = APP.kids.map(k => `
      <div class="kid-skills-col">
        <div class="kid-skills-header" style="background:${State.kidColor(k.key)}">
          ${k.image
            ? `<img src="${k.image}" class="avatar-img">`
            : `<div class="avatar-emoji">${k.gender === 'girl' ? '👧' : '👦'}</div>`}
          <div class="kid-skills-name">${k.name}</div>
        </div>
        <div class="medal-showcase" id="medals-${k.key}"></div>
        <div class="skill-cards" id="sc-${k.key}"></div>
        <button class="add-skill-btn" onclick="Admin.openAddSkill('${k.key}')">＋ Add Skill</button>
      </div>`).join('');
  }

  function renderCol(key) {
    renderMedalShowcase(key);
    const APP    = State.getApp();
    const el     = document.getElementById('sc-' + key); if (!el) return;
    const skills = (APP.skills[key] || []).filter(sk => !sk.mastered);

    el.innerHTML = skills.length ? skills.map((sk, i) => {
      const color = sk.color || COLORS[i % COLORS.length];
      const pct   = Math.min(100, Math.round(((sk.current || 0) / sk.target) * 100));
      return `<div class="skill-card">
        <div class="skill-card-head">
          <div class="skill-icon">${sk.icon}</div>
          <div class="skill-name">${sk.name}</div>
          <button class="skill-edit-btn" onclick="Admin.editSkill('${key}','${sk.id}')">✏️</button>
        </div>
        <div class="skill-progress-area">
          <div class="skill-bar-wrap" onclick="Skills.tapSkill('${key}','${sk.id}')" title="Tap to practice!">
            <div class="skill-bar-fill" style="width:${pct}%;background:${color}"></div>
            <div class="skill-bar-tap">Tap to practice! ${sk.current || 0}/${sk.target}</div>
          </div>
          <div class="skill-bar-label"><span>${sk.current || 0} / ${sk.target}</span><span>${pct}%</span></div>
          ${sk.milestone ? `<div class="skill-milestone">🎯 Goal: ${sk.milestone}</div>` : ''}
        </div>
      </div>`;
    }).join('') : `<div style="text-align:center;color:#ddd;padding:20px;font-size:1.6rem;">All skills mastered! 🎉</div>`;
  }

  function renderMedalShowcase(key) {
    const APP     = State.getApp();
    const el      = document.getElementById('medals-' + key); if (!el) return;
    const mastered = (APP.skills[key] || []).filter(sk => sk.mastered);

    if (!mastered.length) {
      el.innerHTML = `<div class="medal-showcase-title">🏆 Trophy Case</div>
        <div class="medal-empty">Complete skills to earn medals!</div>`;
      return;
    }
    el.innerHTML = `<div class="medal-showcase-title">🏆 Trophy Case <span style="color:#f5c842">${mastered.length} medal${mastered.length !== 1 ? 's' : ''}</span></div>
      <div class="medal-grid">
        ${mastered.map(sk => {
          const d = sk.masteredDate ? new Date(sk.masteredDate).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'2-digit' }) : '';
          return `<div class="medal-badge"
            onmouseenter="Skills.showTip(event,'${(sk.milestone||sk.name).replace(/'/g,"&#39;")}')"
            onmouseleave="Skills.hideTip()">
            <div class="mb-icon">${sk.icon}🥇</div>
            <div class="mb-name">${sk.name}</div>
            ${d ? `<div class="mb-date">${d}</div>` : ''}
          </div>`;
        }).join('')}
      </div>`;
  }

  function tapSkill(key, id) {
    const APP = State.getApp();
    const sk  = (APP.skills[key] || []).find(s => s.id === id); if (!sk || sk.mastered) return;
    sk.current = (sk.current || 0) + 1;
    if (sk.current >= sk.target) { sk.mastered = true; sk.masteredDate = new Date().toISOString(); }
    State.save(); renderCol(key);
  }

  function showTip(e, text) {
    const tip = document.getElementById('medal-tooltip');
    tip.textContent = text; tip.style.opacity = '1';
    tip.style.left = (e.pageX + 10) + 'px'; tip.style.top = (e.pageY - 40) + 'px';
  }
  function hideTip() { document.getElementById('medal-tooltip').style.opacity = '0'; }

  return { buildBoard, renderCol, renderMedalShowcase, tapSkill, showTip, hideTip };
})();
