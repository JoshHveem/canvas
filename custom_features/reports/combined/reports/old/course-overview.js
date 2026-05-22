// courses-overview.js
Vue.component('reports-course-overview', {
  props: {
    account:   { type: [Number, String], required: true },
    year:      { type: [Number, String], required: true },
    anonymous: { type: Boolean, default: false },
    course:    { type: Object, required: false, default: null },
    loading:   { type: Boolean, default: false }
  },

  computed: {
    hasCourse() { return !!this.course; },
    title() {
      if (!this.course) return 'Course';
      return `${this.course.course_code || ''} — ${this.course.name || 'Course'}`.trim();
    }
  },

  template: `
  <div>
    <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
      <div class="btech-row" style="margin-bottom:12px;">
        <h4 class="btech-card-title">{{ title }}</h4>
        <span class="btech-pill">{{ year || '—' }}</span>
      </div>

      <div v-if="loading" class="btech-muted" style="text-align:center;">
        Loading course…
      </div>

      <div v-else-if="!hasCourse" class="btech-muted" style="text-align:center;">
        Select a course to view details.
      </div>

      <div v-else>
        <course-metadata-card :course="course"></course-metadata-card>
        <div class="btech-grid-3" style="margin-bottom:12px;">
          <course-kpi-students :course="course"></course-kpi-students>
          <course-kpi-extensions :course="course"></course-kpi-extensions>
          <course-kpi-drop-rate :course="course"></course-kpi-drop-rate>
        </div>

        <course-metrics-surveys :surveys="course.surveys" :year="year"></course-metrics-surveys>
      </div>
    </div>
  </div>
  `
});

Vue.component('course-kpi-students', {
  props: { course: { type: Object, required: true } },
  computed: {
    numStudents() {
      // your payload has both num_students_jenzabar and num_students_credits/students
      const v = this.course?.num_students_jenzabar ?? this.course?.students ?? this.course?.num_students_credits ?? 0;
      return Number(v || 0);
    }
  },
  template: `
    <div class="btech-tile" title="Students in this course (from SIS if available)">
      <div class="btech-kpi-label">Students</div>
      <div class="btech-kpi-value">{{ numStudents.toLocaleString() }}</div>
    </div>
  `
});

Vue.component('course-kpi-extensions', {
  props: { course: { type: Object, required: true } },
  computed: {
    avgExt() { return Number(this.course?.avg_extensions_needed ?? 0); },
    pctNeedExt() {
      const v = Number(this.course?.pct_need_extension ?? 0);
      return Math.max(0, Math.min(100, Math.round(v * 100)));
    }
  },
  template: `
    <div class="btech-tile" title="Extension need metrics">
      <div class="btech-kpi-label">Extensions Needed</div>
      <div class="btech-kpi-value">
        {{ avgExt.toFixed(2) }}
        <span class="btech-muted">avg</span>
      </div>
      <div class="btech-muted" style="margin-top:4px;">
        {{ pctNeedExt }}% need an extension
      </div>
    </div>
  `
});

Vue.component('course-kpi-drop-rate', {
  props: { course: { type: Object, required: true } },
  computed: {
    pctDropped() {
      const v = Number(this.course?.pct_dropped ?? 0);
      return Math.max(0, Math.min(100, Math.round(v * 100)));
    }
  },
  template: `
    <div class="btech-tile" title="Share of students who dropped">
      <div class="btech-kpi-label">Dropped</div>
      <div class="btech-kpi-value">
        {{ pctDropped }}<span class="btech-muted">%</span>
      </div>
    </div>
  `
});

