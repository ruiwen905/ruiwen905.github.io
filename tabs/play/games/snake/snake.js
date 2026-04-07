/* tabs/play/games/snake/snake.js
   Type: game_snake — collect letters in order to spell a word.
   Speed presets for different ages. On-screen D-pad for touch/iPad. */
(function () {
  const CSS = `
.snake-wrap { display:flex; flex-direction:column; align-items:center; gap:8px; user-select:none; }
.snake-top  { display:flex; justify-content:space-between; width:100%; align-items:center; gap:10px; }
.snake-word-display { display:flex; gap:6px; flex-wrap:wrap; justify-content:center; }
.snake-letter { width:40px; height:46px; border:3px solid #c5bef0; border-radius:10px;
  font-family:'Fredoka One',cursive; font-size:2rem; display:flex; align-items:center;
  justify-content:center; color:#c5bef0; background:#f8f6ff; transition:all .25s; }
.snake-letter.collected { border-color:#27ae60; color:#27ae60; background:#eaffea; }
.snake-letter.next      { border-color:#7c6fcf; color:#7c6fcf; background:#f0edff;
  animation:snakePulse 0.7s ease infinite alternate; }
@keyframes snakePulse { from{transform:scale(1)} to{transform:scale(1.12)} }
canvas#snk { border-radius:14px; box-shadow:0 4px 18px rgba(0,0,0,.13); display:block; touch-action:none; }
.snake-speed-row { display:flex; gap:8px; justify-content:center; flex-wrap:wrap; }
.speed-btn { padding:6px 14px; border-radius:20px; border:2px solid #ddd; background:white;
  font-family:'Fredoka One',cursive; font-size:1.5rem; cursor:pointer; transition:all .12s; }
.speed-btn.active { background:#7c6fcf; color:white; border-color:#7c6fcf; }
.snake-dpad { display:grid; grid-template-columns:repeat(3,52px); grid-template-rows:repeat(3,52px); gap:5px; }
.sdp { width:52px; height:52px; border-radius:12px; border:none; background:#5c52c0; color:white;
  font-size:1.8rem; cursor:pointer; display:flex; align-items:center; justify-content:center;
  -webkit-user-select:none; user-select:none; }
.sdp:active { background:#3a3180; transform:scale(.92); }
.sdp-blank  { width:52px; height:52px; }
.snake-status { font-family:'Fredoka One',cursive; font-size:2rem; color:#5c52c0; text-align:center; min-height:32px; }
.game-btn { background:#7c6fcf;color:white;border:none;padding:12px 28px;border-radius:20px;
  font-family:'Fredoka One',cursive;font-size:2rem;cursor:pointer;display:block;margin:12px auto 0; }
@media(max-width:900px){ .sdp,.sdp-blank{width:44px;height:44px;} .snake-dpad{grid-template-columns:repeat(3,44px);grid-template-rows:repeat(3,44px);} .snake-letter{width:32px;height:36px;font-size:1.4rem;} }
`;
  const S = document.createElement('style'); S.textContent = CSS; document.head.appendChild(S);

  const SPEEDS = { slow:220, medium:150, fast:90, turbo:55 };
  let _sk = {}, _loop = null;

  function render(item) {
    const words = item.data.words || ['CAT','DOG','SUN'];
    const speedKey = item.data.speed || 'medium';
    window._snakeItem = item;
    _sk = { words, wordIdx:0, speedKey, speed:SPEEDS[speedKey]||150 };
    startWord();
    return snakeHTML();
  }

  function startWord() {
    clearInterval(_loop);
    const word = _sk.words[_sk.wordIdx % _sk.words.length].toUpperCase();
    const COLS=15, ROWS=15;
    _sk.word=word; _sk.cols=COLS; _sk.rows=ROWS;
    _sk.snake=[{r:Math.floor(ROWS/2),c:Math.floor(COLS/2)}];
    _sk.dir={r:0,c:1}; _sk.nextDir={r:0,c:1};
    _sk.collected=[]; _sk.nextIdx=0;
    _sk.alive=true; _sk.won=false;
    placeLetters();
    _sk.score=(_sk.score||0);
  }

  function placeLetters() {
    const word=_sk.word;
    _sk.letters=[];
    const occupied=new Set(_sk.snake.map(s=>s.r+','+s.c));
    word.split('').forEach(ch => {
      let r,c;
      do { r=Math.floor(Math.random()*_sk.rows); c=Math.floor(Math.random()*_sk.cols); }
      while (occupied.has(r+','+c) || _sk.letters.find(l=>l.r===r&&l.c===c));
      _sk.letters.push({r,c,ch});
    });
    // Also place distractor letters
    const extras='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l=>!word.includes(l));
    for (let k=0;k<4;k++){
      let r,c;
      do { r=Math.floor(Math.random()*_sk.rows); c=Math.floor(Math.random()*_sk.cols); }
      while (occupied.has(r+','+c)||_sk.letters.find(l=>l.r===r&&l.c===c));
      _sk.letters.push({r,c,ch:extras[Math.floor(Math.random()*extras.length)],distractor:true});
    }
  }

  function snakeHTML() {
    const st=_sk;
    const W=Math.min(330,Math.floor((window.innerWidth*0.72)/st.cols)*st.cols);
    const cell=Math.floor(W/st.cols), H=cell*st.rows;
    const speedBtns=Object.keys(SPEEDS).map(k=>`<button class="speed-btn${st.speedKey===k?' active':''}" onclick="Snake.setSpeed('${k}')">${k}</button>`).join('');
    const letterBoxes=(st.word||'').split('').map((ch,i)=>{
      const collected=i<(st.collected||[]).length;
      const isNext=i===(st.collected||[]).length&&st.alive&&!st.won;
      return `<div class="snake-letter${collected?' collected':isNext?' next':''}">${collected?ch:(isNext?ch:'_')}</div>`;
    }).join('');
    setTimeout(()=>{drawSnake(W,H,cell);startLoop();},50);
    return `<div class="snake-wrap">
      <div class="snake-top">
        <div style="font-family:'Fredoka One',cursive;font-size:1.8rem;color:#aaa">Word ${(st.wordIdx||0)+1}/${st.words.length}</div>
        <div class="snake-speed-row">${speedBtns}</div>
      </div>
      <div class="snake-word-display">${letterBoxes}</div>
      <canvas id="snk" width="${W}" height="${H}"></canvas>
      <div class="snake-status" id="sst"></div>
      <div class="snake-dpad">
        <div class="sdp-blank"></div>
        <button class="sdp" onpointerdown="Snake.dir(-1,0)">▲</button>
        <div class="sdp-blank"></div>
        <button class="sdp" onpointerdown="Snake.dir(0,-1)">◀</button>
        <div class="sdp-blank"></div>
        <button class="sdp" onpointerdown="Snake.dir(0,1)">▶</button>
        <div class="sdp-blank"></div>
        <button class="sdp" onpointerdown="Snake.dir(1,0)">▼</button>
        <div class="sdp-blank"></div>
      </div>
    </div>`;
  }

  function startLoop() {
    clearInterval(_loop);
    if (!_sk.alive || _sk.won) return;
    _loop = setInterval(tick, _sk.speed);
  }

  function tick() {
    const st=_sk; if (!st.alive||st.won) { clearInterval(_loop); return; }
    st.dir={...st.nextDir};
    const head={r:st.snake[0].r+st.dir.r, c:st.snake[0].c+st.dir.c};
    // Wall collision
    if (head.r<0||head.r>=st.rows||head.c<0||head.c>=st.cols) { die(); return; }
    // Self collision (skip tail which will move)
    if (st.snake.slice(0,-1).some(s=>s.r===head.r&&s.c===head.c)) { die(); return; }
    st.snake.unshift(head);
    // Check letter collision
    const hitIdx=st.letters.findIndex(l=>l.r===head.r&&l.c===head.c);
    if (hitIdx>=0) {
      const hit=st.letters[hitIdx];
      if (!hit.distractor && hit.ch===st.word[st.collected.length]) {
        st.collected.push(hit.ch); st.letters.splice(hitIdx,1);
        // grow (don't pop tail)
        if (st.collected.length===st.word.length) {
          st.won=true; st.score++; clearInterval(_loop);
          drawSnake(getCvDims()); updateWordDisplay();
          const sst=document.getElementById('sst');
          if(sst){sst.textContent='🎉 Word complete!'; sst.style.color='#27ae60';}
          setTimeout(()=>nextWord(),1600); return;
        }
        updateWordDisplay();
      } else if (hit.distractor || hit.ch!==st.word[st.collected.length]) {
        // Wrong letter — shrink if >1
        if (st.snake.length>1) st.snake.pop(); else st.snake.pop();
        st.letters.splice(hitIdx,1);
        replaceDistractor();
        const sst=document.getElementById('sst');
        if(sst){sst.textContent='❌ Wrong letter!';sst.style.color='#e74c3c';setTimeout(()=>{if(sst)sst.textContent='';},800);}
      } else { st.snake.pop(); }
    } else { st.snake.pop(); }
    drawSnake(getCvDims()); updateWordDisplay();
  }

  function getCvDims() {
    const cv=document.getElementById('snk');
    return cv ? {W:cv.width,H:cv.height,cell:Math.floor(cv.width/_sk.cols)} : null;
  }

  function replaceDistractor() {
    const occupied=new Set(_sk.snake.map(s=>s.r+','+s.c).concat(_sk.letters.map(l=>l.r+','+l.c)));
    let r,c;
    do {r=Math.floor(Math.random()*_sk.rows);c=Math.floor(Math.random()*_sk.cols);}
    while(occupied.has(r+','+c));
    const extras='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').filter(l=>!_sk.word.includes(l));
    _sk.letters.push({r,c,ch:extras[Math.floor(Math.random()*extras.length)],distractor:true});
  }

  function die() {
    _sk.alive=false; clearInterval(_loop);
    drawSnake(getCvDims());
    const sst=document.getElementById('sst');
    if(sst){sst.textContent='💥 Oops! Try again?';sst.style.color='#e74c3c';}
    setTimeout(()=>{
      if(document.getElementById('snk')) document.getElementById('pm-body').innerHTML=
        `<div style="text-align:center;padding:24px">
          <div style="font-size:4rem">💥</div>
          <div style="font-family:'Fredoka One',cursive;font-size:2.8rem;color:#e74c3c;margin:10px 0">Game Over!</div>
          <div style="font-size:1.8rem;color:#666">Collected: ${_sk.collected.join('')||'—'} / ${_sk.word}</div>
          <button class="game-btn" onclick="Snake.restart()">Try Again</button>
        </div>`;
    }, 1500);
  }

  function nextWord() {
    _sk.wordIdx=(_sk.wordIdx+1)%_sk.words.length;
    if (_sk.wordIdx===0) {
      clearInterval(_loop);
      document.getElementById('pm-body').innerHTML=`<div style="text-align:center;padding:28px">
        <div style="font-size:5rem">🏆</div>
        <div style="font-family:'Fredoka One',cursive;font-size:3rem;color:#5c52c0;margin:10px 0">All words spelled!</div>
        <div style="font-size:2rem;color:#666">Score: ${_sk.score} / ${_sk.words.length}</div>
        <button class="game-btn" onclick="Snake.restart()">Play Again</button>
      </div>`;
      return;
    }
    startWord();
    document.getElementById('pm-body').innerHTML=snakeHTML();
  }

  function updateWordDisplay() {
    const st=_sk;
    const boxes=document.querySelectorAll('.snake-letter');
    if (!boxes.length) return;
    st.word.split('').forEach((ch,i)=>{
      if (!boxes[i]) return;
      const collected=i<st.collected.length;
      const isNext=i===st.collected.length&&st.alive&&!st.won;
      boxes[i].className='snake-letter'+(collected?' collected':isNext?' next':'');
      boxes[i].textContent=collected?ch:(isNext?ch:'_');
    });
  }

  function drawSnake(dims) {
    if (!dims) return;
    const {W,H,cell}=dims;
    const cv=document.getElementById('snk'); if (!cv) return;
    const ctx=cv.getContext('2d');
    const st=_sk;
    ctx.clearRect(0,0,W,H);
    // Grid bg
    ctx.fillStyle='#f0eeff'; ctx.fillRect(0,0,W,H);
    for (let r=0;r<st.rows;r++) for (let c=0;c<st.cols;c++) {
      if ((r+c)%2===0) { ctx.fillStyle='#ebe6ff'; ctx.fillRect(c*cell,r*cell,cell,cell); }
    }
    // Letters on board
    st.letters.forEach(l=>{
      const x=l.c*cell,y=l.r*cell;
      ctx.fillStyle=l.distractor?'#ffecb3':l.ch===st.word[st.collected.length]?'#c8f0d8':'#c8e4ff';
      roundRect(ctx,x+2,y+2,cell-4,cell-4,8); ctx.fill();
      ctx.fillStyle=l.distractor?'#795548':'#1a237e';
      ctx.font=`bold ${Math.floor(cell*0.5)}px Nunito,sans-serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(l.ch,x+cell/2,y+cell/2);
    });
    // Snake body
    st.snake.forEach((seg,i)=>{
      const x=seg.c*cell+1,y=seg.r*cell+1,s=cell-2;
      if (!st.alive) { ctx.fillStyle='#e74c3c'; }
      else ctx.fillStyle=i===0?'#5c52c0':'#7c6fcf';
      roundRect(ctx,x,y,s,s,i===0?8:6); ctx.fill();
      if (i===0) {
        ctx.fillStyle='white'; ctx.font=`${Math.floor(cell*0.55)}px serif`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText('😄',seg.c*cell+cell/2,seg.r*cell+cell/2);
      }
    });
  }

  function roundRect(ctx,x,y,w,h,r){
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y);
    ctx.arcTo(x+w,y,x+w,y+r,r); ctx.lineTo(x+w,y+h-r);
    ctx.arcTo(x+w,y+h,x+w-r,y+h,r); ctx.lineTo(x+r,y+h);
    ctx.arcTo(x,y+h,x,y+h-r,r); ctx.lineTo(x,y+r);
    ctx.arcTo(x,y,x+r,y,r); ctx.closePath();
  }

  // Keyboard support
  document.addEventListener('keydown', e=>{
    const map={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
    const d=map[e.key]; if(d&&document.getElementById('snk')){e.preventDefault();Snake.dir(...d);}
  });

  window.Snake = {
    dir(dr,dc) {
      // Prevent 180-degree reversal
      if (dr===-_sk.dir.r && dc===-_sk.dir.c) return;
      _sk.nextDir={r:dr,c:dc};
    },
    setSpeed(k) {
      _sk.speedKey=k; _sk.speed=SPEEDS[k]||150;
      clearInterval(_loop); _loop=setInterval(tick,_sk.speed);
      document.querySelectorAll('.speed-btn').forEach(b=>{
        b.classList.toggle('active',b.textContent===k);
      });
    },
    restart() {
      clearInterval(_loop); _sk.score=0; _sk.wordIdx=0;
      startWord(); document.getElementById('pm-body').innerHTML=snakeHTML();
    }
  };

  GameRegistry.register({ types:['game_snake'], icon:'🐍', label:'Snake', render });
})();
