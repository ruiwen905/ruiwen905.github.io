/* tabs/play/games/song/song.js
   Song component: displays lyrics line by line with read-aloud. */

(function () {
  const CSS = `
.song-lyrics { display:flex; flex-direction:column; gap:6px; margin:14px 0; }
.lyric-line { padding:8px 14px; border-radius:8px; background:#f8f6ff; font-size:1.9rem; line-height:1.4; transition:background .3s; }
.lyric-line.active { background:#e0d8ff; font-weight:800; }
.speak-btn { background:#7c6fcf; color:white; border:none; padding:12px 24px; border-radius:20px; font-family:'Fredoka One',cursive; font-size:2rem; cursor:pointer; display:flex; align-items:center; gap:8px; margin:0 auto; }
`;
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

  function render(item) {
    const lines = item.data.lyrics.split('\n');
    window._currentLines = lines;
    return `<div class="song-lyrics">${lines.map((l, i) => `<div class="lyric-line" id="ll-${i}">${l || '&nbsp;'}</div>`).join('')}</div>
      <button class="speak-btn" id="speak-btn" onclick="SongGame.speak()">🔊 Read Aloud</button>`;
  }

  window.SongGame = {
    speak() {
      const lines = window._currentLines || [];
      if (!window.speechSynthesis) { alert('Speech not supported.'); return; }
      window.speechSynthesis.cancel();
      const btn = document.getElementById('speak-btn');
      if (btn) { btn.textContent = '⏹ Stop'; btn.onclick = () => { window.speechSynthesis.cancel(); if (btn) { btn.textContent = '🔊 Read Aloud'; btn.onclick = SongGame.speak; } }; }
      let i = 0;
      function next() {
        document.querySelectorAll('.lyric-line').forEach(el => el.classList.remove('active'));
        if (i >= lines.length) { if (btn) { btn.textContent = '🔊 Read Aloud'; btn.onclick = SongGame.speak; } return; }
        const el = document.getElementById('ll-' + i);
        if (el) { el.classList.add('active'); el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
        const u = new SpeechSynthesisUtterance(lines[i] || ' ');
        u.rate = 0.85; u.lang = 'en-US'; u.onend = () => { i++; next(); };
        window.speechSynthesis.speak(u);
      }
      next();
    }
  };

  GameRegistry.register({ types: ['song'], icon: '🎵', label: 'Song', render });
})();
