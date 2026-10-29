const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const repository = path.resolve(__dirname, '../../..');
for (const folder of ['custom_features/reports/combined', 'custom_features_v2/reports_combined']) {
  function setup(fetch) {
    let definition;
    const context = vm.createContext({
      window: { ENV: { current_user_id: 456 } },
      Vue: { component: (_name, options) => { definition = options; } },
      console: { warn() {} }, URLSearchParams, fetch
    });
    vm.runInContext(fs.readFileSync(path.join(repository, folder, 'components/report-mixins.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(repository, folder, 'reports/students-at-a-glance.js'), 'utf8'), context);
    const mixins = context.window.ReportMixins;
    return Object.assign({}, mixins.anonymization?.methods, (mixins.canvasProfiles || mixins.formatting).methods, mixins.formatting.methods, definition.methods);
  }

  test(`${folder}: Canvas profiles populate every Jotform parameter and are cached`, async () => {
    const requests = [];
    const view = setup(async (url, options) => {
      requests.push(url);
      assert.equal(options.credentials, 'include');
      return { ok: true, json: async () => url.includes('/self/')
        ? { id: 456, primary_email: 'teacher+test@btech.edu', name: 'An Instructor' }
        : { id: 123, primary_email: 'student+test@example.com', sortable_name: "O'Neil & Sons, Ana María", sis_user_id: '001234' }
      };
    });
    const original = { canvas_user_id: '123', sis_user_id: '1234', academic_standing_code__expected: 'w1' };
    const hydrated = await view.hydrateSisUserIds([original], { hydrate_sis_user_id: true });
    const [row] = await view.hydrateStandingFormData(hydrated);
    const url = new URL(view.pendingStandingFormUrl(row));
    assert.equal(url.origin + url.pathname, 'https://btech.jotform.com/262353898849983');
    assert.deepEqual(Object.fromEntries(url.searchParams), {
      canvas_user_id__student: '123', canvas_user_id__instructor: '456',
      academic_standing_code__recommended: 'w1', email__student: 'student+test@example.com',
      'name__student[first]': 'Ana María', 'name__student[last]': "O'Neil & Sons",
      sis_user_id: '001234', email__instructor: 'teacher+test@btech.edu', sanction_type: 'Written Warning'
    });
    assert.match(view.academicStandingHtml(row), /target="_blank"/);
    assert.doesNotMatch(view.academicStandingHtml(row), /\bdownload\b|\.pdf/);
    assert.equal(original.sis_user_id, '1234');
    await view.hydrateStandingFormData(hydrated);
    assert.equal(requests.length, 2);
  });

  test(`${folder}: sanction prefixes are case insensitive and only pending forms link`, () => {
    const view = setup();
    for (const [code, sanction] of [['W1', 'Written Warning'], ['w2', 'Written Warning'], ['P1', 'Probation'], ['p2', 'Probation'], [' p1 ', 'Probation']]) {
      assert.equal(new URL(view.pendingStandingFormUrl({ academic_standing_code__expected: code })).searchParams.get('sanction_type'), sanction);
    }
    assert.equal(view.pendingStandingFormUrl({ academic_standing_code: 'P1', academic_standing_code__expected: 'P1' }), '');
    assert.equal(view.pendingStandingFormUrl({ academic_standing_code__expected: 'X1' }), '');
    assert.equal(view.pendingStandingFormUrl({}), '');
  });

  test(`${folder}: refreshes a names-only cache and preserves SIS ID if Canvas omits it`, async () => {
    const view = setup(async url => ({ ok: true, json: async () => ({ id: url.includes('/self/') ? 456 : 123, name: 'A Person', primary_email: 'person@example.com' }) }));
    view.getCanvasUserNameCache()['123'] = { first_name: 'A', last_name: 'Person' };
    const [row] = await view.hydrateStandingFormData([{ canvas_user_id: '123', sis_user_id: '001234', academic_standing_code__expected: 'P2' }]);
    assert.equal(row.email__student, 'person@example.com');
    assert.equal(view.getStudentSisId(row), '001234');
  });

  test(`${folder}: failed profiles preserve report rows and never guess emails`, async () => {
    const view = setup(async () => ({ ok: false, status: 403 }));
    const [row] = await view.hydrateStandingFormData([{ canvas_user_id: '123', sis_user_id: '001234', academic_standing_code__expected: 'P2' }]);
    const params = new URL(view.pendingStandingFormUrl(row)).searchParams;
    assert.equal(params.get('email__student'), '');
    assert.equal(params.get('email__instructor'), '');
    assert.equal(params.get('canvas_user_id__instructor'), '456');
    assert.equal(params.get('sis_user_id'), '001234');
  });
}
