// completion-diagnostic.js
Vue.component('reports-department-completion-diagnostic', {
  props: {
    year: { type: [Number, String], required: true },
    anonymous: { type: Boolean, default: false },
    students: { type: Array, default: [
  // --- EXITED: COMPLETERS ---
  {
    name: "Alex Martinez",
    canvas_user_id: 101,
    exited: "2025-02-15",
    is_completer: true,
    credits_remaining: 0
  },
  {
    name: "Brianna Chen",
    canvas_user_id: 102,
    exited: "2025-03-10",
    is_completer: true,
    credits_remaining: 0
  },
  {
    name: "Carlos Rivera",
    canvas_user_id: 103,
    exited: "2025-01-28",
    is_completer: true,
    credits_remaining: 0
  },

  // --- EXITED: NON-COMPLETERS ---
  {
    name: "Danielle Foster",
    canvas_user_id: 104,
    exited: "2025-02-02",
    is_completer: false,
    credits_remaining: 18
  },
  {
    name: "Ethan Brooks",
    canvas_user_id: 105,
    exited: "2025-03-01",
    is_completer: false,
    credits_remaining: 22
  },

  // --- ACTIVE: ON TRACK ---
  {
    name: "Fatima Noor",
    canvas_user_id: 106,
    exited: null,
    is_completer: false,
    credits_remaining: 6
  },
  {
    name: "Gavin Holt",
    canvas_user_id: 107,
    exited: null,
    is_completer: false,
    credits_remaining: 8
  },

  // --- ACTIVE: AT RISK (close to cutoff) ---
  {
    name: "Hannah Lee",
    canvas_user_id: 108,
    exited: null,
    is_completer: false,
    credits_remaining: 10
  },
  {
    name: "Isaiah Turner",
    canvas_user_id: 109,
    exited: null,
    is_completer: false,
    credits_remaining: 12
  },

  // --- ACTIVE: OFF TRACK ---
  {
    name: "Jamal Washington",
    canvas_user_id: 110,
    exited: null,
    is_completer: false,
    credits_remaining: 20
  },
  {
    name: "Kara O'Neill",
    canvas_user_id: 111,
    exited: null,
    is_completer: false,
    credits_remaining: 26
  },

  // --- EDGE CASES ---
  {
    name: "Liam Patel",
    canvas_user_id: 112,
    exited: null,
    is_completer: false,
    credits_remaining: 0   // active but basically done
  },
  {
    name: "Maya Rodriguez",
    canvas_user_id: 113,
    exited: "2025-04-05",
    is_completer: false,
    credits_remaining: null // bad/missing data
  }
]},
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

      new window.ReportColumn(
        'Status', 'Active vs exited; if exited shows completer/non-completer.', '7rem', false, 'string',
        s => this.statusText(s),
        s => this.statusPillStyle(s),
        s => this.statusSortValue(s)
      ),

      new window.ReportColumn(
        'Exited', 'Exit date (if any).', '7rem', false, 'string',
        s => this.dateOrDash(s?.exited),
        null,
        s => this.sortDateValue(s?.exited)
      ),

      new window.ReportColumn(
        'Completer', 'If exited, whether student is a completer.', '6rem', false, 'string',
        s => this.completerIcon(s),
        null,
        s => this.completerSortValue(s)
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

      new window.ReportColumn(
        'On Track', 'Projected to finish by June 30 for this academic year.', '6rem', false, 'string',
        s => this.onTrackText(s),
        s => this.onTrackPillStyle(s),
        s => this.onTrackSortValue(s)
      ),
    ]);
  },

  computed: {
    // --- core derived sets ---
    studentsClean() {
      return Array.isArray(this.students) ? this.students : [];
    },

    cutoffDate() {
      // June 30 of the academic year passed in (assumes year is the calendar year of the cutoff)
      // If your "AY 2025-26" is passed as "2026", this works as-is.
      const y = Number(this.year);
      if (!Number.isFinite(y)) return null;
      return new Date(Date.UTC(y, 5, 30, 23, 59, 59)); // June=5
    },

    nowUtc() {
      return new Date();
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
      return this.studentsClean.filter(s => !s?.exited);
    },

    activeOnTrack() {
      return this.activeStudents.filter(s => this.isOnTrack(s) === true);
    },

    activeAtRisk() {
      // optional middle band: projected within 30 days after cutoff
      return this.activeStudents.filter(s => this.isAtRisk(s) === true);
    },

    // Projection: if all "on track" students complete by cutoff, they would add to completers & exiters.
    projectedCompletionRate_OnTrackComplete() {
      const baseExiters = this.exiters.length;
      const baseCompleters = this.completerExiters.length;

      const add = this.activeOnTrack.length; // assume they exit as completers
      const denom = baseExiters + add;
      if (!denom) return null;

      return (baseCompleters + add) / denom;
    },

    // how many additional completers needed among actives to hit 60% if they exit as completers
    completersNeededToHit60() {
      const baseExiters = this.exiters.length;
      const baseCompleters = this.completerExiters.length;

      // Need smallest n such that (baseCompleters + n) / (baseExiters + n) >= 0.60
      // Solve: baseCompleters + n >= 0.60*baseExiters + 0.60*n
      // => 0.40*n >= 0.60*baseExiters - baseCompleters
      const rhs = (0.60 * baseExiters) - baseCompleters;
      if (rhs <= 0) return 0;
      return Math.ceil(rhs / 0.40);
    },

    // table rows: active first (risk -> ontrack -> offtrack), exited last (completer then non)
    visibleRows() {
      const rows = this.studentsClean.slice();

      // Pre-sort into buckets with a deterministic weight for table sorting baseline.
      // Table sorting will still apply, but this makes default view "diagnostic".
      rows.sort((a, b) => {
        const wa = this.rowBucketWeight(a);
        const wb = this.rowBucketWeight(b);
        if (wa !== wb) return wa - wb;

        // within bucket: soonest projected finish first (actives), else by name
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

    // --- bar numbers ---
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

    // width for bar segments
    barNowPct() {
      const n = this.currentCompletionRate;
      if (!Number.isFinite(n)) return 0;
      return Math.max(0, Math.min(100, n * 100));
    },

    barProjectedPct() {
      const n = this.projectedCompletionRate_OnTrackComplete;
      if (!Number.isFinite(n)) return 0;
      return Math.max(0, Math.min(100, n * 100));
    },

    barNeededPct() {
      // deficit to reach 60 based on current rate only (visual cue)
      const n = this.currentCompletionRate;
      if (!Number.isFinite(n)) return 60;
      return 60;
    }
  },

  methods: {
    getColumnsWidthsString() { return this.table.getColumnsWidthsString(); },
    setSortColumn(name) { this.table.setSortColumn(name); this.tableTick++; },

    // ---------- formatting helpers ----------
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

    // ---------- completion logic ----------
    // Projection assumption: ~2 credits/month => 0.5 credits/week => 2 credits/30 days
    projectedFinishDate(s) {
      if (!s || s?.exited) return null;
      const cr = Number(s?.credits_remaining);
      if (!Number.isFinite(cr)) return null;

      // months needed at 2 credits/month
      const months = cr / 2;
      const days = Math.ceil(months * 30); // intentionally simple

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
      const cutoff = this.cutoffDate;
      const d = this.projectedFinishDate(s);
      if (!cutoff || !d) return null;
      return d.getTime() <= cutoff.getTime();
    },

    isAtRisk(s) {
      if (!s || s?.exited) return null;
      const cutoff = this.cutoffDate;
      const d = this.projectedFinishDate(s);
      if (!cutoff || !d) return null;

      const diffDays = Math.ceil((d.getTime() - cutoff.getTime()) / (1000 * 60 * 60 * 24));
      // at risk = within 30 days after cutoff (tweak to taste)
      return diffDays > 0 && diffDays <= 30;
    },

    onTrackText(s) {
      if (!s || s?.exited) return '—';
      const v = this.isOnTrack(s);
      if (v === true) return 'Yes';
      if (v === false) return this.isAtRisk(s) ? 'At risk' : 'No';
      return 'n/a';
    },

    onTrackPillStyle(s) {
      if (!s || s?.exited) return { backgroundColor: 'transparent', color: this.colors.black };

      const v = this.isOnTrack(s);
      if (v === true) return { backgroundColor: this.colors.green, color: this.colors.white };

      const risk = this.isAtRisk(s);
      if (risk === true) return { backgroundColor: this.colors.yellow, color: this.colors.black };

      if (v === false) return { backgroundColor: this.colors.red, color: this.colors.white };

      return { backgroundColor: this.colors.gray, color: this.colors.black };
    },

    onTrackSortValue(s) {
      if (!s || s?.exited) return 9;
      const v = this.isOnTrack(s);
      if (v === true) return 1;
      if (this.isAtRisk(s)) return 2;
      if (v === false) return 3;
      return 4;
    },

    // ---------- exited/completer display ----------
    completerIcon(s) {
      if (!s?.exited) return '—';
      return s?.is_completer ? '✅' : '❌';
    },

    completerSortValue(s) {
      if (!s?.exited) return -1;
      return s?.is_completer ? 1 : 0;
    },

    statusText(s) {
      if (!!s?.exited) return s?.is_completer ? 'Exited (Completer)' : 'Exited (Non)';
      const ot = this.isOnTrack(s);
      if (ot === true) return 'Active (On track)';
      if (this.isAtRisk(s)) return 'Active (At risk)';
      if (ot === false) return 'Active (Off track)';
      return 'Active';
    },

    statusPillStyle(s) {
      if (!!s?.exited) {
        return {
          backgroundColor: s?.is_completer ? this.colors.green : this.colors.red,
          color: this.colors.white,
          opacity: 0.9
        };
      }

      const ot = this.isOnTrack(s);
      if (ot === true) return { backgroundColor: this.colors.green, color: this.colors.white };
      if (this.isAtRisk(s)) return { backgroundColor: this.colors.yellow, color: this.colors.black };
      if (ot === false) return { backgroundColor: this.colors.red, color: this.colors.white };
      return { backgroundColor: this.colors.gray, color: this.colors.black };
    },

    statusSortValue(s) {
      // bucket order: active risk (0), active ontrack (1), active offtrack (2), exited completer (3), exited non (4)
      return this.rowBucketWeight(s);
    },

    rowBucketWeight(s) {
      const exited = !!s?.exited;
      if (!exited) {
        const ot = this.isOnTrack(s);
        if (ot === false && this.isAtRisk(s)) return 0; // treat at risk as top priority
        if (ot === false) return 2;
        if (ot === true) return 1;
        return 1.5; // unknown sits with actives
      }

      // exited -> bottom; completers above non-completers
      return s?.is_completer ? 3 : 4;
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
            <!-- current -->
            <div
              :style="{
                position:'absolute', left:'0', top:'0', bottom:'0',
                width: barNowPct + '%',
                background: colors.green
              }"
              :title="'Current completion: ' + pctNowText"
            ></div>

            <!-- projected delta (striped-ish via opacity overlay) -->
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

            <!-- 60% marker -->
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
          </div>

          <div class="btech-muted" style="font-size:.7rem; margin-top:8px;">
            Cutoff: {{ cutoffDate ? cutoffDate.toISOString().slice(0,10) : 'n/a' }}
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
          'opacity': s?.exited ? 0.55 : 1
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
