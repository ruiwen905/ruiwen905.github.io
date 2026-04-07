# 🌟 Kids World App (v2 — Modular)

## Folder Structure

```
kids-app-v2/
├── index.html                  ← Thin shell: just HTML + <script> / <link> tags
├── server.py                   ← Python local server
├── README.md
│
├── css/
│   ├── base.css                ← Layout, nav, modal, loading, shared animations
│   └── responsive.css          ← All @media breakpoints
│
├── onboarding/
│   ├── onboarding.css          ← First-run setup styles
│   └── onboarding.js           ← window.Onboarding — 3-step setup flow
│
├── js/
│   ├── state.js                ← window.State  — single source of truth, save/load
│   ├── boot.js                 ← window.Boot   — app boot, view routing, admin
│   └── admin.js                ← window.Admin  — CRUD modals for tasks/market/skills
│
├── tabs/
│   ├── routines/
│   │   ├── routines.css        ← Panel, road, task card styles
│   │   └── routines.js         ← window.Routines — render & toggle chore tasks
│   │
│   ├── market/
│   │   ├── market.css          ← Stall, pool card, voucher styles
│   │   └── market.js           ← window.Market — buy, redeem, voucher filter
│   │
│   ├── skills/
│   │   ├── skills.css          ← Medal showcase, progress bars, mastered strip
│   │   └── skills.js           ← window.Skills — tap to practice, medal reveal
│   │
│   └── play/
│       ├── play.css            ← Play columns, category list, overlay styles
│       ├── play.js             ← window.Play — board, lang switch, overlay dispatch
│       └── games/
│           ├── registry.js     ← window.GameRegistry — register/render/icon/label
│           ├── song/
│           │   └── song.js     ← type: song
│           ├── story/
│           │   └── story.js    ← type: story
│           ├── concept/
│           │   └── concept.js  ← type: concept
│           ├── phonics/
│           │   └── phonics.js  ← types: game_phonics, game_blends, game_hfwords
│           ├── numeracy/
│           │   └── numeracy.js ← types: game_counting, game_patterns
│           ├── calendar/
│           │   └── calendar.js ← types: game_days_spell, game_days_seq,
│           │                              game_months_spell, game_months_seq
│           └── clock/
│               └── clock.js    ← type: game_clock
│
└── assets/
    ├── data/
    │   ├── syllabus.json       ← N1 + K1 learning content
    │   ├── user-data.json      ← Your family's data (auto-created)
    │   └── templates/
    │       ├── nursery1.json       ← Age 3-4 template
    │       └── kindergarten1.json  ← Age 5-6 template
    └── images/
        ├── ethan.png
        ├── lydia.png
        └── lucas.png
```

---

## How to Run

```bash
cd kids-app-v2
python3 server.py
# Open: http://localhost:8080
```

---

## Adding a New Game Type

1. Create a folder: `tabs/play/games/mygame/`
2. Create `tabs/play/games/mygame/mygame.js`:

```js
(function () {
  // Optional: inject CSS
  const style = document.createElement('style');
  style.textContent = `.my-game { ... }`;
  document.head.appendChild(style);

  function render(item) {
    // item.data comes from syllabus.json
    return `<div class="my-game">...</div>`;
  }

  // Register with the type string used in syllabus.json
  GameRegistry.register({
    types: ['game_mygame'],
    icon:  '🎯',
    label: 'Game',
    render,
  });
})();
```

3. Add one line to `index.html` (after registry.js):
```html
<script src="tabs/play/games/mygame/mygame.js"></script>
```

4. Add items with `"type": "game_mygame"` to `assets/data/syllabus.json`.

That's it — no other files need changing.

---

## Adding a New Syllabus Level

Add a new key to `assets/data/syllabus.json`:
```json
{
  "N1": { "en": [...], "cn": [...] },
  "K1": { "en": [...], "cn": [...] },
  "K2": { "en": [...], "cn": [...] }
}
```

Then add an entry in `js/state.js` under `SYLLABUS_LEVEL`:
```js
const SYLLABUS_LEVEL = { ..., kindergarten2: 'K2' };
```

---

## Module API Summary

| Module | Key methods |
|--------|-------------|
| `State` | `getApp()`, `save()`, `load()`, `kidPct(k)`, `totalPool()`, `kidColor(k)` |
| `Boot`  | `boot()`, `switchView(v)`, `toggleAdmin()`, `updateFloatingStar()` |
| `Admin` | `openAddTask(type)`, `editMarket(id)`, `openAddSkill(key)` |
| `Routines` | `buildBoard()`, `renderRoad(k)`, `renderRoutines(k)`, `toggle(k,tid)` |
| `Market` | `renderMarket()`, `renderVouchers()`, `buy(id)`, `redeem(id)` |
| `Skills` | `buildBoard()`, `renderCol(k)`, `tapSkill(k,id)` |
| `Play`  | `buildBoard()`, `renderCol(k)`, `openOverlay(k,catId,itemId)` |
| `GameRegistry` | `register({types,icon,label,render})`, `render(item)` |
