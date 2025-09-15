Vue.component('instructor-report', {
  props: {
    year:       { type: [Number, String], required: true },
    account:    { type: [Number, String], required: true },
    instructorId: { type: [Number, String], default: () => (typeof ENV !== 'undefined' ? ENV.current_user_id : null) }
  },
  data() {
    return {
      loading: false,
      instructors: [] // raw from API (may include arrays per metric)
    };
  },
  computed: {
    yearNum() {
      return Number(this.year) || new Date().getFullYear();
    },

    // Normalize each instructor down to a single-year snapshot:
    normalizedInstructors() {
      return (Array.isArray(this.instructors) ? this.instructors : []).map(i => this._forYear(i, this.yearNum));
    },

    hasMany() { return this.normalizedInstructors.length > 1; },
    hasSingle() { return this.normalizedInstructors.length === 1; },

    // The single instructor object (already normalized for the chosen year)
    instructor() {
      return this.hasSingle ? this.normalizedInstructors[0] : null;
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
        // If you need to scope to dept head, this returns all instructors under that account:
        const url = `https://reports.bridgetools.dev/api/instructors?dept_head_account_ids[]=${this.account}`;
        const resp = await bridgetools.req(url);
        this.instructors = resp?.data || [];
        for (let i = 0; i < this.instructors.length; i++) {
          let instructor = this.instructors[i];
          let canvasData = (await canvasGet(`/api/v1/users/${instructor.canvas_id}`))[0];
          this.instructors[i].first_name = canvasData.first_name;
          this.instructors[i].last_name = canvasData.last_name;
          console.log(this.instructors[i]);
        }
      } catch (e) {
        console.warn('Failed to load instructor metrics', e);
        this.instructors = [];
      } finally {
        this.loading = false;
      }
    },

    // Pull one object with only the selected year’s metrics
    _forYear(raw, yr) {
      const pickYear = (arr) => {
        if (!Array.isArray(arr)) return {};
        return arr.find(d => Number(d?.academic_year) === yr) || {};
      };

      // Some APIs send single objects already; keep them as-is if so
      const oneOrYear = (val) => {
        if (Array.isArray(val)) return pickYear(val);
        return (val && Number(val.academic_year) ? (Number(val.academic_year) === yr ? val : {}) : (val || {}));
      };

      return {
        // identity/meta (pass through)
        first_name: raw?.first_name || raw?.firstName || '',
        last_name:  raw?.last_name  || raw?.lastName  || '',
        canvas_user_id: raw?.canvas_user_id || raw?.canvasId || raw?.canvas_id || null,
        div_code: raw?.div_code || null,
        academic_year: yr,

        // year slices
        grading:       oneOrYear(raw?.grading),
        supportHours:  oneOrYear(raw?.support_hours || raw?.supportHours),
        interactions:  oneOrYear(raw?.interactions),
        surveys:       oneOrYear(raw?.surveys)
      };
    },

    // Optional helpers (kept from your original)
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

      <!-- Multiple instructors: show overview list -->
      <instructor-metrics-overview
        v-if="!loading && hasMany"
        :instructors="normalizedInstructors"
        :year="year"
      />

      <!-- Exactly one: show individual report -->
      <div v-if="!loading && hasSingle">
        <instructor-metrics-grading
          :interactions="instructor.interactions"
          :support-hours="instructor.supportHours"
          :grading="instructor.grading"
          :year="year"
        />
        <instructor-metrics-surveys
          v-if="instructor.surveys && Object.keys(instructor.surveys).length"
          :surveys="instructor.surveys"
          :year="year"
        />
      </div>

      <!-- None: empty state -->
      <div v-if="!loading && !hasMany && !hasSingle" class="btech-card btech-theme">
        <div class="btech-muted" style="text-align:center;">No instructor data for {{ year }}.</div>
      </div>
    </div>
  `
});
