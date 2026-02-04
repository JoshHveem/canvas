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

    // ---- placements compute (aligned with reports-program-placements) ----
    computeForProgram(p) {
      const target = 0.70;

      // Expectation: program row includes a students array (like completion computeProgram does).
      // If yours uses a different key, swap here.
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

        // Filter out: exited but NOT a completer (your newest requirement)
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

      // Choose the “first N” notPlaced that represent the needed placements,
      // using the same ordering idea as the placements bar (worst-case-ish).
      // We’ll rank by status severity first, then name.
      const severity = (s) => {
        const k = this.placementStatusKey(s, { cutoff, actualEndDate, projectedEndDate });
        if (k === 'stale-completer') return 1; // red
        if (k === 'completer') return 2;       // orange
        if (k === 'projected-soon') return 3;  // yellow
        if (k === 'not-completer') return 4;   // gray
        return 9;
      };

      const neededCandidates = notPlaced.slice().sort((a, b) => {
        const sa = severity(a), sb = severity(b);
        if (sa !== sb) return sa - sb;
        return (a?.name ?? '').localeCompare((b?.name ?? ''));
      });

      const barChosen = neededCandidates.slice(0, neededMin);

      // status bucket = color of the last student needed to hit 70%
      let statusKey = 'not-completer';
      if (denom && (num / denom) >= target) {
        statusKey = 'placed';
      } else if (barChosen.length) {
        statusKey = this.placementStatusKey(barChosen[barChosen.length - 1], { cutoff, actualEndDate, projectedEndDate });
      } else {
        // if denom>0 but no candidates, treat as worst-case gray
        statusKey = 'not-completer';
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

    // ---- placement status logic (same semantics as placements component) ----
    monthsSince(d) {
      if (!d) return null;
      const now = new Date();
      const ms = now.getTime() - d.getTime();
      return ms / (1000 * 60 * 60 * 24 * 30.4375);
    },

    placementStatusKey(s, { cutoff, actualEndDate, projectedEndDate } = {}) {
      if (!s) return 'none';

      if (s.excused_status) return 'excused';
      if (s.is_placement) return 'placed';

      // completed but not placed
      if (s.is_completer && (s.is_exited || s.exit_date)) {
        const d = actualEndDate ? actualEndDate(s) : null;
        const m = this.monthsSince(d);
        if (Number.isFinite(m) && m > 3) return 'stale-completer'; // red
        return 'completer'; // orange
      }

      // projected before cutoff, not a completer yet
      const cd = cutoff || null;
      const pd = projectedEndDate ? projectedEndDate(s) : null;
      if (!s.is_completer && cd && pd && pd.getTime() < cd.getTime()) return 'projected-soon'; // yellow

      return 'not-completer'; // gray
    },

    placementStatusColorFromKey(k) {
      if (k === 'placed') return this.colors.green;
      if (k === 'stale-completer') return this.colors.red;
      if (k === 'completer') return this.colors.orange;
      if (k === 'projected-soon') return this.colors.yellow;
      return this.colors.gray;
    },

    // ---- program-level status (dot + sorting) ----
    statusKeyForProgram(p) {
      return this.computeForProgram(p).statusKey ?? 'not-completer';
    },

    statusSortValueForProgram(p) {
      const k = this.statusKeyForProgram(p);
      if (k === 'stale-completer') return 1;
      if (k === 'completer') return 5;
      if (k === 'projected-soon') return 4;
      if (k === 'not-completer') return 3;
      if (k === 'placed') return 2;
      return 9;
    },

    statusDotHtmlForProgram(p) {
      const k = this.statusKeyForProgram(p);
      const c = this.placementStatusColorFromKey(k);
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

    // ---- pill style for placement rate ----
    placementPillStyleForProgram(p) {
      const r = this.currentRateForProgram(p);
      if (!Number.isFinite(r)) return { backgroundColor: 'transparent', color: this.colors.black };

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
        // Same “reads nicely” ordering as your placements bar
        if (k === 'placed') return 1;
        if (k === 'stale-completer') return 5;
        if (k === 'completer') return 4;
        if (k === 'projected-soon') return 3;
        if (k === 'not-completer') return 2;
        return 9;
      };

      const sorted = list.slice().sort((a, b) => {
        const wa = orderWeight(a), wb = orderWeight(b);
        if (wa !== wb) return wa - wb;
        return (a?.name ?? '').localeCompare((b?.name ?? ''));
      });

      const segs = [];
      const progKey = String(p?.program_id ?? p?.programId ?? p?.id ?? p?.account_id ?? p?.name ?? 'p');

      for (let i = 0; i < sorted.length; i++) {
        const s = sorted[i];
        const k = this.placementStatusKey(s, { cutoff, actualEndDate, projectedEndDate });
        const color = this.placementStatusColorFromKey(k);
        const title =
          (k === 'placed') ? 'Placed' :
          (k === 'stale-completer') ? 'Completed > 3 months ago (not placed)' :
          (k === 'completer') ? 'Completed (not placed)' :
          (k === 'projected-soon') ? 'Projected to finish before July 1 (not a completer yet)' :
          'Not a completer (later / unknown finish)';

        segs.push({
          key: `pl-${progKey}-${s?.sis_user_id ?? s?.id ?? i}`,
          color,
          opacity: 1,
          title: `${studentLabel(s)}: ${title}`
        });
      }

      return segs;
    },

    placementBarHtmlForProgram(p) {
      const segs = this.placementSegmentsForProgram(p);

      const marker = `
        <div
          style="
            position:absolute;
            left:70%;
            top:-3px;
            bottom:-3px;
            width:2px;
            background:${this.colors.black};
            opacity:0.6;
          "
          title="70% placement goal"
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
