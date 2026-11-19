const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const Vue = require('../../../external-libraries/vue.2.6.12.js');

let definition;
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../components/submission-history-graph.js'), 'utf8'), {
  window: {}, Vue: { component: (_name, options) => { definition = options; } }
});

function graph(props = {}) {
  return new Vue({ ...definition, propsData: props });
}

function history(days) {
  return Object.fromEntries(Array.from({ length: days }, (_, index) => [
    new Date(Date.UTC(2026, 0, 1 + index)).toISOString().slice(0, 10), 1
  ]));
}

test('expanded ranges show 30 or 90 days even when more history is returned', () => {
  const compact = graph({ history: history(120), days: 14, graphWidth: 150 });
  try {
    assert.equal(compact.bars.length, 14);
    assert.equal(compact.availableDays, 120);
    for (const [range, days] of [['30', 30], ['90', 90]]) {
      compact.selectedRange = range;
      const expanded = graph({ history: compact.history, days: compact.expandedDays,
        graphWidth: compact.expandedWidth, graphHeight: 220, expandable: false });
      try {
        assert.equal(expanded.bars.length, days);
        assert.equal(expanded.bars.reduce((total, bar) => total + bar.count, 0), days);
        assert.equal(expanded.bars[days - 1].date, compact.latestHistoryDate);
        assert.ok(expanded.bars.every(bar => bar.x + bar.width <= expanded.normalizedWidth - 3));
        assert.equal(expanded.bars[0].height, 204);
        assert.equal(expanded.bars[0].y, 6);
      } finally { expanded.$destroy(); }
    }
  } finally { compact.$destroy(); }
});

test('short history limits expansion and invalid dates cannot extend the available range', () => {
  const view = graph({ history: { ...history(14), 'not-a-date': 2, '2026-02-30': 5, '9999-99-99': 9 } });
  try {
    assert.equal(view.availableDays, 14);
    for (const range of ['30', '90']) {
      view.selectedRange = range;
      assert.equal(view.expandedDays, 14);
    }
    assert.equal(view.latestHistoryDate, '2026-01-14');
    assert.equal(view.historyDates.length, 14);
  } finally { view.$destroy(); }
});

test('opening and closing expansion uses a single native modal and resets the range', async () => {
  const view = graph({ history: history(100) });
  let opened = 0, closed = 0;
  const dialog = {
    open: false,
    showModal() { this.open = true; opened++; },
    close() { this.open = false; closed++; }
  };
  view.$refs.expandedDialog = dialog;
  try {
    view.selectedRange = '90';
    await view.openExpanded();
    assert.equal(view.isExpandedOpen, true);
    assert.equal(view.selectedRange, '30');
    await view.openExpanded();
    assert.equal(opened, 1);
    view.closeExpanded();
    assert.equal(closed, 1);
    assert.equal(view.isExpandedOpen, false);
    await view.openExpanded();
    view.$destroy();
    assert.equal(closed, 2);
  } finally { if (!view._isDestroyed) view.$destroy(); }
});

test('empty charts and charts already inside the popup do not open another popup', async () => {
  for (const props of [{ history: {} }, { history: history(30), expandable: false }]) {
    const view = graph(props);
    try {
      await view.openExpanded();
      assert.equal(view.isExpandedOpen, false);
    } finally { view.$destroy(); }
  }
});
