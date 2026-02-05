Vue.component('reports-departments', {
  template: `
    <div>
      <departments-overview
        v-if="subMenu == 'overview'"
        :year="year"
        :departments="departmentsClean"
        :tags="allSurveyTags"
      ></departments-overview>

      <departments-completion
        v-if="subMenu == 'completion'"
        :year="year"
        :departments="departmentsClean"
      ></departments-completion>

      <departments-canvas
        v-if="subMenu == 'canvas'"
        :year="year"
        :departments="departmentsClean"
        :allCourseTags="allCourseTags"
        :selectedCourseTags="selectedCourseTags"
      ></departments-canvas>

      <reports-departments-syllabi
        v-if="subMenu == 'syllabi'"
        :year="year"
        :departments="departmentsClean"
        :allCourseTags="allCourseTags"
        :selectedCourseTags="selectedCourseTags"
      ></reports-departments-syllabi>

      <departments-instructors
        v-if="subMenu == 'instructors'"
        :year="year"
        :departments="departmentsClean"
        :allCourseTags="allCourseTags"
        :selectedCourseTags="selectedCourseTags"
      ></departments-instructors>

      <departments-course-surveys
        v-if="subMenu == 'course-surveys'"
        :year="year"
        :departments="departmentsClean"
        :allCourseTags="allCourseTags"
        :selectedCourseTags="selectedCourseTags"
      ></departments-course-surveys>
 
    </div>
  `,

  props: {
    year: { type: [Number, String], required: true },
    subMenu: { type: [Number, String], required: true },
    instructorId: { type: [Number, String], default: () => (typeof ENV !== 'undefined' ? ENV.current_user_id : null) },

    allCourseTags: { type: Array, default: () => [] },
    selectedCourseTags: { type: Array, default: () => [] },
    departmentsRaw: { type: Array, default: () => [] }
  },

  data() {
    return {
      departmentsClean: [],
      allSurveyTags: []
    };
  },

  computed: {
    yearNum() { return Number(this.year) || new Date().getFullYear(); }
  },

  watch: {
    year: 'rebuildDepartments',
    departmentsRaw: 'rebuildDepartments' // ✅ FIX
  },

  mounted() {
    this.rebuildDepartments();
  },

  methods: {
    rebuildDepartments() {
      const yr = this.yearNum;

      // ✅ FIX: use departmentsRaw
      const depts = Array.isArray(this.departmentsRaw) ? this.departmentsRaw : [];

      this.departmentsClean = depts.map(d => this.cleanDeptForYear(d, yr));
      // global unique tag list for the selected year
      this.allSurveyTags = this.collectAllSurveyTags(this.departmentsClean);
    },

    cleanDeptForYear(dept, yr) {
      const out = Object.assign({}, dept);

      out.canvas              = this.pickYearOne(dept?.canvas, yr);
      out.statistics          = this.pickYearOne(dept?.statistics, yr);
      out.instructor_metrics  = this.pickYearOne(dept?.instructor_metrics, yr);
      out.course_surveys      = this.pickYearOne(dept?.course_surveys, yr);

      const tagsArr = out.course_surveys?.tags;
      out.course_surveys = out.course_surveys || {};
      out.course_surveys.tags_by_name = this.indexTagsByName(tagsArr);

      out.instructor_surveys  = this.pickYearOne(dept?.instructor_surveys, yr);
      out.interactions        = this.pickYearOne(dept?.interactions, yr);
      out.grading             = this.pickYearOne(dept?.grading, yr);
      out.support_hours       = this.pickYearOne(dept?.support_hours, yr);
      out.syllabi             = this.pickYearMany(dept?.syllabi, yr);

      out.occupations         = this.pickYearMany(dept?.occupations, yr);
      out.cpl                 = this.pickYearMany(dept?.cpl, yr);
      out.coe                 = this.pickYearMany(dept?.coe, yr);

      out.academic_year = yr;
      return out;
    },

    pickYearOne(list, yr) {
      const rows = Array.isArray(list) ? list : [];
      if (!rows.length) return {};
      const y = Number(yr);
      return rows.filter(d => Number(d?.academic_year) === y)[0] || {};
    },

    pickYearMany(list, yr) {
      const rows = Array.isArray(list) ? list : [];
      if (!rows.length) return [];
      const y = Number(yr);
      return rows.filter(d => Number(d?.academic_year) === y) || [];
    },

    indexTagsByName(tagsArr) {
      const arr = Array.isArray(tagsArr) ? tagsArr : [];
      const out = {};
      for (const t of arr) {
        const name = (t && typeof t.tag === 'string') ? t.tag : null;
        if (!name) continue;
        out[name] = t;
      }
      return out;
    },

    collectAllSurveyTags(cleanDepts) {
      const set = new Set();
      for (const d of (Array.isArray(cleanDepts) ? cleanDepts : [])) {
        const tags = d?.course_surveys?.tags;
        if (!Array.isArray(tags)) continue;
        for (const t of tags) {
          if (t && typeof t.tag === 'string' && t.tag) set.add(t.tag);
        }
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b));
    }
  }
});
