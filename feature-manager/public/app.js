let manifest;
let locationOptions = [];
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
function locationChildren(parentId) { return locationOptions.filter(item => item.parent === parentId); }
function locationDescendants(parentId) {
  return locationChildren(parentId).flatMap(item => [item, ...locationDescendants(item.id)]);
}
function locationBranchSelected(item, selected) {
  return selected.includes(item.id) || locationDescendants(item.id).some(child => selected.includes(child.id));
}
function locationPattern(item, feature) {
  if (!feature.courseIds?.length) return patternText(item.route);
  const courseIds = `(?:${feature.courseIds.join('|')})`;
  const source = item.route.source
    .replace('courses\\/[0-9]+', `courses\\/${courseIds}`)
    .replace('courses\\/([0-9]+)', `courses\\/${courseIds}`);
  return patternText({ ...item.route, source });
}
function locationOption(item, selected, feature) {
  const children = locationChildren(item.id);
  const childMarkup = children.length ? `<div class="location-children">${children.map(child => locationOption(child, selected, feature)).join('')}</div>` : '';
  const expanded = locationBranchSelected(item, selected);
  const expandButton = children.length ? `<button class="location-expand" type="button" data-expand="${escapeHtml(item.id)}" aria-label="${expanded ? 'Collapse' : 'Expand'} ${escapeHtml(item.label)}" aria-expanded="${expanded}">${expanded ? '▾' : '▸'}</button>` : '';
  const locationLine = `<div class="location-line">${expandButton}<label><input data-location="${escapeHtml(item.id)}" type="checkbox" ${selected.includes(item.id) ? 'checked' : ''}><span class="location-label">${escapeHtml(item.label)}</span><code class="location-regex">${escapeHtml(locationPattern(item, feature))}</code></label></div>`;
  return `<div class="location-option ${children.length ? 'location-parent' : ''} ${children.length && !expanded ? 'collapsed' : ''}" data-location-option="${escapeHtml(item.id)}">${locationLine}${childMarkup}</div>`;
}
function locationGroupHeading(group, feature, expanded) {
  const toggle = `<button class="location-expand" type="button" data-expand-group aria-label="${expanded ? 'Collapse' : 'Expand'} ${escapeHtml(group)} locations" aria-expanded="${expanded}">${expanded ? '▾' : '▸'}</button>`;
  const title = `<div class="location-group-title">${toggle}<h3>${escapeHtml(group)}</h3></div>`;
  if (group !== 'Course') return `<div class="location-group-heading">${title}</div>`;
  return `<div class="location-group-heading">${title}<div class="course-scope-controls"><label class="course-id-scope">Specific course IDs<input data-field="courseIds" value="${list(feature.courseIds)}" placeholder="All courses"></label><label class="blueprint-scope"><input data-field="blueprint" type="checkbox" ${checked(feature, 'blueprint')}> Blueprint Only</label></div></div>`;
}
function customRouteRules(feature) {
  const rules = routeItems(feature).map(patternText);
  const rows = [...rules, ''].map(rule => `<input class="route-rule-input" data-route-rule value="${escapeHtml(rule)}" placeholder="/^\\/courses\\/[0-9]+\\/example$/">`).join('');
  return `<div class="route-rule-list">${rows}</div>`;
}
function locationPicker(feature) {
  const selected = feature.locations || [];
  const groups = locationOptions.reduce((result, item) => {
    (result[item.group] ||= []).push(item);
    return result;
  }, {});
  return Object.entries(groups).map(([group, items]) => {
    const roots = items.filter(item => !item.parent);
    const expanded = items.some(item => selected.includes(item.id));
    return roots.length ? `<div class="location-group ${expanded ? '' : 'collapsed'}">${locationGroupHeading(group, feature, expanded)}<div class="location-group-content">${roots.map(item => locationOption(item, selected, feature)).join('')}</div></div>` : '';
  }).join('');
}
function syncLocationParentStates() {
  locationOptions.filter(item => locationChildren(item.id).length).forEach(parent => {
    const input = document.querySelector(`[data-location="${parent.id}"]`);
    const children = locationDescendants(parent.id).map(item => document.querySelector(`[data-location="${item.id}"]`));
    if (input) input.indeterminate = !input.checked && children.some(child => child?.checked);
  });
}
function renderEditor() {
  const feature = manifest.features[selectedIndex];
  if (!feature) { $('#editor').innerHTML = '<div class="empty-editor">Select a feature or add a new one.</div>'; return; }
  $('#editor').innerHTML = `<form id="feature-form">
    <div class="editor-heading"><div><p class="eyebrow">Feature</p><h2>${escapeHtml(feature.name)}</h2></div></div>
    <div class="field-grid">
      <label>Feature folder<input value="${escapeHtml(feature.name)}" readonly><small>Discovered from <code>custom_features_v2/</code>.</small></label>
      <label>Load priority<select data-field="priority"><option value="">Standard</option><option value="critical" ${feature.priority === 'critical' ? 'selected' : ''}>Critical — load first</option></select><small>Reserve critical for work users need immediately.</small></label>
    </div>
    <label class="wide">Description<textarea data-field="description" placeholder="Internal reference only; this does not affect loading or permissions.">${escapeHtml(feature.description)}</textarea><small>Saved in the feature settings for reference only. It is not included in the generated loader.</small></label>
    <fieldset><legend>Who can use it</legend><div class="checks">
      <label><input data-field="teacher" type="checkbox" ${checked(feature, 'teacher')}> Teachers and admins</label>
      <label><input data-field="notTeacher" type="checkbox" ${checked(feature, 'notTeacher')}> Students only</label>
      <label><input data-field="isd" type="checkbox" ${checked(feature, 'isd')}> ISD users</label>
      <label><input data-field="rootAdmin" type="checkbox" ${checked(feature, 'rootAdmin')}> Root admins</label>
    </div></fieldset>
    <fieldset><legend>Where it can run</legend><div class="field-grid">
      <label>Specific department IDs<input data-field="departments" value="${list(feature.departments)}" placeholder="Example: 3824, 3833"></label>
    </div>
    </fieldset>
    <fieldset><legend>Locations</legend><p class="field-help">Select every Canvas location where this feature should load. Selecting a parent also selects its child locations; children can be selected on their own.</p><div class="location-groups">${locationPicker(feature)}</div><div class="wide"><label>Advanced custom path rules</label>${customRouteRules(feature)}<small>Only use for a location not covered above. Each entry is one JavaScript regular expression and is combined with selected locations.</small></div></fieldset>
    <fieldset><legend>Required shared libraries</legend><div class="checks">${dependencyOptions.map(([name, label]) => `<label><input data-dependency="${name}" type="checkbox" ${(feature.dependencies || []).includes(name) ? 'checked' : ''}> ${label}</label>`).join('')}</div><small>Select every library this feature needs before it loads.</small></fieldset>
  </form>`;

  syncLocationParentStates();
  document.querySelectorAll('[data-expand]').forEach(button => button.onclick = () => {
    const container = document.querySelector(`[data-location-option="${button.dataset.expand}"]`);
    const expanded = container.classList.toggle('collapsed') === false;
    button.textContent = expanded ? '▾' : '▸';
    button.setAttribute('aria-expanded', String(expanded));
    button.setAttribute('aria-label', `${expanded ? 'Collapse' : 'Expand'} ${button.closest('.location-line').querySelector('.location-label').textContent}`);
  });
  document.querySelectorAll('[data-expand-group]').forEach(button => button.onclick = () => {
    const container = button.closest('.location-group');
    const expanded = container.classList.toggle('collapsed') === false;
    button.textContent = expanded ? '▾' : '▸';
    button.setAttribute('aria-expanded', String(expanded));
    button.setAttribute('aria-label', `${expanded ? 'Collapse' : 'Expand'} ${button.closest('.location-group-title').querySelector('h3').textContent} locations`);
  });
  $('#feature-form').onchange = event => event.target.dataset.location ? updateLocations(event.target) : event.target.dataset.dependency ? updateDependencies() : event.target.dataset.routeRule !== undefined ? updateRoutes() : updateFeature(event.target);
  $('#feature-form').oninput = event => { if (event.target.dataset.routeRule !== undefined) ensureEmptyRouteInput(); };
}

