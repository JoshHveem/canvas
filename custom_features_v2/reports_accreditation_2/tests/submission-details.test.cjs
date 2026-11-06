const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const { buildSync } = require('../../../feature-manager/node_modules/esbuild');

async function setup(file) {
  let definition;
  const $ = () => ({ length: 0, html() {} });
  $.getScript = $.put = async () => {};
  const context = vm.createContext({
    document: { title: 'BTECH Accreditation' },
    window: { location: { pathname: '/courses/1' } },
    $, Vue: function(options) { definition = options; },
    console: { error() {} }
  });
  const entry = path.resolve(__dirname, '..', file);
  const source = file === 'main.js'
    ? buildSync({ entryPoints: [entry], bundle: true, write: false, format: 'iife', target: 'es2018' }).outputFiles[0].text
    : fs.readFileSync(entry, 'utf8');
  await vm.runInContext(source, context);
  await new Promise(setImmediate);
  assert.ok(definition);
  return { app: { ...definition.data(), ...definition.methods }, $ };
}

const raw = (id, comments = []) => ({
  user: { _id: id, name: id },
  commentsConnection: { nodes: comments },
  rubricAssessmentsConnection: { nodes: [] }
});
const assignment = id => ({ id, submissions: [], submissionDetailsLoaded: false });
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
};
const response = (nodes, hasNextPage = false, endCursor = null) => ({
  data: { assignment: { submissionsConnection: { nodes, pageInfo: { hasNextPage, endCursor } } } }
});

