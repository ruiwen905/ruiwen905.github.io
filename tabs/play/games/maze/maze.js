/* tabs/play/games/maze/maze.js
   Types: game_maze, game_maze_phonics   D-pad is beside the canvas, not below. */
(function () {
  const CSS = `
.maze-outer { display:flex; flex-direction:column; align-items:center; gap:10px; }
.maze-top   { display:flex; justify-content:space-between; width:100%; align-items:center; }
.maze-label { font-family:'Fredoka One',cursive; font-size:2rem; color:#5c52c0; }
.maze-moves { font-family:'Fredoka One',cursive; font-size:1.8rem; color:#aaa; }
.maze-collect { background:#f0edff; border-radius:12px; padding:8px 14px; font-family:'Fredoka One',cursive;
  font-size:1.9rem; color:#3a3180; text-align:center; width:100%; letter-spacing:4px; }
.maze-board-row { display:flex; align-items:center; justify-content:center; gap:14px; }
canvas.mzcv { border-radius:14px; box-shadow:0 4px 16px rgba(0,0,0,.12); display:block; touch-action:none; flex-shrink:0; }
.dpad { display:grid; grid-template-columns:repeat(3,52px); grid-template-rows:repeat(3,52px); gap:5px; flex-shrink:0; }
.dpb  { width:52px; height:52px; border-radius:12px; border:none; background:#5c52c0; color:white;
  font-size:1.8rem; cursor:pointer; display:flex; align-items:center; justify-content:center;
  -webkit-user-select:none; user-select:none; touch-action:manipulation; }
.dpb:active { background:#3a3180; transform:scale(.9); }
.dp0 { width:52px; height:52px; }
.maze-status { font-family:'Fredoka One',cursive; font-size:1.9rem; color:#5c52c0; min-height:32px; text-align:center; }
.maze-hint { font-size:1.5rem; color:#aaa; text-align:center; }
.game-btn { background:#7c6fcf;color:white;border:none;padding:12px 28px;border-radius:20px;
  font-family:'Fredoka One',cursive;font-size:2rem;cursor:pointer;display:block;margin:12px auto 0; }
@media(max-width:700px){ .dpb,.dp0{width:42px;height:42px;} .dpad{grid-template-columns:repeat(3,42px);grid-template-rows:repeat(3,42px);} }
`;
  document.head.appendChild(Object.assign(document.createElement('style'), {textContent: CSS}));

  let M = {};

  /* ── MAZE GENERATOR ── */
  function genMaze(R, C) {
    const DIRS = [{r:-1,c:0,b:1,o:4},{r:0,c:1,b:2,o:8},{r:1,c:0,b:4,o:1},{r:0,c:-1,b:8,o:2}];
    const walls   = Array.from({length:R}, ()=>Array(C).fill(0));
    const visited = Array.from({length:R}, ()=>Array(C).fill(false));
    function shuf(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
    function carve(r,c){
      visited[r][c]=true;
      for (const d of shuf([...DIRS])){
        const nr=r+d.r, nc=c+d.c;
        if(nr>=0&&nr<R&&nc>=0&&nc<C&&!visited[nr][nc]){
          walls[r][c]|=d.b; walls[nr][nc]|=d.o; carve(nr,nc);
        }
      }
    }
    carve(0,0);
    return walls;
  }

  function canMove(r,c,nr,nc) {
    if(nr<0||nr>=M.R||nc<0||nc>=M.C) return false;
    const dr=nr-r, dc=nc-c;
    if(dr===-1) return !!(M.walls[r][c]&1);
    if(dc===1)  return !!(M.walls[r][c]&2);
    if(dr===1)  return !!(M.walls[r][c]&4);
    if(dc===-1) return !!(M.walls[r][c]&8);
    return false;
  }

  function render(item) {
    const sz = item.data.size || 7;
    const isPhonics = item.type === 'game_maze_phonics';
    const word = isPhonics && item.data.word ? item.data.word.toUpperCase() : null;
    const walls = genMaze(sz, sz);
    let letters = [];
    if (word) {
      const taken = new Set(['0,0', `${sz-1},${sz-1}`]);
      word.split('').forEach(ch => {
        let r, c;
        do { r=Math.floor(Math.random()*sz); c=Math.floor(Math.random()*sz); }
        while (taken.has(`${r},${c}`));
        taken.add(`${r},${c}`);
        letters.push({r,c,ch,collected:false});
      });
      // Add distractors
      for(let k=0;k<3;k++){
        let r,c;
        do{r=Math.floor(Math.random()*sz);c=Math.floor(Math.random()*sz);}
        while(taken.has(`${r},${c}`));
        taken.add(`${r},${c}`);
        const alpha='ABCDEFGHIJKLMNOPQRSTUVWXYZ'.replace(word,'');
        letters.push({r,c,ch:alpha[Math.floor(Math.random()*alpha.length)],distractor:true,collected:false});
      }
    }
    M = {R:sz,C:sz,walls,pr:0,pc:0,moves:0,isPhonics,word,letters,collected:[],won:false,item};
    return mazeHTML();
  }

  function mazeHTML() {
    const pw = window.innerWidth;
    const maxW = Math.min(280, Math.floor((pw * 0.52)/M.C)*M.C);
    const cell = Math.floor(maxW/M.C);
    const W=cell*M.C, H=cell*M.R;
    const collectHTML = M.word
      ? `<div class="maze-collect">${M.word.split('').map((ch,i)=>{
          const got=i<M.collected.length;
          return `<span style="color:${got?'#27ae60':'#c5bef0'}">${got?M.collected[i]:ch}</span>`;
        }).join(' ')}</div>` : '';
    setTimeout(()=>drawMaze(W,H,cell), 40);
    return `<div class="maze-outer">
      <div class="maze-top">
        <div class="maze-label">${M.isPhonics?'🔤 Phonics Maze':'🌀 Maze'}</div>
        <div class="maze-moves">🔄 ${M.moves}</div>
      </div>
      ${collectHTML}
      <div class="maze-board-row">
        <canvas class="mzcv" id="mzcv" width="${W}" height="${H}"></canvas>
        <div class="dpad">
          <div class="dp0"></div>
          <button class="dpb" onpointerdown="Maze.mv(-1,0)">▲</button>
          <div class="dp0"></div>
          <button class="dpb" onpointerdown="Maze.mv(0,-1)">◀</button>
          <div class="dp0"></div>
          <button class="dpb" onpointerdown="Maze.mv(0,1)">▶</button>
          <div class="dp0"></div>
          <button class="dpb" onpointerdown="Maze.mv(1,0)">▼</button>
          <div class="dp0"></div>
        </div>
      </div>
      <div class="maze-status" id="mzst"></div>
      <div class="maze-hint">${M.isPhonics?'Collect letters in order to spell the word!':'Find the 🏆 trophy!'}</div>
    </div>`;
  }

  function drawMaze(W,H,cell) {
    const cv=document.getElementById('mzcv'); if(!cv) return;
    const ctx=cv.getContext('2d');
    ctx.clearRect(0,0,W,H);
    // Checkerboard bg
    for(let r=0;r<M.R;r++) for(let c=0;c<M.C;c++){
      ctx.fillStyle=(r+c)%2===0?'#f8f6ff':'#ede8ff';
      ctx.fillRect(c*cell,r*cell,cell,cell);
    }
    // Walls
    ctx.strokeStyle='#5c52c0'; ctx.lineWidth=Math.max(2,cell*0.07); ctx.lineCap='square';
    for(let r=0;r<M.R;r++) for(let c=0;c<M.C;c++){
      const x=c*cell,y=r*cell,w=M.walls[r][c];
      if(!(w&1)){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+cell,y);ctx.stroke();}
      if(!(w&2)){ctx.beginPath();ctx.moveTo(x+cell,y);ctx.lineTo(x+cell,y+cell);ctx.stroke();}
      if(!(w&4)){ctx.beginPath();ctx.moveTo(x,y+cell);ctx.lineTo(x+cell,y+cell);ctx.stroke();}
      if(!(w&8)){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+cell);ctx.stroke();}
    }
    // Outer border
    ctx.strokeStyle='#3a3180'; ctx.lineWidth=Math.max(3,cell*0.1);
    ctx.strokeRect(0,0,W,H);
    // Exit
    const ex=(M.C-1)*cell,ey=(M.R-1)*cell;
    ctx.fillStyle='#fff5cc'; ctx.fillRect(ex+1,ey+1,cell-2,cell-2);
    ctx.font=`${cell-6}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('🏆',ex+cell/2,ey+cell/2);
    // Letters
    M.letters.forEach(l=>{
      if(l.collected) return;
      ctx.fillStyle=l.distractor?'#ffecb3':'#c8f0d8';
      ctx.beginPath(); ctx.roundRect(l.c*cell+3,l.r*cell+3,cell-6,cell-6,6); ctx.fill();
      ctx.fillStyle=l.distractor?'#795548':'#1a237e';
      ctx.font=`bold ${Math.floor(cell*0.45)}px Nunito,sans-serif`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(l.ch,l.c*cell+cell/2,l.r*cell+cell/2);
    });
    // Player
    ctx.fillStyle='#7c6fcf';
    ctx.beginPath(); ctx.arc(M.pc*cell+cell/2,M.pr*cell+cell/2,cell*0.34,0,Math.PI*2); ctx.fill();
    ctx.font=`${cell-4}px serif`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('😊',M.pc*cell+cell/2,M.pr*cell+cell/2);
  }

  // Keyboard
  document.addEventListener('keydown', e=>{
    const m={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
    const d=m[e.key]; if(d&&document.getElementById('mzcv')){e.preventDefault();Maze.mv(...d);}
  });

  window.Maze = {
    mv(dr,dc) {
      if(M.won) return;
      const nr=M.pr+dr, nc=M.pc+dc;
      if(!canMove(M.pr,M.pc,nr,nc)) return;
      M.pr=nr; M.pc=nc; M.moves++;
      // Collect letter
      if(M.isPhonics && M.word){
        const nIdx=M.collected.length;
        const tgt=M.letters[nIdx];
        if(tgt && !tgt.distractor && tgt.r===nr && tgt.c===nc){
          tgt.collected=true; M.collected.push(tgt.ch);
        } else {
          // Hit distractor or wrong order
          const hit=M.letters.find(l=>!l.collected&&l.r===nr&&l.c===nc);
          if(hit&&(hit.distractor||(M.word[nIdx]&&hit.ch!==M.word[nIdx]))){
            hit.collected=true; // remove from board
            const st=document.getElementById('mzst');
            if(st){st.textContent='❌ Wrong letter!';st.style.color='#e74c3c';setTimeout(()=>{if(st)st.textContent='';},700);}
          }
        }
      }
      // Win
      if(nr===M.R-1&&nc===M.C-1){
        M.won=true;
        const wordOk=!M.isPhonics||M.collected.join('')===M.word;
        const cv=document.getElementById('mzcv');
        if(cv) drawMaze(cv.width,cv.height,Math.floor(cv.width/M.C));
        setTimeout(()=>{
          document.getElementById('pm-body').innerHTML=`<div style="text-align:center;padding:28px">
            <div style="font-size:5rem">${wordOk?'🎉':'😅'}</div>
            <div style="font-family:'Fredoka One',cursive;font-size:3rem;color:#5c52c0;margin:10px 0">${wordOk?'You made it!':'Almost!'}</div>
            ${M.isPhonics?`<div style="font-size:2rem;color:#666;margin-bottom:8px">Collected: <strong>${M.collected.join('')||'—'}</strong> / ${M.word}</div>`:''}
            <div style="font-size:1.8rem;color:#aaa">Moves: ${M.moves}</div>
            <button class="game-btn" onclick="Maze._restart()">New Maze</button>
          </div>`;
        },300);
        return;
      }
      const cv=document.getElementById('mzcv');
      if(cv) drawMaze(cv.width,cv.height,Math.floor(cv.width/M.C));
      // Update collect display
      if(M.isPhonics){
        const slots=document.querySelectorAll('.maze-collect span');
        M.word.split('').forEach((ch,i)=>{
          if(!slots[i]) return;
          const got=i<M.collected.length;
          slots[i].style.color=got?'#27ae60':'#c5bef0';
          slots[i].textContent=got?M.collected[i]:ch;
        });
      }
      // Update moves
      const mv=document.querySelector('.maze-moves'); if(mv) mv.textContent=`🔄 ${M.moves}`;
    },
    _restart() { document.getElementById('pm-body').innerHTML=render(M.item); }
  };

  GameRegistry.register({ types:['game_maze','game_maze_phonics'], icon:'🌀', label:'Maze', render });
})();
