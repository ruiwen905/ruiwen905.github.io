/* tabs/play/games/snake/snake.js
   D-pad is beside the canvas.
   Speed: slow=500ms  medium=340ms  fast=180ms  turbo=110ms
   (turbo is the old "current speed=1", fast=0.8× of that) */
(function () {
  const CSS = `
.snk-wrap { display:flex; flex-direction:column; align-items:center; gap:8px; user-select:none; -webkit-user-select:none; }
.snk-top  { display:flex; justify-content:space-between; width:100%; align-items:center; gap:8px; flex-wrap:wrap; }
.snk-speed-row { display:flex; gap:6px; flex-wrap:wrap; }
.spbtn { padding:5px 12px; border-radius:18px; border:2px solid #ddd; background:white;
  font-family:'Fredoka One',cursive; font-size:1.5rem; cursor:pointer; transition:all .12s; }
.spbtn.active { background:#7c6fcf; color:white; border-color:#7c6fcf; }
.snk-word { display:flex; gap:6px; flex-wrap:wrap; justify-content:center; }
.snk-letter { width:38px; height:44px; border:3px solid #c5bef0; border-radius:10px;
  font-family:'Fredoka One',cursive; font-size:1.9rem; display:flex; align-items:center;
  justify-content:center; color:#c5bef0; background:#f8f6ff; transition:all .2s; }
.snk-letter.got  { border-color:#27ae60; color:#27ae60; background:#eaffea; }
.snk-letter.next { border-color:#7c6fcf; color:#7c6fcf; background:#f0edff; animation:snkPulse .7s ease infinite alternate; }
@keyframes snkPulse { from{transform:scale(1)}to{transform:scale(1.1)} }
.snk-board-row { display:flex; align-items:center; justify-content:center; gap:14px; }
canvas#snkc { border-radius:14px; box-shadow:0 4px 18px rgba(0,0,0,.13); display:block; touch-action:none; flex-shrink:0; }
.snk-dpad { display:grid; grid-template-columns:repeat(3,52px); grid-template-rows:repeat(3,52px); gap:5px; flex-shrink:0; }
.sdp  { width:52px; height:52px; border-radius:12px; border:none; background:#5c52c0; color:white;
  font-size:1.8rem; cursor:pointer; display:flex; align-items:center; justify-content:center;
  -webkit-user-select:none; user-select:none; touch-action:manipulation; }
.sdp:active { background:#3a3180; transform:scale(.9); }
.sdp0 { width:52px; height:52px; }
.snk-status { font-family:'Fredoka One',cursive; font-size:1.9rem; color:#5c52c0; min-height:30px; text-align:center; }
.game-btn { background:#7c6fcf;color:white;border:none;padding:12px 28px;border-radius:20px;
  font-family:'Fredoka One',cursive;font-size:2rem;cursor:pointer;display:block;margin:10px auto 0; }
@media(max-width:700px){ .sdp,.sdp0{width:42px;height:42px;font-size:1.4rem;} .snk-dpad{grid-template-columns:repeat(3,42px);grid-template-rows:repeat(3,42px);} .snk-letter{width:30px;height:36px;font-size:1.4rem;} }
`;
  document.head.appendChild(Object.assign(document.createElement('style'), {textContent: CSS}));

  // Speeds in ms per tick  (slow is very slow for young kids)
  const SPEEDS = { slow:500, medium:340, fast:180, turbo:110 };
  const COLS=15, ROWS=15;
  let K={}, _loop=null;

  function shuf(a){const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;}

  function render(item) {
    const words    = shuf(item.data.words || ['CAT','DOG','SUN']);
    const speedKey = item.data.speed || 'medium';
    K = {words, wordIdx:0, speedKey, speed:SPEEDS[speedKey]||340, score:0, _item:item};
    startWord();
    return snkHTML();
  }

  function startWord() {
    clearInterval(_loop);
    const word = K.words[K.wordIdx % K.words.length].toUpperCase();
    K.word=word; K.snake=[{r:Math.floor(ROWS/2),c:Math.floor(COLS/2)}];
    K.dir={r:0,c:1}; K.ndir={r:0,c:1};
    K.collected=[]; K.alive=true; K.won=false;
    placePieces();
  }

  function placePieces() {
    K.pieces=[];
    const occ=new Set(K.snake.map(s=>`${s.r},${s.c}`));
    K.word.split('').forEach((ch,i)=>{
      let r,c;
      do{r=Math.floor(Math.random()*ROWS);c=Math.floor(Math.random()*COLS);}
      while(occ.has(`${r},${c}`)||K.pieces.find(p=>p.r===r&&p.c===c));
      occ.add(`${r},${c}`);
      K.pieces.push({r,c,ch,distractor:false});
    });
    // Add a few distractor tiles
    const used=new Set(K.word.split(''));
    const pool='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l=>!used.has(l));
    for(let k=0;k<5;k++){
      let r,c;
      do{r=Math.floor(Math.random()*ROWS);c=Math.floor(Math.random()*COLS);}
      while(occ.has(`${r},${c}`)||K.pieces.find(p=>p.r===r&&p.c===c));
      occ.add(`${r},${c}`);
      K.pieces.push({r,c,ch:pool[Math.floor(Math.random()*pool.length)],distractor:true});
    }
  }

  function snkHTML() {
    const pw = window.innerWidth;
    const cellMax = Math.min(22, Math.floor((pw * 0.50)/COLS));
    const cell = Math.max(12, cellMax);
    const W=cell*COLS, H=cell*ROWS;
    const spBtns = Object.keys(SPEEDS).map(k=>`<button class="spbtn${K.speedKey===k?' active':''}" onclick="Snek.setSpd('${k}')">${k}</button>`).join('');
    const letterBoxes = K.word.split('').map((ch,i)=>{
      const got=i<K.collected.length, isNext=i===K.collected.length&&K.alive&&!K.won;
      return `<div class="snk-letter${got?' got':isNext?' next':''}">${got?K.collected[i]:isNext?ch:'_'}</div>`;
    }).join('');
    setTimeout(()=>{draw(W,H,cell);startLoop();},50);
    return `<div class="snk-wrap">
      <div class="snk-top">
        <div style="font-family:'Fredoka One',cursive;font-size:1.7rem;color:#aaa">Word ${K.wordIdx+1}/${K.words.length} ⭐${K.score}</div>
        <div class="snk-speed-row">${spBtns}</div>
      </div>
      <div class="snk-word">${letterBoxes}</div>
      <div class="snk-board-row">
        <canvas id="snkc" width="${W}" height="${H}"></canvas>
        <div class="snk-dpad">
          <div class="sdp0"></div>
          <button class="sdp" onpointerdown="Snek.d(-1,0)">▲</button>
          <div class="sdp0"></div>
          <button class="sdp" onpointerdown="Snek.d(0,-1)">◀</button>
          <div class="sdp0"></div>
          <button class="sdp" onpointerdown="Snek.d(0,1)">▶</button>
          <div class="sdp0"></div>
          <button class="sdp" onpointerdown="Snek.d(1,0)">▼</button>
          <div class="sdp0"></div>
        </div>
      </div>
      <div class="snk-status" id="snkst"></div>
    </div>`;
  }

  function startLoop() {
    clearInterval(_loop);
    if (!K.alive||K.won) return;
    _loop=setInterval(tick, K.speed);
  }

  function tick() {
    if (!K.alive||K.won){clearInterval(_loop);return;}
    K.dir={...K.ndir};
    const head={r:K.snake[0].r+K.dir.r, c:K.snake[0].c+K.dir.c};
    // Wall
    if(head.r<0||head.r>=ROWS||head.c<0||head.c>=COLS){die();return;}
    // Self (ignore last tail segment — it will move)
    if(K.snake.slice(0,K.snake.length-1).some(s=>s.r===head.r&&s.c===head.c)){die();return;}
    K.snake.unshift(head);
    // Check piece collision
    const hi=K.pieces.findIndex(p=>p.r===head.r&&p.c===head.c);
    if(hi>=0){
      const hit=K.pieces[hi];
      const nxt=K.collected.length;
      if(!hit.distractor && hit.ch===K.word[nxt]){
        K.collected.push(hit.ch); K.pieces.splice(hi,1); spawnReplace(false);
        updateWordDisplay();
        if(K.collected.length===K.word.length){
          K.won=true; K.score++; clearInterval(_loop);
          const st=document.getElementById('snkst');
          if(st){st.textContent='🎉 Word complete!';st.style.color='#27ae60';}
          setTimeout(()=>nextWord(),1500); return;
        }
        // Grow — don't pop tail
      } else {
        // Wrong — shrink if possible
        hit.distractor=true; K.pieces.splice(hi,1); spawnReplace(true);
        if(K.snake.length>1) K.snake.pop();
        K.snake.pop();
        const st=document.getElementById('snkst');
        if(st){st.textContent='❌ Wrong!';st.style.color='#e74c3c';setTimeout(()=>{if(st)st.textContent='';},700);}
      }
    } else { K.snake.pop(); }
    const cv=document.getElementById('snkc');
    if(cv) draw(cv.width,cv.height,Math.floor(cv.width/COLS));
  }

  function spawnReplace(distractor) {
    const occ=new Set([...K.snake.map(s=>`${s.r},${s.c}`),...K.pieces.map(p=>`${p.r},${p.c}`)]);
    let r,c; do{r=Math.floor(Math.random()*ROWS);c=Math.floor(Math.random()*COLS);}while(occ.has(`${r},${c}`));
    if(distractor){
      const pool='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.replace(K.word,'').split('');
      K.pieces.push({r,c,ch:pool[Math.floor(Math.random()*pool.length)],distractor:true});
    }
  }

  function die() {
    K.alive=false; clearInterval(_loop);
    const cv=document.getElementById('snkc'); if(cv) draw(cv.width,cv.height,Math.floor(cv.width/COLS));
    setTimeout(()=>{
      document.getElementById('pm-body').innerHTML=`<div style="text-align:center;padding:24px">
        <div style="font-size:4rem">💥</div>
        <div style="font-family:'Fredoka One',cursive;font-size:2.8rem;color:#e74c3c;margin:10px 0">Game Over!</div>
        <div style="font-size:1.8rem;color:#666">Collected: ${K.collected.join('')||'—'} / ${K.word}</div>
        <button class="game-btn" onclick="Snek._restart()">Try Again</button>
      </div>`;
    },900);
  }

  function nextWord() {
    K.wordIdx=(K.wordIdx+1)%K.words.length;
    if(K.wordIdx===0){
      clearInterval(_loop);
      document.getElementById('pm-body').innerHTML=`<div style="text-align:center;padding:28px">
        <div style="font-size:5rem">🏆</div>
        <div style="font-family:'Fredoka One',cursive;font-size:3rem;color:#5c52c0;margin:10px 0">All words spelled!</div>
        <div style="font-size:2rem;color:#666">Score: ${K.score} / ${K.words.length}</div>
        <button class="game-btn" onclick="Snek._restart()">Play Again</button>
      </div>`;
      return;
    }
    startWord(); document.getElementById('pm-body').innerHTML=snkHTML();
  }

  function updateWordDisplay() {
    const boxes=document.querySelectorAll('.snk-letter');
    K.word.split('').forEach((ch,i)=>{
      if(!boxes[i]) return;
      const got=i<K.collected.length, isNext=i===K.collected.length&&K.alive&&!K.won;
      boxes[i].className='snk-letter'+(got?' got':isNext?' next':'');
      boxes[i].textContent=got?K.collected[i]:isNext?ch:'_';
    });
  }

  function draw(W,H,cell) {
    const cv=document.getElementById('snkc'); if(!cv) return;
    const ctx=cv.getContext('2d');
    ctx.clearRect(0,0,W,H);
    // Grid bg
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
      ctx.fillStyle=(r+c)%2===0?'#f0eeff':'#e8e0ff';
      ctx.fillRect(c*cell,r*cell,cell,cell);
    }
    // Pieces
    K.pieces.forEach(p=>{
      const x=p.c*cell,y=p.r*cell;
      ctx.fillStyle=p.distractor?'#ffe082':p.ch===K.word[K.collected.length]?'#c8f0d8':'#c8e4ff';
      ctx.beginPath(); ctx.roundRect(x+2,y+2,cell-4,cell-4,5); ctx.fill();
      ctx.fillStyle=p.distractor?'#795548':'#1a237e';
      ctx.font=`bold ${Math.floor(cell*0.52)}px Nunito,sans-serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(p.ch,x+cell/2,y+cell/2);
    });
    // Snake
    K.snake.forEach((seg,i)=>{
      const x=seg.c*cell+1,y=seg.r*cell+1,s=cell-2;
      ctx.fillStyle=!K.alive?'#e74c3c':i===0?'#5c52c0':'#7c6fcf';
      ctx.beginPath(); ctx.roundRect(x,y,s,s,i===0?7:5); ctx.fill();
      if(i===0){
        ctx.font=`${cell-3}px serif`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(K.alive?'😄':'😵',seg.c*cell+cell/2,seg.r*cell+cell/2);
      }
    });
  }

  // Keyboard
  document.addEventListener('keydown',e=>{
    const m={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
    const d=m[e.key]; if(d&&document.getElementById('snkc')){e.preventDefault();Snek.d(...d);}
  });

  window.Snek = {
    d(dr,dc){
      if(dr===-K.dir.r&&dc===-K.dir.c) return; // no 180°
      K.ndir={r:dr,c:dc};
    },
    setSpd(k){
      K.speedKey=k; K.speed=SPEEDS[k]||340;
      clearInterval(_loop); _loop=setInterval(tick,K.speed);
      document.querySelectorAll('.spbtn').forEach(b=>b.classList.toggle('active',b.textContent===k));
    },
    _restart(){ clearInterval(_loop); K.score=0; K.wordIdx=0; startWord(); document.getElementById('pm-body').innerHTML=snkHTML(); }
  };

  GameRegistry.register({ types:['game_snake'], icon:'🐍', label:'Snake', render });
})();
