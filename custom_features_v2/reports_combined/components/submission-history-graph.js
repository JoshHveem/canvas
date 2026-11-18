(function () {
  const DAY_MS = 86400000;

  Vue.component('submission-history-graph', {
    props: {
      history: { type: Object, default: () => ({}) },
      days: { type: Number, default: 30 },
      graphWidth: { type: Number, default: 180 },
      graphHeight: { type: Number, default: 48 },
      expandable: { type: Boolean, default: true },
      ariaLabel: { type: String, default: 'Submission history' }
    },

    data() {
      return { isExpandedOpen: false, selectedRange: '30' };
    },

    beforeDestroy() {
      if (this.$refs.expandedDialog?.open) this.$refs.expandedDialog.close();
    },

    methods: {
      async openExpanded() {
        if (!this.expandable || !this.historyDates.length || this.isExpandedOpen) return;
        this.selectedRange = '30';
        this.isExpandedOpen = true;
        await this.$nextTick();
        if (!this._isDestroyed && this.isExpandedOpen) this.$refs.expandedDialog?.showModal();
      },

      closeExpanded() {
        if (this.$refs.expandedDialog?.open) this.$refs.expandedDialog.close();
        this.isExpandedOpen = false;
      }
    },

    computed: {
      colors() {
        return window.bridgetools?.colors || window.ReportUtils?.createColors?.() || {
          red: '#b20b0f',
          yellow: '#eab308',
          green: '#16a34a',
          gray: '#e5e7eb',
          black: '#111827'
        };
      },

      normalizedDays() {
        return Math.max(1, Math.floor(Number(this.days) || 30));
      },

      normalizedWidth() {
        return Math.max(60, Math.floor(Number(this.graphWidth) || 180));
      },

      normalizedHeight() {
        return Math.max(48, Math.floor(Number(this.graphHeight) || 48));
      },

      historyDates() {
        return Object.keys(this.history || {})
          .filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)
            && Number.isFinite(Date.parse(`${date}T00:00:00Z`))
            && new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) === date)
          .sort();
      },

      latestHistoryDate() {
        return this.historyDates[this.historyDates.length - 1] || '';
      },

      availableDays() {
        if (!this.historyDates.length) return 0;
        return Math.round((Date.parse(`${this.latestHistoryDate}T00:00:00Z`)
          - Date.parse(`${this.historyDates[0]}T00:00:00Z`)) / DAY_MS) + 1;
      },

      expandedDays() {
        return this.selectedRange === 'all' ? this.availableDays : Math.min(Number(this.selectedRange), this.availableDays);
      },

      expandedWidth() {
        return Math.max(720, Math.min(3650, this.expandedDays * 6));
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
        const width = (this.normalizedWidth - 6) / this.normalizedDays;
        const activeIndexes = values
          .map((value, index) => value.count > 0 ? index : -1)
          .filter(index => index >= 0);

        return values.map((value, index) => {
          const height = maxCount ? (value.count / maxCount) * (this.normalizedHeight - 16) : 0;
          const activeIndex = activeIndexes.indexOf(index);
          const nextActivityIndex = activeIndex >= 0 ? activeIndexes[activeIndex + 1] : undefined;
          const referenceDate = nextActivityIndex === undefined
            ? endDate
            : new Date(`${values[nextActivityIndex].date}T00:00:00Z`);
          const gapDays = value.count > 0
            ? Math.round((referenceDate.getTime() - new Date(`${value.date}T00:00:00Z`).getTime()) / DAY_MS)
            : null;
          const color = value.count <= 0
            ? this.colors.gray
            : gapDays >= 10
              ? this.colors.red
              : gapDays >= 7
                ? this.colors.yellow
                : this.colors.green;
          const gapText = value.count <= 0
            ? ''
            : nextActivityIndex === undefined
              ? `${gapDays} ${gapDays === 1 ? 'day' : 'days'} since this submission`
              : `${gapDays} ${gapDays === 1 ? 'day' : 'days'} until the next submission`;
          return {
            ...value,
            x: 3 + (index * width),
            width: Math.max(1, width - 1),
            y: this.normalizedHeight - 10 - height,
            height,
            color,
            title: `${value.date}: ${value.count} ${value.count === 1 ? 'submission' : 'submissions'}${gapText ? `; ${gapText}` : ''}`
          };
        });
      },

      summary() {
        if (!this.bars.length) return 'No submission history is available.';
        const total = this.bars.reduce((sum, bar) => sum + bar.count, 0);
        return `${total} ${total === 1 ? 'submission' : 'submissions'} in the ${this.normalizedDays}-day window ending ${this.latestHistoryDate}.`;
      }
    },

    template: `
      <span style="display:inline-block; line-height:0; vertical-align:middle;">
        <component :is="expandable && bars.length ? 'button' : 'span'" :type="expandable && bars.length ? 'button' : null"
          :title="expandable && bars.length ? summary + ' Click to expand submission history.' : summary"
          :aria-label="ariaLabel + ': ' + summary + (expandable && bars.length ? ' Open expanded history.' : '')"
          :aria-haspopup="expandable && bars.length ? 'dialog' : null"
          :style="{ display: 'inline-block', padding: '0', border: '0', background: 'transparent', lineHeight: '0', color: 'inherit', cursor: expandable && bars.length ? 'pointer' : 'default' }"
          @click.stop="openExpanded">
        <svg v-if="bars.length" :width="normalizedWidth" :height="normalizedHeight" :viewBox="'0 0 ' + normalizedWidth + ' ' + normalizedHeight" role="img" :aria-label="ariaLabel + ': ' + summary">
          <line x1="3" :y1="normalizedHeight - 9.5" :x2="normalizedWidth - 3" :y2="normalizedHeight - 9.5" :stroke="colors.gray" stroke-width="1"></line>
          <rect
            v-for="bar in bars"
            :key="bar.date"
            :x="bar.x"
            :y="bar.y"
            :width="bar.width"
            :height="bar.height"
            rx="1"
            :fill="bar.color"
          ><title>{{ bar.title }}</title></rect>
          <text x="3" :y="normalizedHeight - 1" :fill="colors.black" font-size="8">{{ bars[0].date }}</text>
          <text :x="normalizedWidth - 3" :y="normalizedHeight - 1" :fill="colors.black" font-size="8" text-anchor="end">{{ latestHistoryDate }}</text>
        </svg>
        <span v-else style="line-height:1.2rem;">-</span>
        </component>
        <dialog v-if="isExpandedOpen" ref="expandedDialog" aria-label="Expanded submission history"
          @cancel.prevent="closeExpanded" @close="isExpandedOpen = false" @click.self.stop="closeExpanded"
          style="width:min(960px, calc(100vw - 2rem)); max-width:calc(100vw - 2rem); max-height:85vh; box-sizing:border-box; padding:0; border:1px solid #d1d5db; border-radius:8px; background:#fff; color:#111827; line-height:1.5; box-shadow:0 12px 40px rgba(0,0,0,.35);">
          <div @click.stop style="padding:1.25rem;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:1rem;">
              <h3 style="margin:0; font-size:1.1rem;">Submission History</h3>
              <button type="button" class="Button" autofocus @click.stop="closeExpanded">Close</button>
            </div>
            <label style="display:flex; align-items:center; gap:.5rem; margin-top:1rem;">Show
              <select v-model="selectedRange" style="width:auto; margin:0;">
                <option value="30">30 days</option><option value="90">90 days</option><option value="all">All available</option>
              </select>
            </label>
            <p style="margin:.75rem 0;">Available history: {{ historyDates[0] }} through {{ latestHistoryDate }} ({{ availableDays }} days). Showing {{ expandedDays }} days. Hover over a bar for the date and submission count.</p>
            <div style="overflow-x:auto; max-width:100%;">
              <submission-history-graph :history="history" :days="expandedDays" :graph-width="expandedWidth" :graph-height="220" :expandable="false" :aria-label="ariaLabel"></submission-history-graph>
            </div>
            <p style="margin:.75rem 0 0;">This view uses the history available in the report. Dates before the earliest returned date are unavailable.</p>
          </div>
        </dialog>
      </span>
    `
  });

  window.ReportColumnTypes = window.ReportColumnTypes || {};
  window.ReportColumnTypes.submissionHistory = function (options = {}) {
    const history = typeof options.history === 'function' ? options.history : row => row?.submissions_by_date;
    const days = Number(options.days) || 30;
    const column = new window.ReportColumn(
      options.name || 'Submission History',
      options.description || `Daily submission activity for the last ${days} days. Click to expand the available history, or hover over a bar for its date and submission count.`,
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
      graphWidth: Number(options.graphWidth) || 180,
      ariaLabel: options.ariaLabel || 'Submission history'
    });
    return column;
  };
})();
