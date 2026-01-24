// completion-diagnostic.js
Vue.component('reports-department-completion-diagnostic', {
  props: {
    year: { type: [Number, String], required: true },
    anonymous: { type: Boolean, default: false },

    // Vue 2: Array defaults must be functions
    students: {
      type: Array,
      default: () => ([
        // --- FINISHED: COMPLETERS ---
        { name: "Alex Martinez",  canvas_user_id: 101, exited: "2025-02-15", is_completer: true,  credits_remaining: 0 },
        { name: "Brianna Chen",   canvas_user_id: 102, exited: "2025-03-10", is_completer: true,  credits_remaining: 0 },
        { name: "Carlos Rivera",  canvas_user_id: 103, exited: "2025-01-28", is_completer: true,  credits_remaining: 0 },

        // --- FINISHED: NON-COMPLETERS ---
        { name: "Danielle Foster", canvas_user_id: 104, exited: "2025-02-02", is_completer: false, credits_remaining: 5 },
        { name: "Ethan Brooks",    canvas_user_id: 105, exited: "2025-03-01", is_completer: false, credits_remaining: 2 },

        // --- ACTIVE: ON TRACK ---
        { name: "Fatima Noor",    canvas_user_id: 106, exited: null, is_completer: false, credits_remaining: 6 },
        { name: "Gavin Holt",     canvas_user_id: 107, exited: null, is_completer: false, credits_remaining: 13 },

        // --- ACTIVE: AT RISK ---
        { name: "Hannah Lee",     canvas_user_id: 108, exited: null, is_completer: false, credits_remaining: 10 },
        { name: "Isaiah Turner",  canvas_user_id: 109, exited: null, is_completer: false, credits_remaining: 12 },

        // --- ACTIVE: OFF TRACK ---
        { name: "Jamal Washington", canvas_user_id: 110, exited: null, is_completer: false, credits_remaining: 20 },
        { name: "Kara O'Neill",     canvas_user_id: 111, exited: null, is_completer: false, credits_remaining: 26 },

        // --- EDGE CASES ---
        { name: "Liam Patel",     canvas_user_id: 112, exited: null, is_completer: false, credits_remaining: 0 },   // done but not exited (counts as "active done")
        { name: "Maya Rodriguez", canvas_user_id: 113, exited: "2025-04-05", is_completer: false, credits_remaining: null } // bad/missing
      ])
    },

    loading: { type: Boolean, default: false }
  },

  data() {
    const colors = (window.bridgetools?.colors) || {
      red:'#b20b0f', orange:'#f59e0b', yellow:'#eab308',
      green:'#16a34a', gray:'#e5e7eb', black:'#111827', white:'#fff'
    };

    const makeTable = (sort_column, sort_dir = 1) =>
      new window.ReportTable({ rows: [], columns: [], sort_column, sort_dir, colors });

    return {
      colors,
      tableActive: makeTable("End (Projected)", 1),
      tableFinished: makeTable("Student", 1),
      tableTickActive: 0,
      tableTickFinished: 0,
      whatIfDrops: 0,
    };
  },

  created() {
    // ACTIVE TABLE
    this.tableActive.setColumns([
      this.makeStatusColumn('active'),
      this.makeStudentColumn(),
      this.makeEndColumn('active', 'End (Projected)', 'Projected finish date (~2 credits/month).'),
      new window.ReportColumn(
        'Cr Rem', 'Credits remaining (used for projection).', '5.5rem', false, 'number',
        s => this.numOrNA(s?.credits_remaining, 0),
        null,
        s => Number(s?.credits_remaining ?? -1)
      ),
    ]);

    // FINISHED TABLE
    this.tableFinished.setColumns([
      this.makeStatusColumn('finished'),
      this.makeStudentColumn(),
      this.makeEndColumn('finished', 'End', 'Actual end date (exit date).'),
    ]);
  },

  computed: {
    whatIfExitersTotal() {
  return this.exiters.length + Math.max(0, this.whatIfDrops);
},

whatIfCompletersTotal() {
  // drops are assumed NON-completers
  return this.completerExiters.length;
},

whatIfCompletionRate() {
  const denom = this.whatIfExitersTotal;
  if (!denom) return null;
  return this.whatIfCompletersTotal / denom;
},

whatIfPctText() {
  const n = this.whatIfCompletionRate;
  return Number.isFinite(n) ? (n * 100).toFixed(1) + '%' : 'n/a';
},

    studentsClean() {
      return Array.isArray(this.students) ? this.students : [];
    },

    // Academic year: Jul 1 -> Jun 30 (upcoming June 30)
    cutoffDate() {
      const now = new Date();
      const endYear = (now.getMonth() >= 6) ? (now.getFullYear() + 1) : now.getFullYear();
      return new Date(endYear, 5, 30, 23, 59, 59);
    },

    academicYearStart() {
      const now = new Date();
      const startYear = (now.getMonth() >= 6) ? now.getFullYear() : (now.getFullYear() - 1);
      return new Date(startYear, 6, 1, 0, 0, 0);
    },

    finishedStudents() {
      return this.studentsClean.filter(s => this.isFinished(s));
    },

    activeStudents() {
      return this.studentsClean.filter(s => !this.isFinished(s));
    },

    // Exiters for completion KPI (official exited only)
    exiters() {
      return this.studentsClean.filter(s => !!s?.exited);
    },

    completerExiters() {
      return this.exiters.filter(s => !!s?.is_completer);
    },

    currentCompletionRate() {
      const denom = this.exiters.length;
      return denom ? (this.completerExiters.length / denom) : null;
    },

    // Centralized candidate list for all “projection” calculations
    projectionCandidates() {
      // Active only, with bucket + projected timestamp
      return this.activeStudents
        .filter(s => !s?.exited)
        .map(s => {
          const b = this.projectionBucket(s);              // green/yellow/orange/red/null
          const t = this.projectedFinishDate(s)?.getTime();
          return { s, b, t: Number.isFinite(t) ? t : Infinity };
        })
        .filter(x => !!x.b && x.t !== Infinity)
        .sort((a, b) => {
          const w = bb => (bb === 'green' ? 0 : bb === 'yellow' ? 1 : bb === 'orange' ? 2 : 3);
          const wa = w(a.b), wb = w(b.b);
          if (wa !== wb) return wa - wb;
          if (a.t !== b.t) return a.t - b.t;
          return (this.safeName(a.s)).localeCompare(this.safeName(b.s));
        });
    },

    neededActiveCountFor60() {
      const baseE = this.whatIfExitersTotal;
      const baseC = this.whatIfCompletersTotal;

      if (!baseE) return 0;

      const greens = this.projectionCandidates.filter(x => x.b === 'green');

      const rateIfAllGreens =
        (baseE + greens.length) ? ((baseC + greens.length) / (baseE + greens.length)) : null;

      if (Number.isFinite(rateIfAllGreens) && rateIfAllGreens >= 0.60) {
        return greens.length;
      }

      // min number of candidates required to hit 60 (treat each chosen as a completer)
      let add = 0;
      for (let i = 0; i < this.projectionCandidates.length; i++) {
        add += 1;
        const denom = baseE + add;
        const num = baseC + add;
        if (denom > 0 && (num / denom) >= 0.60) return add;
      }
      return this.projectionCandidates.length;
    },

    // ACTIVE rows: sorted by projected date then name (ReportTable handles user-click sort afterward)
    visibleActiveRows() {
      const rows = this.activeStudents.slice().sort((a, b) => {
        const da = this.projectedFinishDate(a)?.getTime() ?? Infinity;
        const db = this.projectedFinishDate(b)?.getTime() ?? Infinity;
        if (da !== db) return da - db;
        return this.safeName(a).localeCompare(this.safeName(b));
      });

      this.tableActive.setRows(rows);
      return this.tableActive.getSortedRows();
    },

    // FINISHED rows: completers first, then newest end date
    visibleFinishedRows() {
      const rows = this.finishedStudents.slice().sort((a, b) => {
        const wa = this.finishedBucketWeight(a);
        const wb = this.finishedBucketWeight(b);
        if (wa !== wb) return wa - wb;

        const da = this.actualEndDate(a)?.getTime() ?? -Infinity;
        const db = this.actualEndDate(b)?.getTime() ?? -Infinity;
        if (da !== db) return db - da;

        return this.safeName(a).localeCompare(this.safeName(b));
      });

      this.tableFinished.setRows(rows);
      return this.tableFinished.getSortedRows();
    },

    pctNowText() {
      const n = this.currentCompletionRate;
      return Number.isFinite(n) ? (n * 100).toFixed(1) + '%' : 'n/a';
    },

    barSegmentsProjected() {
      const segs = [];

      const exitersCompleters = this.exiters.filter(s => !!s?.is_completer);
      const exitersNon = this.exiters.filter(s => !s?.is_completer);

      // deterministic keys (no Math.random)
      const keyFor = (prefix, s, i) => `${prefix}-${s?.canvas_user_id ?? s?.id ?? i}`;

      for (let i = 0; i < exitersCompleters.length; i++) {
        const s = exitersCompleters[i];
        segs.push({
          key: keyFor('done-ok', s, i),
          color: this.colors.green,
          opacity: 0.35,
          title: `${this.displayName(s)}: Completed (exited)`
        });
      }

      const baseE = this.whatIfExitersTotal;
      const baseC = this.whatIfCompletersTotal;


      const greens = this.projectionCandidates.filter(x => x.b === 'green');
      const rest = this.projectionCandidates.filter(x => x.b !== 'green');

      const rateIfAllGreens =
        (baseE + greens.length) ? ((baseC + greens.length) / (baseE + greens.length)) : null;

      const hits60WithGreens = Number.isFinite(rateIfAllGreens) && rateIfAllGreens >= 0.60;

      const chosen = [];
      let add = 0;

      const takeUntilHit60 = (list) => {
        for (const x of list) {
          chosen.push(x);
          add += 1;
          const denom = baseE + add;
          const num = baseC + add;
          if (denom > 0 && (num / denom) >= 0.60) break;
        }
      };

      if (hits60WithGreens) {
        chosen.push(...greens);
      } else {
        takeUntilHit60(greens);
        if ((baseE + add) > 0 && ((baseC + add) / (baseE + add)) < 0.60) {
          takeUntilHit60(rest);
        }
      }

      for (let i = 0; i < chosen.length; i++) {
        const { s, b } = chosen[i];

        const color =
          (b === 'green') ? this.colors.green :
          (b === 'yellow') ? this.colors.yellow :
          (b === 'orange') ? this.colors.orange :
          this.colors.red;

        segs.push({
          key: keyFor(`proj-${b}`, s, i),
          color,
          opacity: 1,
          title: `${this.displayName(s)}: ${this.bucketLabel(b)}`
        });
      }

      for (let i = 0; i < exitersNon.length; i++) {
        const s = exitersNon[i];
        segs.push({
          key: keyFor('done-bad', s, i),
          color: this.colors.gray,
          opacity: 1,
          title: `${this.displayName(s)}: Did not complete (exited)`
        });
      }

      return segs;
    },
  },

  methods: {
    // ---------- tiny helpers ----------
    safeName(s) {
      return (s?.name ?? '').toLowerCase();
    },
    displayName(s) {
      return this.anonymous ? 'STUDENT' : (s?.name ?? 'Student');
    },
    bucketLabel(b) {
      return (
        b === 'green'  ? 'Projected complete (safe)' :
        b === 'yellow' ? 'Projected complete (June / fragile)' :
        b === 'orange' ? 'Projected complete (July / too late)' :
        'Projected complete (Aug+ / very late)'
      );
    },

    // ---------- column factories ----------
    makeStudentColumn() {
      return new window.ReportColumn(
        'Student', 'Student name.', '16rem', false, 'string',
        s => this.displayName(s),
        null,
        s => (s?.name ?? '')
      );
    },

    makeStatusColumn(mode) {
      const desc =
        (mode === 'active')
          ? '● green = on-track, ● yellow = in danger; blank = not going to complete in-window.'
          : '● green = completer, ● red = non-completer.';

      return new window.ReportColumn(
        'Status', desc, '3.5rem', false, 'string',
        s => this.statusDotHtml(s, { mode }),
        null,
        s => this.statusSortValue(s, { mode })
      );
    },

    makeEndColumn(mode, name, description) {
      return new window.ReportColumn(
        name, description, '8rem', false, 'string',
        s => this.endDateText(s, { mode }),
        s => this.endDatePillStyle(s, { mode }),
        s => this.endDateSortValue(s, { mode })
      );
    },

    // --- sort handlers ---
    getColumnsWidthsStringActive() { return this.tableActive.getColumnsWidthsString(); },
    setSortColumnActive(name) { this.tableActive.setSortColumn(name); this.tableTickActive++; },

    getColumnsWidthsStringFinished() { return this.tableFinished.getColumnsWidthsString(); },
    setSortColumnFinished(name) { this.tableFinished.setSortColumn(name); this.tableTickFinished++; },

    // ---------- finished logic ----------
    isFinished(s) {
      if (!s) return false;
      if (s?.exited) return true;
      const cr = Number(s?.credits_remaining);
      return Number.isFinite(cr) && cr <= 0; // operationally finished
    },

    // ---------- formatting ----------
    numOrNA(v, decimals = 2) {
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(decimals) : 'n/a';
    },

    dateOrDash(v) {
      if (!v) return '—';
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? '—' : d.toISOString().slice(0, 10);
    },

    // ---------- projection ----------
    projectedFinishDate(s) {
      if (!s || s?.exited) return null;
      const cr = Number(s?.credits_remaining);
      if (!Number.isFinite(cr)) return null;

      const days = Math.ceil((cr / 2) * 30); // ~2 credits/mo
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d;
    },

    actualEndDate(s) {
      if (!s?.exited) return null;
      const d = new Date(s.exited);
      return Number.isNaN(d.getTime()) ? null : d;
    },

    // ---------- bucket logic ----------
    projectionBucket(s) {
      if (!s || s?.exited) return null;

      const cr = Number(s?.credits_remaining);
      if (Number.isFinite(cr) && cr <= 0) return 'green';

      const d = this.projectedFinishDate(s);
      const cutoff = this.cutoffDate;
      if (!d || !cutoff) return null;

      const y = cutoff.getFullYear();
      const juneStart = new Date(y, 5, 1, 0, 0, 0);
      const julyStart = new Date(y, 6, 1, 0, 0, 0);
      const augStart  = new Date(y, 7, 1, 0, 0, 0);

      if (d < juneStart) return 'green';
      if (d < julyStart) return 'yellow';
      if (d < augStart)  return 'orange';
      return 'red';
    },

    // ---------- merged End column ----------
    endDateText(s, { mode }) {
      if (!s) return 'n/a';
      if (mode === 'finished') return s?.exited ? this.dateOrDash(s.exited) : '—';
      const d = this.projectedFinishDate(s);
      return d ? d.toISOString().slice(0, 10) : 'n/a';
    },

    endDateSortValue(s, { mode }) {
      if (!s) return Infinity;
      if (mode === 'finished') return this.actualEndDate(s)?.getTime() ?? Infinity;
      return this.projectedFinishDate(s)?.getTime() ?? Infinity;
    },

    endDatePillStyle(s, { mode }) {
      if (!s) return { backgroundColor: this.colors.gray, color: this.colors.black };

      if (mode === 'finished') {
        if (!s?.exited) return { backgroundColor: 'transparent', color: this.colors.black };
        return {
          backgroundColor: s?.is_completer ? this.colors.green : this.colors.red,
          color: this.colors.white,
          opacity: 0.85
        };
      }

      const b = this.projectionBucket(s);
      if (!b) return { backgroundColor: this.colors.gray, color: this.colors.black };

      const map = { green: this.colors.green, yellow: this.colors.yellow, orange: this.colors.orange, red: this.colors.red };
      return { backgroundColor: map[b], color: this.colors.white };
    },

    // ---------- status dot ----------
    statusDotColor(s, { mode }) {
      if (!s) return null;

      if (mode === 'finished') {
        if (!s?.exited) return null;
        return s?.is_completer ? this.colors.green : this.colors.red;
      }

      const b = this.projectionBucket(s);
      if (!b) return null;

      const map = { green: this.colors.green, yellow: this.colors.yellow, orange: this.colors.orange, red: this.colors.red };
      return map[b] ?? null;
    },

    statusDotHtml(s, { mode }) {
      const c = this.statusDotColor(s, { mode });
      if (!c) return '';
      return `
        <span
          title="status"
          style="
            display:inline-block;
            width:10px;
            height:10px;
            border-radius:999px;
            background:${c};
            box-shadow: 0 0 0 1px rgba(0,0,0,.12);
            vertical-align:middle;
          "
        ></span>
      `;
    },

    statusSortValue(s, { mode }) {
      const c = this.statusDotColor(s, { mode });
      if (c === this.colors.yellow) return 1;
      if (c === this.colors.green) return 2;
      if (c === this.colors.red) return 3;
      return 9;
    },

    finishedBucketWeight(s) {
      if (!s?.exited) return 9;
      return s?.is_completer ? 0 : 1;
    },

    // ---------- divider ----------
    activeRowDividerStyle(_s, idx, rows) {
      const n = Number(this.neededActiveCountFor60);
      if (!Number.isFinite(n) || n <= 0) return {};
      if (!Array.isArray(rows) || rows.length === 0) return {};
      if (idx === n) return { borderTop: '4px solid rgba(0,0,0,0.75)' };
      return {};
    },
  },

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
    <div class="btech-row" style="align-items:center; margin-bottom:10px;">
      <h4 class="btech-card-title" style="margin:0;">Completion Diagnostic</h4>
      <div style="flex:1;"></div>
      <span class="btech-pill" style="margin-left:8px;">Year: {{ year }}</span>
      <span class="btech-pill" style="margin-left:8px;">Students: {{ studentsClean.length }}</span>
      <span class="btech-pill" style="margin-left:8px;">Exiters: {{ exiters.length }}</span>
    </div>

    <div v-if="loading" class="btech-muted" style="text-align:center; padding:10px;">
      Loading students…
    </div>

    <div v-else>
      <div style="display:grid; grid-template-columns: 1fr; gap:10px; align-items:start; margin-bottom:12px;">
        <div>
          <div class="btech-muted" style="font-size:.75rem; margin-bottom:6px;">
            Completion = Completers / Exiters (excused withdrawals excluded upstream)
          </div>

          <div style="position:relative; height:18px; border-radius:10px; overflow:hidden; background:#F2F2F2;">
            <div style="position:absolute; inset:0; display:flex;">
              <div
                v-for="seg in barSegmentsProjected"
                :key="seg.key"
                :title="seg.title"
                :style="{
                  flex: '1 1 0',
                  background: seg.color,
                  opacity: seg.opacity,
                  borderRight: '1px solid rgba(255,255,255,0.6)'
                }"
              ></div>
            </div>

            <div
              :style="{
                position:'absolute',
                left:'60%',
                top:'-3px',
                bottom:'-3px',
                width:'2px',
                background: colors.black,
                opacity: 0.6
              }"
              title="60% requirement"
            ></div>
          </div>

          <div class="btech-muted" style="font-size:.7rem; margin-top:8px;">
            AY Window: {{ academicYearStart.toISOString().slice(0,10) }} → {{ cutoffDate.toISOString().slice(0,10) }}
          </div>
        </div>
      </div>

      <div class="btech-row">
      <span
  class="btech-pill"
  style="margin-left:8px; display:inline-flex; align-items:center; gap:6px;"
