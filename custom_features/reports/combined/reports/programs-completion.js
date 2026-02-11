// programs-completion.js
Vue.component('reports-programs-completion', {
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
        'Completion', 'Current completion rate (computed from exited students).', '6rem', false, 'string',
        p => {
          const r = this.currentRateForProgram(p);
          return Number.isFinite(r) ? (r * 100).toFixed(1) + '%' : '—';
        },
        p => this.completionPillStyleForProgram(p),
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
        'Completion Bar', 'Exiters + projected completers chosen to clear 60%.', '24rem', false, 'string',
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
    minNeeded(E, C, candidates, target) {
  const e = Number(E) || 0;
  const c = Number(C) || 0;
  const t = Number.isFinite(Number(target)) ? Number(target) : 0.60;
  if (!e) return 0;
  if ((c / e) >= t) return 0;

  const list = Array.isArray(candidates) ? candidates : [];
  let add = 0;
  for (let i = 0; i < list.length; i++) {
    add += 1;
    const denom = e + add;
    const num = c + add;
    if (denom > 0 && (num / denom) >= t) return add;
  }
  return list.length;
},

chooseForBar(E, C, candidates, target) {
  const e = Number(E) || 0;
  const c = Number(C) || 0;
  const t = Number.isFinite(Number(target)) ? Number(target) : 0.60;

  const list = Array.isArray(candidates) ? candidates : [];
  if (!e || !list.length) return [];

  const greens = list.filter(x => window.COMPLETION.bucketFromChance(x?.prob) === 'green');
  const rateIfAllGreens =
    (e + greens.length) ? ((c + greens.length) / (e + greens.length)) : null;

  if (Number.isFinite(rateIfAllGreens) && rateIfAllGreens >= t) return greens;

  const chosen = [];
  let add = 0;
  for (const x of list) {
    chosen.push(x);
    add += 1;
    const denom = e + add;
    const num = c + add;
    if (denom > 0 && (num / denom) >= t) break;
  }
  return chosen;
},

    // ---- ReportTable plumbing ----
    getColumnsWidthsString() { return this.table.getColumnsWidthsString(); },
    setSortColumn(name) { this.table.setSortColumn(name); this.tableTick++; },

    // ---- COMPLETION ----
    computeForProgram(p) {
  const target = 0.60;

  // base compute
  const info = window.COMPLETION.computeProgram(p, { target });

  // incorporate projected non-completer exiters
  const drops = Math.max(0, Number(p?.projected_non_completers) || 0);

  const baseE = Number(info?.baseE) || 0;
  const baseC = Number(info?.baseC) || 0;
  const candidates = Array.isArray(info?.candidates) ? info.candidates : [];

  const E = baseE + drops;
  const C = baseC;

  const neededMin = this.minNeeded(E, C, candidates, target);
  const barChosen = this.chooseForBar(E, C, candidates, target);

  // status = bucket of the last student needed to clear 60%
  let statusBucket = 'red';
  if ((E > 0) && (C / E) >= target) {
    statusBucket = 'green';
  } else if (barChosen.length) {
    const last = barChosen[barChosen.length - 1];
    statusBucket = window.COMPLETION.bucketFromChance(last?.prob) || 'red';
  } else {
    statusBucket = 'red';
  }

  return Object.assign({}, info, {
    projectedDrops: drops,
    whatIfE: E,
    whatIfC: C,
    neededMin,
    barChosen,
    statusBucket
  });
},


    currentRateForProgram(p) {
      const info = this.computeForProgram(p);
      return Number.isFinite(info?.currentRate) ? info.currentRate : null;
    },

    neededCountForProgram(p) {
      return this.computeForProgram(p).neededMin ?? 0;
    },

    statusBucketForProgram(p) {
      return this.computeForProgram(p).statusBucket ?? 'red';
    },

    bucketColor(b) {
      return window.COMPLETION.bucketColor(b, this.colors);
    },

    completionPillStyleForProgram(p) {
      const r = this.currentRateForProgram(p);
      if (!Number.isFinite(r)) return { backgroundColor: 'transparent', color: this.colors.black };

      // thresholds: <60 red, <70 yellow, >=70 green
      if (r < 0.60) return { backgroundColor: this.colors.red, color: this.colors.white };
      if (r < 0.70) return { backgroundColor: this.colors.yellow, color: this.colors.black };
      return { backgroundColor: this.colors.green, color: this.colors.white };
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

    completionSegmentsForProgram(p) {
      const segs = [];
      const info = this.computeForProgram(p);

      const { completers = [], nonCompleters = [], barChosen = [] } = info;

      const studentLabel = (s) => {
        if (this.anonymous) return 'STUDENT';
        return s?.name ?? (s?.sis_user_id != null ? `SIS ${s.sis_user_id}` : 'Student');
      };

      const keyFor = (prefix, s, i) => `${prefix}-${s?.sis_user_id ?? s?.id ?? i}`;

      for (let i = 0; i < completers.length; i++) {
        const s = completers[i];
        segs.push({
          key: keyFor('done-ok', s, i),
          color: this.colors.green,
          opacity: 0.35,
          title: `${studentLabel(s)}: Completed (exiter)`
        });
      }

      for (let i = 0; i < barChosen.length; i++) {
        const { s, prob } = barChosen[i];
        const b = window.COMPLETION.bucketFromChance(prob);
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

      for (let i = 0; i < nonCompleters.length; i++) {
        const s = nonCompleters[i];
        segs.push({
          key: keyFor('done-bad', s, i),
          color: this.colors.gray,
          opacity: 1,
          title: `${studentLabel(s)}: Did not complete (exiter)`
        });
      }
      // Add projected non-completer exiters (from server/program row)
      const drops = Math.max(0, Number(p?.projected_non_completers) || 0);
      const progKey = String(p?.program_id ?? p?.programId ?? p?.id ?? p?.account_id ?? p?.program ?? p?.name ?? 'p');

      for (let i = 0; i < drops; i++) {
        segs.push({
          key: `proj-drop-${progKey}-${i}`,
          color: this.colors.darkGray,
          opacity: 0.9,
          title: `Projected non-completer exiter`
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

    emitDrill(p) {
      this.$emit('drill-report', {
        report: 'programs',
        subMenu: 'completion',
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
      <h4 class="btech-card-title" style="margin:0;">Completion – All Programs</h4>
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