const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { buildSync } = require('../../../feature-manager/node_modules/esbuild');
const root = path.resolve(__dirname, '..');

function load(globals) {
  const module = { exports: {} };
  const code = buildSync({ entryPoints: [path.join(root, 'rubric-export.js')], bundle: true, write: false, platform: 'node', format: 'cjs' }).outputFiles[0].text;
  vm.runInNewContext(code, { module, exports: module.exports, ...globals });
  return module.exports;
}

test('an already-loaded rubric exports without waiting for another iframe load', async () => {
  const holder = { querySelector: () => ({}) };
  const { waitForRubric } = load({});
  assert.equal(await waitForRubric({ querySelector: () => holder }), holder);
});

test('late Canvas rubric rendering is observed and the observer is cleaned up', async () => {
  let changed, timeout, disconnected = false, cleared = false, ready = false;
  const holder = { querySelector: () => ready ? {} : null };
  const { waitForRubric } = load({
    MutationObserver: class { constructor(callback) { changed = callback; } observe() {} disconnect() { disconnected = true; } },
    setTimeout: callback => { timeout = callback; return 1; }, clearTimeout: () => { cleared = true; }
  });
  const pending = waitForRubric({ querySelector: () => holder, body: {} });
  assert.equal(typeof timeout, 'function');
  ready = true;
  changed();
  assert.equal(await pending, holder);
  assert.ok(disconnected && cleared);
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
