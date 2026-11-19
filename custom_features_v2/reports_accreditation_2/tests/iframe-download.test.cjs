const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { buildSync } = require('../../../feature-manager/node_modules/esbuild');

const root = path.resolve(__dirname, '../../..');
const files = [
  'custom_features/reports/accreditation-2.js',
  'custom_features_v2/reports_accreditation_2/main.js',
  'custom_features_v2/reports_accreditation_2/main.bundle.js'
];

async function setup(file) {
  let definition;
  const elements = new Map([['btech-content-1', {}]]);
  const frames = [];
  const content = { find: () => [] };
  const container = {
    html() {},
    append(frame) {
      elements.set(frame.attr('id'), frame[0]);
      frames.push(frame);
    }
  };
  const $ = value => {
    if (value === '#accreditation') return { length: 0 };
    if (value === '#content') return container;
    if (typeof value === 'string' && value.startsWith('<iframe')) {
      const id = value.match(/id="([^"]+)"/)[1];
      return {
        0: { contentWindow: { document: { getElementsByTagName: () => [{}] } } },
        hidden: false,
        hide() { this.hidden = true; },
        attr: name => name === 'id' ? id : undefined
      };
    }
    return content;
  };
  $.getScript = async () => {};
  $.put = async () => {};
  const context = vm.createContext({
    document: { title: 'BTECH Accreditation', getElementById: id => elements.get(id) || null },
    window: { location: { pathname: '/courses/99107' } },
    $,
    Vue: function (options) { definition = options; },
    add_javascript_library() {}
    // Deliberately omit genId, as in the v2 loader.
  });
  const source = file.endsWith('/main.js')
    ? buildSync({ entryPoints: [path.join(root, file)], bundle: true, write: false, format: 'iife', target: 'es2018' }).outputFiles[0].text
    : fs.readFileSync(path.join(root, file), 'utf8');
  await vm.runInContext(source, context);
  // The esbuild IIFE does not return the async initializer's promise.
  await new Promise(setImmediate);
  assert.ok(definition, 'the actual feature initializes');
  return { app: { ...definition.methods, courseId: 99107 }, frames };
}

for (const file of files) {
  test(`${file}: iframe creation needs no global ID helper and preserves callbacks`, async () => {
    const { app, frames } = await setup(file);
    const data = { submission: { id: 123 } };
    const calls = [];
    const iframe = await app.createIframe('/courses/99107/assignments/1/submissions/2', (...args) => calls.push(args), data);
    const second = await app.createIframe('/courses/99107/quizzes/3/history');
    assert.equal(iframe.attr('id'), 'btech-content-2', 'skip an existing iframe ID');
    assert.notEqual(iframe.attr('id'), second.attr('id'));
    assert.equal(iframe.hidden, true);
    assert.equal(frames.length, 2);
    iframe[0].contentWindow.onload();
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], iframe);
    assert.equal(calls[0][2], data);
    second[0].contentWindow.onload();
    assert.equal(calls.length, 1, 'an iframe with no callback can load safely');
  });

  test(`${file}: downloading a quiz reaches the quiz and comments export callbacks`, async () => {
    const { app, frames } = await setup(file);
    const calls = [];
    app.downloadQuiz = (...args) => calls.push(['quiz', ...args]);
    app.downloadComments = (...args) => calls.push(['comments', ...args]);
    const assignment = { id: 1, quiz_id: 3 };
    const submission = { submissionType: 'online_quiz', user: { id: 2 }, rubric_assessments: [] };
    await app.downloadSubmission(assignment, submission);
    assert.equal(app.needsToWait, true);
    assert.equal(frames.length, 2);
    for (const iframe of frames) iframe[0].contentWindow.onload();
    assert.deepEqual(calls.map(call => call[0]), ['quiz', 'comments']);
    for (const call of calls) {
      assert.equal(call[3].assignment, assignment);
      assert.equal(call[3].submission, submission);
    }
  });
}
