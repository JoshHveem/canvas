// completion-diagnostic.js
Vue.component('reports-program-completion', {
  props: {
    year: { type: [Number, String], required: true },
    anonymous: { type: Boolean, default: false },

    // Real data now; no default test array.
    students: {
      type: Array,
      default: () => ([])
    },

    loading: { type: Boolean, default: false }
  },

  data() {
    const colors = (window.bridgetools?.colors) || {
      red: '#b20b0f', orange: '#f59e0b', yellow: '#eab308',
      green: '#16a34a', gray: '#e5e7eb', black: '#111827', white: '#fff'
    };

    const makeTable = (sort_column, sort_dir = 1) =>
      new window.ReportTable({ rows: [], columns: [], sort_column, sort_dir, colors });

    return {
      colors,
      tableActive: makeTable("End (Projected)", 1),
      tableFinished: makeTable("Student", 1),
      tableTickActive: 0,
      tableTickFinished: 0,
      whatIfDrops: 0
    };
  },

  created() {
    // ACTIVE TABLE
    this.tableActive.setColumns([
      this.makeStatusColumn('active'),
      this.makeStudentColumn(),
      this.makeEndColumn('active', 'End (Projected)', 'Projected exit date (server-calculated).')
    ]);

    // FINISHED TABLE
    this.tableFinished.setColumns([
      this.makeStatusColumn('finished'),
      this.makeStudentColumn(),
      this.makeEndColumn('finished', 'End', 'Actual exit date (exit_date).')
    ]);
  },

  computed: {
    barSegmentsProjectedSafe() {
        const segs = Array.isArray(this.barSegmentsProjected) ? this.barSegmentsProjected : [];
        console.log(segs);
        // remove undefined/null and anything missing a key
        return segs.filter(seg => seg && typeof seg.key === 'string' && seg.key.length);
    },
    // ---------- base populations ----------
    studentsClean() {
      return Array.isArray(this.students) ? this.students : [];
    },

    // Active = not exited yet
    activeStudents() {
      return this.studentsClean.filter(s => !s?.is_exited);
    },

    // Finished = exited
    finishedStudents() {
      return this.studentsClean.filter(s => !!s?.is_exited);
    },

    // Exiters for completion KPI = is_exited true
    exiters() {
      return this.studentsClean.filter(s => !!s?.is_exited);
    },

    completerExiters() {
      return this.exiters.filter(s => !!s?.is_completer);
    },

    currentCompletionRate() {
      const denom = this.exiters.length;
      return denom ? (this.completerExiters.length / denom) : null;
    },

    pctNowText() {
      const n = this.currentCompletionRate;
      return Number.isFinite(n) ? (n * 100).toFixed(1) + '%' : 'n/a';
    },

    // ---------- what-if drops ----------
    whatIfExitersTotal() {
      return this.exiters.length + Math.max(0, this.whatIfDrops);
    },

    whatIfCompletersTotal() {
      // drops assumed non-completers
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

    // ---------- projections (client uses server scores only) ----------
    projectionCandidates() {
    return this.activeStudents
        .map(s => {
        if (!s) return null;
        const p = this.safeProb(s?.chance_to_complete);
        if (!Number.isFinite(p)) return null;
        return { s, p };
        })
        .filter(Boolean)
        .sort((a, b) => {
        if (a.p !== b.p) return b.p - a.p;
        const da = this.projectedEndDate(a.s)?.getTime() ?? Infinity;
        const db = this.projectedEndDate(b.s)?.getTime() ?? Infinity;
        if (da !== db) return da - db;
        return this.safeName(a.s).localeCompare(this.safeName(b.s));
        });
    },


    neededActiveCountFor60() {
      const baseE = this.whatIfExitersTotal;
      const baseC = this.whatIfCompletersTotal;

      if (!baseE) return 0;

      const greens = this.projectionCandidates.filter(x => this.bucketFromChance(x.p) === 'green');

      const rateIfAllGreens =
        (baseE + greens.length) ? ((baseC + greens.length) / (baseE + greens.length)) : null;

      if (Number.isFinite(rateIfAllGreens) && rateIfAllGreens >= 0.60) return greens.length;

      let add = 0;
      for (let i = 0; i < this.projectionCandidates.length; i++) {
        add += 1;
        const denom = baseE + add;
        const num = baseC + add;
        if (denom > 0 && (num / denom) >= 0.60) return add;
      }
      return this.projectionCandidates.length;
    },

    // ACTIVE rows: sorted by projected end date then name
    visibleActiveRows() {
      const rows = this.activeStudents.slice().sort((a, b) => {
        const da = this.projectedEndDate(a)?.getTime() ?? Infinity;
        const db = this.projectedEndDate(b)?.getTime() ?? Infinity;
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
        if (da !== db) return db - da; // newest first

        return this.safeName(a).localeCompare(this.safeName(b));
      });

      this.tableFinished.setRows(rows);
      return this.tableFinished.getSortedRows();
    },

    barSegmentsProjected() {
      const segs = [];

      const exitersCompleters = this.exiters.filter(s => !!s?.is_completer);
      const exitersNon = this.exiters.filter(s => !s?.is_completer);

      const keyFor = (prefix, s, i) => `${prefix}-${s?.sis_user_id ?? s?.id ?? i}`;

      // Completer exiters (faded green)
      for (let i = 0; i < exitersCompleters.length; i++) {
        const s = exitersCompleters[i];
        segs.push({
          key: keyFor('done-ok', s, i),
          color: this.colors.green,
          opacity: 0.35,
          title: `${this.displayName(s)}: Completed (exiter)`
        });
      }

      const baseE = this.whatIfExitersTotal;
      const baseC = this.whatIfCompletersTotal;

      const greens = this.projectionCandidates.filter(x => this.bucketFromChance(x.p) === 'green');
      const rest = this.projectionCandidates.filter(x => this.bucketFromChance(x.p) !== 'green');

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

      // Render chosen candidates as SOLID segments, colored by chance bucket
      for (let i = 0; i < chosen.length; i++) {
        const s = chosen[i].s;
        const p = chosen[i].p;

        const b = this.bucketFromChance(p);
        const color =
          (b === 'green') ? this.colors.green :
          (b === 'yellow') ? this.colors.yellow :
          (b === 'orange') ? this.colors.orange :
          this.colors.red;

        segs.push({
          key: keyFor(`proj-${b}`, s, i),
          color,
          opacity: 1,
          title: `${this.displayName(s)}: ${this.bucketLabelFromChance(p)}`
        });
      }

      // Actual non-completer exiters LAST (gray)
      for (let i = 0; i < exitersNon.length; i++) {
        const s = exitersNon[i];
        segs.push({
          key: keyFor('done-bad', s, i),
          color: this.colors.gray,
          opacity: 1,
          title: `${this.displayName(s)}: Did not complete (exiter)`
        });
      }

      // Hypothetical drops as additional gray segments
      const drops = Math.max(0, Number(this.whatIfDrops) || 0);
      for (let i = 0; i < drops; i++) {
        segs.push({
          key: 'whatif-drop-' + i,
          color: this.colors.gray,
          opacity: 0.9,
          title: `What-if exiter (non-completer) #${i + 1}`
        });
      }

      return segs;
    }
  },

  methods: {
    // ---------- tiny helpers ----------
    safeName(s) {
      return (s?.name ?? '').toLowerCase();
    },

    displayName(s) {
      if (this.anonymous) return 'STUDENT';
      // New schema may not include name; fall back to SIS id
      return (s?.name ?? (s?.sis_user_id != null ? `SIS ${s.sis_user_id}` : 'Student'));
    },

    safeProb(v) {
      const n = Number(v);
      return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : NaN;
    },

    // Chance->bucket mapping (client-side thresholds only)
    bucketFromChance(p) {
      const n = this.safeProb(p);
      if (!Number.isFinite(n)) return null;
      if (n >= 0.80) return 'green';
      if (n >= 0.50) return 'yellow';
      if (n >= 0.20) return 'orange';
      return 'red';
    },

    bucketLabelFromChance(p) {
      const b = this.bucketFromChance(p);
      return (
        b === 'green'  ? 'Likely complete this year' :
        b === 'yellow' ? 'Possible complete this year' :
        b === 'orange' ? 'Unlikely this year' :
        'Very unlikely this year'
      );
    },
    escapeHtml(str) {
        return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    },


    // ---------- column factories ----------
    makeStudentColumn() {
        return new window.ReportColumn(
            'Student',
            'Student name (or SIS id if name not provided).',
            '16rem',
            false,
            'string',
            s => {
            const labelRaw = this.displayName(s);
            const label = this.escapeHtml(labelRaw);

            const id = s?.canvas_user_id; // or change to sis_user_id if that's what you have
            if (!id) return label;

            // open in new tab, and keep it safe
            return `<a href="/users/${encodeURIComponent(id)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
            },
            null,
            s => (s?.name ?? String(s?.sis_user_id ?? '')) // sort value stays plain text
        );
        },

    

    makeStatusColumn(mode) {
      const desc =
        (mode === 'active')
          ? '● green/yellow/orange/red based on chance_to_complete. Blank = no score.'
          : '● green = completer, ● gray = non-completer exiter.';

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

    // ---------- merged End column ----------
    endDateText(s, { mode }) {
      if (!s) return 'n/a';
      if (mode === 'finished') return s?.exit_date ? this.dateOrDash(s.exit_date) : '—';
      return s?.projected_exit_date ? this.dateOrDash(s.projected_exit_date) : 'n/a';
    },

    endDateSortValue(s, { mode }) {
      if (!s) return Infinity;
      if (mode === 'finished') return this.actualEndDate(s)?.getTime() ?? Infinity;
      return this.projectedEndDate(s)?.getTime() ?? Infinity;
    },

    endDatePillStyle(s, { mode }) {
      if (!s) return { backgroundColor: this.colors.gray, color: this.colors.black };

      if (mode === 'finished') {
        if (!s?.exit_date) return { backgroundColor: 'transparent', color: this.colors.black };
        return {
          backgroundColor: s?.is_completer ? this.colors.green : this.colors.gray,
          color: s?.is_completer ? this.colors.white : this.colors.black,
          opacity: 0.85
        };
      }

      const b = this.bucketFromChance(s?.chance_to_complete);
      if (!b) return { backgroundColor: this.colors.gray, color: this.colors.black };

      const map = { green: this.colors.green, yellow: this.colors.yellow, orange: this.colors.orange, red: this.colors.red };
      return { backgroundColor: map[b], color: this.colors.white };
    },

    chancePillStyle(s) {
      const b = this.bucketFromChance(s?.chance_to_complete);
      if (!b) return { backgroundColor: this.colors.gray, color: this.colors.black };
      const map = { green: this.colors.green, yellow: this.colors.yellow, orange: this.colors.orange, red: this.colors.red };
      const fg = (b === 'yellow' || b === 'orange') ? this.colors.black : this.colors.white;
      return { backgroundColor: map[b], color: fg };
    },

    // ---------- status dot ----------
    statusDotColor(s, { mode }) {
      if (!s) return null;

      if (mode === 'finished') {
        if (!s?.exit_date && !s?.is_exited) return null;
        return s?.is_completer ? this.colors.green : this.colors.gray;
      }

      const b = this.bucketFromChance(s?.chance_to_complete);
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
      if (mode === 'active') {
        if (c === this.colors.red) return 1;
        if (c === this.colors.orange) return 2;
        if (c === this.colors.yellow) return 3;
        if (c === this.colors.green) return 4;
        return 9;
      }
      if (c === this.colors.gray) return 1;
      if (c === this.colors.green) return 2;
      return 9;
    },

    finishedBucketWeight(s) {
      // completers above non-completers; missing exit_date bottom
      if (!s?.exit_date && !s?.is_exited) return 9;
      return s?.is_completer ? 0 : 1;
    },

    // ---------- divider ----------
    activeRowDividerStyle(_s, idx, rows) {
      const n = Number(this.neededActiveCountFor60);
      if (!Number.isFinite(n) || n <= 0) return {};
      if (!Array.isArray(rows) || rows.length === 0) return {};
      if (idx === n) return { borderTop: '4px solid rgba(0,0,0,0.75)' };
      return {};
    }
  },

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
    <div class="btech-row" style="align-items:center; margin-bottom:10px;">
      <h4 class="btech-card-title" style="margin:0;">Completion Diagnostic</h4>
      <div style="flex:1;"></div>
    </div>

    <div v-if="loading" class="btech-muted" style="text-align:center; padding:10px;">
      Loading students…
    </div>

    <div v-else>
      <div style="display:grid; grid-template-columns: auto 12rem; gap:10px; align-items:start; margin-bottom:12px;">
        <div>
          <div style="position:relative; height:18px; border-radius:10px; overflow:hidden; background:#F2F2F2;">
            <div style="position:absolute; inset:0; display:flex;">
            <div
            v-for="seg in (barSegmentsProjectedSafe || []).filter(x => x && x.key)"
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
        </div>

        <div>
          <span style="display:inline-flex; align-items:center; gap:6px;">
            What-if drop:
            <button
              type="button"
              style="width:22px;height:22px;border-radius:6px;"
              @click="whatIfDrops = Math.max(0, whatIfDrops - 1)"
              :disabled="whatIfDrops <= 0"
              title="Remove hypothetical non-completer exiter"
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
        </div>
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
        :key="'a-' + (s.sis_user_id || s.id || i)"
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

      <!-- FINISHED TABLE -->
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
        :key="'f-' + (s.sis_user_id || s.id || i)"
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
        Score + projected dates are computed server-side. This view renders and simulates “what-if exiters.”
      </div>
    </div>
  </div>
  `
});
