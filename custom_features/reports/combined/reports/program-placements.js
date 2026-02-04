// program-placements.js (slim, no what-if, 3 groups)
Vue.component('reports-program-placements', {
  props: {
    year: { type: [Number, String], required: true },
    anonymous: { type: Boolean, default: false },
    students: { type: Array, default: () => ([]) },
    loading: { type: Boolean, default: false }
  },

  data() {
    const colors = window.COMPLETION.getColors(); // reuse palette helper
    const makeTable = (sort_column, sort_dir = 1) =>
      new window.ReportTable({ rows: [], columns: [], sort_column, sort_dir, colors });

    return {
      colors,

      tableAction: makeTable("Action", 1),
      tablePlaced: makeTable("Student", 1),
      tableExcused: makeTable("Excused", 1),

      tickAction: 0,
      tickPlaced: 0,
      tickExcused: 0
    };
  },

  created() {
    // Action Needed (top)
    this.tableAction.setColumns([
      this.makeStatusColumn('action'),
      this.makeStudentColumn(),
      this.makeEndColumn('actual', 'Exited', 'Projected exit date (server-calculated).'),
    ]);

    // Placed (middle)
    this.tablePlaced.setColumns([
      this.makeStatusColumn('placed'),
      this.makeStudentColumn(),
      this.makeEndColumn('actual', 'Exited', 'Actual exit date (exit_date).'),
    ]);

    // Excused (bottom)
    this.tableExcused.setColumns([
      this.makeStatusColumn('excused'),
      this.makeStudentColumn(),
      this.makeEndColumn('actual', 'Exited', 'Actual exit date (exit_date).'),
      this.makeExcusedColumn()
    ]);
  },

  computed: {
    y() { return Number(this.year) || null; },
    studentsClean() { return Array.isArray(this.students) ? this.students : []; },

    // whether projected_exit_date places them in the chosen academic year
    // AY ends June 30 of (year+1). Start is July 1 of year.
    isInAcademicYear() {
      const y = this.y;
      if (!y) return (_s) => false;
      const start = new Date(Date.UTC(y, 6, 1));       // July 1, y
      const end = new Date(Date.UTC(y + 1, 6, 1));     // July 1, y+1 (exclusive)
      return (s) => {
        const d = this.projectedEndDate(s);
        if (!d) return false;
        const t = d.getTime();
        return t >= start.getTime() && t < end.getTime();
      };
    },

    includedStudents() {
      const inYear = this.isInAcademicYear;
      return this.studentsClean.filter(s => {
        if (!s) return false;
        return (
          !!s.is_completer ||
          !!s.is_placement ||
          !!s.excused_status ||
          inYear(s)
        );
      });
    },

    groupActionNeeded() {
      // yellow blocks in the bar == “eligible but not placed”
      return this.eligibleNotPlaced;
    },
    groupPlaced() {
      return this.includedStudents.filter(s => !!s.is_placement);
    },

    groupExcused() {
      return this.includedStudents.filter(s => !!s.excused_status && !s.is_placement);
    },

    visibleActionRows() {
      const rows = this.groupActionNeeded.slice().sort((a, b) => {
        const da = this.projectedEndDate(a)?.getTime() ?? Infinity;
        const db = this.projectedEndDate(b)?.getTime() ?? Infinity;
        if (da !== db) return da - db;
        return this.safeName(a).localeCompare(this.safeName(b));
      });
      this.tableAction.setRows(rows);
      return this.tableAction.getSortedRows();
    },

    visiblePlacedRows() {
      const rows = this.groupPlaced.slice().sort((a, b) => {
        const da = this.actualEndDate(a)?.getTime() ?? -Infinity;
        const db = this.actualEndDate(b)?.getTime() ?? -Infinity;
        if (da !== db) return db - da;
        return this.safeName(a).localeCompare(this.safeName(b));
      });
      this.tablePlaced.setRows(rows);
      return this.tablePlaced.getSortedRows();
    },

    visibleExcusedRows() {
      const rows = this.groupExcused.slice().sort((a, b) => {
        const ea = (a?.excused_status ?? '').localeCompare(b?.excused_status ?? '');
        if (ea !== 0) return ea;
        const da = this.actualEndDate(a)?.getTime() ?? -Infinity;
        const db = this.actualEndDate(b)?.getTime() ?? -Infinity;
        if (da !== db) return db - da;
        return this.safeName(a).localeCompare(this.safeName(b));
      });
      this.tableExcused.setRows(rows);
      return this.tableExcused.getSortedRows();
    },
    // --- placement numerator/denominator for bar ---
eligibleStudents() {
  // If you later add server field, respect it:
  // - true => eligible
  // - false => not eligible
  return this.includedStudents.filter(s => {
    if (!s) return false;
    return (!!s.is_placement || !!s.is_completer) && !s.excused_status;
  });
},

  eligiblePlaced() {
    return this.eligibleStudents.filter(s => !!s?.is_placement);
  },

  eligibleNotPlaced() {
    return this.eligibleStudents.filter(s => !s?.is_placement);
  },

  barSegmentsPlacement() {
    const segs = [];

    // Yellow = eligible not placed (action-needed within eligible)
    for (let i = 0; i < this.eligibleNotPlaced.length; i++) {
      const s = this.eligibleNotPlaced[i];
      segs.push({
        key: `elig-not-placed-${s?.sis_user_id ?? i}`,
        color: this.colors.yellow,
        opacity: 1,
        title: `${this.displayName(s)}: Eligible, not placed`
      });
    }

    // Green = eligible placed
    for (let i = 0; i < this.eligiblePlaced.length; i++) {
      const s = this.eligiblePlaced[i];
      segs.push({
        key: `elig-placed-${s?.sis_user_id ?? i}`,
        color: this.colors.green,
        opacity: 1,
        title: `${this.displayName(s)}: Placed`
      });
    }

    return segs;
  },

  barSegmentsPlacementSafe() {
    const segs = Array.isArray(this.barSegmentsPlacement) ? this.barSegmentsPlacement : [];
    return segs.filter(seg => seg && typeof seg.key === 'string' && seg.key.length);
  },

  // KPI for the bar
  eligibleCount() { return this.eligibleStudents.length; },
  placedCount() { return this.eligiblePlaced.length; },
  actionEligibleCount() { return this.eligibleNotPlaced.length; },

  placementRate() {
    return this.eligibleCount ? (this.placedCount / this.eligibleCount) : null;
  },

  placementPctText() {
    const r = this.placementRate;
    return Number.isFinite(r) ? (r * 100).toFixed(1) + '%' : 'n/a';
  },
    // simple KPI counts
    kpi() {
      const total = this.includedStudents.length;
      const placed = this.groupPlaced.length;
      const excused = this.groupExcused.length;
      const action = this.groupActionNeeded.length;

      // “eligible denominator” for a simple placement rate:
      // (completer OR placed) AND not excused (your server already computed this as is_placement_eligible if you kept it)
      const eligible = this.includedStudents.filter(s => !!s.is_placement_eligible).length;
      const rate = eligible ? (placed / eligible) : null;

      return { total, placed, excused, action, eligible, rate };
    },

    pctText() {
      const r = this.kpi.rate;
      return Number.isFinite(r) ? (r * 100).toFixed(1) + '%' : 'n/a';
    }
  },

  methods: {
    // ---------- tiny helpers ----------
    safeName(s) { return (s?.name ?? '').toLowerCase(); },

    displayName(s) {
      if (this.anonymous) return 'STUDENT';
      return (s?.name ?? (s?.sis_user_id != null ? `SIS ${s.sis_user_id}` : 'Student'));
    },

    escapeHtml(str) {
      return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    },

    // ---------- dates ----------
    dateOrDash(v) {
      if (!v) return '—';
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? '—' : d.toISOString().slice(0, 10);
    },

    projectedEndDate(s) {
      if (!s?.projected_exit_date) return null;
      const d = new Date(s.projected_exit_date);
      return Number.isNaN(d.getTime()) ? null : d;
    },

    actualEndDate(s) {
      if (!s?.exit_date) return null;
      const d = new Date(s.exit_date);
      return Number.isNaN(d.getTime()) ? null : d;
    },

    rateMarkerLeftPct() {
      const r = this.placementRate;
      if (!Number.isFinite(r)) return null;
      return (Math.max(0, Math.min(1, r)) * 100) + '%';
    },
    // ---------- columns ----------
    makeStudentColumn() {
      return new window.ReportColumn(
        'Student',
        'Student name (or SIS id if name not provided).',
        '16rem',
        false,
        'string',
        s => {
          const label = this.escapeHtml(this.displayName(s));
          const id = s?.canvas_user_id;
          return id
            ? `<a href="/users/${encodeURIComponent(id)}" target="_blank" rel="noopener noreferrer">${label}</a>`
            : label;
        },
        null,
        s => (s?.name ?? String(s?.sis_user_id ?? ''))
      );
    },

    makeEndColumn(mode, name, description) {
      return new window.ReportColumn(
        name, description, '8rem', false, 'string',
        s => {
          if (mode === 'actual') return s?.exit_date ? this.dateOrDash(s.exit_date) : '—';
          // projected
          return s?.projected_exit_date ? this.dateOrDash(s.projected_exit_date) : 'n/a';
        },
        // style + sort can stay as you have it (just treat projected separately if you want)
        null,
        s => {
          const t = (mode === 'actual')
            ? (this.actualEndDate(s)?.getTime() ?? Infinity)
            : (this.projectedEndDate(s)?.getTime() ?? Infinity);
          return t;
        }
      );
    },

    makeExitColumn() {
      return new window.ReportColumn(
        'Exited?',
        'Whether we have an actual exit recorded.',
        '5rem',
        false,
        'string',
        s => (s?.is_exited ? 'Yes' : 'No'),
        null,
        s => (s?.is_exited ? 1 : 0)
      );
    },

    makeExcusedColumn() {
      return new window.ReportColumn(
        'Excused',
        'Pending Licensure / Refused Employment / Unavailable.',
        '12rem',
        false,
        'string',
        s => this.escapeHtml(s?.excused_status ?? '—'),
        s => {
          if (!s?.excused_status) return { backgroundColor: 'transparent', color: this.colors.black };
          return { backgroundColor: this.colors.gray, color: this.colors.black, opacity: 0.85 };
        },
        s => (s?.excused_status ?? '')
      );
    },

    makeStatusColumn(mode) {
      const desc =
        mode === 'placed'
          ? '● green = placed.'
          : mode === 'excused'
          ? '● gray = excused (not placed).'
          : '● yellow = action needed.';

      return new window.ReportColumn(
        'Status', desc, '3.5rem', false, 'string',
        s => this.statusDotHtml(s, { mode }),
        null,
        s => this.statusSortValue(s, { mode })
      );
    },

    statusDotColor(s, { mode }) {
      if (!s) return null;
      if (mode === 'placed') return this.colors.green;
      if (mode === 'excused') return this.colors.gray;
      // action
      return this.colors.yellow;
    },

    statusDotHtml(s, { mode }) {
      const c = this.statusDotColor(s, { mode });
      return c ? `
        <span title="status" style="
          display:inline-block;width:10px;height:10px;border-radius:999px;
          background:${c};box-shadow:0 0 0 1px rgba(0,0,0,.12);vertical-align:middle;
        "></span>
      ` : '';
    },

    statusSortValue(_s, { mode }) {
      if (mode === 'action') return 1;
      if (mode === 'placed') return 2;
      if (mode === 'excused') return 3;
      return 9;
    },

    // --- sort handlers ---
    getColumnsWidthsStringAction() { return this.tableAction.getColumnsWidthsString(); },
    setSortColumnAction(name) { this.tableAction.setSortColumn(name); this.tickAction++; },

    getColumnsWidthsStringPlaced() { return this.tablePlaced.getColumnsWidthsString(); },
    setSortColumnPlaced(name) { this.tablePlaced.setSortColumn(name); this.tickPlaced++; },

    getColumnsWidthsStringExcused() { return this.tableExcused.getColumnsWidthsString(); },
    setSortColumnExcused(name) { this.tableExcused.setSortColumn(name); this.tickExcused++; }
  },

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
    <div class="btech-row" style="align-items:center; margin-bottom:10px;">
    </div>

    <div v-if="loading" class="btech-muted" style="text-align:center; padding:10px;">
      Loading students…
    </div>

    <div v-else>
      <div style="display:grid; grid-template-columns: auto 14rem; gap:10px; align-items:center;">
        <div>
          <div style="position:relative; height:18px; border-radius:10px; overflow:hidden; background:#F2F2F2;">
            <div style="position:absolute; inset:0; display:flex;">
              <div
                v-for="seg in barSegmentsPlacementSafe"
                :key="seg.key"
                :title="seg.title"
                :style="{ flex:'1 1 0', background:seg.color, opacity:seg.opacity, borderRight:'1px solid rgba(255,255,255,0.6)' }"
              ></div>
            </div>

            <!-- 70% goal marker -->
            <div
              :style="{ position:'absolute', left:'70%', top:'-3px', bottom:'-3px', width:'2px', background:colors.black, opacity:0.6 }"
              title="70% placement goal"
            ></div>
          </div> 
        </div>

        <div style="text-align:right;">
          <span class="btech-pill" style="margin-left:6px;">Rate: {{ placementPctText }}</span>
        </div>
      </div>

      <!-- ACTION NEEDED -->
      <div class="btech-row" style="align-items:center; margin: 8px 0;">
        <h4 class="btech-card-title" style="margin:0; font-size: .95rem;">Action needed</h4>
        <div style="flex:1;"></div>
        <span class="btech-pill" style="margin-left:8px;">Rows: {{ visibleActionRows.length }}</span>
      </div>

      <div style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; user-select:none;"
        :style="{ 'grid-template-columns': getColumnsWidthsStringAction() }">
        <div v-for="col in tableAction.getVisibleColumns()" :key="'ah-' + col.name" :title="col.description"
          style="display:inline-block; cursor:pointer;" @click="setSortColumnAction(col.name)">
          <span><b>{{ col.name }}</b></span>
        </div>
      </div>

      <div v-for="(s, i) in visibleActionRows" :key="'a-' + (s.sis_user_id || s.id || i)"
        style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; line-height:1.5rem;"
        :style="{ 'grid-template-columns': getColumnsWidthsStringAction(), 'background-color': (i % 2) ? 'white' : '#F8F8F8' }">
        <div v-for="col in tableAction.getVisibleColumns()" :key="'ac-' + col.name"
          style="display:inline-block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
          <span :class="col.style_formula ? 'btech-pill-text' : ''" :style="col.get_style(s)" v-html="col.getContent(s)"></span>
        </div>
      </div>

      <!-- PLACED -->
      <div class="btech-row" style="align-items:center; margin: 14px 0 8px;">
        <h4 class="btech-card-title" style="margin:0; font-size: .95rem;">Placed</h4>
        <div style="flex:1;"></div>
        <span class="btech-pill" style="margin-left:8px;">Rows: {{ visiblePlacedRows.length }}</span>
      </div>

      <div style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; user-select:none;"
        :style="{ 'grid-template-columns': getColumnsWidthsStringPlaced() }">
        <div v-for="col in tablePlaced.getVisibleColumns()" :key="'ph-' + col.name" :title="col.description"
          style="display:inline-block; cursor:pointer;" @click="setSortColumnPlaced(col.name)">
          <span><b>{{ col.name }}</b></span>
        </div>
      </div>

      <div v-for="(s, i) in visiblePlacedRows" :key="'p-' + (s.sis_user_id || s.id || i)"
        style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; line-height:1.5rem;"
        :style="{ 'grid-template-columns': getColumnsWidthsStringPlaced(), 'background-color': (i % 2) ? 'white' : '#F8F8F8' }">
        <div v-for="col in tablePlaced.getVisibleColumns()" :key="'pc-' + col.name"
          style="display:inline-block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
          <span :class="col.style_formula ? 'btech-pill-text' : ''" :style="col.get_style(s)" v-html="col.getContent(s)"></span>
        </div>
      </div>

      <!-- EXCUSED -->
      <div class="btech-row" style="align-items:center; margin: 14px 0 8px;">
        <h4 class="btech-card-title" style="margin:0; font-size: .95rem;">Excused (not placed)</h4>
        <div style="flex:1;"></div>
        <span class="btech-pill" style="margin-left:8px;">Rows: {{ visibleExcusedRows.length }}</span>
      </div>

      <div style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; user-select:none;"
        :style="{ 'grid-template-columns': getColumnsWidthsStringExcused() }">
        <div v-for="col in tableExcused.getVisibleColumns()" :key="'eh-' + col.name" :title="col.description"
          style="display:inline-block; cursor:pointer;" @click="setSortColumnExcused(col.name)">
          <span><b>{{ col.name }}</b></span>
        </div>
      </div>

      <div v-for="(s, i) in visibleExcusedRows" :key="'e-' + (s.sis_user_id || s.id || i)"
        style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; line-height:1.5rem;"
        :style="{ 'grid-template-columns': getColumnsWidthsStringExcused(), 'background-color': (i % 2) ? 'white' : '#F8F8F8' }">
        <div v-for="col in tableExcused.getVisibleColumns()" :key="'ec-' + col.name"
          style="display:inline-block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
          <span :class="col.style_formula ? 'btech-pill-text' : ''" :style="col.get_style(s)" v-html="col.getContent(s)"></span>
        </div>
      </div>

      <div class="btech-muted" style="font-size:.7rem; margin-top:10px;">
        Includes students who are completers, placed, excused, or projected to exit within the selected academic year.
      </div>
    </div>
  </div>
  `
});
