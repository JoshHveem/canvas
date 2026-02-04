// programs-placements.js
Vue.component('reports-programs-placements', {
  props: {
    year: { type: [Number, String], required: true },
    anonymous: { type: Boolean, default: false },
    programs: { type: Array, required: true },
    loading: { type: Boolean, default: false }
  },

  data() {
    const colors = (window.bridgetools?.colors) || {
      red:'#b20b0f', orange:'#f59e0b', yellow:'#eab308',
      green:'#16a34a', gray:'#e5e7eb', darkGray:'#6b7280',
      black:'#111827', white:'#fff'
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
    this.table.setColumns([
      new window.ReportColumn(
        'Status',
        'Worst-case color of the last student needed to get above 70%.',
        '3.5rem', false, 'string',
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
        'Placement',
        'Current placement rate (placed / barStudents). Excused excluded.',
        '6rem', false, 'string',
        p => {
          const r = this.currentRateForProgram(p);
          return Number.isFinite(r) ? (r * 100).toFixed(1) + '%' : '—';
        },
        p => this.placementPillStyleForProgram(p),
        p => this.currentRateForProgram(p) ?? -1
      ),

      new window.ReportColumn(
        'Needed',
        'How many additional placements are required to reach 70%.',
        '5.5rem', false, 'number',
        p => String(this.neededCountForProgram(p)),
        p => {
          const n = this.neededCountForProgram(p);
          if (!Number.isFinite(n)) return {};
          return n <= 0
            ? { backgroundColor: this.colors.green, color: this.colors.white }
            : { backgroundColor: this.colors.yellow, color: this.colors.black };
        },
        p => Number(this.neededCountForProgram(p) ?? 9999)
      ),

      new window.ReportColumn(
        'Placement Bar',
        'Bar students colored by placement status; marker at 70%.',
        '24rem', false, 'string',
        p => this.placementBarHtmlForProgram(p),
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

  // --- time helpers ---
  monthsSince(d) {
    if (!d) return null;
    const now = new Date();
    const ms = now.getTime() - d.getTime();
    return ms / (1000 * 60 * 60 * 24 * 30.4375);
  },

  // Key for *bar coloring*, includes "recent/mid/old completer" buckets
  placementStatusKey(s, { cutoff, actualEndDate, projectedEndDate } = {}) {
    if (!s) return 'none';

    if (s.excused_status) return 'excused';
    if (s.is_placement) return 'placed';

    const ad = actualEndDate ? actualEndDate(s) : null;
    const pd = projectedEndDate ? projectedEndDate(s) : null;

    // locked-in completers (not placed)
    if (s.is_completer && (s.is_exited || s.exit_date)) {
      const m = this.monthsSince(ad);
      if (!Number.isFinite(m)) return 'comp-old';
      if (m < 3) return 'comp-recent';  // yellow (faded)
      if (m < 6) return 'comp-mid';     // orange (faded)
      return 'comp-old';                // red (faded)
    }

    // on-track-to-finish (actionable)
    if (!s.is_completer && cutoff && pd && pd.getTime() < cutoff.getTime()) {
      return 'on-track'; // yellow (NOT faded)
    }

    return 'other'; // gray (NOT faded)
  },

  placementStatusColorFromKey(k) {
    if (k === 'placed') return this.colors.green;

    // completers: color encodes recency buckets
    if (k === 'comp-recent') return this.colors.yellow; // <3mo
    if (k === 'comp-mid') return this.colors.orange;    // <6mo
    if (k === 'comp-old') return this.colors.red;       // >=6mo

    // actionable on-track
    if (k === 'on-track') return this.colors.yellow;

    // other non-completers
    if (k === 'other') return this.colors.gray;

    // excused/none
    return this.colors.gray;
  },

  // fade only locked-in completers
  placementStatusOpacityFromKey(k) {
    if (k === 'placed' || k === 'comp-recent' || k === 'comp-mid' || k === 'comp-old') return 0.38;
    return 1;
  },

  placementStatusTitleFromKey(k) {
    if (k === 'placed') return 'Placed';
    if (k === 'comp-recent') return 'Completed < 3 months ago (not placed)';
    if (k === 'comp-mid') return 'Completed < 6 months ago (not placed)';
    if (k === 'comp-old') return 'Completed ≥ 6 months ago (not placed)';
    if (k === 'on-track') return 'On track to finish before July 1 (not a completer yet)';
    if (k === 'other') return 'Not a completer (later / unknown finish)';
    return '—';
  },

  // ---- placements compute (aligned with reports-program-placements) ----
  computeForProgram(p) {
    const target = 0.70;

    const students = Array.isArray(p?.students) ? p.students : [];

    const y = Number(this.year) || null;
    const start = y ? new Date(Date.UTC(y, 6, 1)) : null;       // Jul 1, y
    const end = y ? new Date(Date.UTC(y + 1, 6, 1)) : null;     // Jul 1, y+1 (exclusive)
    const cutoff = y ? new Date(Date.UTC(y + 1, 6, 1)) : null;  // Jul 1, y+1

    const projectedEndDate = (s) => {
      if (!s?.projected_exit_date) return null;
      const d = new Date(s.projected_exit_date);
      return Number.isNaN(d.getTime()) ? null : d;
    };
    const actualEndDate = (s) => {
      if (!s?.exit_date) return null;
      const d = new Date(s.exit_date);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const isInAcademicYear = (s) => {
      if (!start || !end) return false;
      const d = projectedEndDate(s);
      if (!d) return false;
      const t = d.getTime();
      return t >= start.getTime() && t < end.getTime();
    };

    // includedStudents (same gate as your placements component)
    const included = students.filter(s => {
      if (!s) return false;

      // Filter out: exited but NOT a completer
      if (!!s.is_exited && !s.is_completer) return false;

      return (
        !!s.is_completer ||
        !!s.is_placement ||
        !!s.excused_status ||
        isInAcademicYear(s)
      );
    });

    // barStudents = included minus excused
    const barStudents = included.filter(s => !!s && !s.excused_status);

    const placed = barStudents.filter(s => !!s.is_placement);
    const notPlaced = barStudents.filter(s => !s.is_placement);

    const denom = barStudents.length;
    const num = placed.length;
    const currentRate = denom ? (num / denom) : null;

    // needed placements to reach >= 70%
    const neededMin = denom
      ? Math.max(0, Math.min(notPlaced.length, Math.ceil((target * denom) - num)))
      : 0;

    // Choose candidates for “needed” in a way that communicates confidence:
    // on-track first, then other (risk).
    const kFor = (s) => this.placementStatusKey(s, { cutoff, actualEndDate, projectedEndDate });

    const candWeight = (s) => {
      const k = kFor(s);
      if (k === 'on-track') return 1;
      if (k === 'other') return 2;
      // shove completers to end if they ever appear here
      if (k.startsWith('comp-')) return 9;
      return 9;
    };

    const neededCandidates = notPlaced.slice().sort((a, b) => {
      const wa = candWeight(a), wb = candWeight(b);
      if (wa !== wb) return wa - wb;
      return (a?.name ?? '').localeCompare((b?.name ?? ''));
    });

    const barChosen = neededCandidates.slice(0, neededMin);

    // Program status for dot: actionable risk signal
    let statusKey = 'placed';
    if (denom && (num / denom) >= target) {
      statusKey = 'placed';
    } else if (barChosen.length) {
      statusKey = barChosen.some(s => kFor(s) === 'other') ? 'other' : 'on-track';
    } else {
      statusKey = 'other';
    }

    return {
      included,
      barStudents,
      placed,
      notPlaced,
      currentRate,
      neededMin,
      barChosen,
      statusKey,
      cutoff
    };
  },

  currentRateForProgram(p) {
    const info = this.computeForProgram(p);
    return Number.isFinite(info?.currentRate) ? info.currentRate : null;
  },

  neededCountForProgram(p) {
    return this.computeForProgram(p).neededMin ?? 0;
  },

  // ---- program-level status (dot + sorting) ----
  statusKeyForProgram(p) {
    return this.computeForProgram(p).statusKey ?? 'other';
  },

  statusSortValueForProgram(p) {
    const k = this.statusKeyForProgram(p);
    if (k === 'other') return 1;      // needs attention
    if (k === 'on-track') return 2;   // likely ok
    if (k === 'placed') return 3;     // already >=70
    return 9;
  },

  statusDotHtmlForProgram(p) {
    const k = this.statusKeyForProgram(p);

    const c =
      (k === 'placed') ? this.colors.green :
      (k === 'on-track') ? this.colors.yellow :
      this.colors.gray;

    const title =
      (k === 'placed') ? 'At/above 70% placement' :
      (k === 'on-track') ? 'On track to reach 70% with projected finishers' :
      'Needs attention: would require non-on-track students to reach 70%';

    return `
      <span title="${this.escapeHtml(title)}" style="
        display:inline-block;width:10px;height:10px;border-radius:999px;
        background:${c};box-shadow:0 0 0 1px rgba(0,0,0,.12);vertical-align:middle;
      "></span>
    `;
  },

  // ---- pill style for placement rate ----
  placementPillStyleForProgram(p) {
    const r = this.currentRateForProgram(p);
    if (!Number.isFinite(r)) return { backgroundColor: 'transparent', color: this.colors.black };

    // optional: make truly “bad” look bad
    if (r < 0.70 && this.statusKeyForProgram(p) === 'other') {
      return { backgroundColor: this.colors.red, color: this.colors.white };
    }

    if (r < 0.70) return { backgroundColor: this.colors.yellow, color: this.colors.black };
    return { backgroundColor: this.colors.green, color: this.colors.white };
  },

  // ---- bar segments ----
  placementSegmentsForProgram(p) {
    const info = this.computeForProgram(p);
    const list = Array.isArray(info?.barStudents) ? info.barStudents : [];

    const studentLabel = (s) => {
      if (this.anonymous) return 'STUDENT';
      return s?.name ?? (s?.sis_user_id != null ? `SIS ${s.sis_user_id}` : 'Student');
    };

    const projectedEndDate = (s) => {
      if (!s?.projected_exit_date) return null;
      const d = new Date(s.projected_exit_date);
      return Number.isNaN(d.getTime()) ? null : d;
    };
    const actualEndDate = (s) => {
      if (!s?.exit_date) return null;
      const d = new Date(s.exit_date);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    const cutoff = info?.cutoff || null;

    const orderWeight = (s) => {
      const k = this.placementStatusKey(s, { cutoff, actualEndDate, projectedEndDate });
      if (k === 'placed') return 1;
      if (k === 'on-track') return 2;
      if (k === 'other') return 3;
      if (k === 'comp-recent') return 4;
      if (k === 'comp-mid') return 5;
      if (k === 'comp-old') return 6;
      return 9;
    };

    const sorted = list.slice().sort((a, b) => {
      const ka = this.placementStatusKey(a, { cutoff, actualEndDate, projectedEndDate });
      const kb = this.placementStatusKey(b, { cutoff, actualEndDate, projectedEndDate });

      const wa = orderWeight(a), wb = orderWeight(b);
      if (wa !== wb) return wa - wb;

      const aIsComp = ka && ka.startsWith('comp-');
      const bIsComp = kb && kb.startsWith('comp-');

      // completers: newest first
      if (aIsComp && bIsComp) {
        const da = actualEndDate(a)?.getTime() ?? -Infinity;
        const db = actualEndDate(b)?.getTime() ?? -Infinity;
        if (da !== db) return db - da;
      }

      return (a?.name ?? '').localeCompare((b?.name ?? ''));
    });

    const segs = [];
    const progKey = String(p?.program_id ?? p?.programId ?? p?.id ?? p?.account_id ?? p?.name ?? 'p');

    for (let i = 0; i < sorted.length; i++) {
      const s = sorted[i];
      const k = this.placementStatusKey(s, { cutoff, actualEndDate, projectedEndDate });
      const color = this.placementStatusColorFromKey(k);
      const opacity = this.placementStatusOpacityFromKey(k);
      const title = this.placementStatusTitleFromKey(k);

      segs.push({
        key: `pl-${progKey}-${s?.sis_user_id ?? s?.id ?? i}`,
        color,
        opacity,
        title: `${studentLabel(s)}: ${title}`
      });
    }

    return segs;
  },

  placementBarHtmlForProgram(p) {
    const segs = this.placementSegmentsForProgram(p);

    const marker = `
      <div style="
        position:absolute; left:70%;
        top:-3px; bottom:-3px;
        width:2px; background:${this.colors.black}; opacity:0.6;
      " title="70% placement goal"></div>
    `;

    const inner = segs.map(seg => `
      <div title="${this.escapeHtml(seg.title)}" style="
        flex:1 1 0;
        background:${seg.color};
        opacity:${seg.opacity};
        border-right:1px solid rgba(255,255,255,0.6);
      "></div>
    `).join('');

    return `
      <div style="position:relative; height:14px; border-radius:10px; overflow:hidden; background:#F2F2F2;">
        <div style="position:absolute; inset:0; display:flex;">${inner}</div>
        ${marker}
      </div>
    `;
  },

  emitDrill(p) {
    this.$emit('drill-program', {
      program: String(p?.program ?? p?.program_code ?? p?.name ?? '').trim(),
      campus: String(p?.campus ?? '').trim(),
      row: p
    });
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
      <h4 class="btech-card-title" style="margin:0;">Placement – All Programs</h4>
      <div style="flex:1;"></div>
      <span class="btech-pill" style="margin-left:8px;">Year: {{ year }}</span>
      <span class="btech-pill" style="margin-left:8px;">Rows: {{ visibleRows.length }}</span>
    </div>

    <div v-if="loading" class="btech-muted" style="text-align:center; padding:10px;">
      Loading programs…
    </div>

    <div v-else>
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

      <div
        v-for="(program, i) in visibleRows"
        :key="program.program_id || program.programId || program.id || program.account_id || i"
        @click="emitDrill(program)"
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
