/* tabs/play/games/registry.js
   Central registry for all game types.
   To add a new game:
     1. Create a folder under tabs/play/games/
     2. Add a JS file that calls GameRegistry.register(...)
     3. Include the script in index.html BEFORE play.js

   Each game file calls:
     GameRegistry.register({
       types:  ['game_mytype'],        // one or more type strings
       icon:   '🎮',
       label:  'Game',
       render: (item) => '<html string>',
     }); */

window.GameRegistry = (() => {
  const _registry = {};

  function register({ types, icon, label, render }) {
    types.forEach(t => { _registry[t] = { icon, label, render }; });
  }

  function render(item) {
    const entry = _registry[item.type];
    if (entry) return entry.render(item);
    return `<p style="padding:20px;color:#aaa;text-align:center;">Game type <strong>${item.type}</strong> not found.<br>Add a file to tabs/play/games/ and register it.</p>`;
  }

  function icon(type) {
    const entry = _registry[type];
    return entry ? entry.icon : '⭐';
  }

  function label(type) {
    const entry = _registry[type];
    return entry ? entry.label : '';
  }

  function listTypes() { return Object.keys(_registry); }

  return { register, render, icon, label, listTypes };
})();
