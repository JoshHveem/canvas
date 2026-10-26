const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const Vue = require('../../../external-libraries/vue.2.6.12.js');

// Use the same Vue version as the tool so selection watchers and nested loading
// are exercised with real Vue scheduling, without Canvas or network access.
const root = path.resolve(__dirname, '..');
const definitions = new Map();
const warnings = [];
const vueErrors = [];
Vue.config.errorHandler = error => vueErrors.push(error);
const context = vm.createContext({
  window: { addEventListener() {}, removeEventListener() {} },
  Vue: { component: (name, options) => definitions.set(name, options) },
  console: { warn: (...args) => warnings.push(args) },
  bridgetools: { req3: async () => [] }
});
context.window.ReportTable = class {
  setColumns() {}
  setRows(rows) { this.rows = rows; }
  getSortedRows() { return this.rows || []; }
};
context.window.ReportColumn = class {};
vm.runInContext(require('./shared-runtime.cjs'), context);
for (const file of fs.readdirSync(path.join(root, 'reports'))) {
  if (file.endsWith('.js')) {
    vm.runInContext(fs.readFileSync(path.join(root, 'reports', file), 'utf8'), context, { filename: file });
  }
}
const mixins = context.window.ReportMixins;

function deferred() {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function flush() {
  // Finish promise continuations and Vue's queued selection watchers.
  for (let i = 0; i < 10; i++) await Vue.nextTick();
}

function instance() {
  return new Vue({
    mixins: [mixins.requests],
    data: () => ({ loading: false, loadingOptions: false, loadError: '', rows: [] })
  });
}

function report(name, overrides = {}, reportContext = { dataset: 'test', filters: {}, sharedFilters: {} }) {
  const definition = definitions.get(`reports-${name}`);
  assert.ok(definition, name);
  return new Vue({
    ...definition,
    // Column creation and DOM mounting are separate from the loader lifecycle.
    created: [],
    mounted: [],
    propsData: { reportContext },
    methods: {
      ...definition.methods,
      ...overrides
    }
  });
}

function load(view, pending, channel = 'data', options = {}) {
  return view.runReportRequest(channel, {
    onError: error => { view.loadError = error.message; view.rows = []; },
    ...options
  }, async request => { view.rows = await request.wait(pending.promise); });
}

for (const outcome of ['success', 'failure']) {
  test(`superseded ${outcome} cannot replace newer rows or errors`, async () => {
    const view = instance(), old = deferred(), latest = deferred();
    const first = load(view, old), second = load(view, latest);
    latest.resolve(['current']);
    await second;
    if (outcome === 'success') old.resolve(['stale']);
    else old.reject(new Error('stale failure'));
    await first;
    assert.deepEqual(Array.from(view.rows), ['current']);
    assert.equal(view.loadError, '');
    assert.equal(view.loading, false);
    view.$destroy();
  });
}

test('old completion does not stop the current loading indicator', async () => {
  const view = instance(), old = deferred(), latest = deferred();
  const first = load(view, old), second = load(view, latest);
  old.resolve(['stale']);
  await first;
  assert.equal(view.loading, true);
  latest.resolve(['current']);
  await second;
  assert.equal(view.loading, false);
  view.$destroy();
});

test('current failures run cleanup once and a retry clears the error', async () => {
  const view = instance(), failed = deferred(), retry = deferred();
  let finalized = 0;
  const first = load(view, failed, 'data', { onFinally: () => finalized++ });
  failed.reject(new Error('request failed'));
  await first;
  assert.equal(view.loadError, 'request failed');
  assert.equal(view.loading, false);
  assert.equal(finalized, 1);
  const next = load(view, retry);
  assert.equal(view.loadError, '');
  retry.resolve(['retried']);
  await next;
  assert.deepEqual(Array.from(view.rows), ['retried']);
  view.$destroy();
});

test('separate channels share a loading flag until every current request finishes', async () => {
  const view = instance(), programs = deferred(), data = deferred();
  const first = load(view, programs, 'programs'), second = load(view, data);
  programs.resolve([]);
  await first;
  assert.equal(view.loading, true);
  data.resolve(['students']);
  await second;
  assert.equal(view.loading, false);
  view.$destroy();
});

test('reloading options invalidates data and keeps its own loading flag', async () => {
  const view = instance(), data = deferred(), options = deferred();
  const first = load(view, data);
  const second = load(view, options, 'options', { loadingKey: 'loadingOptions', invalidate: ['data'] });
  assert.equal(view.loading, false);
  assert.equal(view.loadingOptions, true);
  data.reject(new Error('old data failed'));
  await first;
  assert.equal(view.loadError, '');
  options.resolve([]);
  await second;
  assert.equal(view.loadingOptions, false);
  view.$destroy();
});

test('a cancelled first stage cannot launch a dependent request', async () => {
  const view = instance(), headers = deferred();
  let dependentCalls = 0;
  const pending = view.runReportRequest('data', {}, async request => {
    await request.wait(headers.promise);
    dependentCalls++;
    view.rows = ['stale'];
  });
  view.cancelReportRequest('data');
  headers.resolve([]);
  await pending;
  assert.equal(dependentCalls, 0);
  assert.equal(view.rows.length, 0);
  assert.equal(view.loading, false);
  view.$destroy();
});

test('destroying a report suppresses pending results, errors, finalizers, and future work', async () => {
  const view = instance(), pending = deferred();
  let finalized = 0, futureCalls = 0;
  const loading = load(view, pending, 'data', { onFinally: () => finalized++ });
  view.$destroy();
  pending.reject(new Error('late error'));
  await loading;
  await view.runReportRequest('data', {}, async () => futureCalls++);
  assert.equal(view.rows.length, 0);
  assert.equal(view.loadError, '');
  assert.equal(view.loading, false);
  assert.equal(finalized, 0);
  assert.equal(futureCalls, 0);
});

test('request channels are isolated between report instances', async () => {
  const firstView = instance(), secondView = instance();
  const first = deferred(), second = deferred();
  const a = load(firstView, first), b = load(secondView, second);
  first.resolve(['first']);
  second.resolve(['second']);
  await Promise.all([a, b]);
  assert.deepEqual(Array.from(firstView.rows), ['first']);
  assert.deepEqual(Array.from(secondView.rows), ['second']);
  firstView.$destroy(); secondView.$destroy();
});

for (const scope of ['departmentScoped', 'programScoped', 'yearSummary']) {
  test(`${scope} loader ignores stale failures`, async () => {
    const old = deferred(), latest = deferred();
    let calls = 0;
    const scoped = mixins[scope]({ optionsDataset: 'options' });
    const view = new Vue({
      mixins: [mixins.requests, mixins.formatting, mixins.filters, mixins.datasets, mixins.canvasProfiles],
      data: () => ({ loading: false, loadError: '', rows: [], year: 2026,
        selectedDepartmentCode: 'A', selectedProgramCode: 'A', departmentOptions: [], programOptions: [], reportContext: {} }),
      methods: { ...scoped.methods, fetchReportDataset: () => (++calls === 1 ? old : latest).promise }
    });
    const a = view.loadData(), b = view.loadData();
    latest.resolve([{ id: 'current' }]);
    await b;
    old.reject(new Error('old scoped failure'));
    await a;
    assert.equal(view.rows[0].id, 'current');
    assert.equal(view.loadError, '');
    assert.equal(view.loading, false);
    view.$destroy();
  });
}

for (const outcome of ['success', 'failure']) {
  test(`department options ignore an older ${outcome}`, async () => {
    const old = deferred(), latest = deferred();
    let calls = 0;
    const view = report('department-instructors', {
      fetchReportDataset: () => (++calls === 1 ? old : latest).promise,
      loadData() {}
    });
    const first = view.loadDepartmentOptions(), second = view.loadDepartmentOptions();
    latest.resolve([{ department_code: 'NEW', department_name: 'New' }]);
    await second;
    if (outcome === 'success') old.resolve([{ department_code: 'OLD', department_name: 'Old' }]);
    else old.reject(new Error('old options failed'));
    await first;
    assert.equal(view.departmentOptions[0].value, 'NEW');
    assert.equal(view.loadError, '');
    assert.equal(view.loadingDepartments, false);
    view.$destroy();
  });
}

test('at-a-glance initialization loads the selected department through its watcher', async () => {
  let dataLoads = 0;
  const view = report('students-at-a-glance', {
    fetchReportDataset: async () => [{ department_code: 'A', department_name: 'A' }],
    loadData() { dataLoads++; }
  });
  await view.loadDepartmentOptions();
  await flush();
  assert.equal(view.selectedDepartmentCode, 'A');
  assert.equal(dataLoads, 1);
  assert.equal(view.loadingDepartments, false);
  view.$destroy();
});

test('a stale empty first-stage result cannot clear current at-a-glance rows', async () => {
  const pending = deferred();
  const view = report('students-at-a-glance', { fetchReportDataset: () => pending.promise });
  // Keep option initialization out of this multi-stage data-loading scenario.
  view.selectedDepartmentCode = 'A';
  const first = view.loadData();
  await flush();
  view.selectedDepartmentCode = '';
  await view.loadData();
  view.rows = [{ sis_user_id: 'current' }];
  pending.resolve([]);
  await first;
  assert.equal(view.rows[0].sis_user_id, 'current');
  assert.equal(view.loadError, 'Select a department.');
  view.$destroy();
});

test('multi-dataset employment loading still tolerates optional dataset failures', async () => {
  const view = report('employment-skills', {
    fetchReportDataset: async (filters, options) => {
      if (options.dataset === 'test') return [{ sis_user_id: '1', program_code: 'A' }];
      throw new Error('optional dataset unavailable');
    }
  });
  view.selectedProgramCode = 'A';
  await flush();
  assert.equal(view.rows[0].sis_user_id, '1');
  assert.equal(view.loadError, '');
  assert.equal(view.loading, false);
  view.$destroy();
});

test('direct admissions requests ignore a late failure after a year change', async () => {
  const old = deferred(), latest = deferred();
  let calls = 0;
  const original = context.bridgetools.req3;
  context.bridgetools.req3 = () => (++calls === 1 ? old : latest).promise;
  const view = report('admissions-overview', { renderChart() {} });
  try {
    const first = view.loadData();
    view.year--;
    await flush();
    latest.resolve([]);
    await flush();
    assert.equal(view.loading, false);
    old.reject(new Error('old year failed'));
    await first;
    assert.equal(view.loadError, '');
  } finally {
    view.$destroy();
    context.bridgetools.req3 = original;
  }
});

test('clearing a department invalidates in-flight rows, including hydration', async () => {
  const hydration = deferred();
  const view = report('hs-student-grades', {
    fetchReportDataset: async () => [{ sis_user_id: '1' }],
    hydrateSisUserIds: () => hydration.promise
  });
  view.selectedDepartmentCode = 'A';
  await flush();
  view.selectedDepartmentCode = '';
  await flush();
  hydration.resolve([{ sis_user_id: 'stale' }]);
  await flush();
  assert.equal(view.rows.length, 0);
  assert.match(view.loadError, /Select a department/);
  assert.equal(view.loading, false);
  view.$destroy();
});

test('an empty HS standing submission supersedes an earlier student lookup', async () => {
  const pending = deferred();
  let calls = 0;
  const view = report('hs-student-standing', { fetchReportDataset: () => { calls++; return pending.promise; } });
  view.studentIdsText = '123';
  const first = view.loadData();
  view.studentIdsText = '';
  await view.loadData();
  pending.resolve([{ sis_user_id: '123', canvas_user_id: '456' }]);
  await first;
  assert.equal(calls, 1);
  assert.equal(view.rows.length, 0);
  assert.match(view.loadError, /Paste at least one/);
  assert.equal(view.loading, false);
  view.$destroy();
});

test('prospective and waitlist navigation protects results and loading from the old view', async () => {
  const prospective = deferred(), waitlist = deferred();
  const view = report('students-prospective', {
    fetchReportDataset: filters => (filters.is_waitlisted ? waitlist : prospective).promise
  });
  view.programs = [{ program_name: 'A', academic_year: new Date().getFullYear(), is_on_campus: true }];
  view.hasLoadedPrograms = true;
  view.selectedProgramName = 'A';
  await flush();
  view.reportContext = { subMenu: 'waitlist' };
  await flush();
  waitlist.resolve([{ sis_user_id: 'new', is_waitlisted: true }]);
  await flush();
  assert.equal(view.rows[0].sis_user_id, 'new');
  assert.equal(view.loadedWaitlistMode, true);
  assert.equal(view.loading, false);
  prospective.reject(new Error('old prospective failure'));
  await flush();
  assert.equal(view.rows[0].sis_user_id, 'new');
  assert.equal(view.loadError, '');
  view.$destroy();
});

test('graduation initialization starts the selected program and allows a newer program to finish first', async () => {
  const old = deferred(), latest = deferred();
  const year = new Date().getFullYear();
  const view = report('graduation-students', {
    fetchReportDataset: (filters, options) => options.dataset === 'programs_graduates_projections'
      ? Promise.resolve([
        { program_code: 'A', program_name: 'A', campus_code: '1', academic_year: year, is_on_campus: true },
        { program_code: 'B', program_name: 'B', campus_code: '1', academic_year: year, is_on_campus: true }
      ]) : (filters.program_code === 'A' ? old : latest).promise
  });
  await view.loadData();
  await flush();
  assert.equal(view.selectedProgram.program_code, 'A');
  assert.equal(view.loading, true);
  view.selectedProgramKey = view.programOptions.find(row => row.program_code === 'B').key;
  await flush();
  latest.resolve([{ sis_user_id: 'B', is_exited: false }]);
  await flush();
  assert.equal(view.activeRows[0].sis_user_id, 'B');
  assert.equal(view.loading, false);
  old.reject(new Error('old program failed'));
  await flush();
  assert.equal(view.activeRows[0].sis_user_id, 'B');
  assert.equal(view.loadError, '');
  view.$destroy();
});

test('report-specific grade thresholds and numeric missing-value behavior remain distinct', () => {
  const grades = report('hs-student-grades');
  const standing = report('hs-student-standing');
  const summary = report('graduation-summary');
  assert.equal(grades.numberValue(''), null);
  assert.equal(summary.numberValue(''), 0);
  assert.equal(grades.gradePillStyle(65).backgroundColor, grades.colors.red);
  assert.equal(standing.gradePillStyle(65).backgroundColor, standing.colors.yellow);
  assert.equal(summary.percent(NaN), '—');
  const outlook = report('graduation-outlook');
  assert.equal(outlook.percent(NaN), '-');
  grades.$destroy(); standing.$destroy(); summary.$destroy(); outlook.$destroy();
});

test('student links retain their report-specific course fields, query parameters, and escaping', () => {
  const skills = report('employment-skills');
  const glance = report('students-at-a-glance');
  const row = { first_name: '<Ada>', canvas_user_id: '34', canvas_course_id: '12', upcoming_canvas_course_id: '56' };
  assert.match(skills.studentFirstNameLinkHtml(row), /href="\/courses\/12\/users\/34\?open_btech_report=employment-skills"/);
  assert.match(glance.studentFirstNameLinkHtml(row), /href="\/courses\/56\/users\/34"/);
  assert.match(skills.studentFirstNameLinkHtml(row), /&lt;Ada&gt;/);
  assert.equal(skills.studentFirstNameLinkHtml({ first_name: '<Ada>', canvas_user_id: '34' }), '&lt;Ada&gt;');
  skills.$destroy(); glance.$destroy();
});

test('inherited table rows react to report data replacements', () => {
  const view = report('students-probations');
  view.rows = [{ id: 'first' }];
  assert.equal(view.visibleRows[0].id, 'first');
  view.rows = [{ id: 'second' }];
  assert.equal(view.visibleRows[0].id, 'second');
  view.$destroy();
});

for (const type of ['course', 'instructor']) {
  const name = `evaluations-${type}-detail`;
  const dataset = `${type}_evaluations`;
  const optionsDataset = `course_${type}_evaluations`;
  const title = type === 'course' ? 'Course' : 'Instructor';
  const metric = type === 'course' ? 'likert_course_content_relevant' : 'likert_available_support';
  const optionRows = [
    { program_code: 'P', program_name: 'Program P', course_code: 'C2', course_name: 'Second' },
    { program_code: 'P', program_name: 'Program P', course_code: 'C1', course_name: 'First' },
    { program_code: 'P', program_name: 'Program P', course_code: 'C1', course_name: 'Latest <Name>' },
    { program_code: 'Q', program_name: 'Program Q', course_code: 'C3', course_name: 'Third' }
  ];
  function detailContext(courseCode = '') {
    return { filters: { academic_year: 2026 }, sharedFilters: {}, routeFilters: { programCode: 'P', courseCode } };
  }

  test(`${name} initializes configured datasets, normalizes rows, and intersects local tag filters`, async () => {
    const original = context.bridgetools.req3;
    const calls = [];
    context.bridgetools.req3 = async (reportName, filters, options) => {
      calls.push({ reportName, filters, dataset: options.dataset });
      if (options.dataset === optionsDataset) return optionRows;
      return [
        { evaluation_submission_id: ' first ', course_code: ' C1 ', course_name: ' Name ',
          full_name__instructor: ' Instructor ', [metric]: '2', free_response_positives: ' Positive ',
          free_response_recommendations: ' Recommendation ', free_response_positives__tags: { Good: 1 },
          free_response_recommendations__tags: { Improve: 1 } },
        { evaluation_submission_id: 'second', free_response_positives__tags: { Good: 1 },
          free_response_recommendations__tags: { Different: 1 } }
      ];
    };
    const view = report(name, {}, detailContext('C1'));
    try {
      assert.equal(view.year, 2026);
      assert.equal(view.loading, false);
      assert.equal(view.anonymous, false);
      // Exercise the inherited mounted hook without mounting the Canvas template.
      for (const mounted of view.$options.mounted) mounted.call(view);
      await flush();
      assert.equal(calls[0].dataset, optionsDataset);
      const details = calls.find(call => call.dataset === dataset);
      assert.ok(details);
      assert.equal(details.reportName, 'reports');
      assert.equal(details.filters.academic_year, 2026);
      assert.equal(details.filters.program_code, 'P');
      assert.equal(details.filters.course_code, 'C1');
      assert.deepEqual(Array.from(view.programOptions, option => option.value), ['P', 'Q']);
      assert.deepEqual(Array.from(view.courseOptions, option => option.value), ['', 'C1', 'C2']);
      assert.equal(view.courseOptions[1].label, 'C1 - Latest <Name>');
      assert.equal(view.titleText, `C1 - Latest &lt;Name&gt; - ${title} Eval Detail`);
      assert.equal(view.rows[0].evaluation_submission_id, 'first');
      assert.equal(view.rows[0].course_code, 'C1');
      assert.equal(view.rows[0][metric], 2);
      assert.equal(view.rows[0].free_response_positives, 'Positive');
      assert.equal(view.rows[0].free_response_recommendations, 'Recommendation');
      if (type === 'instructor') assert.equal(view.rows[0].full_name__instructor, 'Instructor');
      assert.deepEqual(Array.from(view.positiveTagOptions), ['Good']);
      assert.deepEqual(Array.from(view.recommendationTagOptions), ['Different', 'Improve']);
      const previousCalls = calls.length;
      view.selectedPositiveTag = 'Good';
      view.selectedRecommendationTag = 'Improve';
      await flush();
      assert.equal(view.visibleRows.length, 1);
      assert.equal(view.visibleRows[0].evaluation_submission_id, 'first');
      assert.equal(calls.length, previousCalls, 'tag filtering must remain local');
      assert.equal(view.loading || view.loadingOptions, false);
      view.reportContext = { ...detailContext('C1'), dataset: 'override' };
      await flush();
      assert.ok(calls.some(call => call.dataset === 'override'));
    } finally {
      view.$destroy();
      context.bridgetools.req3 = original;
    }
  });

  test(`${name} resets invalid courses and reloads the selected program and year`, async () => {
    const original = context.bridgetools.req3;
    const calls = [], shared = {};
    context.bridgetools.req3 = async (reportName, filters, options) => {
      calls.push({ filters, dataset: options.dataset });
      return options.dataset === optionsDataset ? optionRows : [];
    };
    const reportContext = detailContext('MISSING');
    reportContext.setSharedFilter = (key, value) => { shared[key] = value; };
    const view = report(name, {}, reportContext);
    try {
      await view.loadOptions();
      await flush();
      assert.equal(view.selectedCourseCode, '');
      assert.equal(Object.hasOwn(calls.at(-1).filters, 'course_code'), false);
      assert.equal(view.titleText, `All - ${title} Eval Detail`);
      view.selectedProgramCode = 'Q';
      await flush();
      view.selectedCourseCode = 'C3';
      await flush();
      assert.equal(calls.at(-1).filters.course_code, 'C3');
      view.selectedProgramCode = 'P';
      await flush();
      assert.equal(view.selectedCourseCode, '');
      assert.equal(calls.at(-1).filters.program_code, 'P');
      assert.equal(Object.hasOwn(calls.at(-1).filters, 'course_code'), false);
      assert.equal(calls.some(call => call.filters.program_code === 'P' && call.filters.course_code === 'C3'), false);
      assert.equal(shared.program_code, 'P');
      assert.equal(shared.program_name, 'Program P');
      assert.equal(shared.course_code, '');
      view.year = 2025;
      await flush();
      assert.equal(shared.academic_year, 2025);
      assert.ok(calls.some(call => call.dataset === optionsDataset && call.filters.academic_year === 2025));
      assert.equal(calls.at(-1).filters.academic_year, 2025);
    } finally {
      view.$destroy();
      context.bridgetools.req3 = original;
    }
  });

  test(`${name} ignores an older option-list failure after the year changes`, async () => {
    const original = context.bridgetools.req3;
    const old = deferred(), latest = deferred();
    let optionCalls = 0;
    context.bridgetools.req3 = (reportName, filters, options) => options.dataset === optionsDataset
      ? (++optionCalls === 1 ? old : latest).promise
      : Promise.resolve([{ evaluation_submission_id: 'current', [metric]: 1 }]);
    const view = report(name, {}, detailContext());
    try {
      const first = view.loadOptions();
      view.year = 2025;
      await flush();
      latest.resolve(optionRows);
      await flush();
      assert.equal(view.rows[0].evaluation_submission_id, 'current');
      old.reject(new Error('stale options failed'));
      await first;
      assert.equal(view.rows[0].evaluation_submission_id, 'current');
      assert.equal(view.programOptions[0].value, 'P');
      assert.equal(view.loadError, '');
      assert.equal(view.loading || view.loadingOptions, false);
    } finally {
      view.$destroy();
      context.bridgetools.req3 = original;
    }
  });

  test(`${name} preserves option-list errors over invalidated data and uses its configured detail error`, async () => {
    const original = context.bridgetools.req3;
    const pendingData = deferred();
    context.bridgetools.req3 = (reportName, filters, options) => options.dataset === optionsDataset
      ? Promise.reject(new Error('option list failed')) : pendingData.promise;
    const view = report(name, {}, detailContext());
    try {
      const first = view.loadData();
      await view.loadOptions();
      pendingData.resolve([{ evaluation_submission_id: 'stale' }]);
      await first;
      assert.equal(view.rows.length, 0);
      assert.equal(view.loadError, 'Unable to load course list.');
      assert.equal(view.loading || view.loadingOptions, false);
      context.bridgetools.req3 = async () => { throw new Error('details failed'); };
      await view.loadData();
      assert.equal(view.loadError, `Unable to load ${type} evaluation details.`);
      assert.equal(view.loading, false);
    } finally {
      view.$destroy();
      context.bridgetools.req3 = original;
    }
  });
}

test('all 24 reports have the lifecycle and handle an empty response without runtime errors', async () => {
  const names = [...definitions.keys()].filter(name => name.startsWith('reports-'));
  assert.equal(names.length, 24);
  for (const name of names) {
    const view = report(name.slice('reports-'.length));
    assert.equal(typeof view.runReportRequest, 'function', name);
    await view.loadData();
    await flush();
    assert.equal(view.loading, false, name);
    view.$destroy();
  }
  assert.deepEqual(vueErrors, []);
  const runtimeErrors = warnings.filter(args => args.some(value => ['ReferenceError', 'TypeError'].includes(value?.name)));
  assert.deepEqual(runtimeErrors, []);
});
