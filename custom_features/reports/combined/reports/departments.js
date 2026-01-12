Vue.component('reports-departments', {
  template: `
    <div>
      <departments-overview
        v-if="subMenu == 'overview'"
        :year="year"
        :departments="departmentsClean"
        :tags="allSurveyTags"
        :loading="loading"
      ></departments-overview>
      <departments-course-surveys
        v-if="subMenu == 'course-surveys'"
        :year="year"
        :departments="departmentsClean"
        :loading="loading"
        :tags="tags"
      ></departments-course-surveys>

    </div>
  `,

  props: {
    year: { type: [Number, String], required: true },
    subMenu: { type: [Number, String], required: true },
    instructorId: { type: [Number, String], default: () => (typeof ENV !== 'undefined' ? ENV.current_user_id : null) }
  },

  data() {
    return {
      loading: false,
      departments: [],
      departmentsClean: [],
      allSurveyTags: []
    };
  },

  computed: {
    yearNum() { return Number(this.year) || new Date().getFullYear(); }
  },

  watch: {
    year: 'rebuildDepartments',
    departments: 'rebuildDepartments'
  },

  async mounted() {
    await this.loadDepartmentMetrics();
  },

  methods: {
    async loadDepartmentMetrics() {
      try {
        this.loading = true;
        const url = `https://reports.bridgetools.dev/api/departments/full`;
        const resp = await bridgetools.req(url);

        // expects array in resp.data (as you said)
        this.departments = Array.isArray(resp?.data) ? resp.data : [];
      } catch (e) {
        console.warn('Failed to load department metrics', e);
        this.departments = [];
      } finally {
        this.loading = false;
        this.rebuildDepartments();
      }
    },

    rebuildDepartments() {
      const yr = this.yearNum;
      const depts = Array.isArray(this.departments) ? this.departments : [];
      this.departmentsClean = depts.map(d => this.cleanDeptForYear(d, yr));

      // global unique tag list for the selected year
      this.allSurveyTags = this.collectAllSurveyTags(this.departmentsClean);

      console.log(this.departmentsClean);
      console.log('ALL TAGS:', this.allSurveyTags);
    },


    // -------------------------------
    // Core: EXACTLY your computed logic,
    // but applied per department object.
    // -------------------------------
    cleanDeptForYear(dept, yr) {
      const out = Object.assign({}, dept);

      // single-object-per-year arrays → pick first match or {}
      out.statistics          = this.pickYearOne(dept?.statistics, yr);
      out.instructor_metrics  = this.pickYearOne(dept?.instructor_metrics, yr);
      out.course_surveys = this.pickYearOne(dept?.course_surveys, yr);

      // build tag lookup for reports
      const tagsArr = out.course_surveys?.tags;
      out.course_surveys = out.course_surveys || {};
      out.course_surveys.tags_by_name = this.indexTagsByName(tagsArr);

      out.instructor_surveys  = this.pickYearOne(dept?.instructor_surveys, yr);
      out.interactions        = this.pickYearOne(dept?.interactions, yr);
      out.grading             = this.pickYearOne(dept?.grading, yr);
      out.support_hours       = this.pickYearOne(dept?.support_hours, yr);

      // multi-row-per-year arrays → keep all matches or []
      out.occupations         = this.pickYearMany(dept?.occupations, yr);
      out.cpl                 = this.pickYearMany(dept?.cpl, yr);
      out.coe                 = this.pickYearMany(dept?.coe, yr);

      // (optional) attach normalized year for convenience
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
        out[name] = t; // last one wins if duplicates
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
    },


  }
});
