/* tabs/play/games/matching/matching.js */
(function () {
  const CSS = `
.match-wrap { user-select:none; }
.match-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.match-score { font-family:'Fredoka One',cursive; font-size:2rem; color:#7c6fcf; }
.match-moves { font-size:1.6rem; color:#aaa; font-weight:700; }
.match-grid { display:grid; gap:8px; }
.mc { border-radius:14px; cursor:pointer; height:90px; position:relative; transition:transform .35s; transform-style:preserve-3d; }
.mc.flipped { transform:rotateY(180deg); }
.mc.matched  { transform:rotateY(180deg); opacity:.7; pointer-events:none; }
.mc-back, .mc-front { position:absolute; inset:0; border-radius:14px; backface-visibility:hidden; display:flex; align-items:center; justify-content:center; flex-direction:column; gap:3px; padding:6px; }
.mc-back  { background:#7c6fcf; box-shadow:0 2px 8px rgba(92,82,192,.3); }
.mc-back-q { font-family:'Fredoka One',cursive; font-size:3rem; color:white; }
.mc-front { background:white; border:2.5px solid #ddd; transform:rotateY(180deg); }
.mc.matched .mc-front { border-color:#27ae60; background:#eaffea; }
.mc-emoji { font-size:2.8rem; line-height:1; }
.mc-word  { font-family:'Fredoka One',cursive; font-size:1.5rem; color:#3a3180; text-align:center; line-height:1.2; }
.mc-shake { animation:mcShake .4s ease; }
@keyframes mcShake { 0%,100%{transform:rotateY(180deg) translateX(0)} 25%{transform:rotateY(180deg) translateX(-8px)} 75%{transform:rotateY(180deg) translateX(8px)} }
.match-win { text-align:center; padding:30px; }
.game-btn { background:#7c6fcf;color:white;border:none;padding:12px 28px;border-radius:20px;font-family:'Fredoka One',cursive;font-size:2rem;cursor:pointer;display:block;margin:14px auto 0; }
@media(max-width:900px){ .mc{height:64px;} .mc-emoji{font-size:1.8rem;} .mc-word{font-size:1rem;} .mc-back-q{font-size:2rem;} }
`;
  document.head.appendChild(Object.assign(document.createElement('style'), {textContent: CSS}));

  function shuf(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}

  let S = {};

  function render(item) {
    const maxP = item.data.maxPairs || 6;
    const pairs = shuf(item.data.pairs).slice(0, maxP);
    const cards = shuf([
      ...pairs.map((p,i)=>({uid:i*2,  pairId:i, kind:'emoji', show:p.emoji})),
      ...pairs.map((p,i)=>({uid:i*2+1,pairId:i, kind:'word',  show:p.word })),
    ]);
    S = {cards, open:[], matched:new Set(), moves:0, locked:false, _item:item};
    return boardHTML();
  }

  function boardHTML() {
    const n = S.cards.length;
    const cols = n <= 8 ? 4 : 4;
    const {open, matched} = S;
    return `<div class="match-wrap">
      <div class="match-header">
        <div class="match-score">✅ ${matched.size} / ${n/2} pairs</div>
        <div class="match-moves">🔄 ${S.moves} moves</div>
      </div>
      <div class="match-grid" style="grid-template-columns:repeat(${cols},1fr)">
        ${S.cards.map((c,i)=>{
          const isOpen    = open.includes(i);
          const isMatched = matched.has(c.pairId);
          const isEmoji   = c.kind==='emoji';
          return `<div class="mc${isOpen||isMatched?' flipped':''}${isMatched?' matched':''}" id="mc${i}" onclick="Matching.flip(${i})">
            <div class="mc-back"><div class="mc-back-q">?</div></div>
            <div class="mc-front">${isEmoji
              ? `<div class="mc-emoji">${c.show}</div>`
              : `<div class="mc-word">${c.show}</div>`}
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  }

  window.Matching = {
    flip(i) {
      if (S.locked) return;
      if (S.open.includes(i)) return;
      if (S.matched.has(S.cards[i].pairId)) return;
      S.open.push(i);
      document.getElementById('mc'+i)?.classList.add('flipped');
      if (S.open.length < 2) return;
      S.moves++;
      S.locked = true;
      const [a, b] = S.open;
      const ca = S.cards[a], cb = S.cards[b];
      if (ca.pairId === cb.pairId && ca.kind !== cb.kind) {
        // Match
        S.matched.add(ca.pairId); S.open = []; S.locked = false;
        if (S.matched.size === S.cards.length / 2) {
          setTimeout(()=>{
            document.getElementById('pm-body').innerHTML = `<div class="match-win">
              <div style="font-size:5rem">🎉</div>
              <div style="font-family:'Fredoka One',cursive;font-size:3rem;color:#7c6fcf;margin:10px 0">All matched!</div>
              <div style="font-size:2rem;color:#666">${S.moves} moves</div>
              <button class="game-btn" onclick="Matching._restart()">Play Again</button>
            </div>`;
          }, 400);
          return;
        }
        // Refresh board to mark matched
        document.getElementById('pm-body').innerHTML = boardHTML();
      } else {
        // No match — shake then flip back
        setTimeout(()=>{
          [a,b].forEach(idx=>{ document.getElementById('mc'+idx)?.classList.add('mc-shake'); });
          setTimeout(()=>{
            S.open = []; S.locked = false;
            document.getElementById('pm-body').innerHTML = boardHTML();
          }, 420);
        }, 650);
      }
    },
    _restart() { document.getElementById('pm-body').innerHTML = render(S._item); }
  };

  GameRegistry.register({ types:['game_matching'], icon:'🃏', label:'Match', render });
})();
