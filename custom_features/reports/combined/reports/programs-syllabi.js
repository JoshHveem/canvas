// departments-syllabi-overview.js
Vue.component('reports-programs-syllabi', {
  props: {
    year: { type: [Number, String], required: true },
    anonymous: { type: Boolean, default: false },
    programs: { type: Array, required: true },
    loading: { type: Boolean, default: false },
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
        // optional later
      }
    };
  },

  created() {
    console.log(this.programs);
    this.table.setColumns([
      new window.ReportColumn(
        'Department', 'Department name.', '16rem', false, 'string',
        d => this.anonymous ? 'DEPARTMENT' : (d?.name ?? ''),
        null,
        d => (d?.name ?? '')
      ),

      new window.ReportColumn(
        'Published Courses', 'Count: is_published_course = true.', '7rem', false, 'number',
        d => String(this.publishedCount(d)),
        null,
        d => this.publishedCount(d)
      ),

      new window.ReportColumn(
        'Syllabi', 'Total syllabi rows provided.', '6rem', false, 'number',
        d => String(this.syllabiTotal(d)),
        null,
        d => this.syllabiTotal(d)
      ),

      new window.ReportColumn(
        'Needs Submission', 'Count: not submitted AND not approved.', '7rem', false, 'number',
        d => String(this.needsSubmission(d)),
        d => this.countPillStyle(this.needsSubmission(d)),
        d => this.needsSubmission(d)
      ),

      new window.ReportColumn(
        'Needs Approval', 'Count: submitted AND not approved.', '7rem', false, 'number',
        d => String(this.needsApproval(d)),
        d => this.countPillStyle(this.needsApproval(d)),
        d => this.needsApproval(d)
      ),

      new window.ReportColumn(
        'Completed', 'Count: is_submitted AND is_approved.', '7rem', false, 'number',
        d => String(this.completedCount(d)),
        d => this.countPillStyle(this.syllabiTotal(d) - this.completedCount(d)), // highlight remaining
        d => this.completedCount(d)
      ),

      new window.ReportColumn(
        '% Completed',
        'completed / total',
        '8rem',
        false,
        'number',
        d => this.pctText(this.pctCompleted(d)),
        d => this.pctPillStyle(this.pctCompleted(d)),
        d => this.pctCompleted(d)
      ),
      ]);
    },

  computed: {
    visibleRows() {
      const rows = Array.isArray(this.programs) ? this.programs : [];
      this.table.setRows(rows);
      return this.table.getSortedRows();
    }
  },

  methods: {
  getColumnsWidthsString() { return this.table.getColumnsWidthsString(); },
  setSortColumn(name) { this.table.setSortColumn(name); this.tableTick++; },

  // ----- rollup reader -----
  getProgramRollup(p) {
    const r = p?.syllabi; // your rollup object
    if (!r || typeof r !== 'object') {
      return {
        total: 0,
        needs_submission: 0,
        needs_approval: 0,
        completed: 0,
        pct_completed: NaN,
        syllabi: []
      };
    }
    // ensure syllabi is always an array
    if (!Array.isArray(r.syllabi)) r.syllabi = [];
    return r;
  },

  syllabiTotal(p) {
    return Number(this.getProgramRollup(p).total) || 0;
  },

  needsSubmission(p) {
    return Number(this.getProgramRollup(p).needs_submission) || 0;
  },

  needsApproval(p) {
    return Number(this.getProgramRollup(p).needs_approval) || 0;
  },

  completedCount(p) {
    return Number(this.getProgramRollup(p).completed) || 0;
  },

  pctCompleted(p) {
    const n = Number(this.getProgramRollup(p).pct_completed);
    return Number.isFinite(n) ? n : NaN;
  },

  // ----- optional: keep Published Courses column using rollup.syllabi -----
  publishedCount(p) {
    const syls = this.getProgramRollup(p).syllabi;
    let n = 0;
    for (const s of syls) {
      if (s?.is_published_course === true) n++;
    }
    return n;
  },

  // ---------- formatting ----------
  pctText(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 'n/a';
    return (n * 100).toFixed(1) + '%';
  },

  pctPillStyle(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return { backgroundColor: this.colors.gray, color: this.colors.black };

    const pct = n * 100;
    return {
      backgroundColor: (pct < 80) ? this.colors.red : (pct < 90 ? this.colors.yellow : this.colors.green),
      color: this.colors.white
    };
  },

  countPillStyle(count) {
    const n = Number(count);
    if (!Number.isFinite(n)) return { backgroundColor: this.colors.gray, color: this.colors.black };
    return {
      backgroundColor: (n <= 0) ? this.colors.green : (n <= 5 ? this.colors.yellow : this.colors.red),
      color: this.colors.white
    };
  },
},

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
    <div class="btech-row" style="align-items:center; margin-bottom:8px;">
      <h4 class="btech-card-title" style="margin:0;">Departments — Syllabi</h4>
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
