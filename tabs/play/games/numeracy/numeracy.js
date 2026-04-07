/* tabs/play/games/numeracy/numeracy.js
   Types: game_counting, game_patterns */

(function () {
  const CSS = `
.count-objects  { display:flex; flex-wrap:wrap; justify-content:center; gap:8px; margin:16px 0; min-height:80px; align-items:center; font-size:3rem; }
.count-question { text-align:center; font-family:'Fredoka One',cursive; font-size:2.4rem; color:#555; margin-bottom:14px; }
.count-choices  { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-bottom:14px; }
.count-btn      { font-family:'Fredoka One',cursive; font-size:2.8rem; padding:14px; border-radius:14px; border:2.5px solid #ddd; background:white; cursor:pointer; text-align:center; transition:all .15s; }
.count-btn:hover   { border-color:#7c6fcf; background:#f0edff; }
.count-btn.correct { border-color:#27ae60; background:#eaffea; }
.count-btn.wrong   { border-color:#e74c3c; background:#ffeaea; animation:shake .3s ease; }
.count-score    { text-align:center; font-family:'Fredoka One',cursive; font-size:2.2rem; color:#4db89e; }
.pattern-row    { display:flex; align-items:center; justify-content:center; gap:8px; margin:16px 0; flex-wrap:wrap; }
.pattern-item   { font-size:3rem; width:56px; height:56px; display:flex; align-items:center; justify-content:center; background:#f8f6ff; border-radius:12px; }
.pattern-blank  { border:3px dashed #7c6fcf; border-radius:12px; width:56px; height:56px; display:flex; align-items:center; justify-content:center; font-size:2.4rem; }
.pattern-choices { display:flex; justify-content:center; gap:12px; margin-bottom:16px; }
.pattern-choice  { font-size:3rem; width:70px; height:70px; display:flex; align-items:center; justify-content:center; background:#f8f6ff; border:2.5px solid #ddd; border-radius:14px; cursor:pointer; transition:all .15s; }
.pattern-choice:hover   { border-color:#7c6fcf; background:#f0edff; }
.pattern-choice.correct { border-color:#27ae60; background:#eaffea; }
.pattern-choice.wrong   { border-color:#e74c3c; background:#ffeaea; animation:shake .3s ease; }
.game-btn { background:#7c6fcf; color:white; border:none; padding:12px 28px; border-radius:20px; font-family:'Fredoka One',cursive; font-size:2rem; cursor:pointer; display:block; margin:12px auto 0; }
@media(max-width:900px){.count-question{font-size:1.4rem;}.count-btn{font-size:1.8rem;padding:10px;}}
`;
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

  /* ── COUNTING ── */
  function renderCounting(item) {
    window._gState = { type:'counting', data: item.data, score:0, round:0, maxRounds:8, answered:false };
    return countHTML();
  }

  function countHTML() {
    const gs = window._gState;
    if (gs.round >= gs.maxRounds) {
      return `<div style="text-align:center;padding:30px">
        <div style="font-size:5rem">🎉</div>
        <div style="font-family:'Fredoka One',cursive;font-size:3rem;color:#4db89e">Score: ${gs.score}/${gs.maxRounds}</div>
        <button class="game-btn" style="margin-top:20px" onclick="Numeracy.restartCount()">Play Again!</button>
      </div>`;
    }
    const max = gs.data.max || 10;
    const correct = Math.floor(Math.random() * max) + 1;
    const choices = new Set([correct]);
    while (choices.size < 4) { const n = Math.floor(Math.random() * max) + 1; if (n !== correct) choices.add(n); }
    const arr = [...choices].sort(() => Math.random() - .5);
    gs.current = correct; gs.answered = false;
    const em = gs.data.emoji || '🍎';
    return `<div class="count-score">⭐ ${gs.score} / ${gs.maxRounds}</div>
    <div class="count-objects">${Array.from({ length: correct }, () => em).join(' ')}</div>
    <div class="count-question">How many ${em}?</div>
    <div class="count-choices">${arr.map(n => `<button class="count-btn" onclick="Numeracy.checkCount(${n},this)">${n}</button>`).join('')}</div>`;
  }

  /* ── PATTERNS ── */
  function shuffle(arr) { const a=[...arr]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; }

  function renderPatterns(item) {
    const shuffledPats = shuffle(item.data.patterns);
    window._gState = { type:'patterns', data:{...item.data, patterns:shuffledPats}, idx:0, score:0, answered:false };
    return patHTML();
  }

  function patHTML() {
    const gs = window._gState;
    if (gs.idx >= gs.data.patterns.length) {
      return `<div style="text-align:center;padding:30px">
        <div style="font-size:5rem">🎉</div>
        <div style="font-family:'Fredoka One',cursive;font-size:3rem;color:#7c6fcf">Score: ${gs.score}/${gs.data.patterns.length}</div>
        <button class="game-btn" onclick="Numeracy.restartPatterns()">Play Again</button>
      </div>`;
    }
    const p = gs.data.patterns[gs.idx];
    return `<div style="text-align:center;font-family:'Fredoka One',cursive;font-size:2rem;color:#666;margin-bottom:8px">What comes next?</div>
    <div class="pattern-row">
      ${p.seq.map(s => `<div class="pattern-item">${s}</div>`).join('')}
      <div class="pattern-blank">?</div>
    </div>
    <div class="pattern-choices">
      ${p.choices.map(c => `<div class="pattern-choice" onclick="Numeracy.checkPattern('${c}',this)">${c}</div>`).join('')}
    </div>
    <div style="text-align:center;font-size:1.8rem;color:#aaa">Pattern ${gs.idx+1}/${gs.data.patterns.length} &nbsp;⭐ ${gs.score}</div>`;
  }

  window.Numeracy = {
    checkCount(n, btn) {
      const gs = window._gState; if (gs.answered) return;
      gs.answered = true;
      if (n === gs.current) { btn.classList.add('correct'); gs.score++; }
      else btn.classList.add('wrong');
      setTimeout(() => { gs.round++; document.getElementById('pm-body').innerHTML = countHTML(); }, 900);
    },
    restartCount() {
      const gs = window._gState;
      gs.score = 0; gs.round = 0; gs.answered = false;
      document.getElementById('pm-body').innerHTML = countHTML();
    },
    checkPattern(choice, el) {
      const gs = window._gState; if (gs.answered) return;
      gs.answered = true;
      if (choice === gs.data.patterns[gs.idx].ans) { el.classList.add('correct'); gs.score++; }
      else el.classList.add('wrong');
      setTimeout(() => { gs.idx++; gs.answered = false; document.getElementById('pm-body').innerHTML = patHTML(); }, 700);
    },
    restartPatterns() {
      const gs = window._gState;
      gs.data.patterns = shuffle(gs.data.patterns);
      gs.idx = 0; gs.score = 0; gs.answered = false;
      document.getElementById('pm-body').innerHTML = patHTML();
    }
  };

  GameRegistry.register({ types: ['game_counting'], icon: '🔢', label: 'Game', render: renderCounting });
  GameRegistry.register({ types: ['game_patterns'], icon: '🔷', label: 'Game', render: renderPatterns });
})();
