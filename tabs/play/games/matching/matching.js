/* tabs/play/games/matching/matching.js
   Type: game_matching — flip card pairs (emoji + word) */
(function () {
  const CSS = `
.match-header { display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; }
.match-title  { font-family:'Fredoka One',cursive; font-size:2rem; color:#5c52c0; }
.match-stats  { font-family:'Fredoka One',cursive; font-size:1.8rem; color:#aaa; }
.match-grid   { display:grid; gap:8px; }
.match-card   { border-radius:14px; cursor:pointer; perspective:600px; min-height:80px; }
.match-card-inner { position:relative; width:100%; height:100%; transition:transform .35s;
  transform-style:preserve-3d; }
.match-card.flipped .match-card-inner { transform:rotateY(180deg); }
.match-card.matched .match-card-inner { transform:rotateY(180deg); }
.match-card.matched { pointer-events:none; }
.match-face, .match-back { position:absolute; inset:0; border-radius:14px; display:flex;
  align-items:center; justify-content:center; backface-visibility:hidden; flex-direction:column; gap:4px; }
.match-back  { background:#7c6fcf; color:white; font-size:2.4rem; }
.match-back::after { content:'?'; font-family:'Fredoka One',cursive; font-size:2.4rem; }
.match-face  { transform:rotateY(180deg); border:2.5px solid #ddd; background:white; padding:6px; }
.match-face.emoji-face { font-size:2.8rem; }
.match-face.word-face  { font-family:'Fredoka One',cursive; font-size:1.6rem; color:#3a3180; text-align:center; }
.match-card.matched .match-face { border-color:#27ae60; background:#eaffea; }
.match-wrong { animation: matchWrong .4s ease; }
@keyframes matchWrong { 0%,100%{transform:translateX(0)} 25%{transform:translateX(-8px)} 75%{transform:translateX(8px)} }
.match-win { text-align:center; padding:30px; }
.game-btn { background:#7c6fcf; color:white; border:none; padding:12px 28px; border-radius:20px;
  font-family:'Fredoka One',cursive; font-size:2rem; cursor:pointer; margin-top:16px; display:block; width:fit-content; margin-left:auto; margin-right:auto; }
@media(max-width:900px){ .match-face.word-face{font-size:1rem;} .match-face.emoji-face{font-size:1.8rem;} .match-back::after{font-size:1.6rem;} }
`;
  const S = document.createElement('style'); S.textContent = CSS; document.head.appendChild(S);

  let _ms = {};

  function shuffle(a) { const b=[...a]; for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];} return b; }

  function render(item) {
    const pairs = shuffle(item.data.pairs).slice(0, item.data.maxPairs || 8);
    // Create cards: one emoji card + one word card per pair
    const cards = shuffle([
      ...pairs.map((p,i) => ({ id:i, type:'emoji', value:p.emoji, pairId:i, word:p.word })),
      ...pairs.map((p,i) => ({ id:i+pairs.length, type:'word', value:p.word, pairId:i, emoji:p.emoji }))
    ]);
    _ms = { cards, flipped:[], matched:new Set(), moves:0, locked:false };
    return boardHTML();
  }

  function boardHTML() {
    const n = _ms.cards.length;
    const cols = n <= 8 ? 4 : n <= 12 ? 4 : 5;
    const pairsDone = _ms.matched.size / 2;
    const pairsTotal = n / 2;
    return `<div class="match-header">
      <div class="match-title">🃏 Match the pairs!</div>
      <div class="match-stats">⭐ ${pairsDone}/${pairsTotal} &nbsp; 🔄 ${_ms.moves}</div>
    </div>
    <div class="match-grid" style="grid-template-columns:repeat(${cols},1fr)">
      ${_ms.cards.map((c,i) => {
        const isFlipped  = _ms.flipped.includes(i);
        const isMatched  = _ms.matched.has(c.pairId);
        const faceClass  = c.type === 'emoji' ? 'emoji-face' : 'word-face';
        return `<div class="match-card${isFlipped?' flipped':''}${isMatched?' matched':''}" id="mc-${i}" onclick="Matching.flip(${i})" style="height:${Math.floor(240/Math.ceil(n/cols))}px">
          <div class="match-card-inner">
            <div class="match-back"></div>
            <div class="match-face ${faceClass}">${c.value}</div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  window.Matching = {
    flip(i) {
      if (_ms.locked) return;
      if (_ms.flipped.includes(i)) return;
      const card = _ms.cards[i];
      if (_ms.matched.has(card.pairId)) return;
      _ms.flipped.push(i);
      // Re-render the flipped card
      const el = document.getElementById('mc-'+i);
      if (el) el.classList.add('flipped');

      if (_ms.flipped.length === 2) {
        _ms.moves++;
        _ms.locked = true;
        const [a, b] = _ms.flipped.map(idx => _ms.cards[idx]);
        if (a.pairId === b.pairId && a.type !== b.type) {
          // Match!
          _ms.matched.add(a.pairId);
          _ms.flipped = [];
          _ms.locked = false;
          const elA = document.getElementById('mc-'+_ms.flipped[0]);
          const elB = document.getElementById('mc-'+_ms.flipped[1]);
          if (elA) elA.classList.add('matched');
          if (elB) elB.classList.add('matched');
          // Check win
          if (_ms.matched.size === _ms.cards.length / 2) {
            setTimeout(() => {
              document.getElementById('pm-body').innerHTML = `<div class="match-win">
                <div style="font-size:5rem">🎉</div>
                <div style="font-family:'Fredoka One',cursive;font-size:3rem;color:#7c6fcf;margin:10px 0">All matched!</div>
                <div style="font-size:2rem;color:#666">${_ms.moves} moves</div>
                <button class="game-btn" onclick="Matching.restart()">Play Again</button>
              </div>`;
            }, 500);
            return;
          }
          document.getElementById('pm-body').innerHTML = boardHTML();
        } else {
          // No match — flip back
          setTimeout(() => {
            _ms.flipped.forEach(idx => {
              const e = document.getElementById('mc-'+idx);
              if (e) { e.classList.add('match-wrong'); e.classList.remove('flipped'); }
            });
            setTimeout(() => {
              _ms.flipped.forEach(idx => {
                const e = document.getElementById('mc-'+idx);
                if (e) e.classList.remove('match-wrong');
              });
              _ms.flipped = []; _ms.locked = false;
              document.getElementById('pm-body').innerHTML = boardHTML();
            }, 400);
          }, 700);
        }
      }
    },
    restart() {
      const saved = _ms._savedItem;
      if (saved) { document.getElementById('pm-body').innerHTML = render(saved); }
      else document.getElementById('pm-body').innerHTML = boardHTML();
    }
  };

  const _origRender = render;
  GameRegistry.register({ types:['game_matching'], icon:'🃏', label:'Match', render: item => {
    _ms._savedItem = item;
    return _origRender(item);
  }});
})();
