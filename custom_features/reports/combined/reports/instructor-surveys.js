Vue.component('reports-instructor-surveys', {
  props: {
    instructors: { type: Array, required: true, default: () => [] },
    title: { type: String, default: 'Instructors' },
    year:  { type: [String, Number], default: null },
    filters: {
      type: Object,
      default: () => ({
        year_only: true,
        div_code: null
      })
    },
    goals: {
      type: Object,
      default: () => ({
        attempts_lt: 1.1,
        grade_days_lt: 2,
        comments_gte: 1,
        reply_days_lt: 2,
        rubric_pct_gte: .90
      })
    }
  },

  data() {
    const colors = window.bridgetools?.colors || {
      red:'#b20b0f', orange:'#f59e0b', yellow:'#eab308',
      green:'#16a34a', gray:'#e5e7eb', black:'#111827', white:'#fff'
    };

    const tableDefault = new window.ReportTable({
      rows: [],
      columns: [],
      sort_column: "Name",
      sort_dir: 1,
      colors
    });
    const tableSummaries = new window.ReportTable({
      rows: [],
      columns: [],
      sort_column: "Name",
      sort_dir: 1,
      colors
    });

    // formatting helpers (component-level because they use goals/tolerances)
    const pct01 = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? (n * 100).toFixed(0) + '%' : '—';
    };

    const band = (n, goal, goodIfGte = false) => {
      const v = Number(n);
      if (!Number.isFinite(v)) return { backgroundColor: colors.gray, color: colors.black };

      const warn1 = 0.9;
      const warn2 = 0.75;

      let color = colors.red;

      if (goodIfGte) {
        if (v >= goal) color = colors.green;
        else if (v >= goal * warn1) color = colors.yellow;
        else if (v >= goal * warn2) color = colors.orange;
      } else {
        if (v < goal) color = colors.green;
        else if (v < goal / warn1) color = colors.yellow;
        else if (v < goal / warn2) color = colors.orange;
      }

      return { backgroundColor: color, color: colors.white };
    };

    return {
      colors,
      tableDefault,
      tableSummaries,
      tableTick: 0, // helps Vue 2 notice sort changes on class instances
      showSummaries: false,
      pct01,
      band
    };
  },

  created() {
    // Build columns once. Anything that needs `this` can use arrow fns.
    const colsDefault = [
      new window.ReportColumn(
        'Name', 'Instructor name', '20rem', false, 'string',
        i => ((i?.first_name || '') + ' ' + (i?.last_name || '')).trim() || `User ${i?.canvas_user_id || ''}`,
        null,
        i => ((i?.last_name || '') + ' ' + (i?.first_name || '')).toUpperCase()
      ),

      new window.ReportColumn(
        'Subs', 'Total number of surveys submitted for this instructor.', '4rem', false, 'number',
        i => i?.surveys?.num_surveys ?? 0,
        null,
        i => Number(i?.surveys?.num_surveys ?? 0)
      ),

      // Likerts
      this.makeLikertColumn('Available', 'Availability'),
      this.makeLikertColumn('Clarity', 'Clarity'),
      this.makeLikertColumn('Relevance', 'Industry Focused'),
      this.makeLikertColumn('Respect', 'Respectful'),
      this.makeLikertColumn('Meeting', 'Regular Progress Meetings'),
      this.makeLikertColumn('Grading', 'Timely Grading'),
      this.makeLikertColumn('Feedback', 'Provided Feedback'),
      this.makeLikertColumn('Organized', 'Organized'),

      // Recommendations (your example already used ReportColumn but had wrong args order)
      new window.ReportColumn(
        'Improve?',
        'What percentage of free response questions brought up areas to improve.',
        '7rem',
        true,          // average (not used, but keep consistent)
        'number',
        i => this.table.pctText(i?.surveys?.has_recommendations),
        i => this.table.bandBgInv(i?.surveys?.has_recommendations),
        i => Number(i?.surveys?.has_recommendations ?? NaN)
      ),

      new window.ReportColumn(
        'Summary - Condensed',
        'Summary of free responses.',
        '10rem',
        false,
        'string',
        i => i?.surveys?.ai_summary ?? (i?.surveys?.summary_recommendations ?? ''),
        null,
        i => (i?.surveys?.ai_summary ?? (i?.surveys?.summary_recommendations ?? '')).toUpperCase()
      ),
    ];

    this.tableDefault.setColumns(colsDefault);

    const colsSummaries = [
      new window.ReportColumn(
        'Name', 'Instructor name', '20rem', false, 'string',
        i => ((i?.first_name || '') + ' ' + (i?.last_name || '')).trim() || `User ${i?.canvas_user_id || ''}`,
        null,
        i => ((i?.last_name || '') + ' ' + (i?.first_name || '')).toUpperCase()
      ),

      new window.ReportColumn(
        'Subs', 'Total number of surveys submitted for this instructor.', '4rem', false, 'number',
        i => i?.surveys?.num_surveys ?? 0,
        null,
        i => Number(i?.surveys?.num_surveys ?? 0)
      ),

      // Recommendations (your example already used ReportColumn but had wrong args order)
      new window.ReportColumn(
        'Improve?',
        'What percentage of free response questions brought up areas to improve.',
        '7rem',
        true,          // average (not used, but keep consistent)
        'number',
        i => this.table.pctText(i?.surveys?.has_recommendations),
        i => this.table.bandBgInv(i?.surveys?.has_recommendations),
        i => Number(i?.surveys?.has_recommendations ?? NaN)
      ),

      new window.ReportColumn(
        'Summary',
        'Summary of free responses.',
        '35rem',
        false,
        'string',
        i => i?.surveys?.ai_summary ?? (i?.surveys?.summary_recommendations ?? ''),
        null,
        i => (i?.surveys?.ai_summary ?? (i?.surveys?.summary_recommendations ?? '')).toUpperCase()
      ),
    ];

    this.tableSummaries.setColumns(colsSummaries);
  },

  computed: {
    table() {
      void this.tableTick; // keeps Vue refreshing if needed
      return this.showSummaries ? this.tableSummaries: this.tableDefault;
    },
    visibleColumns() {
      // touch tableTick so Vue re-renders when sorting changes
      void this.tableTick;
      return this.table.getVisibleColumns();
    },

    visibleRows() {
      void this.tableTick;

      let rows = Array.isArray(this.instructors) ? this.instructors.slice() : [];

      if (this.filters.year_only && this.year != null) {
        rows = rows.filter(r => String(r?.academic_year ?? '') === String(this.year));
      }
      if (this.filters.div_code) {
        rows = rows.filter(r => String(r?.div_code ?? '') === String(this.filters.div_code));
      }

      rows = rows.filter(r => Number(r?.surveys?.num_surveys ?? 0) > 0);

      this.table.setRows(rows);
      return this.table.getSortedRows();
    }
  },

  methods: {
    cellStyle(col) {
      // Default view: keep table compact (no wrapping, ellipsis)
      const base = {
        display: 'inline-block',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        verticalAlign: 'top'
      };

      if (this.showSummaries) {
        // Summary mode: allow wrapping (especially for AI Summary)
        return Object.assign({}, base, { whiteSpace: 'normal' });
      }

      // Default mode: do NOT wrap
      return Object.assign({}, base, { whiteSpace: 'nowrap' });
    },
    toggleSummaries() {
      this.showSummaries = !this.showSummaries;
      this.tableTick++; // nudge
    },
    makeLikertColumn(label, likertName, width = '5rem') {
      return new window.ReportColumn(
        label,
        `Likert score for ${label}`,
        width,
        true,
        'number',
        i => {
          const score = this.getLikertScore(i, likertName);
          if (score == null) return '—';
          return this.pct01(score);
        },
        i => {
          const score = this.getLikertScore(i, likertName);
          if (score == null) return { backgroundColor: this.colors.gray, color: this.colors.black };
          return this.band(score, 0.9, true);
        },
        i => {
          const score = this.getLikertScore(i, likertName);
          const n = Number(score);
          return Number.isFinite(n) ? n : Number.NaN;
        }
      );
    },

    getLikertScore(inst, likertName) {
      const arr = inst?.surveys?.likerts ?? [];
      if (!Array.isArray(arr)) return null;
      const match = arr.find(item => item?.name === likertName);
      return match?.score ?? null;
    },

    onSelect(inst) {
      this.$emit('select', inst);
    },

    getColumnsWidthsString() {
      return this.table.getColumnsWidthsString();
    },

    setSortColumn(name) { 
      this.tableDefault.setSortColumn(name); 
      this.tableSummaries.setSortColumn(name); 
      this.tableTick++; 
    },

    headerRowStyle() {
      return {
        display: 'grid',
        alignItems: 'center',
        fontSize: '.75rem',
        userSelect: 'none',
        gridTemplateColumns: this.getColumnsWidthsString(),
        padding: '.25rem .5rem'
      };
    },

    rowStyle(i) {
      return {
        display: 'grid',
        alignItems: 'center',
        fontSize: '.75rem',
        lineHeight: '1.5rem',
        gridTemplateColumns: this.getColumnsWidthsString(),
        padding: '.25rem .5rem',
        backgroundColor: (i % 2) ? '#FFFFFF' : '#F8F8F8'
      };
    }
  },

  template: `
    <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
      <!-- Header -->
      <div class="btech-row" style="align-items:center; margin-bottom:8px;">
        <h4 class="btech-card-title" style="margin:0;">{{ title }}</h4>
        <div style="flex:1;"></div>
        <span class="btech-pill" style="margin-left:8px; cursor:pointer;" @click="toggleSummaries">
          {{ showSummaries ? 'Hide Summaries' : 'Show Summaries' }}
        </span>
      </div>

      <!-- Column headers -->
      <div :style="headerRowStyle()">
        <div
          v-for="col in visibleColumns"
          :key="col.name"
          :title="col.description"
          style="display:inline-block; cursor:pointer;"
          @click="setSortColumn(col.name)"
        >
          <span><b>{{ col.name }}</b></span>
          <span style="margin-left:.25rem;">
            <svg style="width:.75rem;height:.75rem;" viewBox="0 0 490 490" aria-hidden="true">
              <g>
                <polygon :style="{ fill: col.sort_state < 0 ? '#000' : '#E0E0E0' }"
                  points="85.877,154.014 85.877,428.309 131.706,428.309 131.706,154.014 180.497,221.213 217.584,194.27 108.792,44.46 0,194.27 37.087,221.213"/>
                <polygon :style="{ fill: col.sort_state > 0 ? '#000' : '#E0E0E0' }"
                  points="404.13,335.988 404.13,61.691 358.301,61.691 358.301,335.99 309.503,268.787 272.416,295.73 381.216,445.54 490,295.715 452.913,268.802"/>
              </g>
            </svg>
          </span>
        </div>
      </div>

      <!-- Rows -->
      <div
        v-for="(inst, i) in visibleRows"
        :key="(inst.canvas_user_id || 'u') + '-' + i"
        :style="rowStyle(i)"
        style="cursor:pointer;"
        @click="onSelect(inst)"
      >
      <div v-for="col in visibleColumns"
        :key="col.name"
        :style="cellStyle(col)">
          <span v-if="col.name === 'Name'">
            <a :href="'/users/' + (inst.canvas_user_id || '')" target="_blank" @click.stop>
              {{ col.getContent(inst) }}
            </a>
          </span>

          <span
            v-else
            :class="col.style_formula ? 'btech-pill-text' : ''"
            :style="col.get_style(inst)"
            v-html="col.getContent(inst)"
          ></span>
        </div>
      </div>
    </div>
  `
});
