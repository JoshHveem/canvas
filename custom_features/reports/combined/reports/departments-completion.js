// departments-completion-overview.js
Vue.component('departments-completion', {
  props: {
    year: { type: [Number, String], required: true },
    anonymous: { type: Boolean, default: false },
    departments: { type: Array, required: true },
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
      sort_column: "Department",
      sort_dir: 1,
      colors
    });

    return { colors, table, tableTick: 0 };
  },

  created() {
    console.log(departments);
    this.table.setColumns([
      new window.ReportColumn(
        'Status', 'Worst-case color of the last student needed to get above 60%.', '3.5rem', false, 'string',
        d => this.statusDotHtmlForDept(d),
        null,
        d => this.statusSortValueForDept(d)
      ),

      new window.ReportColumn(
        'Department', 'Department name.', '16rem', false, 'string',
        d => this.anonymous ? 'DEPARTMENT' : (d?.name ?? ''),
        null,
        d => (d?.name ?? '')
      ),
      new window.ReportColumn(
        'Completion', 'Current completion rate.', '16rem', false, 'string',
        d => d?.cpl.completion,
        null,
        d => d?.cpl.completion,
      ),

      new window.ReportColumn(
        'Needed', 'How many additional projected completers are required to reach 60%.', '5.5rem', false, 'number',
        d => String(this.neededCountForDept(d)),
        s => {
          const n = this.neededCountForDept(s);
          if (!Number.isFinite(n)) return {};
          return n <= 0
            ? { backgroundColor: this.colors.green, color: this.colors.white }
            : { backgroundColor: this.colors.yellow, color: this.colors.black };
        },
        d => Number(this.neededCountForDept(d) ?? 9999)
      ),

      new window.ReportColumn(
        'Completion Bar', 'Exiters + minimal projected completers needed to clear 60%.', '24rem', false, 'string',
        d => this.completionBarHtmlForDept(d),
        null,
        d => this.statusSortValueForDept(d) // keep sort consistent with status
      )
    ]);
  },

  computed: {
    visibleRows() {
      const rows = Array.isArray(this.departments) ? this.departments : [];
      this.table.setRows(rows);
      return this.table.getSortedRows();
    }
  },

  methods: {
    // ---- ReportTable plumbing ----
    getColumnsWidthsString() { return this.table.getColumnsWidthsString(); },
    setSortColumn(name) { this.table.setSortColumn(name); this.tableTick++; },

    // ---- helpers (students) ----
    deptStudents(d) {
      const s = d?.completion?.students ?? [

        {
          name: "Fatima Noor",
          canvas_user_id: 106,
          end_date: null,
          end_date_projected: "2026-04-25",
          chance_to_finish_this_year: 0.95,
          is_exiter: false,
          is_completer: false
        },
        {
          name: "Hannah Lee",
          canvas_user_id: 108,
          end_date: null,
          end_date_projected: "2026-06-25",
          chance_to_finish_this_year: 0.62,
          is_exiter: false,
          is_completer: false
        },
        {
          name: "Jamal Washington",
          canvas_user_id: 110,
          end_date: null,
          end_date_projected: "2026-11-10",
          chance_to_finish_this_year: 0.12,
          is_exiter: false,
          is_completer: false
        },

        // --- FINISHED / EXITERS ---
        {
          name: "Brianna Chen",
          canvas_user_id: 102,
          end_date: "2025-03-10",
          end_date_projected: null,
          chance_to_finish_this_year: null,
          is_exiter: true,
          is_completer: true
        },
        {
          name: "Danielle Foster",
          canvas_user_id: 104,
          end_date: "2025-02-02",
          end_date_projected: null,
          chance_to_finish_this_year: null,
          is_exiter: true,
          is_completer: false
        },

        // --- EDGE CASES ---
        {
          name: "Liam Patel",
          canvas_user_id: 112,
          end_date: null,
          end_date_projected: "2025-02-01",
          chance_to_finish_this_year: 0.99, // operationally done but no end_date yet
          is_exiter: false,
          is_completer: false
        },
        {
          name: "Maya Rodriguez",
          canvas_user_id: 113,
          end_date: "2025-04-05",
          end_date_projected: null,
          chance_to_finish_this_year: null,
          is_exiter: true,
          is_completer: false
        }
      ];
      return Array.isArray(s) ? s : [];
    },

    safeProb(v) {
      const n = Number(v);
      return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : NaN;
    },

    bucketFromChance(p) {
      const n = this.safeProb(p);
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

    // Candidates are actives with a usable probability score
    projectionCandidatesForDept(d) {
      const students = this.deptStudents(d);

      return students
        .filter(s => !s?.end_date) // active only
        .map(s => {
          const p = this.safeProb(s?.chance_to_finish_this_year);
          return { s, p };
        })
        .filter(x => Number.isFinite(x.p))
        .sort((a, b) => b.p - a.p); // highest chance first
    },

    // KPI base counts come from explicit flags
    exiterCountsForDept(d) {
      const students = this.deptStudents(d);
      const exiters = students.filter(s => !!s?.is_exiter);
      const completers = exiters.filter(s => !!s?.is_completer);
      const nonCompleters = exiters.filter(s => !s?.is_completer);
      return { exiters, completers, nonCompleters };
    },

    // ---- the core business: how many needed + what color is the last needed ----
    neededCountForDept(d) {
      const { exiters, completers } = this.exiterCountsForDept(d);
      const baseE = exiters.length;
      const baseC = completers.length;

      // If there are no exiters, KPI is undefined; treat as "n/a" (we'll show 0 needed + gray status)
      if (!baseE) return 0;

      const candidates = this.projectionCandidatesForDept(d);
      if (!candidates.length) return 0; // nothing to add

      // Minimum add such that (baseC + add) / (baseE + add) >= 0.60
      let add = 0;
      for (let i = 0; i < candidates.length; i++) {
        add += 1;
        const denom = baseE + add;
        const num = baseC + add;
        if (denom > 0 && (num / denom) >= 0.60) return add;
      }

      // Even adding everyone doesn't clear it
      return candidates.length;
    },

    statusBucketForDept(d) {
      const needed = this.neededCountForDept(d);
      if (!Number.isFinite(needed) || needed <= 0) return 'green';

      const candidates = this.projectionCandidatesForDept(d);
      if (!candidates.length) return 'red';

      // The status is the bucket of the LAST student you need to include.
      const last = candidates[Math.min(needed, candidates.length) - 1];
      const b = this.bucketFromChance(last?.p);
      return b || 'red';
    },

    statusSortValueForDept(d) {
      // red worst -> orange -> yellow -> green best
      const b = this.statusBucketForDept(d);
      if (b === 'red') return 1;
      if (b === 'orange') return 2;
      if (b === 'yellow') return 3;
      if (b === 'green') return 4;
      return 9;
    },

    statusDotHtmlForDept(d) {
      const b = this.statusBucketForDept(d);
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

    // ---- bar rendering per department ----
    completionSegmentsForDept(d) {
      const segs = [];
      const { completers, nonCompleters, exiters } = this.exiterCountsForDept(d);

      // Completer exiters: faded green
      for (let i = 0; i < completers.length; i++) {
        const s = completers[i];
        segs.push({
          key: `done-ok-${s?.canvas_user_id ?? i}`,
          color: this.colors.green,
          opacity: 0.35,
          title: `${this.anonymous ? 'STUDENT' : (s?.name ?? 'Student')}: Completed (exiter)`
        });
      }

      // Choose minimal actives needed to clear 60% (highest chance first)
      const baseE = exiters.length;
      const baseC = completers.length;

      const candidates = this.projectionCandidatesForDept(d);
      const needed = this.neededCountForDept(d);

      // render only the chosen ones (needed count), colored by chance bucket
      for (let i = 0; i < Math.min(needed, candidates.length); i++) {
        const { s, p } = candidates[i];
        const b = this.bucketFromChance(p);
        segs.push({
          key: `proj-${s?.canvas_user_id ?? i}`,
          color: this.bucketColor(b),
          opacity: 1,
          title: `${this.anonymous ? 'STUDENT' : (s?.name ?? 'Student')}: ${
            b === 'green' ? 'Likely finish' :
            b === 'yellow' ? 'Possible finish' :
            b === 'orange' ? 'Unlikely finish' :
            'Very unlikely finish'
          }`
        });
      }

      // Non-completer exiters LAST: gray
      for (let i = 0; i < nonCompleters.length; i++) {
        const s = nonCompleters[i];
        segs.push({
          key: `done-bad-${s?.canvas_user_id ?? i}`,
          color: this.colors.gray,
          opacity: 1,
          title: `${this.anonymous ? 'STUDENT' : (s?.name ?? 'Student')}: Did not complete (exiter)`
        });
      }

      return segs;
    },

    completionBarHtmlForDept(d) {
      const segs = this.completionSegmentsForDept(d);
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
      <h4 class="btech-card-title" style="margin:0;">Completion – All Departments</h4>
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
