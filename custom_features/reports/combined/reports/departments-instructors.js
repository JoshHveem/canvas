// departments-overview.js
Vue.component('departments-overview', {
  props: {
    account:   { type: [Number, String], required: false, default: '' }, // keep for parity (not used yet)
    year:      { type: [Number, String], required: true },
    anonymous: { type: Boolean, default: false },
    departments: { type: Array, required: true },
    loading:   { type: Boolean, default: false },
    tags: { type: Array, required: false, default: [] }
  },

  data() {
    const colors = (window.bridgetools?.colors) || {
      red:'#b20b0f', orange:'#f59e0b', yellow:'#eab308',
      green:'#16a34a', gray:'#e5e7eb', black:'#111827', white:'#fff'
    };

    const table = new window.ReportTable({
      rows: [],
      columns: [],
      sort_column: "Department",
      sort_dir: 1,
      colors
    });

    return {
      colors,
      table,
      tableTick: 0,
      filters: {
        // you can add dept-level filters later
      }
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'Department', 'Department name.', '16rem', false, 'string',
        d => this.anonymous ? 'DEPARTMENT' : (d?.name ?? ''),
        null,
        d => (d?.name ?? '')
      ),

      // --- Instructor Metrics ---
      new window.ReportColumn(
        'Asgn/Day', 'Assignments per day.', '6rem', false, 'number',
        d => this.numOrNA(d?.instructor_metrics?.assignments_per_day, 2),
        null,
        d => Number(d?.instructor_metrics?.assignments_per_day ?? -1)
      ),
      new window.ReportColumn(
        'Days to Grade', 'Median days to return a grade.', '7rem', false, 'number',
        d => this.numOrNA(d?.instructor_metrics?.days_to_grade, 1),
        d => this.bandDaysToGrade(d?.instructor_metrics?.days_to_grade),
        d => Number(d?.instructor_metrics?.days_to_grade ?? -1)
      ),
      new window.ReportColumn(
        'Stud/Day', 'Estimated students per day (or equivalent) based on credits worth of progress earned / day.', '7rem', false, 'number',
        d => this.numOrNA(d?.instructor_metrics?.full_time_students_per_day, 2),
        null,
        d => Number(d?.instructor_metrics?.full_time_students_per_day ?? -1)
      ),
      new window.ReportColumn(
        'Days to Respond', 'Median days to respond to student messages.', '7rem', false, 'number',
        d => Number(d?.instructor_metrics?.days_to_respond ?? 0),
        null,
        d => Number(d?.instructor_metrics?.days_to_respond ?? -1)
      ),
      new window.ReportColumn(
        'Sub Comments', 'Avg # instructor comments per submission.', '7rem', false, 'number',
        d => Number(d?.instructor_metrics?.comments_per_submission_graded ?? 0),
        null,
        d => Number(d?.instructor_metrics?.comments_per_submission_graded ?? -1)
      ),
      new window.ReportColumn(
        'Attempts', 'Average attempts students need to pass an assignment.', '6rem', false, 'number',
        d => Number(d?.instructor_metrics?.average_attempts ?? 0),
        null,
        d => Number(d?.instructor_metrics?.average_attempts ?? -1)
      ),

      new window.ReportColumn(
        'Rubric Use in Grading', 'Share graded with a rubric.', '6rem', false, 'number',
        d => this.pctText(d?.instructor_metrics?.graded_with_rubric),
        d => this.pctPillStyle(d?.instructor_metrics?.graded_with_rubric),
        d => Number(d?.instructor_metrics?.graded_with_rubric ?? -1)
      ),
    ]);
  },

  computed: {
    visibleRows() {
      // NOTE: departmentsClean should already be year-sliced (course_surveys, instructor_metrics, etc)
      const rows = Array.isArray(this.departments) ? this.departments : [];

      // feed rows into table and return sorted
      this.table.setRows(rows);
      return this.table.getSortedRows();
    }
  },

  methods: {
    getColumnsWidthsString() { return this.table.getColumnsWidthsString(); },
    setSortColumn(name) { this.table.setSortColumn(name); this.tableTick++; },

    // ---------- formatting helpers ----------
    numOrNA(v, decimals = 2) {
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(decimals) : 'n/a';
    },

    pctText(v) {
      const n = Number(v);
      if (!Number.isFinite(n)) return 'n/a';
      return (n * 100).toFixed(1) + '%';
    },

    pctPillStyle(v) {
      const n = Number(v);
      if (!Number.isFinite(n)) return { backgroundColor: this.colors.gray, color: this.colors.black };

      // Basic bands: <80 red, <90 yellow, else green
      const pct = n * 100;
      return {
        backgroundColor: (pct < 80) ? this.colors.red : (pct < 90 ? this.colors.yellow : this.colors.green),
        color: this.colors.white
      };
    },

    bandDaysToGrade(v) {
      const n = Number(v);
      if (!Number.isFinite(n)) return { backgroundColor: this.colors.gray, color: this.colors.black };

      // Goal: <2 days (green), 2–3 (yellow), >3 (red)
      return {
        backgroundColor: (n < 2) ? this.colors.green : (n < 3 ? this.colors.yellow : this.colors.red),
        color: this.colors.white
      };
    }
  },

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
    <!-- Header -->
    <div class="btech-row" style="align-items:center; margin-bottom:8px;">
      <h4 class="btech-card-title" style="margin:0;">Departments</h4>
      <div style="flex:1;"></div>
      <span class="btech-pill" style="margin-left:8px;">Year: {{ year }}</span>
      <span class="btech-pill" style="margin-left:8px;">Rows: {{ visibleRows.length }}</span>
    </div>

    <div v-if="loading" class="btech-muted" style="text-align:center; padding:10px;">
      Loading departments…
    </div>

    <div v-else>
      <!-- Column headers -->
      <div
        style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; user-select:none;"
        :style="{ 'grid-template-columns': getColumnsWidthsString() }"
      >
        <div
          v-for="col in table.getVisibleColumns()"
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
        v-for="(dept, i) in visibleRows"
        :key="dept.deptId || dept.account_id || dept.id || i"
        style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; line-height:1.5rem;"
        :style="{
          'grid-template-columns': getColumnsWidthsString(),
          'background-color': (i % 2) ? 'white' : '#F8F8F8'
        }"
      >
        <div
          v-for="col in table.getVisibleColumns()"
          :key="col.name"
          style="display:inline-block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;"
        >
          <span
            :class="col.style_formula ? 'btech-pill-text' : ''"
            :style="col.get_style(dept)"
            v-html="col.getContent(dept)"
          ></span>
        </div>
      </div>
    </div>
  </div>
`
});
