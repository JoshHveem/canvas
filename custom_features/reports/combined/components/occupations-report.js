Vue.component('occupations-report', {
  template: `
    <div>
      <!-- Could show a loading indicator if you like -->
      <department-cpl
        v-for="campus in cpl"
        :cpl="campus"
        :year="year"
      />
      <department-occupations
        :occupations="occupations"
        :year="year"
      />
    </div>
  `,
  props: {
    year: { type: [Number, String], required: true },
    account: { type: [Number, String], required: true },
    instructorId: { type: [Number, String], default: () => (typeof ENV !== 'undefined' ? ENV.current_user_id : null) }
  },
  data() {
    return {
      loading: false,
      department_metrics: {}
    }
  },
  computed: {
    occupations() {
      let list = this.department_metrics?.occupations?? [];
      if (!list.length) return [];
      const yr = Number(this.year) || new Date().getFullYear();
      list = (list.filter(d => Number(d.academic_year) === yr)) || []
      return list;
    },
    cpl() {
      let list = this.department_metrics?.cpl ?? [];
      if (!list.length) return [];
      const yr = Number(this.year) || new Date().getFullYear();
      list = (list.filter(d => Number(d.academic_year) === yr)) || []
      return list;
    },
  },
  watch: {
    year: 'loadDepartmentMetrics',
    account: 'loadDepartmentMetrics'
  },
  async mounted() {
    await this.loadDepartmentMetrics();
  },
  methods: {
    async loadDepartmentMetrics() {
      try {
        this.loading = true;
        const url = `https://reports.bridgetools.dev/api/departments/${this.account}/full?type=dept`;
        const resp = await bridgetools.req(url);
        console.log(resp);
        this.department_metrics = resp || {};
        // console.log('Instructor metrics', resp);
      } catch (e) {
        console.warn('Failed to load instructor metrics', e);
        this.department_metrics = {};
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
});
