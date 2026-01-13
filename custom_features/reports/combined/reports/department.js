//reports/combined/reports/departments.js
Vue.component('reports-department', {
  template: `
    <div>
      <reports-department-overview
        v-if="subMenu == 'overview'"
        :year="year"
        :statistics="statistics"
        :cpl="cpl"
        :instructor-metrics="instructorMetrics"
        :instructor-surveys="instructorSurveys"
        :course-surveys="courseSurveys"
      ></reports-department-overview>

      <reports-department-instructors
        v-if="subMenu == 'instructors'"
        :year="year"
        :statistics="statistics"
        :cpl="cpl"
        :instructor-metrics="instructorMetrics"
        :instructor-surveys="instructorSurveys"
        :course-surveys="courseSurveys"
      ></reports-department-instructors>

      <reports-department-courses
        v-if="subMenu == 'courses'"
        :year="year"
        :statistics="statistics"
        :cpl="cpl"
        :instructor-metrics="instructorMetrics"
        :instructor-surveys="instructorSurveys"
        :course-surveys="courseSurveys"
      ></reports-department-courses>

      <reports-department-occupation
        v-if="subMenu == 'occupation'"
        :year="year"
        :cpl="cpl"
        :occupations="occupations"
        :statistics="statistics"
      ></reports-department-occupation>

      <reports-department-coe
        v-if="subMenu == 'coe'"
        :year="year"
        :cpl="cpl"
        :coe="coe"
      ></reports-department-coe>
    </div>
  `,
  props: {
    year: { type: [Number, String], required: true },
    account: { type: [Number, String], required: true }, // dept id
    subMenu: { type: [Number, String], required: true },
    // ✅ NEW: cached departments array from parent
    departmentsRaw: { type: Array, default: () => [] },

    instructorId: {
      type: [Number, String],
      default: () => (typeof ENV !== 'undefined' ? ENV.current_user_id : null)
    }
  },

  data() {
    return {
      // keep if you want to show a spinner until departmentsRaw arrives
      loading: false,
    };
  },

  computed: {
    // ✅ single source of truth: pull the one department from cached list
    department_metrics() {
      const list = Array.isArray(this.departmentsRaw) ? this.departmentsRaw : [];
      const deptId = Number(this.account);

      // departments/full returns either {dept: Number} or maybe dept is a string—handle both
      const dep =
        list.find(d => Number(d?.dept) === deptId) ||
        list.find(d => String(d?.dept) === String(this.account));

      return dep || {};
    },

    statistics() {
      let list = this.department_metrics?.statistics ?? [];
      if (!list.length) return {};
      const yr = Number(this.year) || new Date().getFullYear();
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
    },

    occupations() {
      let list = this.department_metrics?.occupations ?? [];
      if (!list.length) return [];
      const yr = Number(this.year) || new Date().getFullYear();
      return list.filter(d => Number(d.academic_year) === yr) || [];
    },

    cpl() {
      let list = this.department_metrics?.cpl ?? [];
      if (!list.length) return [];
      const yr = Number(this.year) || new Date().getFullYear();
      return list.filter(d => Number(d.academic_year) === yr) || [];
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
    },

    coe() {
      let list = this.department_metrics?.coe ?? [];
      if (!list.length) return [];
      const yr = Number(this.year) || new Date().getFullYear();
      return list.filter(d => Number(d.academic_year) === yr) || [];
    },
  },

  watch: {
    // no fetch needed; computed reacts automatically.
    // if you still want a loading flag:
    departmentsRaw: {
      immediate: true,
      handler(v) {
        this.loading = !Array.isArray(v) || v.length === 0;
      }
    }
  },

  methods: {
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