>
  What-if exits:
  <button
    type="button"
    style="width:22px;height:22px;border-radius:6px;"
    @click="whatIfDrops = Math.max(0, whatIfDrops - 1)"
    :disabled="whatIfDrops <= 0"
    title="Remove hypothetical exiter"
  >−</button>

  <b style="min-width:1.5rem; text-align:center;">
    {{ whatIfDrops }}
  </b>

  <button
    type="button"
    style="width:22px;height:22px;border-radius:6px;"
    @click="whatIfDrops++"
    title="Add hypothetical exiter"
  >+</button>
</span>

<span class="btech-pill" style="margin-left:8px;">
  What-if rate: {{ whatIfPctText }}
</span>

      </div>

      <!-- ACTIVE TABLE -->
      <div class="btech-row" style="align-items:center; margin: 8px 0;">
        <h4 class="btech-card-title" style="margin:0; font-size: .95rem;">Active students</h4>
      </div>

      <div
        style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; user-select:none;"
        :style="{ 'grid-template-columns': getColumnsWidthsStringActive() }"
      >
        <div
          v-for="col in tableActive.getVisibleColumns()"
          :key="col.name"
          :title="col.description"
          style="display:inline-block; cursor:pointer;"
          @click="setSortColumnActive(col.name)"
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

      <div
        v-for="(s, i) in visibleActiveRows"
        :key="'a-' + (s.canvas_user_id || s.id || i)"
        style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; line-height:1.5rem;"
        :style="Object.assign(
            {
              'grid-template-columns': getColumnsWidthsStringActive(),
              'background-color': (i % 2) ? 'white' : '#F8F8F8'
            },
            activeRowDividerStyle(s, i, visibleActiveRows)
          )"
      >
        <div
          v-for="col in tableActive.getVisibleColumns()"
          :key="col.name"
          style="display:inline-block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;"
        >
          <span
            :class="col.style_formula ? 'btech-pill-text' : ''"
            :style="col.get_style(s)"
            v-html="col.getContent(s)"
          ></span>
        </div>
      </div>

      <!-- ================= FINISHED TABLE ================= -->
      <div class="btech-row" style="align-items:center; margin: 14px 0 8px;">
        <h4 class="btech-card-title" style="margin:0; font-size: .95rem;">Finished students</h4>
        <div style="flex:1;"></div>
        <span class="btech-pill" style="margin-left:8px;">Rows: {{ visibleFinishedRows.length }}</span>
      </div>

      <div
        style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; user-select:none;"
        :style="{ 'grid-template-columns': getColumnsWidthsStringFinished() }"
      >
        <div
          v-for="col in tableFinished.getVisibleColumns()"
          :key="col.name"
          :title="col.description"
          style="display:inline-block; cursor:pointer;"
          @click="setSortColumnFinished(col.name)"
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

      <div
        v-for="(s, i) in visibleFinishedRows"
        :key="'f-' + (s.canvas_user_id || s.id || i)"
        style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; line-height:1.5rem;"
        :style="{
          'grid-template-columns': getColumnsWidthsStringFinished(),
          'background-color': (i % 2) ? 'white' : '#F8F8F8',
          'opacity': 0.65
        }"
      >
        <div
          v-for="col in tableFinished.getVisibleColumns()"
          :key="col.name"
          style="display:inline-block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;"
        >
          <span
            :class="col.style_formula ? 'btech-pill-text' : ''"
            :style="col.get_style(s)"
            v-html="col.getContent(s)"
          ></span>
        </div>
      </div>
      <div class="btech-muted" style="font-size:.7rem; margin-top:10px;">
        Projection uses a simple rule-of-thumb: <b>~2 credits/month</b> based on <code>credits_remaining</code>.
      </div>
    </div>
  </div>
  `
});
