const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { buildSync } = require('../../../feature-manager/node_modules/esbuild');
const root = path.resolve(__dirname, '..');

function printDocument() {
  return {
    createElement(tagName) {
      return { tagName, textContent: '', style: {}, children: [], append(...nodes) { this.children.push(...nodes); } };
    }
  };
}

test('API fallback prints assessed criteria, selected ratings, zero scores and instructor comments safely', async () => {
  const { loadAssessedRubric } = load({});
  const calls = [];
  const assignment = { rubric: [
    { id: 'c1', description: '<img onerror=alert(1)>', points: 5, ratings: [{ id: 'r0', description: 'Needs work', points: 0 }] },
    { id: 'c2', description: 'Not assessed', points: 3, ratings: null }
  ] };
  const submission = { rubric_assessment: { c1: { rating_id: 'r0', points: 0, comments: 'Please revise.\nSee feedback.' } } };
  const holder = await loadAssessedRubric(printDocument(), { courseId: 1, assignmentId: 2, userId: 3 }, async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => url.includes('/submissions/') ? submission : assignment };
  });
  assert.equal(calls[0].url, '/api/v1/courses/1/assignments/2');
  assert.equal(calls[1].url, '/api/v1/courses/1/assignments/2/submissions/3?include[]=rubric_assessment');
  assert.ok(calls.every(call => call.options.credentials === 'include'));
  const rows = holder.children[1].children[1].children;
  assert.equal(rows[0].children[0].children[0].textContent, '<img onerror=alert(1)>');
  assert.equal(rows[0].children[1].children[0].textContent, 'Selected: Needs work (0 pts)');
  assert.equal(rows[0].children[2].textContent, '0 / 5');
  assert.equal(rows[0].children[3].textContent, 'Please revise.\nSee feedback.');
  assert.equal(rows[1].children[2].textContent, 'Not scored / 3');
});

test('API fallback refuses empty rubrics or missing or unrelated assessments', async () => {
  const { loadAssessedRubric } = load({});
  for (const [rubric, assessment] of [[[], { c1: {} }], [[{ id: 'c1' }], null], [[{ id: 'c1' }], { other: {} }]]) {
    await assert.rejects(loadAssessedRubric(printDocument(), { courseId: 1, assignmentId: 2, userId: 3 }, async url => ({
      ok: true, json: async () => url.includes('/submissions/') ? { rubric_assessment: assessment } : { rubric }
    })), /did not return an assessed rubric/);
  }
});

test('API fallback reports Canvas permission errors instead of printing an empty rubric', async () => {
  const { loadAssessedRubric } = load({});
  await assert.rejects(loadAssessedRubric(printDocument(), { courseId: 1, assignmentId: 2, userId: 3 }, async () => ({
    ok: false, status: 403
  })), /HTTP 403/);
});

function load(globals) {
  const module = { exports: {} };
  const code = buildSync({ entryPoints: [path.join(root, 'rubric-export.js')], bundle: true, write: false, platform: 'node', format: 'cjs' }).outputFiles[0].text;
  vm.runInNewContext(code, { module, exports: module.exports, ...globals });
  return module.exports;
}

test('an already-loaded rubric exports without waiting for another iframe load', async () => {
  const holder = { querySelector: () => ({}) };
  const { waitForRubric } = load({});
  assert.equal(await waitForRubric({ querySelector: selector => selector === '#rubric_holder' ? holder : null }), holder);
});

test('late Canvas rubric rendering is observed and the observer is cleaned up', async () => {
  let changed, timeout, disconnected = false, cleared = false, ready = false;
  const holder = { querySelector: () => ready ? {} : null };
  const { waitForRubric } = load({
    MutationObserver: class { constructor(callback) { changed = callback; } observe() {} disconnect() { disconnected = true; } },
    setTimeout: callback => { timeout = callback; return 1; }, clearTimeout: () => { cleared = true; }
  });
  const pending = waitForRubric({ querySelector: selector => selector === '#rubric_holder' ? holder : null, body: {} });
  assert.equal(typeof timeout, 'function');
  ready = true;
  changed();
  assert.equal(await pending, holder);
  assert.ok(disconnected && cleared);
});

test('enhanced traditional and modern criteria are accepted outside the legacy holder', async () => {
  const { waitForRubric } = load({});
  for (const marker of ['[data-criterion-id]', '[data-criterion-score-id]', '[data-criterion-comment-id]']) {
    const enhanced = { querySelector: selector => selector.includes(marker) ? {} : null };
    assert.equal(await waitForRubric({
      querySelector: selector => selector === '[data-testid="enhanced-rubric-assessment-container"]' ? enhanced : null
    }), enhanced);
  }
  const react = { querySelector: () => ({}) };
  assert.equal(await waitForRubric({ querySelector: selector => selector === '.react_rubric_container' ? react : null }), react);
});

