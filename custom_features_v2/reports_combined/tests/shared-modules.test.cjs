const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const runtime = require('./shared-runtime.cjs');

function setup(overrides = {}) {
  const context = vm.createContext({
    window: {},
    console: { warn() {} },
    bridgetools: { req3: async () => [] },
    ...overrides
  });
  vm.runInContext(runtime, context);
  return context;
}

function adapter(context, names, properties = {}) {
  const view = { ...properties };
  for (const name of names) {
    const definition = context.window.ReportMixins[name];
    const mixin = typeof definition === 'function' ? definition() : definition;
    Object.assign(view, mixin.methods);
  }
  return view;
}

test('the deployed feature bundle provides shared modules before loading report scripts', () => {
  const scripts = [];
  const context = vm.createContext({
    window: {},
    document: { createElement: () => ({}), head: { insertBefore() {} } },
    ReportColumn: class {},
    ReportTable: class {},
    $: { getScript: url => {
      scripts.push(url);
      // Pause at the first external library; no remote scripts run in this test.
      return new Promise(() => {});
    } }
  });
  vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../main.bundle.js'), 'utf8'), context);
  assert.equal(scripts.length, 1);
  assert.match(scripts[0], /vue\.2\.6\.12\.js$/);
  const view = adapter(context, ['formatting', 'filters', 'datasets', 'canvasProfiles', 'requests']);
  assert.equal(view.pctText(0.5), '50.0%');
  assert.equal(typeof view.fetchReportDataset, 'function');
  assert.equal(typeof view.hydrateSisUserIds, 'function');
  assert.equal(typeof view.runReportRequest, 'function');
  assert.equal(typeof context.window.ReportMixins.departmentScoped, 'function');
});

test('formatting and table adapters preserve display, sorting, and wrapped columns', () => {
  const context = setup();
  const colors = context.window.ReportUtils.createColors();
  const view = adapter(context, ['formatting', 'tables'], { colors });
  assert.equal(view.escapeHtml('<a title="test">'), '&lt;a title=&quot;test&quot;&gt;');
  assert.equal(view.pctText(0.825), '82.5%');
  assert.equal(view.numText(3.14159, 2), '3.14');
  assert.equal(view.boolSort(null), -1);
  assert.equal(view.pctPillStyle(0.95).backgroundColor, colors.green);
  const column = {};
  assert.equal(view.withColumnWrap(column), column);
  assert.equal(column.wrap, true);
});

test('filters clone shared arrays and resolve persisted, routed, and fallback selections', () => {
  const context = setup();
  let saved;
  const view = adapter(context, ['filters'], {
    reportContext: {
      sharedFilters: { program_code: 'B', tags: ['one'] },
      setSharedFilter: (key, value) => { saved = { key, value }; }
    }
  });
  const tags = view.getSharedFilterValue('tags');
  tags.push('two');
  assert.equal(view.reportContext.sharedFilters.tags.length, 1);
  view.setSharedFilterValue('tags', tags);
  tags.push('three');
  assert.equal(saved.value.length, 2);
  assert.equal(saved.key, 'tags');
  const selection = { filterKey: 'program_code', options: ['A', 'B'], currentValue: 'A', routeValue: 'A' };
  assert.equal(view.resolveDeferredSelection(selection), 'B');
  view.reportContext.sharedFilters.program_code = 'missing';
  assert.equal(view.resolveDeferredSelection(selection), 'A');
  assert.equal(view.resolveDeferredSelection({ ...selection, routeValue: 'missing', currentValue: 'missing' }), 'A');
});

test('identical dataset requests share in-flight work and return independent cached rows', async () => {
  let resolve, calls = 0;
  const pending = new Promise(yes => { resolve = yes; });
  const context = setup({ bridgetools: { req3: () => { calls++; return pending; } } });
  const view = adapter(context, ['datasets'], { reportContext: { reportName: 'students', subMenu: 'summary' } });
  const a = view.fetchReportDataset({ academic_year: 2026, program_code: 'A' }, { dataset: 'students' });
  const b = view.fetchReportDataset({ program_code: 'A', academic_year: 2026 }, { dataset: 'students' });
  assert.equal(calls, 1);
  resolve([{ id: 'student', nested: { count: 1 } }]);
  const [first, second] = await Promise.all([a, b]);
  first[0].nested.count = 99;
  assert.equal(second[0].nested.count, 1);
  const cached = await view.fetchReportDataset({ academic_year: 2026, program_code: 'A' }, { dataset: 'students' });
  assert.equal(calls, 1);
  assert.equal(cached[0].nested.count, 1);
});

