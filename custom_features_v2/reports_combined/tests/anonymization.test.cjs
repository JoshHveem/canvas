const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const Vue = require('../../../external-libraries/vue.2.6.12.js');
const root = path.resolve(__dirname, '..');

function setup() {
  const definitions = new Map(), errors = [];
  let requests = 0;
  const context = vm.createContext({
    window: { addEventListener() {}, removeEventListener() {} },
    Vue: { component: (name, definition) => definitions.set(name, definition) },
    console: { warn: (...args) => errors.push(args) },
    bridgetools: { req3: async () => { requests++; return []; } }
  });
  context.window.ReportTable = class {
    constructor(options) { Object.assign(this, options); }
    setColumns(columns) { this.columns = columns; }
    setRows(rows) { this.rows = rows; }
    getSortedRows() { return this.rows || []; }
    getVisibleColumns() { return this.columns || []; }
  };
  context.window.ReportColumn = class {
    constructor(name, description, width, average, sortType, getContent) {
      Object.assign(this, { name, description, width, getContent });
    }
  };
  vm.runInContext(require('./shared-runtime.cjs'), context);
  for (const file of ['report-table-shell.js', 'message-template-menu.js', 'submission-history-graph.js']) {
    vm.runInContext(fs.readFileSync(path.join(root, 'components', file), 'utf8'), context);
  }
  for (const file of fs.readdirSync(path.join(root, 'reports')).filter(file => file.endsWith('.js'))) {
    vm.runInContext(fs.readFileSync(path.join(root, 'reports', file), 'utf8'), context);
  }
  const provider = new Vue({
    data: () => ({ privacy: context.window.ReportUtils.createAnonymizationState() }),
    provide() { return { reportAnonymization: this.privacy }; }
  });
  const mixins = context.window.ReportMixins;
  const view = new Vue({ parent: provider, mixins: [mixins.anonymization, mixins.formatting, mixins.students] });
  return { context, definitions, provider, view, errors, requests: () => requests };
}

async function flush() {
  for (let i = 0; i < 10; i++) await Vue.nextTick();
}

test('name columns get stable, escaped aliases while raw rows and non-name content stay intact', () => {
  const { provider, view } = setup();
  const row = Object.freeze({ first_name: 'Ada', last_name: 'Lovelace', canvas_user_id: '42', score: 88 });
  const first = { name: 'First Name', getContent: row => `<a href="/users/${row.canvas_user_id}">${row.first_name}</a>` };
  const score = { name: 'Score', getContent: row => String(row.score) };
  assert.match(view.displayColumnContent(first, row), />Ada<\/a>/);
  provider.privacy.enabled = true;
  assert.equal(view.displayColumnContent(first, row), 'First Name #1');
  assert.equal(view.displayColumnContent(first, { ...row, first_name: 'Grace' }), 'First Name #2');
  assert.equal(view.displayColumnContent(first, row), 'First Name #1');
  assert.equal(view.displayColumnContent(score, row), '88');
  assert.equal(row.first_name, 'Ada');
  assert.equal(row.canvas_user_id, '42');
  provider.privacy.enabled = false;
  assert.match(view.displayColumnContent(first, row), />Ada<\/a>/);
  provider.privacy.enabled = true;
  assert.equal(view.displayColumnContent(first, row), 'First Name #1');
  assert.equal(view.displayColumnContent({ ...first, name: '<Name>' }, row), '&lt;Name&gt; #1');
  provider.$destroy();
});

test('shared name formatters, composite names, and embedded _name fields are masked', () => {
  const { provider, view } = setup();
  provider.privacy.enabled = true;
  const student = { name: 'Student', getContent: row => view.studentName(row) };
  assert.equal(view.displayColumnContent(student, { first_name: 'Ada', last_name: 'Lovelace' }), 'Student #1');
  assert.equal(view.displayColumnContent(student, { first_name: 'Grace', last_name: 'Hopper' }), 'Student #2');
  for (const field of ['department_name', 'course_name', 'full_name__instructor', 'upcoming_course_name', 'academic_standing_name']) {
    assert.equal(view.displayColumnContent({ name: 'Label', getContent: row => row[field] }, { [field]: 'Sensitive Name' }), 'Label #1');
  }
  provider.$destroy();
});

test('filter labels share aliases with columns but retain real selection values and All choices', () => {
  const { provider, view } = setup();
  const option = Object.freeze({ value: 'D1', label: 'Nursing' });
  provider.privacy.enabled = true;
  assert.equal(view.displayFilterOption(option, 'department_name', 'Department'), 'Department #1');
  const column = { name: 'Department', getContent: row => row.department_name };
  assert.equal(view.displayColumnContent(column, { department_name: 'Nursing' }), 'Department #1');
  assert.equal(view.displayFilterOption({ value: '', label: 'All' }, 'department_name', 'Department'), 'All');
  assert.equal(option.value, 'D1');
  assert.equal(option.label, 'Nursing');
  provider.privacy.enabled = false;
  assert.equal(view.displayFilterOption(option, 'department_name', 'Department'), 'Nursing');
  provider.$destroy();
});

test('all report tabs inherit the reactive toggle without reloading datasets', async () => {
  const { provider, context, definitions, requests, errors } = setup();
  const views = [];
  for (const [name, definition] of definitions) {
    if (!name.startsWith('reports-')) continue;
    views.push(new Vue({
      ...definition,
      parent: provider,
      created: [],
      mounted: [],
      propsData: { reportContext: { dataset: 'test', filters: {}, sharedFilters: {} } }
    }));
  }
  assert.equal(views.length, 24);
  await flush();
  const before = requests();
  for (const view of views) assert.equal(view.isAnonymized, false);
  provider.privacy.enabled = true;
  await flush();
  for (const view of views) assert.equal(view.isAnonymized, true);
  provider.privacy.enabled = false;
  await flush();
  assert.equal(requests(), before);
  assert.equal(errors.length, 0);
  for (const view of views) view.$destroy();
  provider.$destroy();
});

test('real report columns and report subtitles mask names and restore them on toggle', async () => {
  const { provider, definitions } = setup();
  const view = new Vue({
    ...definitions.get('reports-students-at-a-glance'), parent: provider,
    propsData: { reportContext: {} }
  });
  view.departmentOptions = [{ value: 'D1', label: 'Nursing' }];
  view.selectedDepartmentCode = 'D1';
  await flush();
  const shell = new Vue({ ...definitions.get('report-table-shell'), parent: view, propsData: { table: view.table } });
  const first = view.table.columns.find(column => column.name === 'First Name');
  const last = view.table.columns.find(column => column.name === 'Last Name');
  const course = view.table.columns.find(column => column.name === 'Next Course to Exit');
  const row = { first_name: 'Ada', last_name: 'Lovelace', upcoming_course_name: 'Nursing 101' };
  assert.equal(view.titleText, 'Nursing - At a Glance');
  provider.privacy.enabled = true;
  assert.equal(shell.displayColumnContent(first, row), 'First Name #1');
  assert.equal(shell.displayColumnContent(last, row), 'Last Name #1');
  assert.equal(shell.displayColumnContent(course, row), 'Next Course to Exit #1');
  assert.equal(view.titleText, 'Department #1 - At a Glance');
  provider.privacy.enabled = false;
  assert.equal(shell.displayColumnContent(last, row), 'Lovelace');
  assert.equal(view.titleText, 'Nursing - At a Glance');
  shell.$destroy(); view.$destroy(); provider.$destroy();
});
