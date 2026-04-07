/* js/admin.js
   Admin modal and all CRUD actions for tasks, market, skills. */

window.Admin = (() => {

  function openModal(title, body, btns) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').innerHTML = body;
    document.getElementById('modal-btns').innerHTML = btns;
    document.getElementById('modal-bg').classList.add('open');
  }
  function closeModal() { document.getElementById('modal-bg').classList.remove('open'); }

  /* ── TASKS ── */
  function editTask(type, id) {
    const APP  = State.getApp();
    const list = type === 'morning' ? APP.morning : APP.evening;
    const t    = list.find(x => x.id === id); if (!t) return;
    openModal('Edit Task',
      `<label>Icon</label><input id="m-icon" value="${t.icon}"><label>Description</label><input id="m-desc" value="${t.desc}">`,
      `<button class="btn-save"   onclick="Admin.saveTask('${type}','${id}')">Save</button>
       <button class="btn-cancel" onclick="Admin.closeModal()">Cancel</button>
       <button class="btn-danger" onclick="Admin.deleteTask('${type}','${id}',true)">Delete</button>`);
  }

  function saveTask(type, id) {
    const APP  = State.getApp();
    const list = type === 'morning' ? APP.morning : APP.evening;
    const t    = list.find(x => x.id === id);
    t.icon = document.getElementById('m-icon').value.trim();
    t.desc = document.getElementById('m-desc').value.trim();
    State.save(); closeModal();
    APP.kids.forEach(k => { Routines.renderRoad(k.key); Routines.renderRoutines(k.key); });
  }

  function deleteTask(type, id, skip) {
    const APP = State.getApp();
    if (!skip && !confirm('Delete task?')) return;
    if (type === 'morning') APP.morning = APP.morning.filter(x => x.id !== id);
    else                    APP.evening = APP.evening.filter(x => x.id !== id);
    APP.kids.forEach(k => { if (APP.tasks[k.key]) delete APP.tasks[k.key][id]; });
    State.save(); closeModal();
    APP.kids.forEach(k => { Routines.renderRoad(k.key); Routines.renderRoutines(k.key); });
  }

  function openAddTask(type) {
    openModal('Add Task',
      `<label>Icon</label><input id="m-icon" value="⭐"><label>Description</label><input id="m-desc" placeholder="e.g. Drink water">`,
      `<button class="btn-save"   onclick="Admin.addTask('${type}')">Add</button>
       <button class="btn-cancel" onclick="Admin.closeModal()">Cancel</button>`);
  }

  function addTask(type) {
    const APP  = State.getApp();
    const icon = document.getElementById('m-icon').value.trim();
    const desc = document.getElementById('m-desc').value.trim();
    if (!desc) return alert('Enter a description');
    const id = (type === 'morning' ? 'mr' : 'ev') + Date.now();
    const task = { id, desc, icon: icon || '📋' };
    if (type === 'morning') { if (!APP.morning) APP.morning = []; APP.morning.push(task); }
    else                    { if (!APP.evening) APP.evening = []; APP.evening.push(task); }
    APP.kids.forEach(k => { if (!APP.tasks[k.key]) APP.tasks[k.key] = {}; APP.tasks[k.key][id] = { done: false, date: State.todayStr() }; });
    State.save(); closeModal();
    APP.kids.forEach(k => { Routines.renderRoad(k.key); Routines.renderRoutines(k.key); });
  }

  /* ── MARKET ── */
  function editMarket(id) {
    const APP  = State.getApp();
    const item = (APP.marketplace || []).find(m => m.id === id); if (!item) return;
    openModal('Edit Activity',
      `<label>Icon</label><input id="m-icon" value="${item.icon}"><label>Name</label><input id="m-name" value="${item.name}"><label>Days effort</label><input id="m-days" type="number" min="1" value="${item.days}">`,
      `<button class="btn-save"   onclick="Admin.saveMarket('${id}')">Save</button>
       <button class="btn-cancel" onclick="Admin.closeModal()">Cancel</button>
       <button class="btn-danger" onclick="Admin.deleteMarket('${id}')">Delete</button>`);
  }

  function saveMarket(id) {
    const APP  = State.getApp();
    const item = (APP.marketplace || []).find(m => m.id === id);
    item.icon = document.getElementById('m-icon').value.trim();
    item.name = document.getElementById('m-name').value.trim();
    item.days = parseInt(document.getElementById('m-days').value) || 1;
    State.save(); closeModal(); Market.renderMarket();
  }

  function deleteMarket(id) {
    const APP = State.getApp();
    if (!confirm('Delete activity?')) return;
    APP.marketplace = (APP.marketplace || []).filter(m => m.id !== id);
    State.save(); closeModal(); Market.renderMarket();
  }

  function openAddMarket() {
    openModal('Add Activity',
      `<label>Icon</label><input id="m-icon" value="🎉"><label>Name</label><input id="m-name" placeholder="Activity name"><label>Days effort</label><input id="m-days" type="number" min="1" value="3">`,
      `<button class="btn-save"   onclick="Admin.addMarket()">Add</button>
       <button class="btn-cancel" onclick="Admin.closeModal()">Cancel</button>`);
  }

  function addMarket() {
    const APP  = State.getApp();
    const icon = document.getElementById('m-icon').value.trim();
    const name = document.getElementById('m-name').value.trim();
    const days = parseInt(document.getElementById('m-days').value) || 1;
    if (!name) return alert('Enter a name');
    if (!APP.marketplace) APP.marketplace = [];
    APP.marketplace.push({ id: 'm' + Date.now(), name, icon: icon || '🎉', days });
    State.save(); closeModal(); Market.renderMarket();
  }

  /* ── SKILLS ── */
  function editSkill(key, id) {
    const APP = State.getApp();
    const sk  = (APP.skills[key] || []).find(s => s.id === id); if (!sk) return;
    openModal('Edit Skill',
      `<label>Icon</label><input id="m-icon" value="${sk.icon}">
       <label>Name</label><input id="m-name" value="${sk.name}">
       <label>Goal (milestone)</label><input id="m-milestone" value="${sk.milestone || ''}">
       <label>Target (practices)</label><input id="m-target" type="number" min="1" value="${sk.target}">
       <label>Current progress</label><input id="m-current" type="number" min="0" value="${sk.current || 0}">`,
      `<button class="btn-save"   onclick="Admin.saveSkill('${key}','${id}')">Save</button>
       <button class="btn-cancel" onclick="Admin.closeModal()">Cancel</button>
       <button class="btn-danger" onclick="Admin.deleteSkill('${key}','${id}')">Delete</button>`);
  }

  function saveSkill(key, id) {
    const APP = State.getApp();
    const sk  = (APP.skills[key] || []).find(s => s.id === id);
    sk.icon      = document.getElementById('m-icon').value.trim();
    sk.name      = document.getElementById('m-name').value.trim();
    sk.milestone = document.getElementById('m-milestone').value.trim();
    sk.target    = parseInt(document.getElementById('m-target').value) || 10;
    sk.current   = parseInt(document.getElementById('m-current').value) || 0;
    sk.mastered  = sk.current >= sk.target;
    if (sk.mastered && !sk.masteredDate) sk.masteredDate = new Date().toISOString();
    State.save(); closeModal(); Skills.renderCol(key);
  }

  function deleteSkill(key, id) {
    const APP = State.getApp();
    if (!confirm('Delete this skill?')) return;
    APP.skills[key] = (APP.skills[key] || []).filter(s => s.id !== id);
    State.save(); closeModal(); Skills.renderCol(key);
  }

  function openAddSkill(key) {
    openModal('Add Skill',
      `<label>Icon</label><input id="m-icon" value="⭐">
       <label>Name</label><input id="m-name" placeholder="e.g. Swim 10m">
       <label>Goal (milestone)</label><input id="m-milestone" placeholder="e.g. Swims independently">
       <label>Target (practices)</label><input id="m-target" type="number" min="1" value="10">`,
      `<button class="btn-save"   onclick="Admin.addSkill('${key}')">Add</button>
       <button class="btn-cancel" onclick="Admin.closeModal()">Cancel</button>`);
  }

  function addSkill(key) {
    const APP  = State.getApp();
    const icon = document.getElementById('m-icon').value.trim();
    const name = document.getElementById('m-name').value.trim();
    const ms   = document.getElementById('m-milestone').value.trim();
    const tgt  = parseInt(document.getElementById('m-target').value) || 10;
    if (!name) return alert('Enter a name');
    if (!APP.skills[key]) APP.skills[key] = [];
    APP.skills[key].push({ id: 'sk' + Date.now(), name, icon: icon || '⭐', target: tgt, current: 0, mastered: false, milestone: ms, color: '#7c6fcf' });
    State.save(); closeModal(); Skills.renderCol(key);
  }

  return { openModal, closeModal, editTask, saveTask, deleteTask, openAddTask, addTask, editMarket, saveMarket, deleteMarket, openAddMarket, addMarket, editSkill, saveSkill, deleteSkill, openAddSkill, addSkill };
})();

// Global shortcuts
window.closeModal    = () => Admin.closeModal();
window.openAddMarket = () => Admin.openAddMarket();