test('failed dataset requests can retry and distinct filters keep distinct cached rows', async () => {
  let calls = 0;
  const context = setup({ bridgetools: { req3: async (report, filters) => {
    if (++calls === 1) throw new Error('temporary failure');
    return [{ program: filters.program_code }];
  } } });
  const view = adapter(context, ['datasets'], { reportContext: { dataset: 'students' } });
  await assert.rejects(view.fetchReportDataset({ program_code: 'A' }), /temporary failure/);
  const first = await view.fetchReportDataset({ program_code: 'A' });
  const second = await view.fetchReportDataset({ program_code: 'B' });
  assert.equal(first[0].program, 'A');
  assert.equal(second[0].program, 'B');
  assert.equal(calls, 3);
});

test('Canvas profile hydration preserves IDs, deduplicates students, and caches names', async () => {
  const requests = [];
  const context = setup({ fetch: async (url, options) => {
    requests.push({ url, options });
    return { ok: true, json: async () => ({ sortable_name: 'Lovelace, Ada' }) };
  } });
  const view = adapter(context, ['canvasProfiles']);
  const rows = [{ canvas_user_id: '123', sis_user_id: 'SIS-1' }, { canvas_user_id: '123', sis_user_id: 'SIS-1' }];
  const hydrated = await view.hydrateSisUserIds(rows, { hydrate_sis_user_id: true });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, '/api/v1/users/123/profile');
  assert.equal(requests[0].options.credentials, 'include');
  assert.equal(hydrated[0].sis_user_id, 'SIS-1');
  assert.equal(hydrated[0].original_sis_user_id, 'SIS-1');
  assert.equal(hydrated[0].first_name, 'Ada');
  assert.equal(hydrated[0].last_name, 'Lovelace');
  assert.equal(rows[0].first_name, undefined);
  await view.hydrateSisUserIds(rows, { hydrate_sis_user_id: true });
  assert.equal(requests.length, 1);
});

test('Canvas profile lookup failures preserve available names and can retry', async () => {
  let calls = 0;
  const context = setup({ fetch: async () => {
    if (++calls === 1) throw new Error('temporary failure');
    return { ok: true, json: async () => ({ first_name: 'Grace', last_name: 'Hopper' }) };
  } });
  const view = adapter(context, ['canvasProfiles']);
  const rows = [{ canvas_user_id: '456', first_name: 'Existing' }];
  const first = await view.hydrateSisUserIds(rows, { hydrate_sis_user_id: true });
  assert.equal(first[0].first_name, 'Existing');
  const second = await view.hydrateSisUserIds(rows, { hydrate_sis_user_id: true });
  assert.equal(second[0].first_name, 'Grace');
  assert.equal(calls, 2);
});

test('evaluation summary and detail score colors retain their distinct boundary rules', () => {
  const context = setup();
  const colors = context.window.ReportUtils.createColors();
  const view = adapter(context, ['evaluationSummary', 'evaluationDetail'], { colors });
  for (const [value, color] of [[0.79, 'red'], [0.8, 'yellow'], [0.9, 'yellow'], [0.9001, 'green'], [NaN, 'gray']]) {
    assert.equal(view.likertPillStyle(value).backgroundColor, colors[color]);
  }
  for (const [value, color] of [[0.499, 'green'], [0.5, 'yellow'], [0.749, 'yellow'], [0.75, 'red']]) {
    assert.equal(view.feedbackRecsPillStyle(value).backgroundColor, colors[color]);
  }
  for (const [value, color] of [[0, 'red'], [0.999, 'red'], [1, 'yellow'], [1.999, 'yellow'], [2, 'green'], [NaN, 'gray']]) {
    assert.equal(view.responseLikertPillStyle(value).backgroundColor, colors[color]);
  }
});

