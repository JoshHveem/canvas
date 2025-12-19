Vue.component('reports-departments', {
  template: `
    <div>
      <departments-overview
        :year="year"
        :departments="departmentsClean"
        :loading="loading"
      ></departments-overview>
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
      departmentsClean: []
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
      out.course_surveys      = this.pickYearOne(dept?.course_surveys, yr);
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
    }
  }
});
