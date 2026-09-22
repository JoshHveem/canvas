let manifest;
const $ = selector => document.querySelector(selector);
const status = text => $('#status').textContent = text;
const routes = feature => feature.routes ? JSON.stringify(feature.routes) : '';
const escapeHtml = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const advanced = feature => Object.fromEntries(Object.entries(feature).filter(([key]) => !['name', 'enabled', 'routes'].includes(key)));
function render() {
  $('#features').innerHTML = manifest.features.map((feature, index) => `<article><div class="top"><label><input data-key="enabled" data-index="${index}" type="checkbox" ${feature.enabled !== false ? 'checked' : ''}> Enabled</label><input data-key="name" data-index="${index}" value="${escapeHtml(feature.name)}"><button data-remove="${index}">Remove</button></div><label>Routes (JSON)<textarea data-key="routes" data-index="${index}" placeholder='{"source":"^/$","flags":""}'>${escapeHtml(routes(feature))}</textarea></label><label>Advanced settings (JSON)<textarea data-key="advanced" data-index="${index}" placeholder='{"teacher":true,"departments":[3824],"dependencies":["vue"],"priority":"critical"}'>${escapeHtml(JSON.stringify(advanced(feature), null, 2))}</textarea></label></article>`).join('');
  document.querySelectorAll('[data-key]').forEach(input => input.onchange = () => { const feature = manifest.features[input.dataset.index]; const key = input.dataset.key; try { if (key === 'routes') { if (input.value) feature.routes = JSON.parse(input.value); else delete feature.routes; } else if (key === 'advanced') { Object.keys(feature).filter(name => !['name', 'enabled', 'routes'].includes(name)).forEach(name => delete feature[name]); Object.assign(feature, JSON.parse(input.value || '{}')); } else feature[key] = input.type === 'checkbox' ? input.checked : input.value; status('Unsaved changes.'); } catch { status(`${key === 'routes' ? 'Routes' : 'Advanced settings'} must be valid JSON.`); } });
  document.querySelectorAll('[data-remove]').forEach(button => button.onclick = () => { manifest.features.splice(button.dataset.remove, 1); render(); });
}
async function api(url, options) { const response = await fetch(url, options); const data = await response.json(); if (!response.ok) throw new Error(data.error); return data; }
manifest = await api('/api/features'); render();
$('#add').onclick = () => { manifest.features.push({ name: 'new/feature', enabled: true }); render(); };
const save = async () => { await api('/api/features', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(manifest) }); status('Saved features.json'); };
$('#save').onclick = save;
$('#build').onclick = async () => { await save(); const result = await api('/api/build', { method: 'POST' }); status(result.output); };
