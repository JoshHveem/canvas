// course.js (single-course container)
Vue.component('reports-course', {
  template: `
    <div>
      <reports-course-overview
        v-if="subMenu == 'overview'"
        :year="year"
        :course="selectedCourse"
        :loading="loading"
      ></reports-course-overview>
    </div>
  `,

  props: {
    year: { type: [Number, String], required: true },
    account: { type: [Number, String], required: true },
    subMenu: { type: [Number, String], required: true },

    coursesRaw: { type: Array, default: () => [] },
    selectedCourseId: { type: [Number, String], default: '' },

    sharedLoading: { type: Object, default: () => ({}) }
  },

  data() {
    return {
      loading: false,
      courses: []
    };
  },

  computed: {
    yearNum() { return Number(this.year) || new Date().getFullYear(); },

    sharedCoursesLoading() {
      return !!(this.sharedLoading && this.sharedLoading.courses);
    },

    // Normalize the selected id into a comparable string
    selectedCourseIdStr() {
      const v = this.selectedCourseId;
      return (v == null) ? '' : String(v);
    },

    // ✅ This is the main point: always derive selectedCourse from processed list
    selectedCourse() {
      const id = this.selectedCourseIdStr;
      if (!id) return null;

      const pickId = (c) => String(c?.id ?? c?.course_id ?? c?.canvas_course_id ?? '');
      return this.courses.find(c => pickId(c) === id) || null;
    }
  },

  watch: {
    // Reprocess whenever raw changes (account/year refreshes upstream)
    coursesRaw: {
      immediate: true,
      handler() {
        this.applyCoursesRaw();
        this.ensureValidSelection();
      }
    },

    // If your processing depends on year, re-run it
    year() {
      this.applyCoursesRaw();
      this.ensureValidSelection();
    },

    // If user changes the selector, ensure it exists
    selectedCourseId() {
      this.ensureValidSelection();
    },

    // Mirror parent loading state
    sharedCoursesLoading(val) {
      this.loading = !!val;
    }
  },

  mounted() {
    this.loading = this.sharedCoursesLoading;
    this.applyCoursesRaw();
    this.ensureValidSelection();
  },

  methods: {
    applyCoursesRaw() {
      this.loading = this.sharedCoursesLoading;

      const raw = Array.isArray(this.coursesRaw) ? this.coursesRaw : [];
      const cloned = raw.map(c => Object.assign({}, c));
      this.courses = this.processCourses(cloned);
    },

    ensureValidSelection() {
      // If nothing selected, don't force a selection here.
      // (Parent can auto-select when there is only one option, if you want.)
      const id = this.selectedCourseIdStr;
      if (!id) return;

      const exists = this.selectedCourse != null;
      if (!exists) {
        // We cannot mutate parent's settings here (prop down).
        // So we just no-op; parent should clear invalid selections.
        // But we *can* emit an event if you want the parent to clear it.
        // this.$emit('invalid-course', id);

        console.warn('[reports-course] selectedCourseId not found in coursesRaw:', id);
      }
    },

    processCourses(courses) {
      return (courses || []).map(course => {
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

    calcLikert(course, name) {
      const score = (course?.surveys?.likerts ?? []).filter(l => l.name == name)?.[0]?.score;
      return score ?? null;
    }
  }
});
