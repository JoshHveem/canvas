// completion-diagnostic.js
Vue.component('reports-department-completion-diagnostic', {
  props: {
    year: { type: [Number, String], required: true },
    anonymous: { type: Boolean, default: false },

    // Vue 2: Array defaults must be functions
    students: {
      type: Array,
      default: () => ([
        // --- EXITED: COMPLETERS ---
        { name: "Alex Martinez",  canvas_user_id: 101, exited: "2025-02-15", is_completer: true,  credits_remaining: 0 },
        { name: "Brianna Chen",   canvas_user_id: 102, exited: "2025-03-10", is_completer: true,  credits_remaining: 0 },
        { name: "Carlos Rivera",  canvas_user_id: 103, exited: "2025-01-28", is_completer: true,  credits_remaining: 0 },

        // --- EXITED: NON-COMPLETERS ---
        { name: "Danielle Foster", canvas_user_id: 104, exited: "2025-02-02", is_completer: false, credits_remaining: 5 },
        { name: "Ethan Brooks",    canvas_user_id: 105, exited: "2025-03-01", is_completer: false, credits_remaining: 2 },

        // --- ACTIVE: ON TRACK ---
        { name: "Fatima Noor",    canvas_user_id: 106, exited: null, is_completer: false, credits_remaining: 6 },
        { name: "Gavin Holt",     canvas_user_id: 107, exited: null, is_completer: false, credits_remaining: 8 },

        // --- ACTIVE: AT RISK ---
        { name: "Hannah Lee",     canvas_user_id: 108, exited: null, is_completer: false, credits_remaining: 10 },
        { name: "Isaiah Turner",  canvas_user_id: 109, exited: null, is_completer: false, credits_remaining: 12 },

        // --- ACTIVE: OFF TRACK ---
        { name: "Jamal Washington", canvas_user_id: 110, exited: null, is_completer: false, credits_remaining: 20 },
        { name: "Kara O'Neill",     canvas_user_id: 111, exited: null, is_completer: false, credits_remaining: 26 },

        // --- EDGE CASES ---
        { name: "Liam Patel",     canvas_user_id: 112, exited: null, is_completer: false, credits_remaining: 0 },   // done but not exited
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

    const table = new window.ReportTable({
      rows: [],
      columns: [],
      sort_column: "Student",
      sort_dir: 1,
      colors
    });

    return {
      colors,
      table,
      tableTick: 0
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'Student', 'Student name.', '16rem', false, 'string',
        s => this.anonymous ? 'STUDENT' : (s?.name ?? ''),
        null,
        s => (s?.name ?? '')
      ),

      // STATUS -> just a colored circle (and blank = empty)
      new window.ReportColumn(
        'Status', '● green = completer/on-track, ● yellow = in danger, ● red = non-completer; blank = not going to complete.', '3.5rem', false, 'string',
        s => this.statusDotHtml(s),
        null,
        s => this.statusSortValue(s)
      ),

      new window.ReportColumn(
        'Exited', 'Exit date (if any).', '7rem', false, 'string',
        s => this.dateOrDash(s?.exited),
        null,
        s => this.sortDateValue(s?.exited)
      ),

      new window.ReportColumn(
        'Cr Rem', 'Credits remaining (used for projection).', '5.5rem', false, 'number',
        s => this.numOrNA(s?.credits_remaining, 0),
        null,
        s => Number(s?.credits_remaining ?? -1)
      ),

      new window.ReportColumn(
        'Proj Finish', 'Projected finish date (~2 credits/month).', '8rem', false, 'string',
        s => this.projectedFinishText(s),
        s => this.projectedFinishPillStyle(s),
        s => this.projectedFinishSortValue(s)
      ),
    ]);
  },

  computed: {
    studentsClean() {
      return Array.isArray(this.students) ? this.students : [];
    },

    // Academic year: Jul 1 -> Jun 30. Cutoff is the *upcoming* June 30, based on today.
    cutoffDate() {
      const now = new Date();
      const endYear = (now.getMonth() >= 6) ? (now.getFullYear() + 1) : now.getFullYear();
      return new Date(endYear, 5, 30, 23, 59, 59); // June=5
    },

    academicYearStart() {
      const now = new Date();
      const startYear = (now.getMonth() >= 6) ? now.getFullYear() : (now.getFullYear() - 1);
      return new Date(startYear, 6, 1, 0, 0, 0); // July=6
    },

    exiters() {
      return this.studentsClean.filter(s => !!s?.exited);
    },

    completerExiters() {
      return this.exiters.filter(s => !!s?.is_completer);
    },

    currentCompletionRate() {
      const denom = this.exiters.length;
      if (!denom) return null;
      return this.completerExiters.length / denom;
    },

    activeStudents() {
      return this.studentsClean.filter(s => !this.isDone(s));
    },

    doneNotExited() {
      return this.studentsClean.filter(s => this.isDone(s) && !s?.exited);
    },

    activeOnTrack() {
      return this.activeStudents.filter(s => this.isOnTrack(s) === true);
    },

    activeAtRisk() {
      return this.activeStudents.filter(s => this.isAtRisk(s) === true);
    },

    projectedCompletionRate_OnTrackComplete() {
      const baseExiters = this.exiters.length;
      const baseCompleters = this.completerExiters.length;

      const add = this.activeOnTrack.length;
      const denom = baseExiters + add;
      if (!denom) return null;

      return (baseCompleters + add) / denom;
    },

    completersNeededToHit60() {
      const baseExiters = this.exiters.length;
      const baseCompleters = this.completerExiters.length;

      const rhs = (0.60 * baseExiters) - baseCompleters;
      if (rhs <= 0) return 0;
      return Math.ceil(rhs / 0.40);
    },

    visibleRows() {
      const rows = this.studentsClean.slice();

      rows.sort((a, b) => {
        const wa = this.rowBucketWeight(a);
        const wb = this.rowBucketWeight(b);
        if (wa !== wb) return wa - wb;

        const da = this.projectedFinishDate(a)?.getTime() ?? Infinity;
        const db = this.projectedFinishDate(b)?.getTime() ?? Infinity;
        if (da !== db) return da - db;

        const na = (a?.name ?? '').toLowerCase();
        const nb = (b?.name ?? '').toLowerCase();
        return na.localeCompare(nb);
      });

      this.table.setRows(rows);
      return this.table.getSortedRows();
    },

    pctNowText() {
      const n = this.currentCompletionRate;
      if (!Number.isFinite(n)) return 'n/a';
      return (n * 100).toFixed(1) + '%';
    },

    pctProjectedText() {
      const n = this.projectedCompletionRate_OnTrackComplete;
      if (!Number.isFinite(n)) return 'n/a';
      return (n * 100).toFixed(1) + '%';
    },

    barNowPct() {
      const n = this.currentCompletionRate;
      if (!Number.isFinite(n)) return 0;
      return Math.max(0, Math.min(100, n * 100));
    },

    barProjectedPct() {
      const n = this.projectedCompletionRate_OnTrackComplete;
      if (!Number.isFinite(n)) return 0;
      return Math.max(0, Math.min(100, n * 100));
    }
  },

  methods: {
    getColumnsWidthsString() { return this.table.getColumnsWidthsString(); },
    setSortColumn(name) { this.table.setSortColumn(name); this.tableTick++; },

    // ---------- done logic ----------
    isDone(s) {
      if (!s) return false;
      if (s?.exited) return true;
      const cr = Number(s?.credits_remaining);
      return Number.isFinite(cr) && cr <= 0;
    },

    // ---------- formatting ----------
    numOrNA(v, decimals = 2) {
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(decimals) : 'n/a';
    },

    dateOrDash(v) {
      if (!v) return '—';
      const d = new Date(v);
      if (Number.isNaN(d.getTime())) return '—';
      return d.toISOString().slice(0, 10);
    },

    sortDateValue(v) {
      if (!v) return -1;
      const d = new Date(v);
      const t = d.getTime();
      return Number.isFinite(t) ? t : -1;
    },

    // ---------- projection ----------
    projectedFinishDate(s) {
      if (!s || s?.exited) return null;
      const cr = Number(s?.credits_remaining);
      if (!Number.isFinite(cr)) return null;

      const months = cr / 2;
      const days = Math.ceil(months * 30);

      const d = new Date();
      d.setDate(d.getDate() + days);
      return d;
    },

    projectedFinishText(s) {
      if (!s || s?.exited) return '—';
      const d = this.projectedFinishDate(s);
      if (!d) return 'n/a';
      return d.toISOString().slice(0, 10);
    },

    projectedFinishSortValue(s) {
      const d = this.projectedFinishDate(s);
      return d ? d.getTime() : Infinity;
    },

    isOnTrack(s) {
      if (!s || s?.exited) return null;
      if (this.isDone(s)) return true;

      const cutoff = this.cutoffDate;
      const d = this.projectedFinishDate(s);
      if (!cutoff || !d) return null;
      return d.getTime() <= cutoff.getTime();
    },

    isAtRisk(s) {
      if (!s || s?.exited) return null;
      if (this.isDone(s)) return false;

      const cutoff = this.cutoffDate;
      const d = this.projectedFinishDate(s);
      if (!cutoff || !d) return null;

      const diffDays = Math.ceil((d.getTime() - cutoff.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays > 0 && diffDays <= 30;
    },

    projectedFinishPillStyle(s) {
      if (!s || s?.exited) return { backgroundColor: 'transparent', color: this.colors.black };
      if (this.isDone(s)) return { backgroundColor: this.colors.gray, color: this.colors.black };

      const d = this.projectedFinishDate(s);
      if (!d) return { backgroundColor: this.colors.gray, color: this.colors.black };

      const cutoff = this.cutoffDate;
      if (!cutoff) return { backgroundColor: this.colors.gray, color: this.colors.black };

      const diffDays = Math.ceil((d.getTime() - cutoff.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays <= 0) return { backgroundColor: this.colors.green, color: this.colors.white };
      if (diffDays <= 30) return { backgroundColor: this.colors.yellow, color: this.colors.black };
      return { backgroundColor: this.colors.red, color: this.colors.white };
    },

    // ---------- STATUS DOT ----------
    // Spec:
    // - red if exited non-completer
    // - green if exited completer OR active on-track OR active done (0 credits)
    // - yellow if in danger (at-risk band)
    // - blank if not going to complete (off-track OR unknown)
    statusDotColor(s) {
      if (!s) return null;

      if (s?.exited) {
        return s?.is_completer ? this.colors.green : this.colors.red;
      }

      if (this.isDone(s)) return this.colors.green;

      const ot = this.isOnTrack(s);
      if (ot === true) return this.colors.green;
      if (this.isAtRisk(s)) return this.colors.yellow;

      // off-track or unknown => blank
      return null;
    },

    statusDotHtml(s) {
      const c = this.statusDotColor(s);
      if (!c) return ''; // blank

      // inline HTML so v-html can render it
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

    // Sort: red/yellow/green/blank in a helpful order (danger first)
    // (This does NOT control row ordering; just helps if user sorts by Status)
    statusSortValue(s) {
      const c = this.statusDotColor(s);
      if (c === this.colors.yellow) return 1; // danger first
      if (c === this.colors.green) return 2;
      if (c === this.colors.red) return 3;
      return 9; // blank last
    },

    // Sorting buckets:
    // 0  = at-risk (top)
    // 1  = on-track
    // 2  = off-track
    // 3  = unknown
    // 85 = done (0 cr) but not exited
    // 90 = exited completer
    // 95 = exited non-completer
    rowBucketWeight(s) {
      if (this.isDone(s)) {
        if (s?.exited) return s?.is_completer ? 90 : 95;
        return 85;
      }

      const ot = this.isOnTrack(s);
      if (ot === false && this.isAtRisk(s)) return 0;
      if (ot === true) return 1;
      if (ot === false) return 2;
      return 3;
    },

    // ---------- bar helpers ----------
    pctPillStyleByPct(p) {
      const n = Number(p);
      if (!Number.isFinite(n)) return { backgroundColor: this.colors.gray, color: this.colors.black };
      const pct = n * 100;
      return {
        backgroundColor: (pct < 60) ? this.colors.red : (pct < 65 ? this.colors.yellow : this.colors.green),
        color: (pct < 65) ? this.colors.black : this.colors.white
      };
    }
  },

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
    <!-- Header -->
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
      <!-- KPI area -->
      <div style="display:grid; grid-template-columns: 1.2fr .8fr; gap:10px; align-items:start; margin-bottom:12px;">
        <div>
          <div class="btech-muted" style="font-size:.75rem; margin-bottom:6px;">
            Completion = Completers / Exiters (excused withdrawals excluded upstream)
          </div>

          <!-- Bar -->
          <div style="position:relative; height:18px; border-radius:10px; overflow:hidden; background:#F2F2F2;">
            <div
              :style="{
                position:'absolute', left:'0', top:'0', bottom:'0',
                width: barNowPct + '%',
                background: colors.green
              }"
              :title="'Current completion: ' + pctNowText"
            ></div>

            <div
              v-if="barProjectedPct > barNowPct"
              :style="{
                position:'absolute', left: barNowPct + '%', top:'0', bottom:'0',
                width: (barProjectedPct - barNowPct) + '%',
                background: colors.green,
                opacity: 0.35
              }"
              :title="'Projected if all on-track complete: ' + pctProjectedText"
            ></div>

            <div
              :style="{
                position:'absolute', left:'60%', top:'-3px', bottom:'-3px',
                width:'2px', background: colors.black, opacity: 0.6
              }"
              title="60% requirement"
            ></div>
          </div>

          <!-- KPI labels -->
          <div class="btech-row" style="gap:8px; margin-top:8px; flex-wrap:wrap;">
            <span class="btech-pill" :style="pctPillStyleByPct(currentCompletionRate)">
              Now: {{ pctNowText }}
              <span style="opacity:.8;"> ({{ completerExiters.length }}/{{ exiters.length }})</span>
            </span>

            <span class="btech-pill" :style="pctPillStyleByPct(projectedCompletionRate_OnTrackComplete)">
              If on-track complete: {{ pctProjectedText }}
              <span style="opacity:.8;"> (+{{ activeOnTrack.length }})</span>
            </span>

            <span class="btech-pill" :style="{ backgroundColor: colors.gray, color: colors.black }">
              Needed to hit 60%: {{ completersNeededToHit60 }}
            </span>
          </div>

          <div class="btech-muted" style="font-size:.7rem; margin-top:8px;">
            AY Window: {{ academicYearStart.toISOString().slice(0,10) }} → {{ cutoffDate.toISOString().slice(0,10) }}
          </div>
        </div>

        <!-- Quick counts -->
        <div style="border:1px solid #EEE; border-radius:10px; padding:10px;">
          <div class="btech-muted" style="font-size:.75rem; margin-bottom:6px;">Active diagnostics</div>
          <div class="btech-row" style="gap:8px; flex-wrap:wrap;">
            <span class="btech-pill" :style="{ backgroundColor: colors.red, color: colors.white }">
              Off track: {{ activeStudents.filter(s => isOnTrack(s) === false && !isAtRisk(s)).length }}
            </span>
            <span class="btech-pill" :style="{ backgroundColor: colors.yellow, color: colors.black }">
              At risk: {{ activeAtRisk.length }}
            </span>
            <span class="btech-pill" :style="{ backgroundColor: colors.green, color: colors.white }">
              On track: {{ activeOnTrack.length }}
            </span>
            <span class="btech-pill" :style="{ backgroundColor: colors.gray, color: colors.black }">
              Done (not exited): {{ doneNotExited.length }}
            </span>
          </div>
        </div>
      </div>

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
        v-for="(s, i) in visibleRows"
        :key="s.canvas_user_id || s.id || i"
        style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; line-height:1.5rem;"
        :style="{
          'grid-template-columns': getColumnsWidthsString(),
          'background-color': (i % 2) ? 'white' : '#F8F8F8',
          'opacity': isDone(s) ? 0.55 : 1
        }"
      >
        <div
          v-for="col in table.getVisibleColumns()"
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