function expandLocationBranch(id) {
  let currentId = id;
  while (currentId) {
    const container = document.querySelector(`[data-location-option="${currentId}"]`);
    const button = document.querySelector(`[data-expand="${currentId}"]`);
    if (container) container.classList.remove('collapsed');
    if (button) { button.textContent = '▾'; button.setAttribute('aria-expanded', 'true'); }
    currentId = locationOptions.find(item => item.id === currentId)?.parent;
  }
}
function updateLocations(changedInput) {
  const descendants = locationDescendants(changedInput.dataset.location);
  if (descendants.length) {
    descendants.forEach(item => {
      const input = document.querySelector(`[data-location="${item.id}"]`);
      if (input) input.checked = changedInput.checked;
    });
  } else {
    let parent = locationOptions.find(item => item.id === changedInput.dataset.location)?.parent;
    while (parent) {
      const input = document.querySelector(`[data-location="${parent}"]`);
      if (input) input.checked = false;
      parent = locationOptions.find(item => item.id === parent)?.parent;
    }
  }
  if (changedInput.checked) expandLocationBranch(changedInput.dataset.location);
  syncLocationParentStates();
  const feature = manifest.features[selectedIndex];
  const selected = [...document.querySelectorAll('[data-location]:checked')].map(input => input.dataset.location);
  selected.length ? feature.locations = selected : delete feature.locations;
  status('');
  setSaving(true);
  queueSave();
}