for (const file of ['main.js', 'main.bundle.js']) {
  test(`${file}: rubric criterion feedback counts as comments without submission comments`, async () => {
    const { app, $ } = await setup(file);
    const a = assignment('7508442');
    const node = raw('2240214');
    node.rubricAssessmentsConnection.nodes = [
      { score: 10, assessmentType: 'grading', assessmentRatings: [
        { comments: null }, { comments: 'Written rubric feedback' }
      ] }
    ];
    $.post = async (url, { query }) => {
      assert.match(query, /assessmentRatings\s*\{\s*comments\s*\}/);
      return response([node]);
    };
    await app.openModal(a);
    assert.equal(app.submissions[0].comments.length, 0);
    assert.equal(app.hasComments(app.submissions[0]), true);
    assert.equal(app.hasComments({ comments: [{ comment: 'Submission feedback' }] }), true);
    assert.equal(app.hasComments({ rubric_assessments: [
      { score: 10, assessmentRatings: [{ comments: null }, { comments: '' }, { comments: ' \n ' }] }
    ] }), false, 'scores and blank criterion comments do not count');
    assert.equal(app.hasComments({ rubric_assessments: [{ assessmentRatings: null }] }), false);
    assert.equal(app.hasComments({ comments: [], rubric_assessments: [] }), false);
  });

  test(`${file}: details remain hidden until all pages load; cache can be refreshed`, async () => {
    const { app, $ } = await setup(file);
    const a = assignment('A');
    const secondPage = deferred();
    let calls = 0;
    $.post = async () => ++calls === 1
      ? response([raw('one')], true, 'next') : secondPage.promise;
    const loading = app.openModal(a);
    await new Promise(setImmediate);
    assert.equal(app.loadingAssignmentDetails, true);
    assert.equal(app.submissions.length, 0);
    assert.equal(a.submissionDetailsLoaded, false);
    secondPage.resolve(response([raw('two', [{ comment: 'Feedback' }])]));
    await loading;
    assert.equal(app.submissions.length, 2);
    assert.equal(app.submissions[1].comments.length, 1);
    await app.openModal(a);
    assert.equal(calls, 2, 'reopening uses validated cache');
    $.post = async () => { calls++; return response([raw('one', [{ comment: 'New comment' }])]); };
    await app.openModal(a, { force: true });
    assert.equal(calls, 3);
    assert.equal(app.submissions[0].comments[0].comment, 'New comment');
  });

  test(`${file}: failed, partial and missing detail responses show an error and allow retry`, async () => {
    for (const failure of ['network', 'graphql', 'missing-comments', 'missing-rubrics', 'missing-data', 'later-page']) {
      const { app, $ } = await setup(file);
      const a = assignment('A');
      a.submissions = [app.normalizeSubmission(raw('summary'))];
      let calls = 0;
      $.post = async () => {
        calls++;
        if (failure === 'network') throw new Error('Network unavailable');
        if (failure === 'missing-data') return { data: null };
        if (failure === 'later-page' && calls === 1) return response([raw('first')], true, 'next');
        if (failure === 'graphql' || failure === 'later-page') {
          return { ...response([raw('partial')]), errors: [{ message: 'Field failed' }] };
        }
        const node = raw('partial');
        node[failure === 'missing-comments' ? 'commentsConnection' : 'rubricAssessmentsConnection'] = null;
        return response([node]);
      };
      await app.openModal(a);
      assert.equal(app.loadingAssignmentDetails, false, failure);
      assert.match(app.assignmentDetailsError, /could not be verified/, failure);
      assert.equal(app.submissions.length, 0, 'never display unverified summary rows');
      assert.equal(a.submissionDetailsLoaded, false, failure);
      $.post = async () => response([raw('complete', [{ comment: 'Verified' }])]);
      await app.openModal(a);
      assert.equal(app.assignmentDetailsError, '');
      assert.equal(a.submissionDetailsLoaded, true);
      assert.equal(app.submissions[0].comments.length, 1);
    }
  });

  test(`${file}: outdated success and failure cannot change the current modal`, async () => {
    for (const outcome of ['success', 'failure']) {
      const { app } = await setup(file);
      const a = assignment('A'), b = assignment('B');
      const first = deferred(), second = deferred();
      app.getSubmissions = id => id === 'A' ? first.promise : second.promise;
      const loadingA = app.openModal(a);
      const loadingB = app.openModal(b);
      if (outcome === 'success') first.resolve([raw('A')]);
      else first.reject(new Error('Old request failed'));
      await loadingA;
      assert.equal(app.loadingAssignmentDetails, true, 'B is still loading');
      assert.equal(app.assignmentDetailsError, '');
      assert.equal(app.submissions.length, 0);
      second.resolve([raw('B', [{ comment: 'B feedback' }])]);
      await loadingB;
      assert.equal(app.currentAssignment.id, 'B');
      assert.equal(app.submissions[0].user.id, 'B');
    }
    const { app } = await setup(file);
    const first = deferred(), second = deferred();
    let calls = 0;
    app.getSubmissions = () => ++calls === 1 ? first.promise : second.promise;
    const a = assignment('A');
    const oldLoad = app.openModal(a);
    const newLoad = app.openModal(a, { force: true });
    second.resolve([raw('new')]);
    await newLoad;
    first.resolve([raw('old')]);
    await oldLoad;
    assert.equal(app.submissions[0].user.id, 'new');
    assert.equal(a.submissions[0].user.id, 'new', 'stale requests cannot replace cache');
  });

  test(`${file}: closing a pending modal invalidates its response`, async () => {
    const { app } = await setup(file);
    const pending = deferred();
    app.getSubmissions = () => pending.promise;
    const a = assignment('A');
    const loading = app.openModal(a);
    app.close();
    pending.resolve([raw('A')]);
    await loading;
    assert.equal(app.showModal, false);
    assert.equal(app.submissions.length, 0);
    assert.equal(a.submissionDetailsLoaded, false);
  });

  test(`${file}: failed refresh hides previously cached results and retries`, async () => {
    const { app, $ } = await setup(file);
    const a = assignment('A');
    $.post = async () => response([raw('A', [{ comment: 'Old' }])]);
    await app.openModal(a);
    $.post = async () => { throw new Error('Refresh failed'); };
    await app.openModal(a, { force: true });
    assert.equal(a.submissionDetailsLoaded, false);
    assert.equal(app.submissions.length, 0);
    assert.ok(app.assignmentDetailsError);
    $.post = async () => response([raw('A')]);
    await app.openModal(a);
    assert.equal(app.submissions[0].comments.length, 0);
    assert.equal(app.assignmentDetailsError, '');
  });
}
