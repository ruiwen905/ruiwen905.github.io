/* tabs/play/games/clock/clock.js
   Type: game_clock — SVG analog clock with 4-choice answers */

(function () {
  const CSS = `
.clock-svg-wrap   { display:flex; justify-content:center; margin:14px 0; }
.clock-choices    { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; }
.clock-choice-btn { padding:14px 10px; border-radius:14px; border:2.5px solid #ddd; background:white; font-family:'Fredoka One',cursive; font-size:1.9rem; cursor:pointer; text-align:center; transition:all .15s; }
.clock-choice-btn:hover   { border-color:#7c6fcf; background:#f0edff; }
.clock-choice-btn.correct { border-color:#27ae60; background:#eaffea; }
.clock-choice-btn.wrong   { border-color:#e74c3c; background:#ffeaea; animation:shake .3s ease; }
.clock-score       { text-align:center; font-family:'Fredoka One',cursive; font-size:2rem; color:#5c52c0; margin-bottom:10px; }
.clock-instruction { text-align:center; font-size:1.8rem; color:#666; margin-bottom:14px; }
.game-btn { background:#7c6fcf; color:white; border:none; padding:12px 28px; border-radius:20px; font-family:'Fredoka One',cursive; font-size:2rem; cursor:pointer; display:block; margin:12px auto 0; }
@media(max-width:900px){.clock-choice-btn{font-size:1.2rem;padding:10px 6px;}.clock-instruction{font-size:1rem;}}
`;
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

  function clockSVG(h, m) {
    const cx = 100, cy = 100, r = 90;
    const hAngle = ((h % 12) + m / 60) * 30 - 90;
    const mAngle = m * 6 - 90;
    const hRad = hAngle * Math.PI / 180, mRad = mAngle * Math.PI / 180;
    const hLen = 52, mLen = 70;
    const hx = cx + hLen * Math.cos(hRad), hy = cy + hLen * Math.sin(hRad);
    const mx = cx + mLen * Math.cos(mRad), my = cy + mLen * Math.sin(mRad);

    const markers = Array.from({ length: 12 }, (_, i) => {
      const a = (i * 30 - 90) * Math.PI / 180;
      const x1 = cx + (r - 8)  * Math.cos(a), y1 = cy + (r - 8)  * Math.sin(a);
      const x2 = cx + r         * Math.cos(a), y2 = cy + r         * Math.sin(a);
      const lx = cx + (r - 22) * Math.cos(a), ly = cy + (r - 22) * Math.sin(a);
      return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#555" stroke-width="2.5"/>
        <text x="${lx.toFixed(1)}" y="${(ly + 5).toFixed(1)}" text-anchor="middle" font-size="13" font-family="Nunito,sans-serif" font-weight="700" fill="#333">${i === 0 ? 12 : i}</text>`;
    }).join('');

    return `<svg viewBox="0 0 200 200" width="200" height="200" style="filter:drop-shadow(0 4px 12px rgba(0,0,0,.2))">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="white" stroke="#5c52c0" stroke-width="5"/>
      <circle cx="${cx}" cy="${cy}" r="${r - 2}" fill="white"/>
      ${markers}
      <line x1="${cx}" y1="${cy}" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="#3a3180" stroke-width="6" stroke-linecap="round"/>
      <line x1="${cx}" y1="${cy}" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="#7c6fcf" stroke-width="4" stroke-linecap="round"/>
      <circle cx="${cx}" cy="${cy}" r="5" fill="#5c52c0"/>
    </svg>`;
  }

  function renderClock(item) {
    const shuffled = [...item.data.clocks].sort(() => Math.random() - .5);
    window._gState = { type:'clock', allClocks: item.data.clocks, clocks: shuffled, idx:0, score:0, answered:false, maxRounds: 10 };
    return clockHTML();
  }

  function clockHTML() {
    const gs = window._gState;
    const maxR = Math.min(gs.maxRounds, gs.clocks.length);
    if (gs.idx >= maxR) {
      return `<div style="text-align:center;padding:30px">
        <div style="font-size:5rem">🕐</div>
        <div style="font-family:'Fredoka One',cursive;font-size:3rem;color:#5c52c0">Score: ${gs.score}/${maxR}</div>
        <button class="game-btn" style="margin-top:20px" onclick="Clock.restart()">Play Again</button>
      </div>`;
    }
    const clk = gs.clocks[gs.idx];
    const wrongPool = gs.allClocks.filter(c => c.display !== clk.display).map(c => c.display);
    const distractors = wrongPool.sort(() => Math.random() - .5).slice(0, 3);
    const choices = [clk.display, ...distractors].sort(() => Math.random() - .5);

    return `<div class="clock-score">⭐ ${gs.score} / ${maxR}</div>
    <div class="clock-instruction">What time does the clock show?</div>
    <div class="clock-svg-wrap">${clockSVG(clk.h, clk.m)}</div>
    <div class="clock-choices">
      ${choices.map(c => `<button class="clock-choice-btn" onclick="Clock.check('${c.replace(/'/g, "\\'")}',this)">${c}</button>`).join('')}
    </div>`;
  }

  window.Clock = {
    check(choice, el) {
      const gs = window._gState; if (gs.answered) return;
      gs.answered = true;
      const clk = gs.clocks[gs.idx];
      if (choice === clk.display) { el.classList.add('correct'); gs.score++; }
      else {
        el.classList.add('wrong');
        document.querySelectorAll('.clock-choice-btn').forEach(btn => {
          if (btn.textContent.trim() === clk.display) btn.classList.add('correct');
        });
      }
      setTimeout(() => { gs.idx++; gs.answered = false; document.getElementById('pm-body').innerHTML = clockHTML(); }, 1000);
    },
    restart() {
      const gs = window._gState;
      gs.clocks = [...gs.allClocks].sort(() => Math.random() - .5);
      gs.idx = 0; gs.score = 0; gs.answered = false;
      document.getElementById('pm-body').innerHTML = clockHTML();
    }
  };

  GameRegistry.register({ types: ['game_clock'], icon: '🕐', label: 'Game', render: renderClock });
})();
