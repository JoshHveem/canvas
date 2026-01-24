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
        { name: "Gavin Holt",     canvas_user_id: 107, exited: null, is_completer: false, credits_remaining: 8 },

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

    // Two independent tables (so sorting one doesn't affect the other)
    const tableActive = new window.ReportTable({
      rows: [],
      columns: [],
      sort_column: "Student",
      sort_dir: 1,
      colors
    });

    const tableFinished = new window.ReportTable({
      rows: [],
      columns: [],
      sort_column: "Student",
      sort_dir: 1,
      colors
    });

    return {
      colors,
      tableActive,
      tableFinished,
      tableTickActive: 0,
      tableTickFinished: 0
    };
  },

  created() {
    // -------- ACTIVE TABLE (uses projected finish) --------
    this.tableActive.setColumns([
      new window.ReportColumn(
        'Status', '● green = on-track, ● yellow = in danger; blank = not going to complete in-window.', '3.5rem', false, 'string',
        s => this.statusDotHtml(s, { mode: 'active' }),
        null,
        s => this.statusSortValue(s, { mode: 'active' })
      ),

      new window.ReportColumn(
        'Student', 'Student name.', '16rem', false, 'string',
        s => this.anonymous ? 'STUDENT' : (s?.name ?? ''),
        null,
        s => (s?.name ?? '')
      ),


      new window.ReportColumn(
        'Cr Rem', 'Credits remaining (used for projection).', '5.5rem', false, 'number',
        s => this.numOrNA(s?.credits_remaining, 0),
        null,
        s => Number(s?.credits_remaining ?? -1)
      ),

      // Merged date column: "End" = projected end date for actives
      new window.ReportColumn(
        'End', 'Projected finish date (~2 credits/month).', '8rem', false, 'string',
        s => this.endDateText(s, { mode: 'active' }),
        s => this.endDatePillStyle(s, { mode: 'active' }),
        s => this.endDateSortValue(s, { mode: 'active' })
      ),
    ]);

    // -------- FINISHED TABLE (uses actual exit) --------
    this.tableFinished.setColumns([
      new window.ReportColumn(
        'Status', '● green = completer, ● red = non-completer.', '3.5rem', false, 'string',
        s => this.statusDotHtml(s, { mode: 'finished' }),
        null,
        s => this.statusSortValue(s, { mode: 'finished' })
      ),
      new window.ReportColumn(
        'Student', 'Student name.', '16rem', false, 'string',
        s => this.anonymous ? 'STUDENT' : (s?.name ?? ''),
        null,
        s => (s?.name ?? '')
      ),


      // Merged date column: "End" = actual end date (exit) for finished
      new window.ReportColumn(
        'End', 'Actual end date (exit date).', '8rem', false, 'string',
        s => this.endDateText(s, { mode: 'finished' }),
        s => this.endDatePillStyle(s, { mode: 'finished' }),
        s => this.endDateSortValue(s, { mode: 'finished' })
      ),
    ]);
  },

  computed: {
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

    // Finished = exited (official) OR done-but-not-exited (0 credits) (operationally finished)
    finishedStudents() {
      return this.studentsClean.filter(s => this.isFinished(s));
    },

    // Active = not finished
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
      if (!denom) return null;
      return this.completerExiters.length / denom;
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

      const add = this.activeOnTrack.length; // assume they exit as completers
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

    // ACTIVE rows: diagnostic bucket ordering (risk -> ontrack -> offtrack/unknown)
    visibleActiveRows() {
      const rows = this.activeStudents.slice();

      rows.sort((a, b) => {
        const wa = this.activeBucketWeight(a);
        const wb = this.activeBucketWeight(b);
        if (wa !== wb) return wa - wb;

        const da = this.projectedFinishDate(a)?.getTime() ?? Infinity;
        const db = this.projectedFinishDate(b)?.getTime() ?? Infinity;
        if (da !== db) return da - db;

        const na = (a?.name ?? '').toLowerCase();
        const nb = (b?.name ?? '').toLowerCase();
        return na.localeCompare(nb);
      });

      this.tableActive.setRows(rows);
      return this.tableActive.getSortedRows();
    },

    // FINISHED rows: show completers above non-completers, newest end date first
    visibleFinishedRows() {
      const rows = this.finishedStudents.slice();

      rows.sort((a, b) => {
        const wa = this.finishedBucketWeight(a);
        const wb = this.finishedBucketWeight(b);
        if (wa !== wb) return wa - wb;

        const da = this.actualEndDate(a)?.getTime() ?? -Infinity;
        const db = this.actualEndDate(b)?.getTime() ?? -Infinity;
        if (da !== db) return db - da; // newest first

        const na = (a?.name ?? '').toLowerCase();
        const nb = (b?.name ?? '').toLowerCase();
        return na.localeCompare(nb);
      });

      this.tableFinished.setRows(rows);
      return this.tableFinished.getSortedRows();
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
    },
barSegmentsProjected() {
  const segs = [];

  // actual completers (faded green)
  for (const s of this.completerExiters) {
    segs.push({
      key: 'done-ok-' + (s?.canvas_user_id ?? s?.id ?? Math.random()),
      color: this.colors.green,
      opacity: 0.35,
      title: `${this.anonymous ? 'STUDENT' : (s?.name ?? 'Student')}: Completed`
    });
  }

  // projected safe (solid green)
  for (const s of this.activeStudents.filter(x => this.projectionBucket(x) === 'green')) {
    segs.push({
      key: 'proj-ok-' + (s?.canvas_user_id ?? s?.id ?? Math.random()),
      color: this.colors.green,
      opacity: 1,
      title: `${this.anonymous ? 'STUDENT' : (s?.name ?? 'Student')}: Projected complete (before June)`
    });
  }

  // June (yellow)
  for (const s of this.activeStudents.filter(x => this.projectionBucket(x) === 'yellow')) {
    segs.push({
      key: 'proj-june-' + (s?.canvas_user_id ?? s?.id ?? Math.random()),
      color: this.colors.yellow,
      opacity: 1,
      title: `${this.anonymous ? 'STUDENT' : (s?.name ?? 'Student')}: June finish (fragile)`
    });
  }

  // July+ (orange)
  for (const s of this.activeStudents.filter(x => this.projectionBucket(x) === 'orange')) {
    segs.push({
      key: 'proj-july-' + (s?.canvas_user_id ?? s?.id ?? Math.random()),
      color: this.colors.orange,
      opacity: 1,
      title: `${this.anonymous ? 'STUDENT' : (s?.name ?? 'Student')}: July+ finish (too late)`
    });
  }

  // actual non-completers (faded red, LAST)
  for (const s of this.exiters.filter(x => !x?.is_completer)) {
    segs.push({
      key: 'done-bad-' + (s?.canvas_user_id ?? s?.id ?? Math.random()),
      color: this.colors.red,
      opacity: 0.35,
      title: `${this.anonymous ? 'STUDENT' : (s?.name ?? 'Student')}: Did not complete`
    });
  }

  return segs;
},

projectedDenomCount() {
  return this.exiters.length + this.activeOnTrack.length;
},

projectedPctText() {
  const denom = this.projectedDenomCount;
  if (!denom) return 'n/a';
  const num = this.completerExiters.length + this.activeOnTrack.length;
  return ((num / denom) * 100).toFixed(1) + '%';
},

  },

  methods: {
    projectionBucket(s) {
      if (!s || s?.exited) return null;

      // operationally done
      const cr = Number(s?.credits_remaining);
      if (Number.isFinite(cr) && cr <= 0) return 'green';

      const d = this.projectedFinishDate(s);
      const cutoff = this.cutoffDate;
      if (!d || !cutoff) return null;

      const y = cutoff.getFullYear();
      const juneStart = new Date(y, 5, 1, 0, 0, 0); // Jun 1 of cutoff year
      const julyStart = new Date(y, 6, 1, 0, 0, 0); // Jul 1 of cutoff year

      if (d.getTime() < juneStart.getTime()) return 'green';   // before June (safe)
      if (d.getTime() < julyStart.getTime()) return 'yellow';  // June (fragile)
      return 'orange';                                         // July+ (too late)
    },
    // --- sort header click handlers (two tables) ---
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
      if (Number.isNaN(d.getTime())) return '—';
      return d.toISOString().slice(0, 10);
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

    // ---------- actual end date ----------
    actualEndDate(s) {
      if (!s) return null;
      if (s?.exited) {
        const d = new Date(s.exited);
        return Number.isNaN(d.getTime()) ? null : d;
      }
      // done-but-not-exited has no "actual", so keep null
      return null;
    },

    // ---------- on track logic ----------
    isOnTrack(s) {
  return this.projectionBucket(s) === 'green';
},

// 4) REPLACE your isAtRisk with this:
isAtRisk(s) {
  return this.projectionBucket(s) === 'yellow';
},
    // ---------- merged End column ----------
    endDateText(s, { mode }) {
      if (!s) return 'n/a';

      if (mode === 'finished') {
        // official exited date or blank for done-not-exited
        if (s?.exited) return this.dateOrDash(s.exited);
        return '—';
      }

      // active
      const d = this.projectedFinishDate(s);
      if (!d) return 'n/a';
      return d.toISOString().slice(0, 10);
    },

    endDateSortValue(s, { mode }) {
      if (!s) return Infinity;

      if (mode === 'finished') {
        const d = this.actualEndDate(s);
        // no actual date => push to bottom
        return d ? d.getTime() : Infinity;
      }

      const d = this.projectedFinishDate(s);
      return d ? d.getTime() : Infinity;
    },

    endDatePillStyle(s, { mode }) {
      if (!s) return { backgroundColor: this.colors.gray, color: this.colors.black };

      // finished: show completer/non-completer tint based on outcome (exited only)
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

      if (b === 'green')  return { backgroundColor: this.colors.green,  color: this.colors.white };
      if (b === 'yellow') return { backgroundColor: this.colors.yellow, color: this.colors.black };
      return               { backgroundColor: this.colors.orange, color: this.colors.black };
    },

    // ---------- status dot ----------
    // mode=active:
    //   green if on-track
    //   yellow if at-risk
    //   blank if off-track OR unknown
    // mode=finished:
    //   green if exited completer
    //   red if exited non-completer
    //   blank if done-not-exited (no official outcome yet)
    statusDotColor(s, { mode }) {
      if (!s) return null;

      if (mode === 'finished') {
        if (!s?.exited) return null;
        return s?.is_completer ? this.colors.green : this.colors.red;
      }

      // active
      const b = this.projectionBucket(s);
      if (b === 'green') return this.colors.green;
      if (b === 'yellow') return this.colors.yellow;
      if (b === 'orange') return this.colors.orange; // or return null if you want orange to be blank
      return null;
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
      // In both tables: yellow first (if present), then green, then red, then blank
      if (c === this.colors.yellow) return 1;
      if (c === this.colors.green) return 2;
      if (c === this.colors.red) return 3;
      return 9;
    },

    // ---------- bucket ordering ----------
    activeBucketWeight(s) {
      // at-risk first, then on-track, then off-track, then unknown
      const ot = this.isOnTrack(s);
      if (ot === false && this.isAtRisk(s)) return 0;
      if (ot === true) return 1;
      if (ot === false) return 2;
      return 3;
    },

    finishedBucketWeight(s) {
      // completers above non-completers, but put "done-not-exited" at very bottom
      if (!s?.exited) return 9;
      return s?.is_completer ? 0 : 1;
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
      <div style="display:grid; grid-template-columns: 1fr; gap:10px; align-items:start; margin-bottom:12px;">
        <div>
          <div class="btech-muted" style="font-size:.75rem; margin-bottom:6px;">
            Completion = Completers / Exiters (excused withdrawals excluded upstream)
          </div>

          <!-- Segmented projected bar -->
          <!-- Segmented projected bar -->
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

  <!-- 60% marker -->
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
      </div>

      <!-- ================= ACTIVE TABLE ================= -->
      <div class="btech-row" style="align-items:center; margin: 8px 0;">
        <h4 class="btech-card-title" style="margin:0; font-size: .95rem;">Active students</h4>
        <div style="flex:1;"></div>
        <span class="btech-pill" style="margin-left:8px;">Rows: {{ visibleActiveRows.length }}</span>
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
        :style="{
          'grid-template-columns': getColumnsWidthsStringActive(),
          'background-color': (i % 2) ? 'white' : '#F8F8F8'
        }"
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
