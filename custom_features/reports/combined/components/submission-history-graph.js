(function () {
  const DAY_MS = 86400000;

  Vue.component('submission-history-graph', {
    props: {
      history: { type: Object, default: () => ({}) },
      days: { type: Number, default: 30 },
      ariaLabel: { type: String, default: 'Submission history' }
    },

    computed: {
      normalizedDays() {
        return Math.max(1, Math.floor(Number(this.days) || 30));
      },

      latestHistoryDate() {
        return Object.keys(this.history || {})
          .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date))
          .sort()
          .pop() || '';
      },

      bars() {
        if (!this.latestHistoryDate) return [];

        const endDate = new Date(`${this.latestHistoryDate}T00:00:00Z`);
        if (!Number.isFinite(endDate.getTime())) return [];

        const values = [];
        for (let offset = this.normalizedDays - 1; offset >= 0; offset -= 1) {
          const date = new Date(endDate.getTime() - (offset * DAY_MS)).toISOString().slice(0, 10);
          const count = Math.max(0, Number(this.history?.[date]) || 0);
          values.push({ date, count });
        }

        const maxCount = Math.max(...values.map(value => value.count), 0);
        const width = 174 / this.normalizedDays;
        return values.map((value, index) => {
          const height = maxCount ? (value.count / maxCount) * 32 : 0;
          return {
            ...value,
            x: 3 + (index * width),
            width: Math.max(1, width - 1),
            y: 38 - height,
            height,
            title: `${value.date}: ${value.count} ${value.count === 1 ? 'submission' : 'submissions'}`
          };
        });
      },

      summary() {
        if (!this.bars.length) return 'No submission history is available.';
        const total = this.bars.reduce((sum, bar) => sum + bar.count, 0);
        return `${total} ${total === 1 ? 'submission' : 'submissions'} in the last ${this.normalizedDays} days.`;
      }
    },

    template: `
      <span :title="summary" :aria-label="ariaLabel + ': ' + summary" style="display:inline-block; line-height:0; vertical-align:middle;">
        <svg v-if="bars.length" width="180" height="48" viewBox="0 0 180 48" role="img" :aria-label="ariaLabel + ': ' + summary">
          <line x1="3" y1="38.5" x2="177" y2="38.5" stroke="#cbd5e1" stroke-width="1"></line>
          <rect
            v-for="bar in bars"
            :key="bar.date"
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="bar.height"
            rx="1"
            fill="#1f7a4d"
          ><title>{{ bar.title }}</title></rect>
          <text x="3" y="47" fill="#64748b" font-size="8">30d ago</text>
          <text x="177" y="47" fill="#64748b" font-size="8" text-anchor="end">Today</text>
        </svg>
        <span v-else style="line-height:1.2rem;">-</span>
      </span>
    `
  });

  window.ReportColumnTypes = window.ReportColumnTypes || {};
  window.ReportColumnTypes.submissionHistory = function (options = {}) {
    const history = typeof options.history === 'function' ? options.history : row => row?.submissions_by_date;
    const days = Number(options.days) || 30;
    const column = new window.ReportColumn(
      options.name || 'Submission History',
      options.description || `Daily submission activity for the last ${days} days. Hover over a bar for its date and submission count.`,
      options.width || '13rem',
      false,
      'number',
      () => '',
      null,
      typeof options.sortValue === 'function'
        ? options.sortValue
        : row => Object.values(history(row) || {}).reduce((sum, count) => sum + (Number(count) || 0), 0)
    );

    column.cellComponent = 'submission-history-graph';
    column.cellProps = row => ({
      history: history(row),
      days,
      ariaLabel: options.ariaLabel || 'Submission history'
    });
    return column;
  };
})();
