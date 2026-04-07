/* tabs/play/games/tracing/tracing.js
   Types: game_tracing_en, game_tracing_cn
   Canvas-based letter/word tracing with finger or mouse. */
(function () {
  const CSS = `
.trace-wrap { display:flex; flex-direction:column; align-items:center; gap:10px; }
.trace-lbl { font-family:'Fredoka One',cursive; font-size:2.2rem; color:#5c52c0; }
.trace-sub { font-size:1.6rem; color:#aaa; text-align:center; margin-top:-6px; }
.trace-cw { position:relative; border-radius:16px; overflow:hidden; box-shadow:0 4px 16px rgba(92,82,192,.2); touch-action:none; }
canvas.trace-cv { display:block; background:#f8f6ff; cursor:crosshair; }
.trace-clr-row { display:flex; gap:8px; justify-content:center; }
.trace-dot { width:28px; height:28px; border-radius:50%; cursor:pointer; border:3px solid transparent; transition:transform .12s; }
.trace-dot.on { border-color:#333; transform:scale(1.25); }
.trace-fb { font-family:'Fredoka One',cursive; font-size:2rem; min-height:38px; text-align:center; }
.trace-btns { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; }
.tbtn { padding:10px 20px; border-radius:14px; border:none; font-family:'Fredoka One',cursive; font-size:1.7rem; cursor:pointer; }
.tbtn-clr { background:#eee; color:#555; }
.tbtn-chk { background:#f39c12; color:white; }
.tbtn-nxt { background:#7c6fcf; color:white; }
.trace-prog { font-size:1.6rem; color:#aaa; }
@media(max-width:900px){ .trace-lbl{font-size:1.4rem;} .tbtn{font-size:1rem;padding:7px 12px;} }
`;
  const S = document.createElement('style'); S.textContent = CSS; document.head.appendChild(S);

  const COLORS = ['#7c6fcf','#e74c3c','#27ae60','#f39c12','#e91e8c','#000'];
  let col = '#7c6fcf', drawing = false, ctx = null, guide = null;

  function render(item) {
    window._ts = { items: item.data.items || [], idx: 0 };
    return html();
  }

  function html() {
    const st = window._ts, cur = st.items[st.idx];
    const W = Math.min(340, Math.floor(window.innerWidth * 0.62));
    setTimeout(() => initCanvas(cur, W), 50);
    return `<div class="trace-wrap">
      <div class="trace-prog">${st.idx+1} / ${st.items.length}</div>
      <div class="trace-lbl">${cur.label || cur.char}</div>
      ${cur.pinyin ? `<div class="trace-sub">${cur.pinyin}</div>` : ''}
      <div class="trace-cw"><canvas class="trace-cv" id="tcv" width="${W}" height="${W}"></canvas></div>
      <div class="trace-clr-row">${COLORS.map(c=>`<div class="trace-dot${c===col?' on':''}" style="background:${c}" onclick="Tr.color('${c}')"></div>`).join('')}</div>
      <div class="trace-fb" id="tfb"></div>
      <div class="trace-btns">
        <button class="tbtn tbtn-clr" onclick="Tr.clear()">🗑 Clear</button>
        <button class="tbtn tbtn-chk" onclick="Tr.check()">✓ Check</button>
        <button class="tbtn tbtn-nxt" onclick="Tr.next()">${st.idx < st.items.length-1 ? 'Next →' : 'Finish!'}</button>
      </div>
    </div>`;
  }

  function initCanvas(item, W) {
    const cv = document.getElementById('tcv'); if (!cv) return;
    ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, W, W);
    // Guide letter/char
    const fs = item.char.length > 1 ? Math.floor(W * 0.35) : Math.floor(W * 0.65);
    ctx.font = `bold ${fs}px ${item.cn ? 'serif' : 'Nunito,sans-serif'}`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ddd8f8';
    ctx.fillText(item.char, W/2, W/2);
    ctx.strokeStyle = '#c0b8f0'; ctx.lineWidth = 1.5;
    ctx.setLineDash([5,5]); ctx.strokeText(item.char, W/2, W/2); ctx.setLineDash([]);
    guide = ctx.getImageData(0, 0, W, W);
    // Events
    const on = (e, start) => {
      const r = cv.getBoundingClientRect(), sx = W/r.width, sy = W/r.height;
      const x = (e.clientX - r.left)*sx, y = (e.clientY - r.top)*sy;
      if (start) { drawing=true; ctx.beginPath(); ctx.moveTo(x,y); }
      else if (drawing) {
        ctx.lineTo(x,y); ctx.strokeStyle=col; ctx.lineWidth=16;
        ctx.lineCap='round'; ctx.lineJoin='round'; ctx.stroke();
      }
    };
    cv.onpointerdown = e => on(e, true);
    cv.onpointermove = e => on(e, false);
    cv.onpointerup = cv.onpointerleave = () => { drawing=false; };
  }

  window.Tr = {
    color(c) { col=c; document.getElementById('pm-body').innerHTML=html(); },
    clear() {
      const cv=document.getElementById('tcv'); if(!cv) return;
      initCanvas(window._ts.items[window._ts.idx], cv.width);
      const fb=document.getElementById('tfb'); if(fb) fb.textContent='';
    },
    check() {
      const cv=document.getElementById('tcv'); if(!cv||!guide) return;
      const drawn=ctx.getImageData(0,0,cv.width,cv.height);
      let total=0, covered=0;
      for (let i=3; i<guide.data.length; i+=4) {
        if (guide.data[i]>50) { total++;
          if (drawn.data[i-3]<190 || drawn.data[i-2]<190 || drawn.data[i-1]<190) covered++;
        }
      }
      const pct = total ? Math.round(covered/total*100) : 0;
      const fb = document.getElementById('tfb'); if (!fb) return;
      if (pct>=55) { fb.textContent='✅ Excellent tracing!'; fb.style.color='#27ae60'; }
      else if (pct>=25) { fb.textContent='👍 Good! Trace the full shape.'; fb.style.color='#f39c12'; }
      else { fb.textContent='✏️ Trace over the grey letter!'; fb.style.color='#e74c3c'; }
    },
    next() {
      const st=window._ts; st.idx++;
      if (st.idx>=st.items.length) {
        document.getElementById('pm-body').innerHTML=`<div style="text-align:center;padding:30px">
          <div style="font-size:5rem">🎨</div>
          <div style="font-family:'Fredoka One',cursive;font-size:3rem;color:#7c6fcf;margin:10px 0">All traced!</div>
          <button style="margin-top:20px;background:#7c6fcf;color:white;border:none;padding:12px 28px;border-radius:20px;font-family:'Fredoka One',cursive;font-size:2rem;cursor:pointer" onclick="window._ts.idx=0;document.getElementById('pm-body').innerHTML=Tr._html()">Trace Again</button>
        </div>`;
        return;
      }
      document.getElementById('pm-body').innerHTML=html();
    },
    _html: html
  };

  GameRegistry.register({ types:['game_tracing_en','game_tracing_cn'], icon:'✏️', label:'Trace', render });
})();
