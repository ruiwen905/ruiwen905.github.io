/* tabs/play/games/maze/maze.js
   Types: game_maze, game_maze_phonics
   Recursive-backtracking maze with on-screen D-pad for touch/iPad. */
(function () {
  const CSS = `
.maze-wrap { display:flex; flex-direction:column; align-items:center; gap:10px; }
.maze-top  { display:flex; justify-content:space-between; width:100%; align-items:center; }
.maze-title{ font-family:'Fredoka One',cursive; font-size:2rem; color:#5c52c0; }
.maze-info { font-family:'Fredoka One',cursive; font-size:1.8rem; color:#aaa; }
canvas.maze-cv { border-radius:14px; box-shadow:0 4px 16px rgba(0,0,0,.12); display:block; touch-action:none; }
.maze-hint { font-size:1.6rem; color:#888; text-align:center; min-height:28px; }
.dpad { display:grid; grid-template-columns:repeat(3,48px); grid-template-rows:repeat(3,48px); gap:4px; margin-top:4px; }
.dpad-btn { width:48px; height:48px; border-radius:12px; border:none; background:#7c6fcf; color:white;
  font-size:1.6rem; cursor:pointer; display:flex; align-items:center; justify-content:center;
  user-select:none; -webkit-user-select:none; }
.dpad-btn:active { background:#5c52c0; transform:scale(.92); }
.dpad-blank { width:48px; height:48px; }
.maze-phonics-prompt { background:#f0edff; border-radius:14px; padding:10px 16px; font-family:'Fredoka One',cursive;
  font-size:2rem; color:#3a3180; text-align:center; width:100%; }
.maze-win { text-align:center; padding:20px; }
.game-btn { background:#7c6fcf;color:white;border:none;padding:12px 28px;border-radius:20px;
  font-family:'Fredoka One',cursive;font-size:2rem;cursor:pointer;display:block;
  margin:14px auto 0; }
@media(max-width:900px){ .dpad-btn{width:40px;height:40px;font-size:1.2rem;} .dpad{grid-template-columns:repeat(3,40px);grid-template-rows:repeat(3,40px);} }
`;
  const S = document.createElement('style'); S.textContent = CSS; document.head.appendChild(S);

  let _mz = {};

  /* ── MAZE GENERATOR (recursive backtracking) ── */
  function genMaze(rows, cols) {
    const cells = Array.from({length:rows}, () => Array(cols).fill(0));
    // walls: bit 1=N 2=E 4=S 8=W (open = bit set means wall removed)
    const walls = Array.from({length:rows}, () => Array(cols).fill(0));
    const visited = Array.from({length:rows}, () => Array(cols).fill(false));
    const dirs = [[-1,0,1,0],[0,1,0,2],[1,0,4,0],[0,-1,0,8]]; // [dr,dc,myBit,oppBit] but simplified below
    const DIRS = [{r:-1,c:0,bit:1,opp:4},{r:0,c:1,bit:2,opp:8},{r:1,c:0,bit:4,opp:1},{r:0,c:-1,bit:8,opp:2}];
    function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
    function carve(r,c){
      visited[r][c]=true;
      for (const d of shuffle([...DIRS])) {
        const nr=r+d.r, nc=c+d.c;
        if (nr>=0&&nr<rows&&nc>=0&&nc<cols&&!visited[nr][nc]) {
          walls[r][c]|=d.bit; walls[nr][nc]|=d.opp; carve(nr,nc);
        }
      }
    }
    carve(0,0);
    return walls;
  }

  function render(item) {
    const rows = item.data.size || 7, cols = item.data.size || 7;
    const phonics = item.type === 'game_maze_phonics';
    const collectWord = phonics && item.data.word ? item.data.word.toUpperCase() : null;
    const walls = genMaze(rows, cols);
    // Place collectibles for phonics
    let collectibles = [];
    if (collectWord) {
      const positions = [];
      while (positions.length < collectWord.length) {
        const r=Math.floor(Math.random()*rows), c=Math.floor(Math.random()*cols);
        if ((r!==0||c!==0)&&(r!==rows-1||c!==cols-1)&&!positions.find(p=>p.r===r&&p.c===c))
          positions.push({r,c});
      }
      collectibles = collectWord.split('').map((ch,i)=>({...positions[i],ch,collected:false}));
    }
    _mz = { rows, cols, walls, pr:0, pc:0, moves:0, phonics, collectWord, collectibles,
      collected:[], won:false, item };
    return mazeHTML();
  }

  function mazeHTML() {
    const st = _mz;
    const W = Math.min(340, Math.floor((window.innerWidth*0.72)/st.cols)*st.cols);
    const cell = Math.floor(W / st.cols);
    const H = cell * st.rows;
    const phonicsPrompt = st.phonics && st.collectWord
      ? `<div class="maze-phonics-prompt">Collect: ${st.collectWord.split('').map((ch,i) => {
          const got = st.collected[i];
          return `<span style="color:${got?'#27ae60':'#c5bef0'};margin:0 2px">${got||ch}</span>`;
        }).join('')}</div>` : '';
    const hintText = st.phonics ? 'Collect letters in order!' : 'Find the 🏆 exit!';
    setTimeout(() => drawMaze(W, H, cell), 40);
    return `<div class="maze-wrap">
      <div class="maze-top"><div class="maze-title">${st.phonics?'🔤 Phonics Maze':'🌀 Maze'}</div><div class="maze-info">🔄 ${st.moves}</div></div>
      ${phonicsPrompt}
      <canvas class="maze-cv" id="mcv" width="${W}" height="${H}"></canvas>
      <div class="maze-hint">${hintText}</div>
      <div class="dpad">
        <div class="dpad-blank"></div>
        <button class="dpad-btn" onpointerdown="Maze.move(-1,0)">▲</button>
        <div class="dpad-blank"></div>
        <button class="dpad-btn" onpointerdown="Maze.move(0,-1)">◀</button>
        <div class="dpad-blank"></div>
        <button class="dpad-btn" onpointerdown="Maze.move(0,1)">▶</button>
        <div class="dpad-blank"></div>
        <button class="dpad-btn" onpointerdown="Maze.move(1,0)">▼</button>
        <div class="dpad-blank"></div>
      </div>
    </div>`;
  }

  function drawMaze(W, H, cell) {
    const cv = document.getElementById('mcv'); if (!cv) return;
    const ctx = cv.getContext('2d');
    const st  = _mz;
    ctx.clearRect(0,0,W,H);
    // Background
    ctx.fillStyle='#f8f6ff'; ctx.fillRect(0,0,W,H);
    // Walls
    ctx.strokeStyle='#5c52c0'; ctx.lineWidth=2; ctx.lineCap='round';
    for (let r=0;r<st.rows;r++) for (let c=0;c<st.cols;c++) {
      const x=c*cell, y=r*cell, w=st.walls[r][c];
      if (!(w&1)){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+cell,y);ctx.stroke();}         // N
      if (!(w&2)){ctx.beginPath();ctx.moveTo(x+cell,y);ctx.lineTo(x+cell,y+cell);ctx.stroke();}// E
      if (!(w&4)){ctx.beginPath();ctx.moveTo(x,y+cell);ctx.lineTo(x+cell,y+cell);ctx.stroke();}// S
      if (!(w&8)){ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+cell);ctx.stroke();}          // W
    }
    // Exit
    const ex=(st.cols-1)*cell, ey=(st.rows-1)*cell;
    ctx.fillStyle='#fff5cc'; ctx.fillRect(ex+2,ey+2,cell-4,cell-4);
    ctx.font=`${cell-8}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('🏆',ex+cell/2,ey+cell/2);
    // Collectibles
    st.collectibles.forEach(col=>{
      if (!col.collected){
        ctx.fillStyle='#ffe082'; ctx.beginPath();
        ctx.arc(col.c*cell+cell/2,col.r*cell+cell/2,cell*0.28,0,Math.PI*2); ctx.fill();
        ctx.fillStyle='#3a3180'; ctx.font=`bold ${Math.floor(cell*0.4)}px Nunito,sans-serif`;
        ctx.textAlign='center'; ctx.textBaseline='middle';
        ctx.fillText(col.ch,col.c*cell+cell/2,col.r*cell+cell/2);
      }
    });
    // Player
    ctx.fillStyle='#7c6fcf'; ctx.beginPath();
    ctx.arc(st.pc*cell+cell/2,st.pr*cell+cell/2,cell*0.32,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='white'; ctx.font=`${cell-10}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('😊',st.pc*cell+cell/2,st.pr*cell+cell/2);
  }

  function canMove(r,c,nr,nc) {
    const st=_mz;
    if (nr<0||nr>=st.rows||nc<0||nc>=st.cols) return false;
    const dr=nr-r, dc=nc-c;
    if (dr===-1) return !!(st.walls[r][c]&1);
    if (dc===1)  return !!(st.walls[r][c]&2);
    if (dr===1)  return !!(st.walls[r][c]&4);
    if (dc===-1) return !!(st.walls[r][c]&8);
    return false;
  }

  // Keyboard support
  document.addEventListener('keydown', e => {
    const map={ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1]};
    const d=map[e.key]; if(d&&document.getElementById('mcv')) { e.preventDefault(); Maze.move(...d); }
  });

  window.Maze = {
    move(dr,dc) {
      const st=_mz; if(st.won) return;
      const nr=st.pr+dr, nc=st.pc+dc;
      if (!canMove(st.pr,st.pc,nr,nc)) return;
      st.pr=nr; st.pc=nc; st.moves++;
      // Phonics collect
      if (st.phonics && st.collectWord) {
        const nextIdx = st.collected.length;
        const col = st.collectibles[nextIdx];
        if (col && col.r===nr && col.c===nc) { col.collected=true; st.collected.push(col.ch); }
      }
      // Win
      if (nr===st.rows-1 && nc===st.cols-1) {
        st.won=true;
        const wordDone = !st.phonics || st.collected.join('')===st.collectWord;
        setTimeout(()=>{
          document.getElementById('pm-body').innerHTML=`<div class="maze-win">
            <div style="font-size:5rem">${wordDone?'🎉':'😅'}</div>
            <div style="font-family:'Fredoka One',cursive;font-size:3rem;color:#5c52c0;margin:10px 0">${wordDone?'You made it!':'Try collecting all letters!'}</div>
            ${st.phonics?`<div style="font-size:2rem;color:#666">Word: ${st.collected.join('') || '—'}</div>`:''}
            <div style="font-size:1.8rem;color:#aaa">Moves: ${st.moves}</div>
            <button class="game-btn" onclick="Maze.restart()">Play Again</button>
          </div>`;
        }, 300);
        return;
      }
      // Re-draw
      const cv=document.getElementById('mcv'); if(!cv) return;
      drawMaze(cv.width,cv.height,Math.floor(cv.width/st.cols));
      // Update collected display
      if (st.phonics) {
        const el=document.getElementById('pm-body');
        if(el) el.querySelector('.maze-phonics-prompt') && (el.innerHTML = mazeHTML());
      }
    },
    restart() { document.getElementById('pm-body').innerHTML=render(_mz.item); }
  };

  GameRegistry.register({ types:['game_maze','game_maze_phonics'], icon:'🌀', label:'Maze', render });
})();
