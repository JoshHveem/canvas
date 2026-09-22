let manifest;
let selectedIndex = 0;
let saveTimer;
let saveChain = Promise.resolve();

const $ = selector => document.querySelector(selector);
const status = text => $('#status').textContent = text;
const setSaving = saving => $('#save-indicator').hidden = !saving;
const escapeHtml = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const routeItems = feature => !feature.routes ? [] : Array.isArray(feature.routes) ? feature.routes : [feature.routes];
const patternText = route => `/${route.source}/${route.flags || ''}`;
const list = value => Array.isArray(value) ? value.join(', ') : '';
const dependencyOptions = [
  ['vue', 'Vue'],
  ['select2', 'Select2'],
  ['bridgetools', 'Bridgetools'],
  ['reportRuntime', 'Report runtime']
];

function parseNumbers(value, label) {
  if (!value.trim()) return undefined;
  const values = value.split(',').map(item => Number(item.trim()));
  if (values.some(item => !Number.isInteger(item) || item <= 0)) throw new Error(`${label} must be comma-separated positive whole numbers.`);
  return values;
}

function parseRoutes(value) {
  const lines = value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (!lines.length) return undefined;
  const patterns = lines.map(line => {
    const literal = line.match(/^\/(.*)\/([a-z]*)$/i);
    const source = literal ? literal[1] : line;
    const flags = literal ? literal[2] : '';
    new RegExp(source, flags);
    return { source, flags };
  });
  return patterns.length === 1 ? patterns[0] : patterns;
}

function scopes(feature) {
  const items = [];
  if (feature.teacher) items.push('Teachers');
  if (feature.notTeacher) items.push('Students');
  if (feature.isd) items.push('ISD');
  if (feature.rootAdmin) items.push('Root admin');
  if (feature.courseIds) items.push(`${feature.courseIds.length} course${feature.courseIds.length === 1 ? '' : 's'}`);
  if (feature.departments) items.push(`${feature.departments.length} department${feature.departments.length === 1 ? '' : 's'}`);
  return items.length ? items.join(' · ') : 'All users';
}

function renderSidebar() {
  const filter = $('#search').value.trim().toLowerCase();
  $('#feature-list').innerHTML = manifest.features.map((feature, index) => ({ feature, index }))
    .filter(({ feature }) => feature.name.toLowerCase().includes(filter))
    .map(({ feature, index }) => `<div class="feature-row ${index === selectedIndex ? 'selected' : ''}"><button class="feature-toggle ${feature.enabled === false ? 'disabled' : 'enabled'}" data-toggle="${index}" title="${feature.enabled === false ? 'Enable' : 'Disable'} ${escapeHtml(feature.name)}" aria-label="${feature.enabled === false ? 'Enable' : 'Disable'} ${escapeHtml(feature.name)}">${feature.enabled === false ? '×' : '✓'}</button><button class="feature-item" data-select="${index}"><span class="feature-name">${escapeHtml(feature.name)}</span><span class="feature-meta">${feature.enabled === false ? 'Disabled' : scopes(feature)}</span></button></div>`).join('') || '<p class="empty-list">No matching features.</p>';
  document.querySelectorAll('[data-select]').forEach(button => button.onclick = () => { selectedIndex = Number(button.dataset.select); renderSidebar(); renderEditor(); });
  document.querySelectorAll('[data-toggle]').forEach(button => button.onclick = () => {
    const feature = manifest.features[Number(button.dataset.toggle)];
    feature.enabled = feature.enabled === false;
    status('');
    setSaving(true);
    queueSave();
    renderSidebar();
  });
}

