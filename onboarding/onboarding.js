/* onboarding/onboarding.js
   Handles the first-run setup flow. Registers on window.Onboarding. */

window.Onboarding = (() => {
  const LEVEL_MAP = { 1:'infant', 2:'playgroup', 3:'nursery1', 4:'nursery1', 5:'kindergarten1', 6:'kindergarten1', 7:'kindergarten2' };
  const LEVEL_LABELS = { nursery1:'Nursery 1', kindergarten1:'Kindergarten 1', kindergarten2:'Kindergarten 2', playgroup:'Playgroup', infant:'Infant Care' };

  let obStep = 0;
  let obKids = [];

  function newKid(i) { return { name: '', age: 3, gender: 'boy', key: 'kid' + i }; }

  function saveFormValues() {
    document.querySelectorAll('.ob-kid-row').forEach((row, i) => {
      if (!obKids[i]) return;
      obKids[i].name   = row.querySelector('.ob-name').value;
      obKids[i].age    = parseInt(row.querySelector('.ob-age').value) || 3;
      obKids[i].gender = row.querySelector('.ob-gender-select').value;
    });
  }

  function renderKids() {
    const list = document.getElementById('ob-kids-list');
    list.innerHTML = obKids.map((k, i) => `
      <div class="ob-kid-row" id="ob-kid-${i}">
        <div class="ob-kid-row-head">
          <div class="ob-kid-num">${i + 1}</div>
          <div class="ob-kid-row-title">Child ${i + 1}</div>
          ${obKids.length > 1 ? `<button class="ob-remove-kid" onclick="Onboarding.removeKid(${i})">✕</button>` : ''}
        </div>
        <div class="ob-field">
          <label>Name</label>
          <input class="ob-name" placeholder="e.g. Emma" value="${k.name}">
        </div>
        <div class="ob-field">
          <label>Age</label>
          <select class="ob-age">
            ${[1,2,3,4,5,6,7,8].map(a => `<option value="${a}" ${k.age===a?'selected':''}>${a} years old</option>`).join('')}
          </select>
        </div>
        <div class="ob-field">
          <label>Gender</label>
          <select class="ob-gender-select">
            <option value="boy"  ${k.gender==='boy' ?'selected':''}>👦 Boy</option>
            <option value="girl" ${k.gender==='girl'?'selected':''}>👧 Girl</option>
          </select>
        </div>
      </div>`).join('');
    document.getElementById('ob-add-kid-btn').style.display = obKids.length >= 5 ? 'none' : '';
  }

  function updateDots() {
    document.querySelectorAll('.ob-dot').forEach((el, i) => {
      el.classList.toggle('done',   i < obStep);
      el.classList.toggle('active', i === obStep);
    });
    document.querySelectorAll('.ob-step').forEach((el, i) => el.classList.toggle('active', i === obStep));
  }

  function show() {
    obStep = 0;
    obKids = [newKid(0)];
    document.getElementById('onboarding').classList.remove('hidden');
    renderKids();
    updateDots();
  }

  function next() {
    if (obStep === 1) {
      saveFormValues();
      const valid = obKids.every(k => k.name.trim() && k.age);
      if (!valid) { alert('Please fill in name and age for each child.'); return; }
      let notice = '<strong>Templates selected:</strong><br>';
      obKids.forEach(k => {
        const level = LEVEL_MAP[k.age] || 'nursery1';
        notice += `• ${k.name} (Age ${k.age}) → ${LEVEL_LABELS[level] || level}<br>`;
      });
      document.getElementById('ob-template-notice').innerHTML = notice;
    }
    obStep = Math.min(obStep + 1, 2);
    updateDots();
  }

  function back() {
    obStep = Math.max(obStep - 1, 0);
    updateDots();
  }

  function addKid() {
    if (obKids.length >= 5) { alert('Maximum 5 children'); return; }
    saveFormValues();
    obKids.push(newKid(obKids.length));
    renderKids();
  }

  function removeKid(i) {
    saveFormValues();
    obKids.splice(i, 1);
    renderKids();
  }

  async function finish() {
    saveFormValues();
    const btn = document.querySelector('#ob-step-2 .ob-btn-primary');
    btn.textContent = 'Setting up...'; btn.disabled = true;

    const kids = obKids.map((k, i) => ({
      key: 'kid' + i, name: k.name.trim(), age: k.age,
      gender: k.gender, level: LEVEL_MAP[k.age] || 'nursery1', image: null
    }));

    // Load templates
    const templates = {};
    for (const kid of kids) {
      if (!templates[kid.level]) {
        try {
          const res = await fetch(`/assets/data/templates/${kid.level}.json`);
          templates[kid.level] = res.ok ? await res.json() : null;
        } catch { templates[kid.level] = null; }
      }
    }

    const firstTmpl = templates[kids[0].level] || {};
    const APP = {
      version: 2, createdAt: new Date().toISOString(), kids,
      morning:     firstTmpl.morning     || State.defaultMorning(),
      evening:     firstTmpl.evening     || State.defaultEvening(),
      marketplace: firstTmpl.marketplace || State.defaultMarket(),
      tasks: {}, stars: {}, sgiven: {}, spent: 0, vouch: [], skills: {},
    };

    kids.forEach((kid, i) => {
      APP.stars[kid.key]  = 0;
      APP.sgiven[kid.key] = null;
      APP.tasks[kid.key]  = {};
      const kt = templates[kid.level];
      const skillList = kt && kt.skills && kt.skills[kid.gender]
        ? JSON.parse(JSON.stringify(kt.skills[kid.gender]))
        : State.defaultSkills(kid.gender);
      skillList.forEach(s => { s.id = s.id + '_' + kid.key; });
      APP.skills[kid.key] = skillList;
    });

    State.setApp(APP);
    State.initTasks();
    await State.save();
    document.getElementById('onboarding').classList.add('hidden');
    Boot.startApp();
  }

  return { show, next, back, addKid, removeKid, finish };
})();
