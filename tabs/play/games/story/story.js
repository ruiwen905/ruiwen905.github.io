/* tabs/play/games/story/story.js */

(function () {
  const CSS = `
.story-emoji   { text-align:center; font-size:5rem; margin:10px 0; }
.story-summary { background:#f8f6ff; border-radius:14px; padding:16px; font-size:1.9rem; line-height:1.6; margin-bottom:12px; }
.story-moral   { background:linear-gradient(135deg,#fff5cc,#fff0aa); border-radius:14px; padding:14px 16px; font-size:1.9rem; border-left:5px solid #f5c842; }
.story-moral strong { color:#8a6000; }
@media(max-width:900px){.story-summary,.story-moral{font-size:1rem;}}
`;
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

  function render(item) {
    const d = item.data;
    return `<div class="story-emoji">${d.emoji || '📖'}</div>
      <div class="story-summary">${d.summary}</div>
      <div class="story-moral"><strong>💡 Moral: </strong>${d.moral}</div>`;
  }

  GameRegistry.register({ types: ['story'], icon: '📖', label: 'Story', render });
})();
