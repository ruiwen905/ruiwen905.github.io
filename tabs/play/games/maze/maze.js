/* tabs/play/games/maze/maze.js
   Types: game_maze, game_maze_phonics

   DESIGN:
   - The maze has a MARGIN around it (1.5 cells wide).
   - Letters (and the 🏆 trophy) sit in that outer margin.
   - Each letter/trophy has its own "gate" — a gap cut in the outer wall of the maze.
   - Player navigates inside the maze and exits through each gate to collect the item.
   - After collecting ALL letters (in any order), the 🏆 gate opens and the player must
     reach the trophy to win.
   - For game_maze (no phonics): single gate leads directly to 🏆.
*/

(function () {
  const CSS = `
.maze-outer     { display:flex; flex-direction:column; align-items:center; gap:10px; }
.maze-top       { display:flex; justify-content:space-between; width:100%; align-items:center; }
.maze-label     { font-family:'Fredoka One',cursive; font-size:2rem; color:#5c52c0; }
.maze-moves     { font-family:'Fredoka One',cursive; font-size:1.8rem; color:#aaa; }
.maze-word-row  { display:flex; gap:10px; justify-content:center; flex-wrap:wrap; }
.mwl            { width:46px; height:52px; border:3px solid #c5bef0; border-radius:10px;
  font-family:'Fredoka One',cursive; font-size:2.2rem; display:flex; align-items:center;
  justify-content:center; color:#c5bef0; background:#f8f6ff; transition:all .2s; }
.mwl.got        { border-color:#27ae60; color:#27ae60; background:#eaffea; }
.mwl.next       { border-color:#7c6fcf; color:#7c6fcf; background:#f0edff;
  animation:mwPulse .6s ease infinite alternate; }
@keyframes mwPulse { from{transform:scale(1)} to{transform:scale(1.1)} }
.maze-board-row { display:flex; align-items:center; justify-content:center; gap:14px; }
canvas.mzcv     { display:block; touch-action:none; flex-shrink:0;
  border-radius:10px; box-shadow:0 4px 16px rgba(0,0,0,.12); }
.dpad           { display:grid; grid-template-columns:repeat(3,52px); grid-template-rows:repeat(3,52px); gap:5px; flex-shrink:0; }
.dpb            { width:52px; height:52px; border-radius:12px; border:none; background:#5c52c0; color:white;
  font-size:1.8rem; cursor:pointer; display:flex; align-items:center; justify-content:center;
  -webkit-user-select:none; user-select:none; touch-action:manipulation; }
.dpb:active     { background:#3a3180; transform:scale(.9); }
.dp0            { width:52px; height:52px; }
.maze-status    { font-family:'Fredoka One',cursive; font-size:1.9rem; color:#5c52c0; min-height:30px; text-align:center; }
.maze-hint      { font-size:1.5rem; color:#aaa; text-align:center; }
.game-btn       { background:#7c6fcf;color:white;border:none;padding:12px 28px;border-radius:20px;
  font-family:'Fredoka One',cursive;font-size:2rem;cursor:pointer;display:block;margin:12px auto 0; }
@media(max-width:700px){
  .dpb,.dp0{ width:42px;height:42px; }
  .dpad{ grid-template-columns:repeat(3,42px);grid-template-rows:repeat(3,42px); }
  .mwl{ width:36px;height:42px;font-size:1.6rem; }
}
`;
  document.head.appendChild(Object.assign(document.createElement('style'), { textContent: CSS }));

  let M = {};

  /* ── MAZE GENERATOR ── */
  function genMaze(R, C) {
    const DIRS = [
      { r:-1,c:0,b:1,o:4 }, { r:0,c:1,b:2,o:8 },
      { r:1,c:0,b:4,o:1 }, { r:0,c:-1,b:8,o:2 }
    ];
    const walls   = Array.from({ length:R }, () => Array(C).fill(0));
    const visited = Array.from({ length:R }, () => Array(C).fill(false));
    function shuf(a) { for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a; }
    function carve(r, c) {
      visited[r][c] = true;
      for (const d of shuf([...DIRS])) {
        const nr=r+d.r, nc=c+d.c;
        if (nr>=0&&nr<R&&nc>=0&&nc<C&&!visited[nr][nc]) {
          walls[r][c]|=d.b; walls[nr][nc]|=d.o; carve(nr,nc);
        }
      }
    }
    carve(0, 0);
    return walls;
  }

  /* ── PLACE GATES evenly around the perimeter ──
     Each gate = { r, c, side:'N'|'E'|'S'|'W', ch, isTrophy, collected }
     side = which outer wall is opened.
     For the exit cell on that side:
       N: cell (0, c)   wall bit 1 removed
       E: cell (r, C-1) wall bit 2 removed
       S: cell (R-1, c) wall bit 4 removed
       W: cell (r, 0)   wall bit 8 removed
  */
  function placeGates(R, C, walls, items) {
    // items = array of {ch, isTrophy}
    const n = items.length;
    // Distribute positions evenly around perimeter
    const perim = 2*(R+C) - 4; // total perimeter cells
    const step  = Math.floor(perim / n);
    const gates = [];

    items.forEach((item, i) => {
      const pos = (i * step + Math.floor(step/2)) % perim;
      let r, c, side;

      if (pos < C) {                           // top edge
        r=0; c=pos; side='N';
      } else if (pos < C+R-1) {                // right edge
        r=pos-C+1; c=C-1; side='E';
      } else if (pos < 2*C+R-2) {              // bottom edge
        r=R-1; c=C-(pos-(C+R-2))-1; side='S';
      } else {                                  // left edge
        r=R-(pos-(2*C+R-3))-1; c=0; side='W';
      }
      // Clamp
      r = Math.max(0,Math.min(R-1,r));
      c = Math.max(0,Math.min(C-1,c));

      // Open the outer wall
      const bitMap = { N:1, E:2, S:4, W:8 };
      walls[r][c] |= bitMap[side];

      gates.push({ r, c, side, ch:item.ch, isTrophy:item.isTrophy, collected:false });
    });

    return gates;
  }

  /* ── RENDER ── */
  function render(item) {
    const sz        = item.data.size || 7;
    const isPhonics = item.type === 'game_maze_phonics';
    const word      = isPhonics && item.data.word ? item.data.word.toUpperCase() : null;
    const walls     = genMaze(sz, sz);

    // Build items list: letters first (any order), then trophy
    let gateItems = [];
    if (word) {
      // Shuffle letter order so gates are distributed unpredictably
      const shuffled = word.split('').map((ch, i) => ({ ch, isTrophy:false }));
      for (let i=shuffled.length-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]]; }
      gateItems = [...shuffled, { ch:'🏆', isTrophy:true }];
    } else {
      gateItems = [{ ch:'🏆', isTrophy:true }];
    }

    const gates = placeGates(sz, sz, walls, gateItems);

    M = {
      R:sz, C:sz, walls, pr:0, pc:0, moves:0,
      isPhonics, word, gates,
      collected: [],  // letters collected so far
      won: false,
      item,
      // player location: null = inside maze, 'gate_i' = stepped into gate i's margin
      atGate: null,
    };
    return mazeHTML();
  }

  /* ── HTML ── */
  function mazeHTML() {
    const MARGIN = 1.5; // cells of margin on each side
    const pw   = window.innerWidth;
    const maxTotal = Math.min(320, Math.floor((pw * 0.52)));
    const cell = Math.max(14, Math.floor(maxTotal / (M.C + MARGIN*2)));
    const mPx  = Math.round(cell * MARGIN);   // margin in pixels
    const W    = cell*M.C + 2*mPx;
    const H    = cell*M.R + 2*mPx;

    const letterBoxes = M.word
      ? M.word.split('').map((ch, i) => {
          const got  = M.collected.includes(ch) || M.collected.filter(x=>x===ch).length > M.word.split('').slice(0,i).filter(x=>x===ch).length;
          // Simpler: track by index
          const gotI = i < M.collected.length;
          const isNext = i === M.collected.length;
          return `<div class="mwl${gotI?' got':isNext?' next':''}">${gotI?ch:'_'}</div>`;
        }).join('') : '';

    setTimeout(() => drawMaze(W, H, cell, mPx), 40);

    return `<div class="maze-outer">
      <div class="maze-top">
        <div class="maze-label">${M.isPhonics ? '🔤 Phonics Maze' : '🌀 Maze'}</div>
        <div class="maze-moves">🔄 ${M.moves}</div>
      </div>
      ${M.word ? `<div class="maze-word-row">${letterBoxes}</div>` : ''}
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
      <div class="maze-hint">${M.isPhonics ? 'Exit the maze through each gate to collect letters, then reach 🏆!' : 'Find the exit gate and reach 🏆!'}</div>
    </div>`;
  }

  /* ── DRAW ── */
  function drawMaze(W, H, cell, mPx) {
    const cv = document.getElementById('mzcv'); if (!cv) return;
    const ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, W, H);

    const mx = mPx, my = mPx; // maze origin in canvas px

    // ── Margin background ──
    ctx.fillStyle = '#e8e4f8';
    ctx.fillRect(0, 0, W, H);

    // ── Maze checkerboard ──
    for (let r=0; r<M.R; r++) for (let c=0; c<M.C; c++) {
      ctx.fillStyle = (r+c)%2===0 ? '#f8f6ff' : '#ede8ff';
      ctx.fillRect(mx+c*cell, my+r*cell, cell, cell);
    }

    // ── Walls (interior + outer) ──
    ctx.strokeStyle = '#5c52c0'; ctx.lineWidth = Math.max(2, cell*0.07); ctx.lineCap = 'round';
    for (let r=0; r<M.R; r++) for (let c=0; c<M.C; c++) {
      const x=mx+c*cell, y=my+r*cell, w=M.walls[r][c];
      if (!(w&1)) drawLine(ctx, x, y, x+cell, y);             // N
      if (!(w&2)) drawLine(ctx, x+cell, y, x+cell, y+cell);   // E
      if (!(w&4)) drawLine(ctx, x, y+cell, x+cell, y+cell);   // S
      if (!(w&8)) drawLine(ctx, x, y, x, y+cell);             // W
    }

    // ── Outer border (thick) — drawn AFTER walls so it covers thin wall ends ──
    // Draw each edge, but leave gaps for gates
    const gateSet = new Set(M.gates.map(g => `${g.r},${g.c},${g.side}`));
    const lw = Math.max(3, cell*0.12);
    ctx.strokeStyle = '#3a3180'; ctx.lineWidth = lw;

    // Top edge
    for (let c=0; c<M.C; c++) {
      if (!gateSet.has(`0,${c},N`)) {
        drawLine(ctx, mx+c*cell, my, mx+(c+1)*cell, my);
      }
    }
    // Bottom edge
    for (let c=0; c<M.C; c++) {
      if (!gateSet.has(`${M.R-1},${c},S`)) {
        drawLine(ctx, mx+c*cell, my+M.R*cell, mx+(c+1)*cell, my+M.R*cell);
      }
    }
    // Left edge
    for (let r=0; r<M.R; r++) {
      if (!gateSet.has(`${r},0,W`)) {
        drawLine(ctx, mx, my+r*cell, mx, my+(r+1)*cell);
      }
    }
    // Right edge
    for (let r=0; r<M.R; r++) {
      if (!gateSet.has(`${r},${M.C-1},E`)) {
        drawLine(ctx, mx+M.C*cell, my+r*cell, mx+M.C*cell, my+(r+1)*cell);
      }
    }

    // ── Gate stations (in margin) ──
    const allLettersCollected = M.word ? M.collected.length >= M.word.length : true;

    M.gates.forEach(g => {
      const gx = mx + g.c*cell + cell/2;
      const gy = my + g.r*cell + cell/2;
      let sx, sy; // station center

      if      (g.side==='N') { sx=gx;           sy=my - mPx*0.55; }
      else if (g.side==='E') { sx=mx+M.C*cell+mPx*0.55; sy=gy; }
      else if (g.side==='S') { sx=gx;           sy=my+M.R*cell+mPx*0.55; }
      else                   { sx=mx - mPx*0.55; sy=gy; }

      const radius = mPx * 0.42;
      const done   = g.collected || (g.isTrophy && g.collected);
      const locked = g.isTrophy && !allLettersCollected;

      // Station circle
      ctx.beginPath();
      ctx.arc(sx, sy, radius, 0, Math.PI*2);
      if (locked)      ctx.fillStyle = '#ccc';
      else if (done)   ctx.fillStyle = '#eaffea';
      else if (g.isTrophy) ctx.fillStyle = '#fff5cc';
      else             ctx.fillStyle = '#c8f0d8';
      ctx.fill();
      ctx.strokeStyle = locked ? '#bbb' : done ? '#27ae60' : g.isTrophy ? '#f5c842' : '#27ae60';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Draw a "path" from gate to station
      ctx.strokeStyle = locked ? '#ddd' : '#b8e8c8';
      ctx.lineWidth = Math.max(2, cell*0.15);
      ctx.setLineDash([4,4]);
      ctx.beginPath();
      if (g.side==='N') { ctx.moveTo(gx, my); ctx.lineTo(sx, sy+radius); }
      else if (g.side==='E') { ctx.moveTo(mx+M.C*cell, gy); ctx.lineTo(sx-radius, sy); }
      else if (g.side==='S') { ctx.moveTo(gx, my+M.R*cell); ctx.lineTo(sx, sy-radius); }
      else { ctx.moveTo(mx, gy); ctx.lineTo(sx+radius, sy); }
      ctx.stroke(); ctx.setLineDash([]);

      // Letter / trophy emoji
      ctx.font = `${Math.round(radius*1.1)}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      if (done) {
        ctx.fillStyle = '#27ae60'; ctx.font = `bold ${Math.round(radius*0.9)}px Nunito,sans-serif`;
        ctx.fillText('✓', sx, sy);
      } else if (g.isTrophy) {
        ctx.fillText(locked ? '🔒' : '🏆', sx, sy);
      } else {
        ctx.fillStyle = '#1a237e'; ctx.font = `bold ${Math.round(radius*0.9)}px Nunito,sans-serif`;
        ctx.fillText(g.ch, sx, sy);
      }

      // Gate opening highlight (cyan bar in the wall gap)
      if (!locked && !done) {
        ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = Math.max(3, cell*0.18);
        ctx.beginPath();
        if (g.side==='N') { ctx.moveTo(mx+g.c*cell+2, my); ctx.lineTo(mx+(g.c+1)*cell-2, my); }
        else if (g.side==='E') { ctx.moveTo(mx+M.C*cell, my+g.r*cell+2); ctx.lineTo(mx+M.C*cell, my+(g.r+1)*cell-2); }
        else if (g.side==='S') { ctx.moveTo(mx+g.c*cell+2, my+M.R*cell); ctx.lineTo(mx+(g.c+1)*cell-2, my+M.R*cell); }
        else { ctx.moveTo(mx, my+g.r*cell+2); ctx.lineTo(mx, my+(g.r+1)*cell-2); }
        ctx.stroke();
      }
    });

    // ── Player ──
    const px = mx + M.pc*cell + cell/2;
    const py = my + M.pr*cell + cell/2;
    ctx.fillStyle = '#7c6fcf';
    ctx.beginPath(); ctx.arc(px, py, cell*0.34, 0, Math.PI*2); ctx.fill();
    ctx.font = `${cell-4}px serif`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('😊', px, py);
  }

  function drawLine(ctx, x1,y1,x2,y2) {
    ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
  }

  /* ── CAN MOVE (inside maze) ── */
  function canMove(r, c, nr, nc) {
    if (nr<0||nr>=M.R||nc<0||nc>=M.C) return false;
    const dr=nr-r, dc=nc-c;
    if (dr===-1) return !!(M.walls[r][c]&1);
    if (dc===1)  return !!(M.walls[r][c]&2);
    if (dr===1)  return !!(M.walls[r][c]&4);
    if (dc===-1) return !!(M.walls[r][c]&8);
    return false;
  }

  /* ── CHECK if moving would exit through a gate ── */
  function gateAt(r, c, dr, dc) {
    return M.gates.find(g => {
      if (g.r!==r || g.c!==c) return false;
      if (dr===-1 && g.side==='N') return true;
      if (dc===1  && g.side==='E') return true;
      if (dr===1  && g.side==='S') return true;
      if (dc===-1 && g.side==='W') return true;
      return false;
    });
  }

  /* ── MOVE ── */
  window.Maze = {
    mv(dr, dc) {
      if (M.won) return;
      const nr=M.pr+dr, nc=M.pc+dc;

      // First check if this direction leads to a gate exit
      const gate = gateAt(M.pr, M.pc, dr, dc);
      if (gate) {
        const allLettersCollected = M.word ? M.collected.length >= M.word.length : true;
        if (gate.isTrophy && !allLettersCollected) {
          // Trophy locked
          const st = document.getElementById('mzst');
          if (st) { st.textContent='🔒 Collect all letters first!'; st.style.color='#e74c3c'; setTimeout(()=>{if(st)st.textContent='';},900); }
          return;
        }
        // Collect!
        gate.collected = true;
        M.moves++;
        if (gate.isTrophy) {
          M.won = true;
          const cv = document.getElementById('mzcv');
          if (cv) { const c=Math.floor(cv.width/M.C); drawMaze(cv.width,cv.height,c,c*1.5|0); }
          setTimeout(() => {
            document.getElementById('pm-body').innerHTML = `<div style="text-align:center;padding:28px">
              <div style="font-size:5rem">🎉</div>
              <div style="font-family:'Fredoka One',cursive;font-size:3rem;color:#5c52c0;margin:10px 0">You made it!</div>
              ${M.word ? `<div style="font-family:'Fredoka One',cursive;font-size:2.4rem;color:#27ae60">${M.word}</div>` : ''}
              <div style="font-size:1.8rem;color:#aaa">Moves: ${M.moves}</div>
              <button class="game-btn" onclick="Maze._restart()">New Maze</button>
            </div>`;
          }, 300);
          return;
        } else {
          // Collected a letter
          M.collected.push(gate.ch);
          const st = document.getElementById('mzst');
          if (st) {
            st.textContent = `✅ Got "${gate.ch}"! ${M.collected.length}/${M.word.length}`;
            st.style.color = '#27ae60';
            setTimeout(()=>{if(st) st.textContent='';},900);
          }
          updateWordDisplay();
        }
      } else if (canMove(M.pr, M.pc, nr, nc)) {
        M.pr=nr; M.pc=nc; M.moves++;
      } else {
        return; // wall — can't move
      }

      const cv = document.getElementById('mzcv');
      if (cv) {
        const mPx = cv.width - M.C * Math.floor(cv.width/(M.C+3));
        const cell = Math.floor((cv.width - 2*mPx) / M.C);
        const realMPx = Math.round(cell * 1.5);
        drawMaze(cv.width, cv.height, Math.floor((cv.width - 2*realMPx)/M.C), realMPx);
      }
      const mv = document.querySelector('.maze-moves');
      if (mv) mv.textContent = `🔄 ${M.moves}`;
      updateWordDisplay();
    },

    _restart() { document.getElementById('pm-body').innerHTML = render(M.item); }
  };

  function updateWordDisplay() {
    if (!M.word) return;
    const boxes = document.querySelectorAll('.mwl');
    M.word.split('').forEach((ch, i) => {
      if (!boxes[i]) return;
      const got = i < M.collected.length;
      const isNext = i === M.collected.length;
      boxes[i].className = 'mwl' + (got?' got':isNext?' next':'');
      boxes[i].textContent = got ? M.collected[i] : '_';
    });
  }

  // Keyboard support
  document.addEventListener('keydown', e => {
    const m = { ArrowUp:[-1,0],ArrowDown:[1,0],ArrowLeft:[0,-1],ArrowRight:[0,1] };
    const d = m[e.key];
    if (d && document.getElementById('mzcv')) { e.preventDefault(); Maze.mv(...d); }
  });

  GameRegistry.register({ types:['game_maze','game_maze_phonics'], icon:'🌀', label:'Maze', render });
})();
