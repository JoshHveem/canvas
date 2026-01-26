// programs-completion-overview.js
Vue.component('programs-completion', {
  props: {
    year: { type: [Number, String], required: true },
    anonymous: { type: Boolean, default: false },
    programs: { type: Array, required: true },
    loading: { type: Boolean, default: false }
  },

  data() {
    const colors = (window.bridgetools?.colors) || {
      red:'#b20b0f', orange:'#f59e0b', yellow:'#eab308',
      green:'#16a34a', gray:'#e5e7eb', black:'#111827', white:'#fff'
    };

    const table = new window.ReportTable({
      rows: [],
      columns: [],
      sort_column: "Program",
      sort_dir: 1,
      colors
    });

    return { colors, table, tableTick: 0 };
  },

  created() {
    console.log(this.programs);

    this.table.setColumns([
      new window.ReportColumn(
        'Status', 'Worst-case color of the last student needed to get above 60%.', '3.5rem', false, 'string',
        p => this.statusDotHtmlForProgram(p),
        null,
        p => this.statusSortValueForProgram(p)
      ),

      new window.ReportColumn(
        'Program', 'Program name.', '16rem', false, 'string',
        p => this.anonymous ? 'PROGRAM' : (p?.name ?? ''),
        null,
        p => (p?.name ?? '')
      ),

      new window.ReportColumn(
        'Campus', 'Campus name.', '5rem', false, 'string',
        p => p?.campus,
        null,
        p => (p?.campus ?? '')
      ),

      new window.ReportColumn(
        'Completion', 'Current completion rate (computed from exited students).', '4rem', false, 'string',
        p => {
            const r = this.currentRateForProgram(p);
            return Number.isFinite(r) ? (r * 100).toFixed(1) + '%' : '—';
        },
        null,
        p => this.currentRateForProgram(p) ?? -1
        ),

      new window.ReportColumn(
        'Needed', 'How many additional projected completers are required to reach 60%.', '5.5rem', false, 'number',
        p => String(this.neededCountForProgram(p)),
        s => {
          const n = this.neededCountForProgram(s);
          if (!Number.isFinite(n)) return {};
          return n <= 0
            ? { backgroundColor: this.colors.green, color: this.colors.white }
            : { backgroundColor: this.colors.yellow, color: this.colors.black };
        },
        p => Number(this.neededCountForProgram(p) ?? 9999)
      ),

      new window.ReportColumn(
        'Completion Bar', 'Exiters + minimal projected completers needed to clear 60%.', '24rem', false, 'string',
        p => this.completionBarHtmlForProgram(p),
        null,
        p => this.statusSortValueForProgram(p)
      )
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
    // ---- ReportTable plumbing ----
    getColumnsWidthsString() { return this.table.getColumnsWidthsString(); },
    setSortColumn(name) { this.table.setSortColumn(name); this.tableTick++; },

    // ---- helpers (students) ----
    programStudents(p) {
      // No fallback sample data anymore; real data only.
      const s = p?.completion?.students ?? p?.students ?? [];
      return Array.isArray(s) ? s : [];
    },

    safeProb(v) {
      const n = Number(v);
      return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : NaN;
    },

    bucketFromChance(prob) {
      const n = this.safeProb(prob);
      if (!Number.isFinite(n)) return null;
      if (n >= 0.80) return 'green';
      if (n >= 0.50) return 'yellow';
      if (n >= 0.20) return 'orange';
      return 'red';
    },

    bucketColor(b) {
      if (b === 'green') return this.colors.green;
      if (b === 'yellow') return this.colors.yellow;
      if (b === 'orange') return this.colors.orange;
      if (b === 'red') return this.colors.red;
      return this.colors.gray;
    },

    // Candidates are actives with a usable probability score (NEW schema)
    projectionCandidatesForProgram(p) {
      const students = this.programStudents(p);

      return students
        .filter(s => !s?.is_exited) // active only (new schema)
        .map(s => {
          const prob = this.safeProb(s?.chance_to_complete);
          return { s, prob };
        })
        .filter(x => Number.isFinite(x.prob))
        .sort((a, b) => b.prob - a.prob); // highest chance first
    },

    // KPI base counts come from explicit flags (NEW schema)
    exiterCountsForProgram(p) {
      const students = this.programStudents(p);
      const exiters = students.filter(s => !!s?.is_exited);
      const completers = exiters.filter(s => !!s?.is_completer);
      const nonCompleters = exiters.filter(s => !s?.is_completer);
      return { exiters, completers, nonCompleters };
    },

    currentRateForProgram(p) {
    // Use the SAME base used by Needed/Status: exited students only.
    const { exiters, completers } = this.exiterCountsForProgram(p);
    const denom = exiters.length;
    return denom ? (completers.length / denom) : null;
    },


    // ---- core business: how many needed ----
    neededCountForProgram(p) {
    const { exiters, completers } = this.exiterCountsForProgram(p);
    const baseE = exiters.length;
    const baseC = completers.length;

    // If there are no exiters, KPI undefined; treat as 0 needed.
    if (!baseE) return 0;

    // ✅ IMPORTANT: if already meeting 60%, need 0.
    const current = baseC / baseE;
    if (current >= 0.60) return 0;

    const candidates = this.projectionCandidatesForProgram(p);
    if (!candidates.length) return 0;

    // Minimum add such that (baseC + add) / (baseE + add) >= 0.60
    let add = 0;
    for (let i = 0; i < candidates.length; i++) {
        add += 1;
        const denom = baseE + add;
        const num = baseC + add;
        if (denom > 0 && (num / denom) >= 0.60) return add;
    }

    return candidates.length;
    },

    statusBucketForProgram(p) {
      const needed = this.neededCountForProgram(p);
      if (!Number.isFinite(needed) || needed <= 0) return 'green';

      const candidates = this.projectionCandidatesForProgram(p);
      if (!candidates.length) return 'red';

      // bucket of the LAST student you need to include
      const last = candidates[Math.min(needed, candidates.length) - 1];
      const b = this.bucketFromChance(last?.prob);
      return b || 'red';
    },

    statusSortValueForProgram(p) {
      const b = this.statusBucketForProgram(p);
      if (b === 'red') return 1;
      if (b === 'orange') return 2;
      if (b === 'yellow') return 3;
      if (b === 'green') return 4;
      return 9;
    },

    statusDotHtmlForProgram(p) {
      const b = this.statusBucketForProgram(p);
      const c = this.bucketColor(b);
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

    // ---- bar rendering per program ----
    completionSegmentsForProgram(p) {
      const segs = [];
      const { completers, nonCompleters, exiters } = this.exiterCountsForProgram(p);

      const studentLabel = (s) => {
        if (this.anonymous) return 'STUDENT';
        // new schema may not include name
        return s?.name ?? (s?.sis_user_id != null ? `SIS ${s.sis_user_id}` : 'Student');
      };

      const keyFor = (prefix, s, i) => `${prefix}-${s?.sis_user_id ?? s?.id ?? i}`;

      // Completer exiters: faded green
      for (let i = 0; i < completers.length; i++) {
        const s = completers[i];
        segs.push({
          key: keyFor('done-ok', s, i),
          color: this.colors.green,
          opacity: 0.35,
          title: `${studentLabel(s)}: Completed (exiter)`
        });
      }

      const candidates = this.projectionCandidatesForProgram(p);
      const needed = this.neededCountForProgram(p);

      // chosen projected completers (needed count), colored by chance bucket
      for (let i = 0; i < Math.min(needed, candidates.length); i++) {
        const { s, prob } = candidates[i];
        const b = this.bucketFromChance(prob);
        segs.push({
          key: keyFor('proj', s, i),
          color: this.bucketColor(b),
          opacity: 1,
          title: `${studentLabel(s)}: ${
            b === 'green' ? 'Likely complete' :
            b === 'yellow' ? 'Possible complete' :
            b === 'orange' ? 'Unlikely complete' :
            'Very unlikely complete'
          }`
        });
      }

      // Non-completer exiters LAST: gray
      for (let i = 0; i < nonCompleters.length; i++) {
        const s = nonCompleters[i];
        segs.push({
          key: keyFor('done-bad', s, i),
          color: this.colors.gray,
          opacity: 1,
          title: `${studentLabel(s)}: Did not complete (exiter)`
        });
      }

      return segs;
    },

    completionBarHtmlForProgram(p) {
      const segs = this.completionSegmentsForProgram(p);

      const marker = `
        <div
          style="
            position:absolute;
            left:60%;
            top:-3px;
            bottom:-3px;
            width:2px;
            background:${this.colors.black};
            opacity:0.6;
          "
          title="60% requirement"
        ></div>
      `;

      const inner = segs.map(seg => `
        <div
          title="${this.escapeHtml(seg.title)}"
          style="
            flex:1 1 0;
            background:${seg.color};
            opacity:${seg.opacity};
            border-right:1px solid rgba(255,255,255,0.6);
          "
        ></div>
      `).join('');

      return `
        <div style="position:relative; height:14px; border-radius:10px; overflow:hidden; background:#F2F2F2;">
          <div style="position:absolute; inset:0; display:flex;">${inner}</div>
          ${marker}
        </div>
      `;
    },

    escapeHtml(str) {
      return String(str ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
    }
  },

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
    <div class="btech-row" style="align-items:center; margin-bottom:8px;">
      <h4 class="btech-card-title" style="margin:0;">Completion – All Programs</h4>
      <div style="flex:1;"></div>
      <span class="btech-pill" style="margin-left:8px;">Year: {{ year }}</span>
      <span class="btech-pill" style="margin-left:8px;">Rows: {{ visibleRows.length }}</span>
    </div>

    <div v-if="loading" class="btech-muted" style="text-align:center; padding:10px;">
      Loading programs…
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
        v-for="(program, i) in visibleRows"
        :key="program.program_id || program.programId || program.id || program.account_id || i"
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
            :style="col.get_style(program)"
            v-html="col.getContent(program)"
          ></span>
        </div>
      </div>
    </div>
  </div>
  `
});