Vue.component('course-metrics-surveys', {
  props: {
    surveys: { type: Object, required: false, default: () => ({}) },
    year: { type: [String, Number], default: null }
  },
  computed: {
    yearLabel() { return this.year ?? '—'; },
    numSurveys() { return Number(this.surveys?.num_surveys || 0); },
    likerts() { return Array.isArray(this.surveys?.likerts) ? this.surveys.likerts : []; },
    recPct() {
      const v = Number(this.surveys?.has_recommendations || 0);
      return Math.max(0, Math.min(100, Math.round(v * 100)));
    },
    avgLikertPct() {
      if (!this.likerts.length) return 0;
      const scores = this.likerts.map(x => Number(x?.score)).filter(v => Number.isFinite(v));
      if (!scores.length) return 0;
      const avg = scores.reduce((s, x) => s + x, 0) / scores.length;
      return Math.max(0, Math.min(100, Math.round(avg * 1000) / 10));
    },
    summary() { return this.surveys?.summary || ''; },
    hasAnyData() {
      return this.numSurveys > 0 || this.likerts.some(l => Number.isFinite(Number(l?.score))) || !!this.summary;
    }
  },
  template: `
  <div class="btech-card btech-theme" style="margin-top:12px;" aria-label="Course surveys card">
    <div class="btech-row" style="margin-bottom:12px;">
      <h4 class="btech-card-title">Student Surveys</h4>
      <span class="btech-pill">{{ yearLabel }}</span>
    </div>

    <div v-if="!hasAnyData" class="btech-muted" style="text-align:center;">
      No survey data yet.
    </div>

    <div v-else>
      <div class="btech-grid-3" style="margin-bottom:12px;">
        <div class="btech-tile" title="Total number of survey responses">
          <div class="btech-kpi-label">Responses</div>
          <div class="btech-kpi-value">{{ numSurveys.toLocaleString() }}</div>
        </div>

        <div class="btech-tile" title="Average of all Likert scores (0–1)">
          <div class="btech-kpi-label">Avg Likert</div>
          <div class="btech-kpi-value">{{ avgLikertPct.toFixed(1) }}<span class="btech-muted">%</span></div>
        </div>

        <div class="btech-tile" title="Share of responses that include a recommendation">
          <div class="btech-kpi-label">Has Recommendation</div>
          <div class="btech-kpi-value">{{ recPct }}<span class="btech-muted">%</span></div>
        </div>
      </div>

      <div class="btech-tile" style="margin-bottom:8px;" title="Breakdown of each Likert item">
        <div class="btech-row" style="margin-bottom:6px;">
          <div style="font-size:12px; color:#374151; font-weight:600;">Likert Breakdown</div>
          <div class="btech-muted">0%–100%</div>
        </div>

        <div v-if="likerts.length">
          <div v-for="(item, idx) in likerts" :key="idx" style="margin-bottom:10px;">
            <div class="btech-row" style="margin-bottom:6px;">
              <div style="font-size:12px; color:#374151; font-weight:600;">{{ item.name || 'Item ' + (idx+1) }}</div>
              <div style="font-size:12px; color:#111827; font-weight:700;">
                {{ Number.isFinite(Number(item.score)) ? Math.round(Number(item.score) * 100) : '—' }}%
              </div>
            </div>
            <div class="btech-progress" role="presentation">
              <div
                class="fill btech-fill-accent"
                :style="{ width: Math.max(0, Math.min(100, Number(item.score || 0) * 100)) + '%' }"
                role="progressbar"
                :aria-valuenow="Math.max(0, Math.min(100, Number(item.score || 0) * 100))"
                aria-valuemin="0" aria-valuemax="100"
              ></div>
            </div>
          </div>
        </div>
        <div v-else class="btech-muted">No Likert items provided.</div>
      </div>

      <div class="btech-tile" v-if="summary" title="Summary of free responses">
        <div class="btech-row" style="margin-bottom:6px;">
          <div style="font-size:12px; color:#374151; font-weight:600;">Free Response Summary</div>
        </div>
        <div style="white-space:pre-wrap; font-size:12px; color:#111827;">
          {{ summary }}
        </div>
      </div>
    </div>
  </div>
  `
});

Vue.component('course-metadata-card', {
  props: { course: { type: Object, required: true } },
  computed: {
    credits() { return this.course?.credits ?? this.course?.suggested_credits ?? null; },
    lastUpdate() { return this.course?.last_update || null; },
    lastSurveyUpdate() { return this.course?.surveys?.last_update || null; },
    fmtLast() { return this.formatDate(this.lastUpdate); },
    fmtSurveyLast() { return this.formatDate(this.lastSurveyUpdate); }
  },
  methods: {
    formatDate(v) {
      // treat null/undefined/empty/"0"/0 as missing
      if (v == null) return '—';
      if (v === 0 || v === '0') return '—';
      if (typeof v === 'string' && v.trim() === '') return '—';

      // allow unix seconds or ms too, if that ever happens
      if (typeof v === 'number') {
        const ms = v < 2e10 ? v * 1000 : v; // seconds -> ms
        const d = new Date(ms);
        return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
      }

      const d = new Date(v); // handles ISO strings well
      return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
    }
  },

  template: `
  <div class="btech-card btech-theme" style="margin-top:12px;">
    <div class="btech-row" style="margin-bottom:10px;">
      <h4 class="btech-card-title">Course Details</h4>
    </div>

    <div class="btech-grid-3">
      <div class="btech-tile">
        <div class="btech-kpi-label">Course Code</div>
        <div class="btech-kpi-value" style="font-size:16px;">{{ course.course_code || '—' }}</div>
      </div>

      <div class="btech-tile">
        <div class="btech-kpi-label">Credits</div>
        <div class="btech-kpi-value" style="font-size:16px;">{{ (credits != null ? credits : '—') }}</div>
      </div>

      <div class="btech-tile">
        <div class="btech-kpi-label">Last Update</div>
        <div style="font-size:12px; color:#111827; font-weight:600;">{{ fmtLast }}</div>
        <div class="btech-muted" style="margin-top:4px;">Surveys: {{ fmtSurveyLast }}</div>
      </div>
    </div>
  </div>
  `
});
