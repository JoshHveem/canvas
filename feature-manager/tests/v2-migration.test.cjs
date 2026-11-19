const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { buildSync } = require('../node_modules/esbuild');
const root = path.resolve(__dirname, '../..');

function shared(name, globals = {}) {
  const code = buildSync({ entryPoints: [path.join(root, 'custom_features_v2/shared', name + '.js')], bundle: true, write: false, platform: 'node', format: 'cjs' }).outputFiles[0].text;
  const module = { exports: {} };
  vm.runInNewContext(code, { module, exports: module.exports, ...globals });
  return module.exports;
}

async function bootstrap({ route = '/courses/42/modules', roles = ['teacher'], iframe = false, failBootstrap = false } = {}) {
  const requests = [];
  const errors = [];
  const context = {
    ENV: { current_user_roles: roles, current_user: { id: 10 } },
    location: { pathname: route },
    console: { error: (...args) => errors.push(args) },
    document: {
      querySelector: () => null,
      createElement: () => ({}),
      head: { appendChild(script) {
        requests.push(script.src);
        if (failBootstrap && script.src.endsWith('/custom_canvas_v2.js')) {
          queueMicrotask(() => script.onerror());
          return;
        }
        if (script.src.endsWith('/custom_canvas_v2.js')) vm.runInContext(fs.readFileSync(path.join(root, 'custom_canvas_v2.js'), 'utf8'), sandbox);
        if (script.src.includes('/scripts_v2.min.js')) vm.runInContext(fs.readFileSync(path.join(root, 'scripts_v2.min.js'), 'utf8'), sandbox);
        queueMicrotask(() => script.onload?.());
      } }
    },
    $: Object.assign(() => ({ text: () => '' }), { get: async () => ({ account_id: 3824 }), ajax: async () => {} })
  };
  context.window = context;
  context.self = context;
  context.top = iframe ? {} : context;
  const sandbox = vm.createContext(context);
  const entry = fs.readFileSync(path.join(root, 'custom_canvas.js'), 'utf8');
  vm.runInContext(entry, sandbox);
  await new Promise(setImmediate);
  return { context, requests, errors, runAgain: () => vm.runInContext(entry, sandbox) };
}

test('the existing theme entry starts v2 and never requests legacy feature assets', async () => {
  const { context, requests, errors, runAgain } = await bootstrap();
  assert.ok(context.BTECH_CANVAS_V2_BOOTSTRAPPED);
  assert.ok(requests.some(url => url.endsWith('/custom_canvas_v2.js')));
  assert.ok(requests.some(url => url.includes('/scripts_v2.min.js')));
  assert.ok(requests.some(url => url.includes('/custom_features_v2/modules_course_readiness/main.bundle.js')));
  assert.ok(requests.some(url => url.includes('/custom_features_v2/rubrics_gen_comment/main.bundle.js')) === false);
  assert.ok(requests.every(url => !url.includes('/custom_features/')));
  assert.ok(requests.every(url => !/^https:\/\/bridgetools\.dev\/canvas\/scripts\.js/.test(url)));
  const before = requests.length;
  runAgain();
  assert.equal(requests.length, before, 'both entry points must not start features twice');
  assert.equal(errors.length, 0);
});

test('v2 keeps student restrictions and does not start the theme inside iframes', async () => {
  const student = await bootstrap({ roles: ['student'] });
  assert.ok(student.requests.every(url => !url.includes('/modules_course_readiness/')));
  const nested = await bootstrap({ iframe: true });
  assert.equal(nested.requests.length, 0);
});

test('a failed v2 bootstrap can be retried without falling back to legacy', async () => {
  const { context, requests, errors, runAgain } = await bootstrap({ failBootstrap: true });
  assert.equal(context.BTECH_CANVAS_V2_BOOTSTRAP_LOADING, false);
  assert.equal(errors.length, 1);
  runAgain();
  assert.equal(requests.length, 2);
  await new Promise(setImmediate);
});

test('the v2 registry has a built bundle for each enabled feature and imports known dependencies', async () => {
  const { context } = await bootstrap();
  const knownDependencies = new Set(['vue', 'select2', 'bridgetools', 'reportRuntime']);
  const names = new Set();
  for (const feature of context.BTECH_CANVAS_V2.features) {
    names.add(feature.name);
    assert.ok(fs.existsSync(path.join(root, 'custom_features_v2', feature.name, 'main.bundle.js')), feature.name);
    for (const dependency of feature.dependencies || []) assert.ok(knownDependencies.has(dependency), dependency);
  }
  assert.ok(names.has('editor_toolbar'), 'the toolbar owns its bundled subfeatures');
  assert.ok(names.has('reports_accreditation_2'));
  assert.ok(!names.has('shared'));
  const settings = JSON.parse(fs.readFileSync(path.join(root, 'feature-manager/features.json'), 'utf8')).settings;
  for (const [name, setting] of Object.entries(settings)) {
    if (setting.enabled === false) assert.ok(!names.has(name), `disabled feature ${name}`);
  }
});

