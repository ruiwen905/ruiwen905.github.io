/* tabs/play/games/puzzle/puzzle.js
   Type: game_puzzle — tap scrambled letter tiles to fill blank slots and spell a word. */
(function () {
  const CSS = `
.puz-wrap { display:flex; flex-direction:column; align-items:center; gap:12px; }
.puz-target { background:linear-gradient(135deg,#7c6fcf,#a78bfa); border-radius:16px; padding:16px 20px; text-align:center; width:100%; }
.puz-emoji { font-size:4rem; }
.puz-hint  { font-family:'Fredoka One',cursive; font-size:1.8rem; color:rgba(255,255,255,.85); margin-top:4px; }
.puz-slots { display:flex; gap:8px; justify-content:center; flex-wrap:wrap; }
.puz-slot  { width:58px; height:66px; border-bottom:4px solid #c5bef0; display:flex; align-items:center; justify-content:center;
  font-family:'Fredoka One',cursive; font-size:2.6rem; color:#5c52c0; cursor:pointer; transition:all .15s; border-radius:8px 8px 0 0; }
.puz-slot:hover { background:#f0edff; }
.puz-slot.filled   { border-color:#7c6fcf; background:#f0edff; }
.puz-slot.correct  { border-color:#27ae60; background:#eaffea; color:#27ae60; }
.puz-slot.wrong    { border-color:#e74c3c; background:#ffeaea; color:#e74c3c; animation:shake .3s ease; }
.puz-tiles { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.puz-tile  { width:58px; height:66px; border-radius:14px; border:2.5px solid #ddd; background:white;
  display:flex; align-items:center; justify-content:center; font-family:'Fredoka One',cursive;
  font-size:2.6rem; color:#3a3180; cursor:pointer; transition:all .15s; }
.puz-tile:hover   { border-color:#7c6fcf; background:#f0edff; transform:scale(1.08); }
.puz-tile.used    { background:#f0f0f0; color:#ccc; border-color:#eee; pointer-events:none; }
.puz-prog { font-size:1.6rem; color:#aaa; }
.puz-fb   { font-family:'Fredoka One',cursive; font-size:2.2rem; text-align:center; min-height:36px; }
.puz-btns { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
.game-btn { background:#7c6fcf;color:white;border:none;padding:11px 24px;border-radius:18px;font-family:'Fredoka One',cursive;font-size:1.9rem;cursor:pointer; }
.game-btn.grey  { background:#eee; color:#555; }
.game-btn.amber { background:#f39c12; color:white; }
@media(max-width:900px){ .puz-slot,.puz-tile{width:44px;height:50px;font-size:1.8rem;} }
`;
  document.head.appendChild(Object.assign(document.createElement('style'), {textContent: CSS}));

  function shuf(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}

  let P = {};

  function makeTiles(word) {
    const letters = word.toUpperCase().split('');
    const pool = new Set(letters);
    const extras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l=>!pool.has(l));
    const distCount = Math.min(4, 12 - letters.length);
    return shuf([...letters, ...shuf(extras).slice(0, distCount)])
      .map((ch,i)=>({id:i, ch, used:false}));
  }

  function render(item) {
    const puzzles = shuf(item.data.puzzles);
    P = {puzzles, idx:0, score:0, slots:[], tiles:[], checked:false, _item:item};
    return puzHTML();
  }

  function puzHTML() {
    const cur = P.puzzles[P.idx];
    const word = cur.word.toUpperCase();
    if (!P.tiles.length) P.tiles = makeTiles(word);
    if (!P.slots.length) P.slots = Array(word.length).fill(null);

    const slotEls = P.slots.map((s,i)=>{
      let cls = s ? 'filled' : '';
      if (P.checked && s) cls = s === word[i] ? 'correct' : 'wrong';
      return `<div class="puz-slot ${cls}" onclick="Puz.removeSlot(${i})">${s||''}</div>`;
    }).join('');

    const tileEls = P.tiles.map((t,i)=>
      `<div class="puz-tile${t.used?' used':''}" onclick="Puz.pickTile(${i})">${t.ch}</div>`
    ).join('');

    return `<div class="puz-wrap">
      <div class="puz-prog">Puzzle ${P.idx+1} / ${P.puzzles.length} &nbsp; ⭐ ${P.score}</div>
      <div class="puz-target">
        <div class="puz-emoji">${cur.emoji}</div>
        <div class="puz-hint">${cur.hint || 'Spell the word!'}</div>
      </div>
      <div class="puz-slots">${slotEls}</div>
      <div class="puz-tiles">${tileEls}</div>
      <div class="puz-fb" id="puz-fb"></div>
      <div class="puz-btns">
        <button class="game-btn grey"  onclick="Puz.clear()">🗑 Clear</button>
        <button class="game-btn amber" onclick="Puz.check()">✓ Check</button>
        ${P.checked ? `<button class="game-btn" onclick="Puz.next()">${P.idx<P.puzzles.length-1?'Next →':'Finish!'}</button>` : ''}
      </div>
    </div>`;
  }

  window.Puz = {
    pickTile(i) {
      if (P.tiles[i].used) return;
      const emptyIdx = P.slots.findIndex(s=>s===null);
      if (emptyIdx === -1) return;
      P.slots[emptyIdx] = P.tiles[i].ch;
      P.tiles[i].used = true;
      P.checked = false;
      document.getElementById('pm-body').innerHTML = puzHTML();
    },
    removeSlot(i) {
      if (!P.slots[i]) return;
      const ch = P.slots[i]; P.slots[i] = null;
      const tile = P.tiles.find(t=>t.ch===ch&&t.used);
      if (tile) tile.used = false;
      P.checked = false;
      document.getElementById('pm-body').innerHTML = puzHTML();
    },
    clear() {
      P.slots = Array(P.puzzles[P.idx].word.length).fill(null);
      P.tiles.forEach(t=>t.used=false); P.checked = false;
      document.getElementById('pm-body').innerHTML = puzHTML();
    },
    check() {
      if (P.slots.some(s=>s===null)) {
        const fb=document.getElementById('puz-fb'); if(fb){fb.textContent='Fill all the blanks first!';fb.style.color='#e74c3c';} return;
      }
      P.checked = true;
      const word = P.puzzles[P.idx].word.toUpperCase();
      const ok   = P.slots.join('') === word;
      if (ok) P.score++;
      document.getElementById('pm-body').innerHTML = puzHTML();
      const fb = document.getElementById('puz-fb');
      if (fb) { fb.textContent = ok ? '✅ Correct! 🎉' : `❌ The word is ${word}`; fb.style.color = ok?'#27ae60':'#e74c3c'; }
    },
    next() {
      P.idx++; P.slots=[]; P.tiles=[]; P.checked=false;
      if (P.idx >= P.puzzles.length) {
        document.getElementById('pm-body').innerHTML = `<div style="text-align:center;padding:30px">
          <div style="font-size:5rem">🧩</div>
          <div style="font-family:'Fredoka One',cursive;font-size:3rem;color:#7c6fcf;margin:10px 0">All puzzles done!</div>
          <div style="font-size:2rem;color:#666">Score: ${P.score} / ${P.puzzles.length}</div>
          <button class="game-btn" style="margin-top:16px" onclick="document.getElementById('pm-body').innerHTML=render(P._item)">Play Again</button>
        </div>`;
        return;
      }
      document.getElementById('pm-body').innerHTML = puzHTML();
    }
  };

  const _r = render;
  GameRegistry.register({ types:['game_puzzle'], icon:'🧩', label:'Puzzle', render: item=>{ P._item=item; return _r(item); } });
})();
