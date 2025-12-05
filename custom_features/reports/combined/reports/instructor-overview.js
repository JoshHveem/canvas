/* =========================
 * Instructor Report (root)
 * ========================= */
Vue.component('reports-instructor-overview', {
  props: {
    year:         { type: [Number, String], required: true },
    account:      { type: [Number, String], required: true },
    instructorId: { type: [Number, String], default: () => (typeof ENV !== 'undefined' ? ENV.current_user_id : null) },
    instructors: { type: Array, default: [], required: true}
  },
  data() {
    return {
      loading: false,
      selected: null     // normalized instructor object for the chosen year
    };
  },
  computed: {
    yearNum() { return Number(this.year) || new Date().getFullYear(); },


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