test('shared DOM readiness resolves existing content without starting an observer', async () => {
  const elements = { length: 1, html: () => 'Ready' };
  const { waitForElement } = shared('dom', { document: {}, $: () => elements });
  assert.equal(await waitForElement('#ready'), elements);
});

test('shared DOM readiness observes late content and cleans up after success', async () => {
  let callback, disconnected = false, cleared = false, ready = false;
  const elements = { length: 1, html: () => ready ? 'Loaded' : '' };
  const { waitForElement } = shared('dom', {
    document: { documentElement: {} }, $: () => elements,
    MutationObserver: class { constructor(fn) { callback = fn; } observe() {} disconnect() { disconnected = true; } },
    setTimeout: () => 17, clearTimeout: id => { cleared = id === 17; }
  });
  const pending = waitForElement('#late');
  ready = true;
  callback();
  assert.equal(await pending, elements);
  assert.ok(disconnected && cleared);
});

test('shared DOM readiness stops observing if Canvas never renders the element', async () => {
  let timeout, disconnected = false;
  const { waitForElement } = shared('dom', {
    document: {}, $: () => ({ length: 0 }),
    MutationObserver: class { observe() {} disconnect() { disconnected = true; } },
    setTimeout: fn => { timeout = fn; }, clearTimeout() {}
  });
  const pending = waitForElement('#missing');
  timeout();
  await assert.rejects(pending, /#missing/);
  assert.ok(disconnected);
});

test('v2 IDs and number formatting work without legacy globals', () => {
  const { createId } = shared('ids', { crypto: {}, Date });
  assert.notEqual(createId(), createId());
  const { toPrecision } = shared('formatting');
  assert.equal(toPrecision(3.14159, 2), 3.14);
  assert.equal(toPrecision(12, 2), 12);
});

test('all deployed feature bundles are independent of legacy helper globals and asset URLs', async () => {
  const { parse } = require('../node_modules/acorn');
  const { context } = await bootstrap();
  const legacyHelpers = new Set(['getElement', 'genId', 'delay', 'toPrecision', 'addToModuleMenu', 'addToModuleItemMenu', 'add_javascript_library', 'add_css_library', 'feature', 'featureISD', 'featureBeta', 'featurePilot']);
  for (const name of new Set(context.BTECH_CANVAS_V2.features.map(entry => entry.name))) {
    const source = fs.readFileSync(path.join(root, 'custom_features_v2', name, 'main.bundle.js'), 'utf8');
    assert.ok(!source.includes('/custom_features/'), `${name} requests a legacy asset`);
    const check = node => {
      if (!node || typeof node !== 'object') return;
      if (node.type === 'CallExpression' && node.callee.type === 'Identifier') {
        assert.ok(!legacyHelpers.has(node.callee.name), `${name} still calls legacy global ${node.callee.name}`);
      }
      for (const child of Object.values(node)) {
        if (Array.isArray(child)) child.forEach(check);
        else if (child && typeof child === 'object') check(child);
      }
    };
    check(parse(source, { ecmaVersion: 'latest' }));
  }
});

test('the v2 module menu preserves course/module context and inserts each action once', () => {
  const menu = { children: [], attributes: {} };
  const header = { menu, attributes: {} };
  const module = { header, attributes: { 'data-module-id': '17' } };
  const wrap = nodes => ({
    length: nodes.length,
    each(fn) { nodes.forEach(node => fn.call(node)); return this; },
    filter(fn) { return wrap(nodes.filter(node => fn.call(node))); },
    find(selector) {
      if (selector === 'div.ig-header-admin') return wrap(nodes.map(node => node.header));
      if (selector === 'ul.al-options') return wrap(nodes.map(node => node.menu));
      return wrap(nodes.flatMap(node => node.children || []).filter(node => node.attributes['data-btech-menu-action']));
    },
    attr(key, value) {
      if (value === undefined) return nodes[0].attributes[key];
      nodes.forEach(node => { node.attributes[key] = value; }); return this;
    },
    addClass() { return this; },
    append(child) { nodes[0].children.push(child.nodes ? child.nodes[0] : child); return this; },
    on(event, handler) { nodes[0].handlers[event] = handler; return this; },
    nodes
  });
  const $ = value => {
    if (value === 'div.context_module') return wrap([module]);
    if (typeof value === 'string') return wrap([{ attributes: {}, handlers: {}, children: [] }]);
    return wrap([value]);
  };
  const { addToModuleMenu } = shared('module-menus', { $, ENV: { COURSE_ID: 42 }, document: { createTextNode: text => ({ text }) } });
  const calls = [];
  const action = (...args) => calls.push(args);
  addToModuleMenu('Delete Content', 'Delete module content', action, 'icon-trash');
  addToModuleMenu('Delete Content', 'Delete module content', action, 'icon-trash');
  assert.equal(menu.children.length, 1);
  const link = menu.children[0].children[0];
  assert.equal(link.attributes.title, 'Delete module content');
  assert.equal(link.children[1].text, 'Delete Content');
  const event = {};
  link.handlers.click(event);
  assert.equal(calls[0][0], event);
  assert.equal(calls[0][1], 42);
  assert.equal(calls[0][2], '17');
  assert.equal(calls[0][3].nodes[0], header);
});
