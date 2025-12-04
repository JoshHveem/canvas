Vue.component('reports-department', {
  template: `
    <div>
        <reports-department-instructors
            v-if="subMenu == 'Instructors'"
            :year="year"
            :statistics="statistics"
            :cpl="cpl"
            :instructor-metrics="instructorMetrics"
            :instructor-surveys="instructorSurveys"
            :course-surveys="courseSurveys"
        ></reports-department-instructors>
    </div>
  `,
  props: {
    year: { type: [Number, String], required: true },
    account: { type: [Number, String], required: true },
    subMenu: { type: [Number, String], required: true },
    instructorId: { type: [Number, String], default: () => (typeof ENV !== 'undefined' ? ENV.current_user_id : null) }
  },
  data() {
    return {
      loading: false,
      department_metrics: {}
    }
  },
  computed: {
    statistics() {
      let list = this.department_metrics?.statistics?? [];
      if (!list.length) return {};
      const yr = Number(this.year) || new Date().getFullYear();
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
    },
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
    instructorMetrics() {
      let list = this.department_metrics?.instructor_metrics ?? [];
      if (!list.length) return {};
      const yr = Number(this.year) || new Date().getFullYear();
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
    },
    courseSurveys() {
      let list = this.department_metrics?.course_surveys ?? [];
      if (!list.length) return {};
      const yr = Number(this.year) || new Date().getFullYear();
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
    },
    instructorSurveys() {
      let list = this.department_metrics?.instructor_surveys ?? [];
      if (!list.length) return {};
      const yr = Number(this.year) || new Date().getFullYear();
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
    },
    interactions() {
      let list = this.department_metrics?.interactions ?? [];
      if (!list.length) return {};
      const yr = Number(this.year) || new Date().getFullYear();
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
    },
    grading() {
      let list = this.department_metrics?.grading ?? [];
      if (!list.length) return {};
      const yr = Number(this.year) || new Date().getFullYear();
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
    },
    supportHours() {
      let list = this.department_metrics?.support_hours ?? [];
      if (!list.length) return {};
      const yr = Number(this.year) || new Date().getFullYear();
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
    }
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
