/* tabs/play/games/phonics/phonics.js
   Types: game_phonics, game_blends, game_hfwords
   Levels: alphabets → short vowels → consonants → digraphs/blends
   Every tile click reads the word aloud twice.
   Question order is randomized each play. */

(function () {
  /* ── CSS ── */
  const style = document.createElement('style');
  style.textContent = `
.phonics-level-bar { display:flex; gap:6px; flex-wrap:wrap; margin-bottom:14px; justify-content:center; }
.phonics-level-btn { padding:6px 14px; border-radius:20px; border:2px solid #ddd; background:white;
  font-family:'Fredoka One',cursive; font-size:1.6rem; cursor:pointer; transition:all .15s; }
.phonics-level-btn.active { background:#7c6fcf; color:white; border-color:#7c6fcf; }
.phonics-level-btn:hover:not(.active) { border-color:#b8b0e8; background:#f0edff; }
.game-prompt { text-align:center; margin-bottom:14px; }
.game-digraph { font-family:'Fredoka One',cursive; font-size:5rem; text-shadow:2px 3px 0 rgba(124,111,207,.25); line-height:1.1; }
.game-instruction { font-size:1.8rem; color:#666; margin-top:4px; }
.word-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-bottom:14px; }
.word-tile { padding:12px 8px; border-radius:12px; border:2.5px solid #ddd; background:white;
  text-align:center; cursor:pointer; transition:all .15s; user-select:none; }
.word-tile:hover { border-color:#7c6fcf; background:#f0edff; }
.word-tile.selected { border-color:#7c6fcf; background:#f0edff; }
.word-tile.correct  { border-color:#27ae60; background:#eaffea; }
.word-tile.wrong    { border-color:#e74c3c; background:#ffeaea; animation:shake .3s ease; }
.word-tile.speaking { border-color:#f39c12; background:#fff8e1; }
.wt-emoji { font-size:2.8rem; }
.wt-word  { font-weight:800; font-size:1.7rem; margin-top:4px; }
.game-score { text-align:center; font-family:'Fredoka One',cursive; font-size:2.2rem; color:#7c6fcf; margin-bottom:10px; }
.game-btn   { background:#7c6fcf; color:white; border:none; padding:12px 28px; border-radius:20px;
  font-family:'Fredoka One',cursive; font-size:2rem; cursor:pointer; display:block; margin:12px auto 0; }
.game-btn.green  { background:#27ae60; }
.game-btn.orange { background:#f39c12; }
/* Blends */
.blend-reveal { font-family:'Fredoka One',cursive; font-size:3.5rem; color:#555; margin-top:8px; cursor:pointer; }
.blend-reveal:hover { color:#7c6fcf; }
/* HF Words */
.hfw-progress { text-align:center; font-size:1.6rem; color:#aaa; margin-bottom:10px; }
.hfw-card { background:linear-gradient(135deg,#7c6fcf,#a78bfa); border-radius:20px; padding:30px;
  text-align:center; cursor:pointer; margin-bottom:14px; }
.hfw-word { font-family:'Fredoka One',cursive; font-size:5rem; color:white; line-height:1.1; }
.hfw-tap  { font-size:1.6rem; color:rgba(255,255,255,.7); margin-top:8px; }
.hfw-sentence { background:#f0edff; border-radius:12px; padding:14px; font-size:1.9rem;
  text-align:center; margin-bottom:12px; }
.hfw-nav { display:flex; gap:10px; align-items:center; justify-content:center; }
.hfw-nav button { background:#eee; border:none; padding:10px 20px; border-radius:14px;
  font-family:'Fredoka One',cursive; font-size:1.8rem; cursor:pointer; }
@media(max-width:900px){
  .game-digraph{font-size:3rem;} .game-instruction{font-size:1rem;}
  .wt-word{font-size:1rem;} .hfw-word{font-size:2.8rem;} .hfw-sentence{font-size:1rem;}
  .phonics-level-btn{font-size:1rem; padding:4px 10px;}
}
  `;
  document.head.appendChild(style);

  /* ── SPEAK WORD TWICE ── */
  function speakWord(word, lang, onDone) {
    if (!window.speechSynthesis) { if (onDone) onDone(); return; }
    window.speechSynthesis.cancel();
    const say = (times, cb) => {
      if (times <= 0) { if (cb) cb(); return; }
      const u = new SpeechSynthesisUtterance(word);
      u.lang = lang || 'en-US'; u.rate = 0.75;
      u.onend = () => setTimeout(() => say(times - 1, cb), 350);
      window.speechSynthesis.speak(u);
    };
    say(2, onDone);
  }

  /* ── SHUFFLE ── */
  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ── ALL PHONICS LEVEL DATA ── */
  const LEVELS = {
    alphabets: {
      label:'Alphabets',
      rounds: shuffle([
        {letters:'Aa',color:'#e74c3c',words:shuffle([{w:'apple',e:'🍎',c:true},{w:'ant',e:'🐜',c:true},{w:'arrow',e:'🏹',c:true},{w:'arm',e:'💪',c:true},{w:'alligator',e:'🐊',c:true},{w:'dog',e:'🐶',c:false},{w:'ball',e:'⚽',c:false},{w:'cup',e:'☕',c:false}])},
        {letters:'Bb',color:'#3498db',words:shuffle([{w:'ball',e:'⚽',c:true},{w:'bear',e:'🐻',c:true},{w:'boat',e:'⛵',c:true},{w:'bee',e:'🐝',c:true},{w:'bird',e:'🐦',c:true},{w:'cat',e:'🐱',c:false},{w:'sun',e:'☀️',c:false},{w:'hat',e:'🎩',c:false}])},
        {letters:'Cc',color:'#27ae60',words:shuffle([{w:'cat',e:'🐱',c:true},{w:'car',e:'🚗',c:true},{w:'cup',e:'☕',c:true},{w:'cow',e:'🐄',c:true},{w:'cake',e:'🎂',c:true},{w:'dog',e:'🐶',c:false},{w:'bus',e:'🚌',c:false},{w:'egg',e:'🥚',c:false}])},
        {letters:'Dd',color:'#f39c12',words:shuffle([{w:'dog',e:'🐶',c:true},{w:'duck',e:'🦆',c:true},{w:'door',e:'🚪',c:true},{w:'drum',e:'🥁',c:true},{w:'dolphin',e:'🐬',c:true},{w:'cat',e:'🐱',c:false},{w:'sun',e:'☀️',c:false},{w:'egg',e:'🥚',c:false}])},
        {letters:'Ee',color:'#9b59b6',words:shuffle([{w:'egg',e:'🥚',c:true},{w:'elephant',e:'🐘',c:true},{w:'eye',e:'👁️',c:true},{w:'ear',e:'👂',c:true},{w:'earth',e:'🌍',c:true},{w:'dog',e:'🐶',c:false},{w:'ball',e:'⚽',c:false},{w:'cat',e:'🐱',c:false}])},
        {letters:'Ff',color:'#1abc9c',words:shuffle([{w:'fish',e:'🐟',c:true},{w:'frog',e:'🐸',c:true},{w:'fire',e:'🔥',c:true},{w:'fan',e:'💨',c:true},{w:'flag',e:'🚩',c:true},{w:'dog',e:'🐶',c:false},{w:'ball',e:'⚽',c:false},{w:'cup',e:'☕',c:false}])},
        {letters:'Gg',color:'#c0392b',words:shuffle([{w:'goat',e:'🐐',c:true},{w:'grapes',e:'🍇',c:true},{w:'gate',e:'🚪',c:true},{w:'gift',e:'🎁',c:true},{w:'gorilla',e:'🦍',c:true},{w:'cat',e:'🐱',c:false},{w:'duck',e:'🦆',c:false},{w:'sun',e:'☀️',c:false}])},
        {letters:'Hh',color:'#e67e22',words:shuffle([{w:'hat',e:'🎩',c:true},{w:'house',e:'🏠',c:true},{w:'horse',e:'🐴',c:true},{w:'hammer',e:'🔨',c:true},{w:'heart',e:'❤️',c:true},{w:'dog',e:'🐶',c:false},{w:'cat',e:'🐱',c:false},{w:'sun',e:'☀️',c:false}])},
        {letters:'Ii',color:'#2980b9',words:shuffle([{w:'ice cream',e:'🍦',c:true},{w:'igloo',e:'🏔️',c:true},{w:'insect',e:'🐛',c:true},{w:'ink',e:'🖊️',c:true},{w:'island',e:'🏝️',c:true},{w:'dog',e:'🐶',c:false},{w:'ball',e:'⚽',c:false},{w:'hat',e:'🎩',c:false}])},
        {letters:'Jj',color:'#8e44ad',words:shuffle([{w:'jet',e:'✈️',c:true},{w:'jar',e:'🫙',c:true},{w:'jelly',e:'🍮',c:true},{w:'jungle',e:'🌴',c:true},{w:'jaguar',e:'🐆',c:true},{w:'cat',e:'🐱',c:false},{w:'sun',e:'☀️',c:false},{w:'egg',e:'🥚',c:false}])},
        {letters:'Kk',color:'#e74c3c',words:shuffle([{w:'kite',e:'🪁',c:true},{w:'key',e:'🔑',c:true},{w:'koala',e:'🐨',c:true},{w:'king',e:'👑',c:true},{w:'kangaroo',e:'🦘',c:true},{w:'dog',e:'🐶',c:false},{w:'ball',e:'⚽',c:false},{w:'cat',e:'🐱',c:false}])},
        {letters:'Ll',color:'#3498db',words:shuffle([{w:'lion',e:'🦁',c:true},{w:'leaf',e:'🍃',c:true},{w:'lamp',e:'💡',c:true},{w:'lemon',e:'🍋',c:true},{w:'ladybird',e:'🐞',c:true},{w:'dog',e:'🐶',c:false},{w:'hat',e:'🎩',c:false},{w:'sun',e:'☀️',c:false}])},
        {letters:'Mm',color:'#27ae60',words:shuffle([{w:'moon',e:'🌙',c:true},{w:'monkey',e:'🐒',c:true},{w:'milk',e:'🥛',c:true},{w:'mango',e:'🥭',c:true},{w:'mouse',e:'🐭',c:true},{w:'cat',e:'🐱',c:false},{w:'ball',e:'⚽',c:false},{w:'egg',e:'🥚',c:false}])},
        {letters:'Nn',color:'#f39c12',words:shuffle([{w:'nest',e:'🪺',c:true},{w:'nose',e:'👃',c:true},{w:'net',e:'🥅',c:true},{w:'nut',e:'🥜',c:true},{w:'needle',e:'🪡',c:true},{w:'dog',e:'🐶',c:false},{w:'cup',e:'☕',c:false},{w:'hat',e:'🎩',c:false}])},
        {letters:'Oo',color:'#9b59b6',words:shuffle([{w:'orange',e:'🍊',c:true},{w:'owl',e:'🦉',c:true},{w:'octopus',e:'🐙',c:true},{w:'otter',e:'🦦',c:true},{w:'olive',e:'🫒',c:true},{w:'cat',e:'🐱',c:false},{w:'sun',e:'☀️',c:false},{w:'ball',e:'⚽',c:false}])},
        {letters:'Pp',color:'#1abc9c',words:shuffle([{w:'pig',e:'🐷',c:true},{w:'pizza',e:'🍕',c:true},{w:'pear',e:'🍐',c:true},{w:'penguin',e:'🐧',c:true},{w:'plane',e:'✈️',c:true},{w:'dog',e:'🐶',c:false},{w:'hat',e:'🎩',c:false},{w:'egg',e:'🥚',c:false}])},
        {letters:'Qq',color:'#c0392b',words:shuffle([{w:'queen',e:'👸',c:true},{w:'quail',e:'🐦',c:true},{w:'quiz',e:'❓',c:true},{w:'quarter',e:'🔵',c:true},{w:'queue',e:'🚶',c:true},{w:'cat',e:'🐱',c:false},{w:'sun',e:'☀️',c:false},{w:'ball',e:'⚽',c:false}])},
        {letters:'Rr',color:'#e67e22',words:shuffle([{w:'rabbit',e:'🐰',c:true},{w:'rainbow',e:'🌈',c:true},{w:'robot',e:'🤖',c:true},{w:'rocket',e:'🚀',c:true},{w:'rose',e:'🌹',c:true},{w:'dog',e:'🐶',c:false},{w:'cup',e:'☕',c:false},{w:'hat',e:'🎩',c:false}])},
        {letters:'Ss',color:'#2980b9',words:shuffle([{w:'sun',e:'☀️',c:true},{w:'star',e:'⭐',c:true},{w:'snake',e:'🐍',c:true},{w:'shark',e:'🦈',c:true},{w:'snail',e:'🐌',c:true},{w:'cat',e:'🐱',c:false},{w:'egg',e:'🥚',c:false},{w:'ball',e:'⚽',c:false}])},
        {letters:'Tt',color:'#8e44ad',words:shuffle([{w:'tiger',e:'🐯',c:true},{w:'turtle',e:'🐢',c:true},{w:'tree',e:'🌳',c:true},{w:'truck',e:'🚛',c:true},{w:'train',e:'🚂',c:true},{w:'dog',e:'🐶',c:false},{w:'hat',e:'🎩',c:false},{w:'cup',e:'☕',c:false}])},
        {letters:'Uu',color:'#e74c3c',words:shuffle([{w:'umbrella',e:'☂️',c:true},{w:'unicorn',e:'🦄',c:true},{w:'ufo',e:'🛸',c:true},{w:'urchin',e:'🦔',c:true},{w:'uniform',e:'👔',c:true},{w:'cat',e:'🐱',c:false},{w:'sun',e:'☀️',c:false},{w:'ball',e:'⚽',c:false}])},
        {letters:'Vv',color:'#3498db',words:shuffle([{w:'van',e:'🚐',c:true},{w:'violin',e:'🎻',c:true},{w:'volcano',e:'🌋',c:true},{w:'vest',e:'🦺',c:true},{w:'vulture',e:'🦅',c:true},{w:'dog',e:'🐶',c:false},{w:'hat',e:'🎩',c:false},{w:'egg',e:'🥚',c:false}])},
        {letters:'Ww',color:'#27ae60',words:shuffle([{w:'whale',e:'🐋',c:true},{w:'wolf',e:'🐺',c:true},{w:'watch',e:'⌚',c:true},{w:'worm',e:'🪱',c:true},{w:'watermelon',e:'🍉',c:true},{w:'cat',e:'🐱',c:false},{w:'sun',e:'☀️',c:false},{w:'ball',e:'⚽',c:false}])},
        {letters:'Xx',color:'#f39c12',words:shuffle([{w:'xray',e:'🩻',c:true},{w:'xylophone',e:'🎹',c:true},{w:'xerox',e:'📄',c:true},{w:'cat',e:'🐱',c:false},{w:'dog',e:'🐶',c:false},{w:'sun',e:'☀️',c:false},{w:'ball',e:'⚽',c:false},{w:'egg',e:'🥚',c:false}])},
        {letters:'Yy',color:'#9b59b6',words:shuffle([{w:'yak',e:'🐃',c:true},{w:'yarn',e:'🧶',c:true},{w:'yacht',e:'⛵',c:true},{w:'yogurt',e:'🍶',c:true},{w:'yam',e:'🍠',c:true},{w:'cat',e:'🐱',c:false},{w:'dog',e:'🐶',c:false},{w:'hat',e:'🎩',c:false}])},
        {letters:'Zz',color:'#1abc9c',words:shuffle([{w:'zebra',e:'🦓',c:true},{w:'zoo',e:'🦁',c:true},{w:'zero',e:'0️⃣',c:true},{w:'zipper',e:'🤐',c:true},{w:'zombie',e:'🧟',c:true},{w:'cat',e:'🐱',c:false},{w:'sun',e:'☀️',c:false},{w:'ball',e:'⚽',c:false}])},
      ])
    },
    vowels: {
      label:'Short Vowels',
      rounds: shuffle([
        {letters:'a',color:'#e74c3c',words:shuffle([{w:'cat',e:'🐱',c:true},{w:'bat',e:'🦇',c:true},{w:'hat',e:'🎩',c:true},{w:'map',e:'🗺️',c:true},{w:'fan',e:'💨',c:true},{w:'rat',e:'🐭',c:true},{w:'dog',e:'🐶',c:false},{w:'cup',e:'☕',c:false}])},
        {letters:'e',color:'#3498db',words:shuffle([{w:'hen',e:'🐔',c:true},{w:'bed',e:'🛏️',c:true},{w:'pen',e:'✏️',c:true},{w:'net',e:'🥅',c:true},{w:'web',e:'🕸️',c:true},{w:'leg',e:'🦵',c:true},{w:'cat',e:'🐱',c:false},{w:'dog',e:'🐶',c:false}])},
        {letters:'i',color:'#27ae60',words:shuffle([{w:'pig',e:'🐷',c:true},{w:'bit',e:'🔧',c:true},{w:'sit',e:'💺',c:true},{w:'fin',e:'🐟',c:true},{w:'lip',e:'👄',c:true},{w:'kit',e:'🧰',c:true},{w:'cat',e:'🐱',c:false},{w:'dog',e:'🐶',c:false}])},
        {letters:'o',color:'#f39c12',words:shuffle([{w:'dog',e:'🐶',c:true},{w:'hot',e:'🔥',c:true},{w:'box',e:'📦',c:true},{w:'mop',e:'🧹',c:true},{w:'log',e:'🪵',c:true},{w:'fox',e:'🦊',c:true},{w:'cat',e:'🐱',c:false},{w:'pen',e:'✏️',c:false}])},
        {letters:'u',color:'#9b59b6',words:shuffle([{w:'cup',e:'☕',c:true},{w:'bug',e:'🐛',c:true},{w:'sun',e:'☀️',c:true},{w:'run',e:'🏃',c:true},{w:'nut',e:'🥜',c:true},{w:'mud',e:'🌊',c:true},{w:'cat',e:'🐱',c:false},{w:'dog',e:'🐶',c:false}])},
        {letters:'Long A',color:'#e74c3c',words:shuffle([{w:'cake',e:'🎂',c:true},{w:'gate',e:'🚪',c:true},{w:'name',e:'📛',c:true},{w:'lake',e:'🏞️',c:true},{w:'rain',e:'🌧️',c:true},{w:'snail',e:'🐌',c:true},{w:'cup',e:'☕',c:false},{w:'dog',e:'🐶',c:false}])},
        {letters:'Long E',color:'#3498db',words:shuffle([{w:'tree',e:'🌳',c:true},{w:'bee',e:'🐝',c:true},{w:'feet',e:'🦶',c:true},{w:'sheep',e:'🐑',c:true},{w:'wheel',e:'⚙️',c:true},{w:'leaf',e:'🍃',c:true},{w:'cat',e:'🐱',c:false},{w:'hat',e:'🎩',c:false}])},
        {letters:'Long I',color:'#27ae60',words:shuffle([{w:'kite',e:'🪁',c:true},{w:'bike',e:'🚲',c:true},{w:'night',e:'🌃',c:true},{w:'tiger',e:'🐯',c:true},{w:'pie',e:'🥧',c:true},{w:'ice',e:'🧊',c:true},{w:'dog',e:'🐶',c:false},{w:'cup',e:'☕',c:false}])},
        {letters:'Long O',color:'#f39c12',words:shuffle([{w:'boat',e:'⛵',c:true},{w:'toad',e:'🐸',c:true},{w:'snow',e:'❄️',c:true},{w:'rose',e:'🌹',c:true},{w:'phone',e:'📱',c:true},{w:'stone',e:'🪨',c:true},{w:'cat',e:'🐱',c:false},{w:'pen',e:'✏️',c:false}])},
        {letters:'Long U',color:'#9b59b6',words:shuffle([{w:'cube',e:'🎲',c:true},{w:'flute',e:'🎵',c:true},{w:'unicorn',e:'🦄',c:true},{w:'music',e:'🎶',c:true},{w:'mule',e:'🐴',c:true},{w:'dune',e:'🏜️',c:true},{w:'dog',e:'🐶',c:false},{w:'hat',e:'🎩',c:false}])},
      ])
    },
    consonants: {
      label:'Consonants',
      rounds: shuffle([
        {letters:'b',color:'#e74c3c',words:shuffle([{w:'ball',e:'⚽',c:true},{w:'bat',e:'🦇',c:true},{w:'bear',e:'🐻',c:true},{w:'boat',e:'⛵',c:true},{w:'book',e:'📚',c:true},{w:'bed',e:'🛏️',c:true},{w:'cat',e:'🐱',c:false},{w:'dog',e:'🐶',c:false}])},
        {letters:'c',color:'#3498db',words:shuffle([{w:'cake',e:'🎂',c:true},{w:'car',e:'🚗',c:true},{w:'cat',e:'🐱',c:true},{w:'coat',e:'🧥',c:true},{w:'cube',e:'🎲',c:true},{w:'cow',e:'🐄',c:true},{w:'sun',e:'☀️',c:false},{w:'egg',e:'🥚',c:false}])},
        {letters:'d',color:'#27ae60',words:shuffle([{w:'dog',e:'🐶',c:true},{w:'door',e:'🚪',c:true},{w:'duck',e:'🦆',c:true},{w:'drum',e:'🥁',c:true},{w:'desk',e:'🪑',c:true},{w:'doll',e:'🪆',c:true},{w:'cat',e:'🐱',c:false},{w:'ball',e:'⚽',c:false}])},
        {letters:'f',color:'#f39c12',words:shuffle([{w:'fish',e:'🐟',c:true},{w:'frog',e:'🐸',c:true},{w:'fire',e:'🔥',c:true},{w:'fork',e:'🍴',c:true},{w:'flag',e:'🚩',c:true},{w:'fox',e:'🦊',c:true},{w:'dog',e:'🐶',c:false},{w:'cup',e:'☕',c:false}])},
        {letters:'g',color:'#9b59b6',words:shuffle([{w:'goat',e:'🐐',c:true},{w:'gate',e:'🚪',c:true},{w:'grapes',e:'🍇',c:true},{w:'gift',e:'🎁',c:true},{w:'grass',e:'🌿',c:true},{w:'gorilla',e:'🦍',c:true},{w:'cat',e:'🐱',c:false},{w:'sun',e:'☀️',c:false}])},
        {letters:'h',color:'#1abc9c',words:shuffle([{w:'hat',e:'🎩',c:true},{w:'house',e:'🏠',c:true},{w:'horse',e:'🐴',c:true},{w:'hand',e:'🤚',c:true},{w:'heart',e:'❤️',c:true},{w:'hippo',e:'🦛',c:true},{w:'dog',e:'🐶',c:false},{w:'egg',e:'🥚',c:false}])},
        {letters:'j',color:'#c0392b',words:shuffle([{w:'jet',e:'✈️',c:true},{w:'jar',e:'🫙',c:true},{w:'jelly',e:'🍮',c:true},{w:'jungle',e:'🌴',c:true},{w:'jaguar',e:'🐆',c:true},{w:'jug',e:'🫗',c:true},{w:'cat',e:'🐱',c:false},{w:'ball',e:'⚽',c:false}])},
        {letters:'k',color:'#e67e22',words:shuffle([{w:'kite',e:'🪁',c:true},{w:'key',e:'🔑',c:true},{w:'king',e:'👑',c:true},{w:'koala',e:'🐨',c:true},{w:'kangaroo',e:'🦘',c:true},{w:'kettle',e:'🫖',c:true},{w:'dog',e:'🐶',c:false},{w:'cup',e:'☕',c:false}])},
        {letters:'l',color:'#2980b9',words:shuffle([{w:'lion',e:'🦁',c:true},{w:'leaf',e:'🍃',c:true},{w:'lamp',e:'💡',c:true},{w:'lemon',e:'🍋',c:true},{w:'lizard',e:'🦎',c:true},{w:'lobster',e:'🦞',c:true},{w:'cat',e:'🐱',c:false},{w:'hat',e:'🎩',c:false}])},
        {letters:'m',color:'#8e44ad',words:shuffle([{w:'moon',e:'🌙',c:true},{w:'monkey',e:'🐒',c:true},{w:'milk',e:'🥛',c:true},{w:'mouse',e:'🐭',c:true},{w:'mango',e:'🥭',c:true},{w:'mushroom',e:'🍄',c:true},{w:'dog',e:'🐶',c:false},{w:'sun',e:'☀️',c:false}])},
        {letters:'n',color:'#e74c3c',words:shuffle([{w:'nest',e:'🪺',c:true},{w:'nose',e:'👃',c:true},{w:'net',e:'🥅',c:true},{w:'nut',e:'🥜',c:true},{w:'needle',e:'🪡',c:true},{w:'noodle',e:'🍜',c:true},{w:'cat',e:'🐱',c:false},{w:'ball',e:'⚽',c:false}])},
        {letters:'p',color:'#3498db',words:shuffle([{w:'pig',e:'🐷',c:true},{w:'pizza',e:'🍕',c:true},{w:'pear',e:'🍐',c:true},{w:'penguin',e:'🐧',c:true},{w:'peach',e:'🍑',c:true},{w:'parrot',e:'🦜',c:true},{w:'dog',e:'🐶',c:false},{w:'egg',e:'🥚',c:false}])},
        {letters:'r',color:'#27ae60',words:shuffle([{w:'rabbit',e:'🐰',c:true},{w:'rainbow',e:'🌈',c:true},{w:'robot',e:'🤖',c:true},{w:'rocket',e:'🚀',c:true},{w:'rose',e:'🌹',c:true},{w:'rhino',e:'🦏',c:true},{w:'cat',e:'🐱',c:false},{w:'cup',e:'☕',c:false}])},
        {letters:'s',color:'#f39c12',words:shuffle([{w:'sun',e:'☀️',c:true},{w:'star',e:'⭐',c:true},{w:'snake',e:'🐍',c:true},{w:'shark',e:'🦈',c:true},{w:'snail',e:'🐌',c:true},{w:'strawberry',e:'🍓',c:true},{w:'dog',e:'🐶',c:false},{w:'hat',e:'🎩',c:false}])},
        {letters:'t',color:'#9b59b6',words:shuffle([{w:'tiger',e:'🐯',c:true},{w:'turtle',e:'🐢',c:true},{w:'tree',e:'🌳',c:true},{w:'truck',e:'🚛',c:true},{w:'train',e:'🚂',c:true},{w:'tomato',e:'🍅',c:true},{w:'dog',e:'🐶',c:false},{w:'cup',e:'☕',c:false}])},
        {letters:'v',color:'#1abc9c',words:shuffle([{w:'van',e:'🚐',c:true},{w:'violin',e:'🎻',c:true},{w:'volcano',e:'🌋',c:true},{w:'vest',e:'🦺',c:true},{w:'vulture',e:'🦅',c:true},{w:'vase',e:'💐',c:true},{w:'cat',e:'🐱',c:false},{w:'ball',e:'⚽',c:false}])},
        {letters:'w',color:'#c0392b',words:shuffle([{w:'whale',e:'🐋',c:true},{w:'wolf',e:'🐺',c:true},{w:'watch',e:'⌚',c:true},{w:'worm',e:'🪱',c:true},{w:'walrus',e:'🦭',c:true},{w:'wagon',e:'🚃',c:true},{w:'dog',e:'🐶',c:false},{w:'sun',e:'☀️',c:false}])},
        {letters:'y',color:'#e67e22',words:shuffle([{w:'yak',e:'🐃',c:true},{w:'yarn',e:'🧶',c:true},{w:'yacht',e:'⛵',c:true},{w:'yogurt',e:'🍶',c:true},{w:'yam',e:'🍠',c:true},{w:'yolk',e:'🍳',c:true},{w:'cat',e:'🐱',c:false},{w:'ball',e:'⚽',c:false}])},
        {letters:'z',color:'#2980b9',words:shuffle([{w:'zebra',e:'🦓',c:true},{w:'zoo',e:'🦁',c:true},{w:'zero',e:'0️⃣',c:true},{w:'zigzag',e:'〰️',c:true},{w:'zombie',e:'🧟',c:true},{w:'zucchini',e:'🥒',c:true},{w:'cat',e:'🐱',c:false},{w:'dog',e:'🐶',c:false}])},
      ])
    },
    digraphs: {
      label:'Digraphs',
      rounds: shuffle([
        {letters:'ch',color:'#e74c3c',words:shuffle([{w:'chair',e:'🪑',c:true},{w:'cheese',e:'🧀',c:true},{w:'cherry',e:'🍒',c:true},{w:'chick',e:'🐥',c:true},{w:'chop',e:'🪓',c:true},{w:'chin',e:'🫦',c:true},{w:'chest',e:'📦',c:true},{w:'chain',e:'⛓️',c:true},{w:'cheek',e:'😊',c:true},{w:'child',e:'👶',c:true},{w:'dog',e:'🐶',c:false},{w:'ball',e:'⚽',c:false},{w:'tree',e:'🌳',c:false},{w:'sun',e:'☀️',c:false},{w:'fish',e:'🐟',c:false},{w:'hat',e:'🎩',c:false},{w:'ship',e:'🚢',c:false},{w:'thumb',e:'👍',c:false}])},
        {letters:'sh',color:'#3498db',words:shuffle([{w:'shoe',e:'👟',c:true},{w:'ship',e:'🚢',c:true},{w:'shell',e:'🐚',c:true},{w:'sheep',e:'🐑',c:true},{w:'shark',e:'🦈',c:true},{w:'shelf',e:'📚',c:true},{w:'shirt',e:'👕',c:true},{w:'shovel',e:'🪚',c:true},{w:'short',e:'📏',c:true},{w:'shout',e:'📢',c:true},{w:'chair',e:'🪑',c:false},{w:'cat',e:'🐱',c:false},{w:'three',e:'3️⃣',c:false},{w:'phone',e:'📱',c:false},{w:'dog',e:'🐶',c:false},{w:'whale',e:'🐋',c:false},{w:'cup',e:'☕',c:false},{w:'bird',e:'🐦',c:false}])},
        {letters:'th',color:'#27ae60',words:shuffle([{w:'three',e:'3️⃣',c:true},{w:'thumb',e:'👍',c:true},{w:'thorn',e:'🌵',c:true},{w:'throne',e:'👑',c:true},{w:'thief',e:'🦹',c:true},{w:'thick',e:'📏',c:true},{w:'thread',e:'🧵',c:true},{w:'thunder',e:'⚡',c:true},{w:'thirst',e:'💧',c:true},{w:'thank',e:'🙏',c:true},{w:'shoe',e:'👟',c:false},{w:'chair',e:'🪑',c:false},{w:'whale',e:'🐋',c:false},{w:'phone',e:'📱',c:false},{w:'ship',e:'🚢',c:false},{w:'cheese',e:'🧀',c:false},{w:'star',e:'⭐',c:false},{w:'frog',e:'🐸',c:false}])},
        {letters:'wh',color:'#f39c12',words:shuffle([{w:'whale',e:'🐋',c:true},{w:'wheel',e:'⚙️',c:true},{w:'white',e:'⬜',c:true},{w:'wheat',e:'🌾',c:true},{w:'whistle',e:'🎵',c:true},{w:'whip',e:'🪢',c:true},{w:'whisper',e:'🤫',c:true},{w:'whoosh',e:'💨',c:true},{w:'whirl',e:'🌀',c:true},{w:'while',e:'⏳',c:true},{w:'shell',e:'🐚',c:false},{w:'three',e:'3️⃣',c:false},{w:'chair',e:'🪑',c:false},{w:'shirt',e:'👕',c:false},{w:'frog',e:'🐸',c:false},{w:'cat',e:'🐱',c:false},{w:'kite',e:'🪁',c:false},{w:'dog',e:'🐶',c:false}])},
        {letters:'ph',color:'#9b59b6',words:shuffle([{w:'phone',e:'📱',c:true},{w:'photo',e:'📷',c:true},{w:'dolphin',e:'🐬',c:true},{w:'phoenix',e:'🦅',c:true},{w:'phase',e:'🌙',c:true},{w:'trophy',e:'🏆',c:true},{w:'graph',e:'📊',c:true},{w:'pharmacy',e:'💊',c:true},{w:'pheasant',e:'🦚',c:true},{w:'phantom',e:'👻',c:true},{w:'shoe',e:'👟',c:false},{w:'three',e:'3️⃣',c:false},{w:'shell',e:'🐚',c:false},{w:'wheel',e:'⚙️',c:false},{w:'chair',e:'🪑',c:false},{w:'ship',e:'🚢',c:false},{w:'cat',e:'🐱',c:false},{w:'hat',e:'🎩',c:false}])},
        {letters:'ng',color:'#1abc9c',words:shuffle([{w:'ring',e:'💍',c:true},{w:'king',e:'👑',c:true},{w:'song',e:'🎵',c:true},{w:'swing',e:'🛝',c:true},{w:'spring',e:'🌸',c:true},{w:'string',e:'🪢',c:true},{w:'sting',e:'🐝',c:true},{w:'strong',e:'💪',c:true},{w:'wing',e:'🦅',c:true},{w:'long',e:'📏',c:true},{w:'shoe',e:'👟',c:false},{w:'chair',e:'🪑',c:false},{w:'three',e:'3️⃣',c:false},{w:'phone',e:'📱',c:false},{w:'cat',e:'🐱',c:false},{w:'hat',e:'🎩',c:false},{w:'dog',e:'🐶',c:false},{w:'ship',e:'🚢',c:false}])},
        {letters:'ck',color:'#c0392b',words:shuffle([{w:'duck',e:'🦆',c:true},{w:'clock',e:'🕐',c:true},{w:'black',e:'🖤',c:true},{w:'truck',e:'🚛',c:true},{w:'brick',e:'🧱',c:true},{w:'stick',e:'🪵',c:true},{w:'thick',e:'📏',c:true},{w:'track',e:'🛤️',c:true},{w:'knock',e:'🚪',c:true},{w:'flock',e:'🐑',c:true},{w:'whale',e:'🐋',c:false},{w:'shell',e:'🐚',c:false},{w:'three',e:'3️⃣',c:false},{w:'phone',e:'📱',c:false},{w:'ring',e:'💍',c:false},{w:'wing',e:'🦅',c:false},{w:'shoe',e:'👟',c:false},{w:'star',e:'⭐',c:false}])},
      ])
    },
    blends: {
      label:'Blends',
      rounds: shuffle([
        {letters:'bl',color:'#3498db',words:shuffle([{w:'blue',e:'🔵',c:true},{w:'black',e:'🖤',c:true},{w:'block',e:'🧱',c:true},{w:'blink',e:'👁️',c:true},{w:'bloom',e:'🌸',c:true},{w:'cat',e:'🐱',c:false},{w:'dog',e:'🐶',c:false},{w:'sun',e:'☀️',c:false}])},
        {letters:'br',color:'#e74c3c',words:shuffle([{w:'bread',e:'🍞',c:true},{w:'bridge',e:'🌉',c:true},{w:'brick',e:'🧱',c:true},{w:'broom',e:'🧹',c:true},{w:'brown',e:'🟤',c:true},{w:'cat',e:'🐱',c:false},{w:'dog',e:'🐶',c:false},{w:'sun',e:'☀️',c:false}])},
        {letters:'cl',color:'#27ae60',words:shuffle([{w:'clock',e:'🕐',c:true},{w:'cloud',e:'☁️',c:true},{w:'clown',e:'🤡',c:true},{w:'claw',e:'🦞',c:true},{w:'clay',e:'🪄',c:true},{w:'cat',e:'🐱',c:false},{w:'ball',e:'⚽',c:false},{w:'hat',e:'🎩',c:false}])},
        {letters:'cr',color:'#f39c12',words:shuffle([{w:'crab',e:'🦀',c:true},{w:'crown',e:'👑',c:true},{w:'crane',e:'🦢',c:true},{w:'crayon',e:'🖍️',c:true},{w:'cricket',e:'🦗',c:true},{w:'dog',e:'🐶',c:false},{w:'cup',e:'☕',c:false},{w:'sun',e:'☀️',c:false}])},
        {letters:'dr',color:'#9b59b6',words:shuffle([{w:'drum',e:'🥁',c:true},{w:'dragon',e:'🐉',c:true},{w:'dress',e:'👗',c:true},{w:'drip',e:'💧',c:true},{w:'drive',e:'🚗',c:true},{w:'cat',e:'🐱',c:false},{w:'egg',e:'🥚',c:false},{w:'ball',e:'⚽',c:false}])},
        {letters:'fl',color:'#1abc9c',words:shuffle([{w:'flag',e:'🚩',c:true},{w:'flower',e:'🌸',c:true},{w:'flame',e:'🔥',c:true},{w:'fly',e:'🪰',c:true},{w:'flute',e:'🎵',c:true},{w:'dog',e:'🐶',c:false},{w:'hat',e:'🎩',c:false},{w:'cup',e:'☕',c:false}])},
        {letters:'fr',color:'#c0392b',words:shuffle([{w:'frog',e:'🐸',c:true},{w:'fruit',e:'🍎',c:true},{w:'frame',e:'🖼️',c:true},{w:'freeze',e:'❄️',c:true},{w:'fries',e:'🍟',c:true},{w:'cat',e:'🐱',c:false},{w:'sun',e:'☀️',c:false},{w:'ball',e:'⚽',c:false}])},
        {letters:'gr',color:'#e67e22',words:shuffle([{w:'grapes',e:'🍇',c:true},{w:'grass',e:'🌿',c:true},{w:'green',e:'🟢',c:true},{w:'grin',e:'😁',c:true},{w:'grow',e:'🌱',c:true},{w:'dog',e:'🐶',c:false},{w:'egg',e:'🥚',c:false},{w:'hat',e:'🎩',c:false}])},
        {letters:'pl',color:'#2980b9',words:shuffle([{w:'plane',e:'✈️',c:true},{w:'plant',e:'🌿',c:true},{w:'plate',e:'🍽️',c:true},{w:'play',e:'🎮',c:true},{w:'plum',e:'🍑',c:true},{w:'cat',e:'🐱',c:false},{w:'sun',e:'☀️',c:false},{w:'cup',e:'☕',c:false}])},
        {letters:'pr',color:'#8e44ad',words:shuffle([{w:'prince',e:'🤴',c:true},{w:'prize',e:'🏆',c:true},{w:'pretzel',e:'🥨',c:true},{w:'pray',e:'🙏',c:true},{w:'press',e:'👇',c:true},{w:'dog',e:'🐶',c:false},{w:'ball',e:'⚽',c:false},{w:'hat',e:'🎩',c:false}])},
        {letters:'sc',color:'#e74c3c',words:shuffle([{w:'scarf',e:'🧣',c:true},{w:'school',e:'🏫',c:true},{w:'scoop',e:'🍦',c:true},{w:'score',e:'⚽',c:true},{w:'scout',e:'🎒',c:true},{w:'cat',e:'🐱',c:false},{w:'egg',e:'🥚',c:false},{w:'sun',e:'☀️',c:false}])},
        {letters:'sk',color:'#3498db',words:shuffle([{w:'ski',e:'⛷️',c:true},{w:'skin',e:'🫱',c:true},{w:'skip',e:'🎯',c:true},{w:'skull',e:'💀',c:true},{w:'sky',e:'🌤️',c:true},{w:'dog',e:'🐶',c:false},{w:'cup',e:'☕',c:false},{w:'ball',e:'⚽',c:false}])},
        {letters:'sl',color:'#27ae60',words:shuffle([{w:'slide',e:'🛝',c:true},{w:'sled',e:'🛷',c:true},{w:'slim',e:'📏',c:true},{w:'slow',e:'🐌',c:true},{w:'sleep',e:'😴',c:true},{w:'cat',e:'🐱',c:false},{w:'hat',e:'🎩',c:false},{w:'sun',e:'☀️',c:false}])},
        {letters:'sm',color:'#f39c12',words:shuffle([{w:'smile',e:'😊',c:true},{w:'smoke',e:'💨',c:true},{w:'small',e:'🐜',c:true},{w:'smooth',e:'🫧',c:true},{w:'smell',e:'👃',c:true},{w:'dog',e:'🐶',c:false},{w:'egg',e:'🥚',c:false},{w:'ball',e:'⚽',c:false}])},
        {letters:'sn',color:'#9b59b6',words:shuffle([{w:'snake',e:'🐍',c:true},{w:'snow',e:'❄️',c:true},{w:'snail',e:'🐌',c:true},{w:'snap',e:'👌',c:true},{w:'snore',e:'😴',c:true},{w:'cat',e:'🐱',c:false},{w:'cup',e:'☕',c:false},{w:'hat',e:'🎩',c:false}])},
        {letters:'sp',color:'#1abc9c',words:shuffle([{w:'spider',e:'🕷️',c:true},{w:'spoon',e:'🥄',c:true},{w:'spin',e:'🌀',c:true},{w:'sport',e:'⚽',c:true},{w:'speak',e:'💬',c:true},{w:'dog',e:'🐶',c:false},{w:'sun',e:'☀️',c:false},{w:'ball',e:'⚽',c:false}])},
        {letters:'st',color:'#c0392b',words:shuffle([{w:'star',e:'⭐',c:true},{w:'stone',e:'🪨',c:true},{w:'stick',e:'🪵',c:true},{w:'storm',e:'⛈️',c:true},{w:'straw',e:'🥤',c:true},{w:'cat',e:'🐱',c:false},{w:'egg',e:'🥚',c:false},{w:'hat',e:'🎩',c:false}])},
        {letters:'sw',color:'#e67e22',words:shuffle([{w:'swan',e:'🦢',c:true},{w:'swim',e:'🏊',c:true},{w:'swing',e:'🛝',c:true},{w:'sweet',e:'🍬',c:true},{w:'sword',e:'⚔️',c:true},{w:'dog',e:'🐶',c:false},{w:'cup',e:'☕',c:false},{w:'ball',e:'⚽',c:false}])},
        {letters:'tr',color:'#2980b9',words:shuffle([{w:'tree',e:'🌳',c:true},{w:'truck',e:'🚛',c:true},{w:'train',e:'🚂',c:true},{w:'trophy',e:'🏆',c:true},{w:'triangle',e:'🔺',c:true},{w:'cat',e:'🐱',c:false},{w:'sun',e:'☀️',c:false},{w:'hat',e:'🎩',c:false}])},
      ])
    }
  };

  /* ── CURRENT GAME STATE ── */
  let _gs = {};

  /* ── SPEAK WORD 2x ── */
  function speak2x(word) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const say = (n) => {
      if (n <= 0) return;
      const u = new SpeechSynthesisUtterance(word.replace(/_/g,' '));
      u.lang = 'en-US'; u.rate = 0.72;
      u.onend = () => setTimeout(() => say(n - 1), 380);
      window.speechSynthesis.speak(u);
    };
    say(2);
  }

  /* ── RENDER PHONICS (pick level → play rounds) ── */
  function renderDigraphs(item) {
    // Use syllabus data if present, otherwise use built-in LEVELS.digraphs
    const hasSylData = item.data && item.data.digraphs && item.data.digraphs.length;
    _gs = {
      levelKey: 'digraphs',
      levels: LEVELS,
      // Override digraphs level rounds with syllabus data if provided
      syllabusRounds: hasSylData ? item.data.digraphs.map(d => ({...d, words: shuffle(d.words)})) : null,
      dgIdx: 0, score: 0, selected: new Set(), checked: false,
      levelRoundIdx: 0
    };
    return phonicsShell();
  }

  function phonicsShell() {
    const levelKeys = Object.keys(LEVELS);
    const activeLvl = _gs.levelKey || 'alphabets';
    const levelBtns = levelKeys.map(k => `
      <button class="phonics-level-btn ${_gs.levelKey===k?'active':''}" onclick="Phonics.setLevel('${k}')">${LEVELS[k].label}</button>`
    ).join('');
    return `<div class="phonics-level-bar">${levelBtns}</div>${phonicsHTML()}`;
  }

  function phonicsHTML() {
    const rounds = _gs.syllabusRounds || LEVELS[_gs.levelKey].rounds;
    const dg = rounds[_gs.dgIdx % rounds.length];
    const total = rounds.length;
    return `
      <div class="game-score">Round ${(_gs.dgIdx % total)+1}/${total} &nbsp;⭐ ${_gs.score}</div>
      <div class="game-prompt">
        <div class="game-digraph" style="color:${dg.color}">${dg.letters}</div>
        <div class="game-instruction">Tap all words with the <strong>${dg.letters}</strong> sound!<br><small style="color:#aaa;font-size:1.3rem">Tap a word to hear it read aloud 🔊</small></div>
      </div>
      <div class="word-grid">
        ${dg.words.map((opt,i) => `
          <div class="word-tile ${_gs.selected.has(i)?'selected':''}" onclick="Phonics.pick(${i})" id="wt-${i}">
            <div class="wt-emoji">${opt.e}</div>
            <div class="wt-word">${opt.w}</div>
          </div>`).join('')}
      </div>
      <button class="game-btn" onclick="Phonics.check()">${_gs.checked?'Next →':'Check! ✓'}</button>`;
  }

  /* ── BLENDS ── */
  function renderBlends(item) {
    const families = shuffle(item.data.families.map(f => ({...f, words: shuffle(f.words)})));
    _gs = { type:'blends', families, famIdx:0, wordIdx:0, revealed:false };
    return blendsHTML();
  }

  function blendsHTML() {
    const fam = _gs.families[_gs.famIdx], w = fam.words[_gs.wordIdx];
    return `
      <div class="game-prompt">
        <div class="game-digraph" style="color:${fam.color}">${fam.end}</div>
        <div class="game-instruction">Words ending with <strong>${fam.end}</strong><br><small style="color:#aaa;font-size:1.3rem">Tap the word to hear it 🔊</small></div>
      </div>
      <div style="text-align:center;margin:20px 0">
        <div style="font-size:5rem">${w.e}</div>
        <div class="blend-reveal" onclick="Phonics.revealBlend()">${_gs.revealed ? w.w : '_ ' + fam.end}</div>
      </div>
      <div style="display:flex;gap:10px;justify-content:center">
        <button class="game-btn orange" onclick="Phonics.revealBlend()">${_gs.revealed?'Next Word →':'Reveal & Hear'}</button>
      </div>
      <div style="text-align:center;margin-top:10px;font-size:1.6rem;color:#aaa">
        ${_gs.wordIdx+1}/${fam.words.length} words · Family ${_gs.famIdx+1}/${_gs.families.length}
      </div>`;
  }

  /* ── HF WORDS ── */
  function renderHFWords(item) {
    _gs = { type:'hfwords', words: shuffle(item.data.words), idx: 0 };
    return hfHTML();
  }

  function hfHTML() {
    const w = _gs.words[_gs.idx];
    return `
      <div class="hfw-progress">${_gs.idx+1} / ${_gs.words.length}</div>
      <div class="hfw-card" onclick="Phonics.speakHFW('${w.w}')">
        <div class="hfw-word">${w.w}</div>
        <div class="hfw-tap">👆 Tap to hear it twice 🔊🔊</div>
      </div>
      <div class="hfw-sentence">${w.s}</div>
      <div class="hfw-nav">
        <button onclick="Phonics.hfPrev()" ${_gs.idx===0?'disabled':''}>◀ Back</button>
        <button onclick="Phonics.hfNext()">${_gs.idx<_gs.words.length-1?'Next ▶':'Finish!'}</button>
      </div>`;
  }

  /* ── BLENDS LEVEL GAME ── */
  function renderBlendsLevel(item) {
    // Use built-in blends level
    const rounds = shuffle(LEVELS.blends.rounds.map(r => ({...r, words: shuffle(r.words)})));
    _gs = { levelKey:'blends', syllabusRounds: rounds, dgIdx:0, score:0, selected:new Set(), checked:false };
    return phonicsShell();
  }

  /* ── EXPORTS ── */
  window.Phonics = {
    setLevel(key) {
      _gs.levelKey = key;
      _gs.syllabusRounds = null;
      _gs.dgIdx = 0; _gs.score = 0; _gs.selected = new Set(); _gs.checked = false;
      document.getElementById('pm-body').innerHTML = phonicsShell();
    },
    pick(i) {
      if (_gs.checked) return;
      const rounds = _gs.syllabusRounds || LEVELS[_gs.levelKey].rounds;
      const dg = rounds[_gs.dgIdx % rounds.length];
      const word = dg.words[i].w;
      // Speak 2x
      const el = document.getElementById('wt-'+i);
      if (el) { el.classList.add('speaking'); setTimeout(()=>el.classList.remove('speaking'), 1200); }
      speak2x(word);
      // Toggle selection
      if (_gs.selected.has(i)) _gs.selected.delete(i); else _gs.selected.add(i);
      document.getElementById('pm-body').innerHTML = phonicsShell();
    },
    check() {
      if (_gs.checked) {
        const rounds = _gs.syllabusRounds || LEVELS[_gs.levelKey].rounds;
        _gs.dgIdx++;
        if (_gs.dgIdx >= rounds.length) {
          document.getElementById('pm-body').innerHTML = endScreen(_gs.score, rounds.length, () => {
            _gs.dgIdx = 0; _gs.score = 0; _gs.selected = new Set(); _gs.checked = false;
            if (!_gs.syllabusRounds) {
              LEVELS[_gs.levelKey].rounds = shuffle(LEVELS[_gs.levelKey].rounds);
            }
            document.getElementById('pm-body').innerHTML = phonicsShell();
          });
          return;
        }
        _gs.selected = new Set(); _gs.checked = false;
        document.getElementById('pm-body').innerHTML = phonicsShell();
        return;
      }
      _gs.checked = true;
      const rounds = _gs.syllabusRounds || LEVELS[_gs.levelKey].rounds;
      const dg = rounds[_gs.dgIdx % rounds.length]; let ok = true;
      dg.words.forEach((opt,i) => {
        const el = document.getElementById('wt-'+i); if (!el) return;
        if (opt.c && _gs.selected.has(i))           el.classList.add('correct');
        else if (!opt.c && _gs.selected.has(i))   { el.classList.add('wrong'); ok=false; }
        else if (opt.c && !_gs.selected.has(i))   { el.classList.add('wrong'); ok=false; }
      });
      if (ok) _gs.score++;
      // Vocab tracking — record each correct-target word
      if (window._currentKidKey && typeof VocabTracker !== 'undefined') {
        dg.words.forEach((opt, i) => {
          if (opt.c) VocabTracker.record(window._currentKidKey, opt.w, 'phonics', ok);
        });
      }
      const btn = document.querySelector('#pm-body .game-btn');
      if (btn) { btn.textContent = 'Next →'; if (ok) btn.classList.add('green'); }
    },
    revealBlend() {
      if (!_gs.revealed) {
        _gs.revealed = true;
        speak2x(_gs.families[_gs.famIdx].words[_gs.wordIdx].w);
      } else {
        _gs.wordIdx++;
        if (_gs.wordIdx >= _gs.families[_gs.famIdx].words.length) {
          _gs.famIdx++; _gs.wordIdx = 0;
          if (_gs.famIdx >= _gs.families.length) {
            document.getElementById('pm-body').innerHTML = `<div style="text-align:center;padding:30px"><div style="font-size:5rem">🎉</div><div style="font-family:'Fredoka One',cursive;font-size:3rem;color:#7c6fcf">All Done!</div><button class="game-btn" style="margin-top:20px" onclick="Phonics.restartBlends()">Play Again</button></div>`;
            return;
          }
        }
        _gs.revealed = false;
      }
      document.getElementById('pm-body').innerHTML = blendsHTML();
    },
    restartBlends() {
      _gs.families = shuffle(_gs.families.map(f=>({...f,words:shuffle(f.words)})));
      _gs.famIdx=0; _gs.wordIdx=0; _gs.revealed=false;
      document.getElementById('pm-body').innerHTML = blendsHTML();
    },
    speakHFW(word) { speak2x(word); },
    hfNext() {
      if (_gs.idx < _gs.words.length-1) { _gs.idx++; document.getElementById('pm-body').innerHTML = hfHTML(); }
      else {
        _gs.words = shuffle(_gs.words); _gs.idx = 0;
        document.getElementById('pm-body').innerHTML = `<div style="text-align:center;padding:30px"><div style="font-size:5rem">🎉</div><div style="font-family:'Fredoka One',cursive;font-size:3rem;color:#7c6fcf">All words done!</div><button class="game-btn" style="margin-top:20px" onclick="Phonics.restartHFW()">Shuffle & Play Again</button></div>`;
      }
    },
    hfPrev() { if (_gs.idx>0) { _gs.idx--; document.getElementById('pm-body').innerHTML = hfHTML(); } },
    restartHFW() { document.getElementById('pm-body').innerHTML = hfHTML(); }
  };

  function endScreen(score, total, onReplay) {
    window._replayFn = onReplay;
    return `<div style="text-align:center;padding:30px">
      <div style="font-size:5rem">🎉</div>
      <div style="font-family:'Fredoka One',cursive;font-size:3rem;color:#7c6fcf;margin:10px 0">Well done!</div>
      <div style="font-size:2rem;color:#666">Score: ${score} / ${total}</div>
      <button class="game-btn" style="margin-top:20px" onclick="window._replayFn&&window._replayFn()">Play Again</button>
    </div>`;
  }

  GameRegistry.register({ types:['game_phonics'], icon:'🔤', label:'Phonics', render: renderDigraphs });
  GameRegistry.register({ types:['game_blends'],  icon:'🔡', label:'Blends',  render: renderBlends  });
  GameRegistry.register({ types:['game_hfwords'], icon:'👁️', label:'Sight Words', render: renderHFWords });
})();