function updateRoutes() {
  const feature = manifest.features[selectedIndex];
  try {
    const values = [...document.querySelectorAll('[data-route-rule]')].map(input => input.value).filter(Boolean).join('\n');
    const routes = parseRoutes(values);
    routes ? feature.routes = routes : delete feature.routes;
    status('');
    setSaving(true);
    queueSave();
  } catch (error) { status(error.message); }
}

function ensureEmptyRouteInput() {
  const inputs = [...document.querySelectorAll('[data-route-rule]')];
  const blanks = inputs.filter(input => !input.value.trim());
  if (blanks.length) {
    const keep = blanks.includes(document.activeElement) ? document.activeElement : blanks[0];
    blanks.filter(input => input !== keep).forEach(input => input.remove());
    return;
  }
  const input = document.createElement('input');
  input.className = 'route-rule-input';
  input.dataset.routeRule = '';
  input.placeholder = '/^\\/courses\\/[0-9]+\\/example$/';
  document.querySelector('.route-rule-list').append(input);
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
    if (['teacher', 'notTeacher', 'isd', 'rootAdmin', 'blueprint'].includes(field)) feature[field] = input.checked;
    else if (field === 'courseIds') { const values = parseNumbers(input.value, 'Course IDs'); values ? feature.courseIds = values : delete feature.courseIds; }
    else if (field === 'departments') { const values = parseNumbers(input.value, 'Department IDs'); values ? feature.departments = values : delete feature.departments; }
    else if (field === 'routes') { const values = parseRoutes(input.value); values ? feature.routes = values : delete feature.routes; }
    else if (field === 'description') { input.value.trim() ? feature.description = input.value.trim() : delete feature.description; }
    else if (field === 'priority') { input.value ? feature.priority = input.value : delete feature.priority; }
    status('');
    setSaving(true);
    queueSave();
    if (['teacher', 'notTeacher', 'isd', 'rootAdmin', 'courseIds', 'departments'].includes(field)) renderSidebar();
    if (field === 'courseIds') renderEditor();
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

locationOptions = await api('/api/locations');
manifest = await api('/api/features');
renderSidebar(); renderEditor();
$('#search').oninput = renderSidebar;
$('#build').onclick = async () => { await saveNow(); await api('/api/build', { method: 'POST' }); status(''); };
