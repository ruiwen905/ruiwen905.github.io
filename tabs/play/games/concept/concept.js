/* tabs/play/games/concept/concept.js */

(function () {
  const CSS = `
.concept-cards { display:flex; flex-direction:column; gap:10px; }
.concept-card  { display:flex; align-items:flex-start; gap:12px; padding:14px; background:#f8f7ff; border-radius:12px; border:1.5px solid #e8e0f0; }
.concept-card-icon { font-size:2.8rem; flex-shrink:0; }
.concept-card-name { font-weight:800; font-size:1.9rem; margin-bottom:4px; }
.concept-card-desc { font-size:1.7rem; color:#666; }
@media(max-width:900px){.concept-card-name{font-size:1rem;}.concept-card-desc{font-size:.9rem;}.concept-card-icon{font-size:1.8rem;}}
`;
  const style = document.createElement('style'); style.textContent = CSS; document.head.appendChild(style);

  function render(item) {
    return `<div class="concept-cards">${item.data.concepts.map(c => `
      <div class="concept-card">
        <div class="concept-card-icon">${c.emoji}</div>
        <div>
          <div class="concept-card-name">${c.name}</div>
          <div class="concept-card-desc">${c.desc}</div>
        </div>
      </div>`).join('')}</div>`;
  }

  GameRegistry.register({ types: ['concept'], icon: '💡', label: 'Learn', render });
})();