function checked(feature, key) { return feature[key] ? 'checked' : ''; }
function renderEditor() {
  const feature = manifest.features[selectedIndex];
  if (!feature) { $('#editor').innerHTML = '<div class="empty-editor">Select a feature or add a new one.</div>'; return; }
  $('#editor').innerHTML = `<form id="feature-form">
    <div class="editor-heading"><div><p class="eyebrow">Feature</p><h2>${escapeHtml(feature.name)}</h2></div></div>
    <div class="field-grid">
      <label>Feature folder<input value="${escapeHtml(feature.name)}" readonly><small>Discovered from <code>custom_features_v2/</code>.</small></label>
      <label>Load priority<select data-field="priority"><option value="">Standard</option><option value="critical" ${feature.priority === 'critical' ? 'selected' : ''}>Critical — load first</option></select><small>Reserve critical for work users need immediately.</small></label>
    </div>
    <fieldset><legend>Who can use it</legend><div class="checks">
      <label><input data-field="teacher" type="checkbox" ${checked(feature, 'teacher')}> Teachers and admins</label>
      <label><input data-field="notTeacher" type="checkbox" ${checked(feature, 'notTeacher')}> Students only</label>
      <label><input data-field="isd" type="checkbox" ${checked(feature, 'isd')}> ISD users</label>
      <label><input data-field="rootAdmin" type="checkbox" ${checked(feature, 'rootAdmin')}> Root admins</label>
    </div></fieldset>
    <fieldset><legend>Where it can run</legend><div class="field-grid">
      <label>Specific course IDs<input data-field="courseIds" value="${list(feature.courseIds)}" placeholder="Example: 621895, 632661"></label>
      <label>Specific department IDs<input data-field="departments" value="${list(feature.departments)}" placeholder="Example: 3824, 3833"></label>
    </div><div class="checks">
      <label><input data-field="course" type="checkbox" ${checked(feature, 'course')}> Require a course page</label>
      <label><input data-field="blueprint" type="checkbox" ${checked(feature, 'blueprint')}> Blueprint courses only</label>
    </div>
    <label class="wide">Page path rules<textarea data-field="routes" placeholder="One JavaScript regular expression per line. Example: /^\\/courses\\/[0-9]+\\/modules$/">${escapeHtml(routeItems(feature).map(patternText).join('\n'))}</textarea><small>Leave blank to allow every page. Multiple rules mean any one can match.</small></label>
    </fieldset>
    <fieldset><legend>Required shared libraries</legend><div class="checks">${dependencyOptions.map(([name, label]) => `<label><input data-dependency="${name}" type="checkbox" ${(feature.dependencies || []).includes(name) ? 'checked' : ''}> ${label}</label>`).join('')}</div><small>Select every library this feature needs before it loads.</small></fieldset>
  </form>`;

  $('#feature-form').onchange = event => event.target.dataset.dependency ? updateDependencies() : updateFeature(event.target);
}

function updateDependencies() {
  const feature = manifest.features[selectedIndex];
  const known = dependencyOptions.map(([name]) => name);
  const preserved = (feature.dependencies || []).filter(name => !known.includes(name));
  const selected = [...document.querySelectorAll('[data-dependency]:checked')].map(input => input.dataset.dependency);
  const dependencies = [...preserved, ...selected];
  dependencies.length ? feature.dependencies = dependencies : delete feature.dependencies;
  status('');
  setSaving(true);
  queueSave();
}

function updateFeature(input) {
  const feature = manifest.features[selectedIndex];
  const field = input.dataset.field;
  if (!field) return;
  try {
    if (['teacher', 'notTeacher', 'isd', 'rootAdmin', 'course', 'blueprint'].includes(field)) feature[field] = input.checked;
    else if (field === 'courseIds') { const values = parseNumbers(input.value, 'Course IDs'); values ? feature.courseIds = values : delete feature.courseIds; }
    else if (field === 'departments') { const values = parseNumbers(input.value, 'Department IDs'); values ? feature.departments = values : delete feature.departments; }
    else if (field === 'routes') { const values = parseRoutes(input.value); values ? feature.routes = values : delete feature.routes; }
    else if (field === 'priority') { input.value ? feature.priority = input.value : delete feature.priority; }
    status('');
    setSaving(true);
    queueSave();
    if (['teacher', 'notTeacher', 'isd', 'rootAdmin', 'courseIds', 'departments'].includes(field)) renderSidebar();
  } catch (error) { status(error.message); input.focus(); }
}

async function api(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data;
}

function saveNow() {
  clearTimeout(saveTimer);
  setSaving(true);
  const snapshot = JSON.stringify(manifest);
  const request = saveChain.catch(() => {}).then(() => api('/api/features', {
    method: 'PUT', headers: { 'content-type': 'application/json' }, body: snapshot
  }));
  saveChain = request.catch(() => {});
  return request.then(() => { setSaving(false); status(''); }).catch(error => {
    setSaving(false);
    status(`Could not save: ${error.message}`);
    throw error;
  });
}

function queueSave() {
  clearTimeout(saveTimer);
  setSaving(true);
  saveTimer = setTimeout(() => saveNow().catch(() => {}), 350);
}

manifest = await api('/api/features');
renderSidebar(); renderEditor();
$('#search').oninput = renderSidebar;
$('#build').onclick = async () => { await saveNow(); await api('/api/build', { method: 'POST' }); status(''); };
