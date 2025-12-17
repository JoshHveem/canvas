// courses.js
// container module for combined reports Courses menu
Vue.component('reports-courses', {
  template: `
    <div>
        <reports-courses-overview
            v-if="subMenu == 'overview'"
            :year="year"
            :courses="courses"
        ></reports-department-instructors>
        <reports-courses-surveys
            v-if="subMenu == 'surveys'"
            :year="year"
            :courses="courses"
        ></reports-department-instructors>
    </div>
  `,
  props: {
    year: { type: [Number, String], required: true },
    account: { type: [Number, String], required: true },
    subMenu: { type: [Number, String], required: true },
  },
  watch: {
    year:    'loadCourses',
    account: 'loadCourses'
  },
  data() {
    return {
      loading: false,
      department_metrics: {},
      courses: []
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
    },
    coe() {
      let list = this.department_metrics?.coe?? [];
      if (!list.length) return [];
      const yr = Number(this.year) || new Date().getFullYear();
      list = (list.filter(d => Number(d.academic_year) === yr)) || []
      return list;
    },
  },
  async mounted() {
    await this.loadCourses();
  },
  methods: {
        processCourses(courses) {
      return courses.map(course => {
        course.students = course.num_students_credits;
        course.grades = course.average_score;
        course.objectives = this.calcLikert(course, 'Objectives');
        course.relevance  = this.calcLikert(course, 'Workplace Relevance');
        course.examples   = this.calcLikert(course, 'Examples');
        course.recommendable = this.calcLikert(course, 'Recommendable');
        course.recommendations = course?.surveys?.has_recommendations;
        return course;
      });
    },

    // ---- API
    async getMyCourses() {
      const courses = await canvasGet('/api/v1/courses?enrollment_type=teacher&enrollment_state=active&state[]=available&include[]=term');
      const ids = courses.map(c => c.id);
      const out = [];
      const limit = 50;
      for (let i = 0; i < ids.length; i += limit) {
        const chunk = ids.slice(i, i + limit);
        let url = `https://reports.bridgetools.dev/api/reviews/courses?limit=${limit}`;
        chunk.forEach(id => { url += `&course_ids[]=${id}`; });
        const data = await bridgetools.req(url);
        out.push(...(this.processCourses(data.courses || [])));
      }
      return out;
    },

    async loadCourses() {
      try {
        this.loading = true;
        this.courses = [];
        const limit = 50;
        if (Number(this.account) === 0) {
          this.courses = await this.getMyCourses();
          return;
        }
        // by account (department)
        let url = `https://reports.bridgetools.dev/api/reviews/courses?limit=${limit}&excludes[]=content_items&year=${this.year}&account_id=${this.account}`;
        let resp = {};
        do {
          resp = await bridgetools.req(url + (resp?.next_id ? `&last_id=${resp.next_id}` : ''));
          this.courses.push(...this.processCourses(resp?.courses || []));
        } while ((resp?.courses || []).length === limit);
        console.log(this.courses);
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