test('loading enhanced rubrics wait for criteria and a late Show Rubric control is opened only once', async () => {
  let changed, disconnected = false, ready = false, controlReady = false, clicks = 0, observed;
  const enhanced = { querySelector: () => ready ? {} : null };
  const control = { click() { clicks++; } };
  const { waitForRubric } = load({
    MutationObserver: class {
      constructor(callback) { changed = callback; }
      observe(body, options) { observed = options; }
      disconnect() { disconnected = true; }
    },
    setTimeout: () => 1, clearTimeout() {}
  });
  const pending = waitForRubric({ body: {}, querySelector: selector =>
    selector === '[data-testid="enhanced-rubric-assessment-container"]' ? enhanced :
      selector === '.assess_submission_link' && controlReady ? control : null
  });
  assert.equal(disconnected, false);
  assert.equal(observed.attributes, true);
  controlReady = true;
  changed();
  changed();
  assert.equal(clicks, 1);
  assert.equal(disconnected, false);
  ready = true;
  changed();
  assert.equal(await pending, enhanced);
  assert.equal(disconnected, true);
});

test('enhanced rating buttons keep content and selected state while print cleanup removes action buttons', () => {
  const { prepareRubricDocument } = load({});
  for (const modern of [false, true]) {
    const document = printDocument();
    document.head = { append() {} };
    document.body = { replaceChildren() {} };
    document.defaultView = { getComputedStyle: () => ({ overflowY: 'auto' }) };
    const scrollArea = { style: {} };
    const button = {
      className: 'rating-style', style: { cssText: 'border: 3px solid green' },
      childNodes: [document.createElement('span')],
      matches: () => true,
      querySelector: () => modern ? null : {},
      parentElement: { querySelector: () => modern ? {} : null },
      replaceWith(node) { this.replacement = node; }
    };
    button.childNodes[0].textContent = 'Full marks';
    const saveButton = { matches: () => false, remove() { this.removed = true; } };
    const clone = { style: {}, querySelectorAll: selector => selector === '*' ? [scrollArea] : selector === 'button' ? [button, saveButton] : [] };
    const holder = { cloneNode: () => clone, querySelectorAll: selector => selector === '*' ? [{}] : [] };
    prepareRubricDocument(document, holder);
    assert.equal(button.replacement.children[0].textContent, 'Full marks');
    assert.equal(button.replacement.children[1].textContent, ' Selected');
    assert.equal(button.replacement.className, 'rating-style');
    assert.equal(saveButton.removed, true);
    assert.equal(scrollArea.style.overflow, 'visible');
    assert.equal(scrollArea.style.maxHeight, 'none');
  }
});

test('missing rubrics fail explicitly rather than hanging or silently printing an empty page', async () => {
  let timeout, disconnected = false;
  const { waitForRubric } = load({
    MutationObserver: class { observe() {} disconnect() { disconnected = true; } },
    setTimeout: callback => { timeout = callback; }, clearTimeout() {}
  });
  const pending = waitForRubric({ querySelector: () => null, body: {} });
  timeout();
  await assert.rejects(pending, /supported rubric/);
  assert.ok(disconnected);
});

test('printing waits for source fonts and images and clears its readiness timeout', async () => {
  let fontsReady, decoded = false, cleared = false;
  const { waitForPrintAssets } = load({ setTimeout: () => 1, clearTimeout: () => { cleared = true; } });
  const fonts = new Promise(resolve => { fontsReady = resolve; });
  let finished = false;
  const pending = waitForPrintAssets({ fonts: { ready: fonts }, images: [{ complete: false, decode: async () => { decoded = true; } }] }).then(() => { finished = true; });
  await Promise.resolve();
  assert.ok(decoded);
  assert.equal(finished, false);
  fontsReady();
  await pending;
  assert.ok(cleared);
});

test('failed image decoding is tolerated, while stuck assets fail explicitly', async () => {
  let timeout;
  const { waitForPrintAssets } = load({ setTimeout: callback => { timeout = callback; }, clearTimeout() {} });
  await waitForPrintAssets({ images: [{ complete: false, decode: async () => { throw new Error('Image missing'); } }] });
  const pending = waitForPrintAssets({ fonts: { ready: new Promise(() => {}) }, images: [] });
  timeout();
  await assert.rejects(pending, /assets did not finish loading/);
});