test('evaluation tags sort ties, reject empty counts, and limit summaries without limiting detail filters', () => {
  const context = setup();
  const view = adapter(context, ['formatting', 'evaluationSummary', 'evaluationDetail']);
  const raw = { Zebra: 5, Alpha: '5', Beta: 4, Delta: 3, Empty: 0, Negative: -1, Invalid: 'bad', ' ': 2 };
  assert.deepEqual(Array.from(view.tagNames(raw)), ['Alpha', 'Zebra', 'Beta', 'Delta']);
  const summary = view.normalizeTags(raw, 10);
  assert.deepEqual(Array.from(summary, tag => tag.name), ['Alpha', 'Zebra', 'Beta']);
  assert.equal(summary[0].pct, 0.5);
  assert.equal(view.hasTag(raw, ' Delta '), true);
  assert.equal(view.hasTag(raw, 'Negative'), false);
  assert.equal(Number.isNaN(view.normalizeTags(raw, 0)[0].pct), true);
});

test('top evaluation tags preserve both count and percentage thresholds and escape labels', () => {
  const context = setup();
  const colors = context.window.ReportUtils.createColors();
  const view = adapter(context, ['formatting', 'evaluationSummary'], { colors });
  for (const [pct, count, color] of [[0.2, 4, 'red'], [0.1, 4, 'yellow'], [0.2, 3, 'yellow'], [0.0501, 3, 'yellow'], [0.05, 3, 'green']]) {
    const row = { top_tags: [{ name: '<unsafe>', count, pct }] };
    assert.equal(view.topTagPillStyle(row, 0).backgroundColor, colors[color]);
    assert.match(view.topTagHtml(row, 0), /&lt;unsafe&gt;/);
    assert.equal(view.topTagSortValue(row, 0), count);
  }
  assert.equal(view.topTagPillStyle({}, 0).backgroundColor, colors.gray);
  assert.equal(view.topTagSortValue({}, 0), -1);
});

test('shared names and labels keep the original fallback and escaping policies', () => {
  const context = setup();
  const view = adapter(context, ['students', 'labels', 'formatting']);
  assert.equal(view.getStudentFirstName({ canvas_user_id: '42' }), 'Canvas User 42');
  assert.equal(view.getStudentName({ first_name: ' Ada ', last_name: ' Lovelace ' }), 'Ada Lovelace');
  assert.equal(view.getStudentName({ canvas_user_id: '42', last_name: 'Lovelace' }), 'Canvas User 42 Lovelace');
  assert.equal(view.studentName({ canvas_user_id: '42', last_name: 'Lovelace' }), 'Lovelace');
  assert.equal(view.studentName({ sis_user_id: 'SIS-42' }), 'Canvas User SIS-42');
  assert.equal(view.programName({ program_code: 'ABC' }), 'ABC');
  assert.equal(view.programName({ program_name: '', program_code: 'ABC' }), '(no program)');
  assert.equal(view.courseLabel({ course_code: 'ABC', course_name: 'Course' }), 'ABC - Course');
  assert.equal(view.courseLabel({}), '(no course)');
  assert.equal(view.textOrDash('<unsafe>'), '&lt;unsafe&gt;');
});

test('shared date helpers preserve local date parsing and missing-date sorting', () => {
  const context = setup();
  const view = adapter(context, ['dates']);
  const expected = new Date(2026, 6, 1).getTime();
  assert.equal(view.dateValue('2026-07-01'), expected);
  assert.equal(view.dateValue('2026-07-01T15:00:00Z'), expected);
  assert.equal(view.dateValue('not a date'), null);
  assert.equal(view.dateSort('not a date'), Infinity);
  assert.equal(view.dateText('not a date'), '—');
});

test('CPL completion and outcome metrics retain different thresholds', () => {
  const context = setup();
  const colors = context.window.ReportUtils.createColors();
  const view = adapter(context, ['cplMetrics'], { colors });
  assert.equal(view.completionPillStyle(0.59).backgroundColor, colors.red);
  assert.equal(view.completionPillStyle(0.6).backgroundColor, colors.yellow);
  assert.equal(view.completionPillStyle(0.7).backgroundColor, colors.green);
  assert.equal(view.outcomePillStyle(0.69).backgroundColor, colors.red);
  assert.equal(view.outcomePillStyle(0.7).backgroundColor, colors.yellow);
  assert.equal(view.outcomePillStyle(0.8).backgroundColor, colors.green);
});
