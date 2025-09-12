Vue.component('instructor-report', {
  props: {
    year: { type: [Number, String], required: true },
    account: { type: [Number, String], required: true },
    instructorId: { type: [Number, String], default: () => (typeof ENV !== 'undefined' ? ENV.current_user_id : null) }
  },
  data() {
    return {
      loading: false,
      instructor_metrics: {}
    }
  },
  computed: {
    surveys() {
      let list = this.instructor_metrics?.surveys ?? [];
      if (!list.length) return {};
      const yr = Number(this.year) || new Date().getFullYear();
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
    },
    interactions() {
      let list = this.instructor_metrics?.interactions ?? [];
      if (!list.length) return {};
      const yr = Number(this.year) || new Date().getFullYear();
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
    },
    grading() {
      let list = this.instructor_metrics?.grading ?? [];
      if (!list.length) return {};
      const yr = Number(this.year) || new Date().getFullYear();
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
    },
    supportHours() {
      let list = this.instructor_metrics?.support_hours ?? [];
      if (!list.length) return {};
      const yr = Number(this.year) || new Date().getFullYear();
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
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
        let instructorId = this.instructorId || (typeof ENV !== 'undefined' ? ENV.current_user_id : null);

        // (Remove the debug override; keep here only if you need it)
        // instructorId = 1840071;

        const url = `https://reports.bridgetools.dev/api/instructors/${instructorId}?year=${this.year}&account_id=${this.account}`;
        const resp = await bridgetools.req(url);
        this.instructor_metrics = resp || {};
        console.log(resp);
        // console.log('Instructor metrics', resp);
      } catch (e) {
        console.warn('Failed to load instructor metrics', e);
        this.instructor_metrics = {};
      } finally {
        this.loading = false;
      }
    },

    // Optional helpers if any child tiles use them directly:
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
      <!-- Could show a loading indicator if you like -->
      <instructor-metrics-grading
        v-if="grading && Object.keys(grading).length"
        :interactions="interactions"
        :support-hours="supportHours"
        :grading="grading"
        :year="year"
      />
      <instructor-metrics-surveys
        v-if="surveys && Object.keys(surveys).length"
        :surveys="surveys"
        :year="year"
      />
      <div v-if="!loading && (!grading || !Object.keys(grading).length) && (!surveys || !Object.keys(surveys).length)" class="btech-card btech-theme">
        <div class="btech-muted" style="text-align:center;">No instructor data for {{ year }}.</div>
      </div>
    </div>
  `
});
