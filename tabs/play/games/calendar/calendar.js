/* tabs/play/games/calendar/calendar.js
   Types: game_days_spell, game_days_seq, game_months_spell, game_months_seq */

(function () {
  const CSS = `
/* ── SPELL ── */
.spell-card     { background:linear-gradient(135deg,#5c52c0,#8b5cf6); border-radius:20px; padding:24px 20px; text-align:center; margin-bottom:16px; }
.spell-emoji    { font-size:4rem; margin-bottom:8px; }
.spell-word     { font-family:'Fredoka One',cursive; font-size:3.2rem; color:white; letter-spacing:4px; min-height:52px; }
.spell-fact     { background:#f0edff; border-radius:14px; padding:12px 16px; font-size:1.8rem; color:#444; line-height:1.5; margin-bottom:14px; }
.spell-answer-row { display:flex; flex-wrap:wrap; gap:6px; justify-content:center; margin-bottom:14px; }
.spell-slot     { width:44px; height:52px; border-bottom:3px solid #5c52c0; display:flex; align-items:center; justify-content:center; font-family:'Fredoka One',cursive; font-size:2.2rem; color:#5c52c0; cursor:pointer; transition:all .15s; }
.spell-slot:hover { background:#f0edff; border-radius:8px 8px 0 0; }
.spell-slot.filled { border-color:#27ae60; color:#27ae60; }
.spell-letters  { display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin-bottom:14px; }
.spell-letter-btn { width:52px; height:52px; border-radius:12px; border:2px solid #ddd; background:white; font-family:'Fredoka One',cursive; font-size:2rem; cursor:pointer; transition:all .15s; display:flex; align-items:center; justify-content:center; }
.spell-letter-btn:hover { border-color:#7c6fcf; background:#f0edff; }
.spell-letter-btn.used  { background:#eee; color:#ccc; cursor:not-allowed; border-color:#eee; }
.spell-result   { text-align:center; font-family:'Fredoka One',cursive; font-size:2.4rem; min-height:40px; margin:10px 0; }
.spell-progress { text-align:center; font-size:1.6rem; color:#aaa; margin-bottom:10px; }
.spell-nav      { display:flex; gap:10px; align-items:center; justify-content:center; margin-top:6px; }
.spell-nav button      { background:#eee; border:none; padding:10px 18px; border-radius:14px; font-family:'Fredoka One',cursive; font-size:1.8rem; cursor:pointer; }
.spell-nav .spell-check { background:#5c52c0; color:white; }
.spell-nav .spell-clear { background:#f39c12; color:white; }
/* ── SEQ ── */
.seq-question   { text-align:center; margin:10px 0 20px; }
.seq-q-emoji    { font-size:4rem; }
.seq-q-word     { font-family:'Fredoka One',cursive; font-size:2.8rem; color:#3a3180; margin-top:6px; }
.seq-q-label    { font-size:1.6rem; color:#888; margin-top:4px; }
.seq-choices    { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:14px; }
.seq-btn        { padding:14px 10px; border-radius:14px; border:2.5px solid #ddd; background:white; font-family:'Fredoka One',cursive; font-size:2rem; cursor:pointer; text-align:center; transition:all .15s; display:flex; flex-direction:column; align-items:center; gap:4px; }
.seq-btn:hover  { border-color:#7c6fcf; background:#f0edff; }
.seq-btn.correct { border-color:#27ae60; background:#eaffea; }
.seq-btn.wrong   { border-color:#e74c3c; background:#ffeaea; animation:shake .3s ease; }
.seq-score      { text-align:center; font-family:'Fredoka One',cursive; font-size:2rem; color:#5c52c0; margin-bottom:12px; }
.seq-feedback   { text-align:center; font-family:'Fredoka One',cursive; font-size:2.2rem; min-height:40px; margin:8px 0; }
.game-btn { background:#7c6fcf; color:white; border:none; padding:12px 28px; border-radius:20px; font-family:'Fredoka One',cursive; font-size:2rem; cursor:pointer; display:block; margin:12px auto 0; }
@media(max-width:900px){
  .spell-fact{font-size:1rem;} .spell-word{font-size:2rem;} .spell-letter-btn{width:38px;height:38px;font-size:1.4rem;}
  .spell-slot{width:34px;height:40px;font-size:1.6rem;} .seq-btn{font-size:1.2rem;padding:10px 6px;}
}
`;
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

  /* ── SHARED SHUFFLE ── */
  function shuffleLetters(word) {
    const arr = word.toUpperCase().split('');
    for (let tries = 0; tries < 20; tries++) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      if (arr.join('') !== word.toUpperCase()) break;
    }
    return arr.map((l, i) => ({ letter: l, idx: i, used: false }));
  }

  function speak2x(word) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const say = (n) => {
      if (n <= 0) return;
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'en-US'; u.rate = 0.75;
      u.onend = () => setTimeout(() => say(n-1), 350);
      window.speechSynthesis.speak(u);
    };
    say(2);
  }

    /* ── SPELL ── */
  function renderSpell(item) {
    window._gState = { type:'spell', data: item.data, idx:0, answer:[], score:0, shuffled:[] };
    return spellHTML();
  }

  function spellHTML() {
    const gs   = window._gState;
    const item = gs.data.items[gs.idx];
    if (!gs.shuffled[gs.idx]) gs.shuffled[gs.idx] = shuffleLetters(item.word);
    const tiles  = gs.shuffled[gs.idx];
    const ans    = gs.answer;
    const wordLen = item.word.length;
    const isComplete = ans.length === wordLen;
    const isCorrect  = isComplete && ans.map(a => a.letter).join('') === item.word.toUpperCase();

    setTimeout(() => { if(typeof speak2x!=="undefined") speak2x(item.word); }, 80);
    return `<div class="spell-progress">${gs.idx + 1} / ${gs.data.items.length}</div>
    <div class="spell-card" onclick="speak2x('${item.word}')" style="cursor:pointer" title="Tap to hear">
      <div class="spell-emoji">${item.emoji}</div>
      <div class="spell-word">${ans.map(a => a.letter).join(' ') || '_ '.repeat(wordLen).trim()}</div>
    </div>
    <div class="spell-fact">${item.fact}</div>
    <div class="spell-answer-row">
      ${Array.from({ length: wordLen }, (_, i) => `<div class="spell-slot ${ans[i]?'filled':''}" onclick="Calendar.remove(${i})">${ans[i] ? ans[i].letter : ''}</div>`).join('')}
    </div>
    <div class="spell-letters">
      ${tiles.map((t, i) => `<button class="spell-letter-btn ${t.used?'used':''}" onclick="Calendar.pick(${i})" ${t.used?'disabled':''}>${t.letter}</button>`).join('')}
    </div>
    ${isComplete ? `<div class="spell-result">${isCorrect ? '✅ Correct! 🎉' : '❌ Not quite — try again!'}</div>` : '<div class="spell-result"></div>'}
    <div class="spell-nav">
      ${ans.length ? `<button class="spell-clear" onclick="Calendar.clear()">Clear</button>` : ''}
      ${isCorrect  ? `<button class="spell-check" onclick="Calendar.nextSpell()">${gs.idx < gs.data.items.length - 1 ? 'Next →' : 'Finish! ✓'}</button>` : ''}
    </div>`;
  }

  /* ── SEQ ── */
  function renderSeq(item) {
    const rounds = [...item.data.rounds].sort(() => Math.random() - .5);
    window._gState = { type:'seq', data: item.data, rounds, idx:0, score:0, answered:false };
    return seqHTML();
  }

  function seqHTML() {
    const gs = window._gState;
    if (gs.idx >= gs.rounds.length) {
      return `<div style="text-align:center;padding:30px">
        <div style="font-size:5rem">🎉</div>
        <div style="font-family:'Fredoka One',cursive;font-size:3rem;color:#5c52c0">Score: ${gs.score}/${gs.rounds.length}</div>
        <button class="game-btn" onclick="Calendar.restartSeq()">Play Again</button>
      </div>`;
    }
    const r = gs.rounds[gs.idx];
    return `<div class="seq-score">⭐ ${gs.score} / ${gs.rounds.length}</div>
    <div class="seq-question">
      <div class="seq-q-emoji">${r.questionEmoji}</div>
      <div class="seq-q-word">${r.question}</div>
      <div class="seq-q-label">What comes after?</div>
    </div>
    <div class="seq-choices">
      ${r.choices.map(c => `<button class="seq-btn" onclick="Calendar.checkSeq('${c}',this)"><span>${c}</span></button>`).join('')}
    </div>
    <div class="seq-feedback" id="seq-fb"></div>`;
  }

  window.Calendar = {
    pick(i) {
      const gs = window._gState;
      const tiles = gs.shuffled[gs.idx];
      if (tiles[i].used) return;
      if (gs.answer.length >= gs.data.items[gs.idx].word.length) return;
      tiles[i].used = true;
      gs.answer.push({ letter: tiles[i].letter, tileIdx: i });
      document.getElementById('pm-body').innerHTML = spellHTML();
    },
    remove(pos) {
      const gs = window._gState;
      if (pos >= gs.answer.length) return;
      const removed = gs.answer.splice(pos, 1)[0];
      gs.shuffled[gs.idx][removed.tileIdx].used = false;
      document.getElementById('pm-body').innerHTML = spellHTML();
    },
    clear() {
      const gs = window._gState;
      gs.answer.forEach(a => { gs.shuffled[gs.idx][a.tileIdx].used = false; });
      gs.answer = [];
      document.getElementById('pm-body').innerHTML = spellHTML();
    },
    nextSpell() {
      const gs = window._gState;
      gs.score++; gs.idx++; gs.answer = [];
      if (gs.idx >= gs.data.items.length) {
        document.getElementById('pm-body').innerHTML = `<div style="text-align:center;padding:30px">
          <div style="font-size:5rem">🎉</div>
          <div style="font-family:'Fredoka One',cursive;font-size:3rem;color:#5c52c0">All spelled correctly!</div>
          <div style="font-size:2rem;color:#666;margin-top:8px">${gs.score} / ${gs.data.items.length}</div>
          <button class="game-btn" style="margin-top:20px" onclick="Calendar.restartSpell()">Play Again</button>
        </div>`;
        return;
      }
      document.getElementById('pm-body').innerHTML = spellHTML();
    },
    restartSpell() {
      const gs = window._gState;
      const items = [...gs.data.items].sort(() => Math.random() - .5);
      gs.data = {...gs.data, items};
      gs.idx = 0; gs.score = 0; gs.answer = []; gs.shuffled = [];
      document.getElementById('pm-body').innerHTML = spellHTML();
    },
    checkSeq(choice, el) {
      const gs = window._gState; if (gs.answered) return;
      gs.answered = true;
      const r = gs.rounds[gs.idx];
      const fb = document.getElementById('seq-fb');
      if (choice === r.answer) {
        el.classList.add('correct'); gs.score++;
        if (fb) fb.textContent = '✅ Correct!';
      } else {
        el.classList.add('wrong');
        if (fb) fb.innerHTML = `❌ It's <strong>${r.answer}</strong>!`;
        document.querySelectorAll('.seq-btn').forEach(btn => {
          if (btn.querySelector('span').textContent === r.answer) btn.classList.add('correct');
        });
      }
      setTimeout(() => { gs.idx++; gs.answered = false; document.getElementById('pm-body').innerHTML = seqHTML(); }, 1100);
    },
    restartSeq() {
      const gs = window._gState;
      gs.rounds = [...gs.data.rounds].sort(() => Math.random() - .5);
      gs.idx = 0; gs.score = 0; gs.answered = false;
      document.getElementById('pm-body').innerHTML = seqHTML();
    },
  };

  GameRegistry.register({ types: ['game_days_spell', 'game_months_spell'], icon: '📅', label: 'Game', render: renderSpell });
  GameRegistry.register({ types: ['game_days_seq',   'game_months_seq'],   icon: '🗓️', label: 'Game', render: renderSeq });
})();
