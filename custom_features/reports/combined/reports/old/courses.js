// courses.js
// container module for combined reports Courses menu
Vue.component('reports-courses', {
  template: `
    <div>
        <reports-courses-overview
            v-if="subMenu == 'overview'"
            :year="year"
            :courses="courses"
        ></reports-courses-overview>
        <reports-courses-surveys
            v-if="subMenu == 'surveys'"
            :year="year"
            :courses="courses"
        ></reports-courses-surveys>
    </div>
  `,
  props: {
    year: { type: [Number, String], required: true },
    account: { type: [Number, String], required: true },
    subMenu: { type: [Number, String], required: true },

    // NEW: raw courses provided by top-level ReportData loader
    coursesRaw: { type: Array, default: () => [] },

    // Optional: top-level shared loading flags (if you passed it)
    sharedLoading: { type: Object, default: () => ({}) }
  },

  watch: {
    // account/year change will cause parent to refresh coursesRaw;
    // we only need to re-process when the raw input changes or the year changes.
    coursesRaw: {
      immediate: true,
      handler: 'applyCoursesRaw'
    },
    year: 'applyCoursesRaw',
  },

  data() {
    return {
      // You can either keep your local loading, or mirror the parent's.
      // Here we just mirror so existing templates can show loading state if needed.
      loading: false,

      department_metrics: {},
      courses: []
    }
  },

  computed: {
    yearNum() { return Number(this.year) || new Date().getFullYear(); },

    // If you want to key UI spinners off parent loader:
    sharedCoursesLoading() {
      return !!(this.sharedLoading && this.sharedLoading.courses);
    },

    statistics() {
      let list = this.department_metrics?.statistics ?? [];
      if (!list.length) return {};
      const yr = this.yearNum;
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
    },
    occupations() {
      let list = this.department_metrics?.occupations ?? [];
      if (!list.length) return [];
      const yr = this.yearNum;
      return (list.filter(d => Number(d.academic_year) === yr)) || [];
    },
    cpl() {
      let list = this.department_metrics?.cpl ?? [];
      if (!list.length) return [];
      const yr = this.yearNum;
      return (list.filter(d => Number(d.academic_year) === yr)) || [];
    },
    instructorMetrics() {
      let list = this.department_metrics?.instructor_metrics ?? [];
      if (!list.length) return {};
      const yr = this.yearNum;
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
    },
    courseSurveys() {
      let list = this.department_metrics?.course_surveys ?? [];
      if (!list.length) return {};
      const yr = this.yearNum;
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
    },
    instructorSurveys() {
      let list = this.department_metrics?.instructor_surveys ?? [];
      if (!list.length) return {};
      const yr = this.yearNum;
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
    },
    interactions() {
      let list = this.department_metrics?.interactions ?? [];
      if (!list.length) return {};
      const yr = this.yearNum;
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
    },
    grading() {
      let list = this.department_metrics?.grading ?? [];
      if (!list.length) return {};
      const yr = this.yearNum;
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
    },
    supportHours() {
      let list = this.department_metrics?.support_hours ?? [];
      if (!list.length) return {};
      const yr = this.yearNum;
      return (list.filter(d => Number(d.academic_year) === yr)[0]) || {};
    },
    coe() {
      let list = this.department_metrics?.coe ?? [];
      if (!list.length) return [];
      const yr = this.yearNum;
      return (list.filter(d => Number(d.academic_year) === yr)) || [];
    },
  },

  mounted() {
    // No more API loading here; parent owns it.
    // Keep mounted in case you later add report-specific loads.
    this.applyCoursesRaw();
  },

  methods: {
    applyCoursesRaw() {
      // Mirror parent loading state if you want a local flag
      this.loading = this.sharedCoursesLoading;

      const raw = Array.isArray(this.coursesRaw) ? this.coursesRaw : [];

      // IMPORTANT: don't mutate props in-place (coursesRaw). Make a shallow copy.
      // If you need deeper safety, do a deeper clone, but this is usually enough.
      const cloned = raw.map(c => Object.assign({}, c));

      // Process + normalize to what your overview/surveys expect.
      // (Your old code processed after fetch; now we do it here.)
      this.courses = this.processCourses(cloned);
      console.log(this.courses);
    },

    processCourses(courses) {
      return (courses || []).map(course => {
        // preserve original fields and add derived ones
        const out = course;

        out.students = out.num_students_credits;
        out.grades = out.average_score;
        out.objectives = this.calcLikert(out, 'Objectives');
        out.relevance  = this.calcLikert(out, 'Workplace Relevance');
        out.examples   = this.calcLikert(out, 'Examples');
        out.recommendable = this.calcLikert(out, 'Recommendable');
        out.recommendations = out?.surveys?.has_recommendations;
        out.survey_summary = out?.surveys?.summary;

        return out;
      });
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
