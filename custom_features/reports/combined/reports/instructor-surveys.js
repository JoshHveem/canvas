/* =========================
 * Instructor Report (root)
 * ========================= */
Vue.component('reports-instructor-surveys', {
  props: {
    year:         { type: [Number, String], required: true },
    account:      { type: [Number, String], required: true },
    instructorId: { type: [Number, String], default: () => (typeof ENV !== 'undefined' ? ENV.current_user_id : null) }
  },
  data() {
    return {
      loading: false,
      instructors: [],   // raw list from API
      selected: null     // normalized instructor object for the chosen year
    };
  },
  computed: {
    yearNum() { return Number(this.year) || new Date().getFullYear(); },

    normalizedInstructors() {
    return (Array.isArray(this.instructors) ? this.instructors : [])
      .map(i => this._forYear(i, this.yearNum))
      .filter(i => (Number(i?.grading?.assignments_graded) > 0 || Number(i?.surveys?.num_surveys) > 0))
      ;
  },
    hasMany()   { return this.normalizedInstructors.length > 1; },
    hasSingle() { return this.normalizedInstructors.length === 1; },

    // The detail record to show (selected or the only one)
    detailInstructor() {
      if (this.selected) return this.selected;
      if (this.hasSingle) return this.normalizedInstructors[0];
      return null;
    },

    // styles for the back pill
    backPillStyle() {
      return [
        'display:inline-block',
        'cursor:pointer',
        'user-select:none',
        'border-radius:9999px',
        'padding:4px 10px',
        'font-size:12px',
        'font-weight:700',
        'background:#F3F4F6',
        'color:#111827',
        'border:1px solid #E5E7EB',
        'margin-bottom:8px'
      ].join(';');
    }
  },
  watch: {
    year: 'loadInstructorMetrics',
    account: 'loadInstructorMetrics'
  },
  async mounted() {
    await this.loadInstructorMetrics();
  },
  methods: {
    async loadInstructorMetrics() {
      try {
        this.loading = true;
        this.selected = null; // reset selection on reload
        const url = `https://reports.bridgetools.dev/api/instructors?dept_head_account_ids[]=${this.account}`;
        const resp = await bridgetools.req(url);

        const incoming = resp?.data || [];
        // enrich names from Canvas
        for (let i = 0; i < incoming.length; i++) {
          try {
            const canvasData = (await canvasGet(`/api/v1/users/${incoming[i].canvas_id}`))[0];
            incoming[i].first_name = canvasData?.first_name || incoming[i].first_name;
            incoming[i].last_name  = canvasData?.last_name  || incoming[i].last_name;
          } catch (e) {
            // non-fatal; keep whatever we have
          }
        }
        this.instructors = incoming;
        console.log(this.instructors);

        // if exactly one, auto-select it
        if (this.normalizedInstructors.length === 1) {
          this.selected = this.normalizedInstructors[0];
        }
      } catch (e) {
        console.error('Failed to load instructor metrics', e);
        this.instructors = [];
        this.selected = null;
      } finally {
        this.loading = false;
      }
    },

    // Normalize one instructor to a single-year snapshot
    _forYear(raw, yr) {
      const pickYear = (arr) => Array.isArray(arr)
        ? (arr.find(d => Number(d?.academic_year) === yr) || {})
        : {};

      const oneOrYear = (val) => Array.isArray(val)
        ? pickYear(val)
        : (val && Number(val.academic_year)
            ? (Number(val.academic_year) === yr ? val : {})
            : (val || {}));

      return {
        first_name: raw?.first_name || raw?.firstName || '',
        last_name:  raw?.last_name  || raw?.lastName  || '',
        canvas_user_id: raw?.canvas_user_id || raw?.canvasId || raw?.canvas_id || raw?.canvas_id || null,
        div_code: raw?.div_code || null,
        academic_year: yr,

        grading:        oneOrYear(raw?.grading),
        support_hours:  oneOrYear(raw?.support_hours || raw?.supportHours),
        interactions:   oneOrYear(raw?.interactions),
        surveys:        oneOrYear(raw?.surveys)
      };
    },

    onSelectInstructor(inst) {
      // inst is already normalized for the year (emitted by the row component),
      // but if you decide to emit the raw object, re-normalize here.
      this.selected = inst;
      // optional: scroll into view / focus, etc.
    },

    onBackToList() {
      this.selected = null;
    },

    // (kept helpers)
    dateToString(date) {
      date = new Date(Date.parse(date));
      return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
    },
    calcLikert(course, name) {
      const score = (course?.surveys?.likerts ?? []).filter(l => l.name == name)?.[0]?.score;
      return score ?? null;
    }
  },
  template: `
    <div>
      <!-- Loading -->
      <div v-if="loading" class="btech-card btech-theme">
        <div class="btech-muted" style="text-align:center;">Loading…</div>
      </div>

      <!-- Overview list (only when multiple and nothing selected) -->
      <instructors-report
        v-if="!loading && hasMany && !selected"
        :instructors="normalizedInstructors"
        :year="year"
        @select="onSelectInstructor"
      />

      <!-- Back button when drilled in and there are multiple -->
      <div v-if="!loading && hasMany && selected" :style="backPillStyle" @click="onBackToList">
        ← Back to list
      </div>

      <!-- Detail view (single or selected) -->
      <div v-if="!loading && detailInstructor">
        <instructor-metrics-grading
          :interactions="detailInstructor.interactions"
          :support-hours="detailInstructor.support_hours"
          :grading="detailInstructor.grading"
          :year="year"
        />
        <instructor-metrics-surveys
          v-if="detailInstructor.surveys && Object.keys(detailInstructor.surveys).length"
          :surveys="detailInstructor.surveys"
          :year="year"
        />
      </div>

      <!-- None: empty state -->
      <div v-if="!loading && !hasMany && !detailInstructor" class="btech-card btech-theme">
        <div class="btech-muted" style="text-align:center;">No instructor data for {{ year }}.</div>
      </div>
    </div>
  `
});