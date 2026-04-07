/* tabs/play/games/puzzle/puzzle.js
   Type: game_puzzle — slide tile puzzle for words + emojis */
(function () {
  const CSS = `
.puzzle-wrap { display:flex; flex-direction:column; align-items:center; gap:12px; }
.puzzle-word-target { background:linear-gradient(135deg,#7c6fcf,#a78bfa); border-radius:14px;
  padding:14px 20px; text-align:center; width:100%; }
.puzzle-word-target .pw-emoji { font-size:3.5rem; }
.puzzle-word-target .pw-hint  { font-family:'Fredoka One',cursive; font-size:1.8rem; color:rgba(255,255,255,.8); margin-top:4px; }
.puzzle-slots { display:flex; gap:8px; justify-content:center; flex-wrap:wrap; margin:8px 0; }
.puzzle-slot  { width:56px; height:62px; border:3px dashed #c5bef0; border-radius:12px;
  display:flex; align-items:center; justify-content:center; font-family:'Fredoka One',cursive;
  font-size:2.4rem; color:#5c52c0; transition:all .2s; background:#f8f6ff; }
.puzzle-slot.filled  { border-style:solid; border-color:#7c6fcf; background:#f0edff; }
.puzzle-slot.correct { border-color:#27ae60; background:#eaffea; color:#27ae60; }
.puzzle-slot.wrong   { border-color:#e74c3c; background:#ffeaea; color:#e74c3c; animation:shake .3s ease; }
.puzzle-tiles { display:flex; gap:8px; flex-wrap:wrap; justify-content:center; }
.puzzle-tile  { width:56px; height:62px; border-radius:12px; border:2.5px solid #ddd; background:white;
  display:flex; align-items:center; justify-content:center; font-family:'Fredoka One',cursive;
  font-size:2.4rem; color:#3a3180; cursor:pointer; transition:all .15s; user-select:none; }
.puzzle-tile:hover  { border-color:#7c6fcf; background:#f0edff; }
.puzzle-tile.picked { border-color:#7c6fcf; background:#7c6fcf; color:white; transform:scale(1.1); }
.puzzle-tile.used   { opacity:.25; cursor:default; pointer-events:none; }
.puzzle-prog { font-size:1.6rem; color:#aaa; }
.game-btn { background:#7c6fcf;color:white;border:none;padding:12px 28px;border-radius:20px;
  font-family:'Fredoka One',cursive;font-size:2rem;cursor:pointer;display:block;margin:14px auto 0; }
.puzzle-feedback { font-family:'Fredoka One',cursive; font-size:2.2rem; text-align:center; min-height:38px; }
@media(max-width:900px){ .puzzle-slot,.puzzle-tile{width:42px;height:48px;font-size:1.7rem;} }
`;
  const S = document.createElement('style'); S.textContent = CSS; document.head.appendChild(S);

  function shuffle(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}

  let _ps = {};

  function render(item) {
    const puzzles = shuffle(item.data.puzzles);
    _ps = { puzzles, idx:0, score:0, slots:[], picked:null, tiles:[], checked:false };
    _ps._item = item;
    return puzzleHTML();
  }

  function makeTiles(word) {
    // word letters + extra distractors shuffled
    const letters = word.toUpperCase().split('');
    const extras  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l=>!letters.includes(l));
    shuffle(extras);
    const pool = shuffle([...letters, ...extras.slice(0, Math.min(4, 12 - letters.length))]);
    return pool.map((ch,i)=>({id:i,ch,used:false}));
  }

  function puzzleHTML() {
    const st=_ps, p=st.puzzles[st.idx];
    if (!st.tiles.length) st.tiles = makeTiles(p.word);
    const word = p.word.toUpperCase();
    if (!st.slots.length) st.slots = Array(word.length).fill(null);

    const slotEls = st.slots.map((s,i) => {
      const cls = s ? (st.checked ? (s===word[i]?'correct':'wrong') : 'filled') : '';
      return `<div class="puzzle-slot ${cls}" onclick="Puzzle.slotClick(${i})">${s||''}</div>`;
    }).join('');

    const tileEls = st.tiles.map((t,i) =>
      `<div class="puzzle-tile${t.used?' used':''}${st.picked===i?' picked':''}" onclick="Puzzle.tileClick(${i})">${t.ch}</div>`
    ).join('');

    return `<div class="puzzle-wrap">
      <div class="puzzle-prog">${st.idx+1} / ${st.puzzles.length} &nbsp; ⭐ ${st.score}</div>
      <div class="puzzle-word-target">
        <div class="pw-emoji">${p.emoji}</div>
        <div class="pw-hint">${p.hint || 'Spell the word!'}</div>
      </div>
      <div class="puzzle-slots">${slotEls}</div>
      <div class="puzzle-tiles">${tileEls}</div>
      <div class="puzzle-feedback" id="pfb"></div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
        <button class="game-btn" style="font-size:1.7rem;padding:9px 18px;background:#eee;color:#555" onclick="Puzzle.clear()">🗑 Clear</button>
        <button class="game-btn" style="font-size:1.7rem;padding:9px 18px;background:#f39c12" onclick="Puzzle.check()">✓ Check</button>
        ${st.checked ? `<button class="game-btn" style="font-size:1.7rem;padding:9px 18px" onclick="Puzzle.next()">${st.idx<st.puzzles.length-1?'Next →':'Finish!'}</button>` : ''}
      </div>
    </div>`;
  }

  window.Puzzle = {
    tileClick(i) {
      const st=_ps; if(st.tiles[i].used) return;
      if (st.picked===i) { st.picked=null; document.getElementById('pm-body').innerHTML=puzzleHTML(); return; }
      if (st.picked!==null) { st.picked=null; }
      // Fill first empty slot
      const emptyIdx = st.slots.findIndex(s=>s===null);
      if (emptyIdx===-1) return;
      st.slots[emptyIdx]=st.tiles[i].ch; st.tiles[i].used=true;
      st.checked=false;
      document.getElementById('pm-body').innerHTML=puzzleHTML();
    },
    slotClick(i) {
      const st=_ps; if(!st.slots[i]) return;
      const ch=st.slots[i]; st.slots[i]=null;
      // Return tile
      const tile=st.tiles.find(t=>t.ch===ch&&t.used);
      if (tile) tile.used=false;
      st.checked=false;
      document.getElementById('pm-body').innerHTML=puzzleHTML();
    },
    clear() {
      const st=_ps; st.slots=Array(st.puzzles[st.idx].word.length).fill(null);
      st.tiles.forEach(t=>t.used=false); st.checked=false;
      document.getElementById('pm-body').innerHTML=puzzleHTML();
    },
    check() {
      const st=_ps; if(st.slots.some(s=>s===null)) { const fb=document.getElementById('pfb'); if(fb){fb.textContent='Fill all slots first!';fb.style.color='#e74c3c';} return; }
      st.checked=true;
      const word=st.puzzles[st.idx].word.toUpperCase();
      const ok=st.slots.join('')===word;
      if(ok) st.score++;
      document.getElementById('pm-body').innerHTML=puzzleHTML();
      const fb=document.getElementById('pfb');
      if(fb){fb.textContent=ok?'✅ Correct! 🎉':'❌ Try again!'; fb.style.color=ok?'#27ae60':'#e74c3c';}
    },
    next() {
      const st=_ps; st.idx++; st.slots=[]; st.tiles=[]; st.checked=false;
      if(st.idx>=st.puzzles.length){
        document.getElementById('pm-body').innerHTML=`<div style="text-align:center;padding:30px">
          <div style="font-size:5rem">🧩</div>
          <div style="font-family:'Fredoka One',cursive;font-size:3rem;color:#7c6fcf;margin:10px 0">All puzzles solved!</div>
          <div style="font-size:2rem;color:#666">Score: ${st.score}/${st.puzzles.length}</div>
          <button class="game-btn" onclick="document.getElementById('pm-body').innerHTML=render(Puzzle._item)">Play Again</button>
        </div>`;
        return;
      }
      document.getElementById('pm-body').innerHTML=puzzleHTML();
    },
    _item: null
  };
  const _r=render;
  GameRegistry.register({ types:['game_puzzle'], icon:'🧩', label:'Puzzle', render: item=>{ Puzzle._item=item; return _r(item); } });
})();
