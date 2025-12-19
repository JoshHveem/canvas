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
    departments: { type: Array, required: true },
    subMenu: { type: [Number, String], required: true },
    instructorId: { type: [Number, String], default: () => (typeof ENV !== 'undefined' ? ENV.current_user_id : null) }
  },

  data() {
    return {
      loading: false,
      department_metrics: {},
      departmentsClean: []
    };
  },

  computed: {
    yearNum() { return Number(this.year) || new Date().getFullYear(); }
  },

  watch: {
    year: 'rebuildDepartments',
    departments: {
      deep: true,
      handler: 'rebuildDepartments'
    },
    department_metrics: {
      deep: true,
      handler: 'rebuildDepartments'
    }
  },

  async mounted() {
    console.log('load departments');
    await this.loadDepartmentMetrics();
  },

  methods: {
    async loadDepartmentMetrics() {
      try {
        this.loading = true;
        const url = `https://reports.bridgetools.dev/api/departments/full`;
        const resp = await bridgetools.req(url);
        this.department_metrics = resp?.data || [];
        console.log(this.department_metrics);
      } catch (e) {
        console.warn('Failed to load department metrics', e);
        this.department_metrics = {};
      } finally {
        this.loading = false;
        this.rebuildDepartments(); // ensure we build once after load
      }
    },

    rebuildDepartments() {
      const depts = Array.isArray(this.departments) ? this.departments : [];
      this.departmentsClean = depts.map(d => this.buildDeptRow(d));
      console.log(this.departmentsClean);
    },

    // ---------- Core: take one dept and attach year-filtered metrics ----------
    buildDeptRow(dept) {
      const yr = this.yearNum;

      // dept key is usually account id; support a few common field names
      const deptId =
        dept?.account_id ??
        dept?.id ??
        dept?.dept_account_id ??
        dept?.canvas_account_id ??
        null;

      const out = Object.assign({}, dept, {
        deptId: deptId,
        year: yr
      });

      // Attach all metric “slices” (per dept, per year)
      out.statistics        = this.pickOne(this.department_metrics?.statistics, yr, deptId);
      out.instructorMetrics = this.pickOne(this.department_metrics?.instructor_metrics, yr, deptId);
      out.interactions      = this.pickOne(this.department_metrics?.interactions, yr, deptId);
      out.grading           = this.pickOne(this.department_metrics?.grading, yr, deptId);
      out.supportHours      = this.pickOne(this.department_metrics?.support_hours, yr, deptId);
      out.courseSurveys     = this.pickOne(this.department_metrics?.course_surveys, yr, deptId);
      out.instructorSurveys = this.pickOne(this.department_metrics?.instructor_surveys, yr, deptId);

      // These tend to be “many rows per dept per year”
      out.occupations = this.pickMany(this.department_metrics?.occupations, yr, deptId);
      out.cpl         = this.pickMany(this.department_metrics?.cpl, yr, deptId);
      out.coe         = this.pickMany(this.department_metrics?.coe, yr, deptId);

      // ---------- Optional: derived KPIs for your table ----------
      // (keep these lightweight; you can add more later)
      out.kpis = {
        instructors: Number(out.statistics?.num_instructors || out.instructorMetrics?.num_instructors || 0),
        courses:     Number(out.statistics?.num_courses || 0),
        // survey averages (0–1 to pct)
        courseLikertPct:     this.avgLikertPct(out.courseSurveys),
        instructorLikertPct: this.avgLikertPct(out.instructorSurveys),
      };

      return out;
    },

    // ---------- Generic filters ----------
    // Finds the first row matching dept+year (good for “one object per dept per year” datasets)
    pickOne(list, year, deptId) {
      const rows = Array.isArray(list) ? list : [];
      if (!rows.length) return {};

      const y = Number(year);
      const did = String(deptId ?? '');

      return (
        rows.find(r =>
          Number(r?.academic_year ?? r?.year) === y &&
          this.matchesDept(r, did)
        ) || {}
      );
    },

    // Returns all rows matching dept+year (good for “many rows” datasets)
    pickMany(list, year, deptId) {
      const rows = Array.isArray(list) ? list : [];
      if (!rows.length) return [];

      const y = Number(year);
      const did = String(deptId ?? '');

      return rows.filter(r =>
        Number(r?.academic_year ?? r?.year) === y &&
        this.matchesDept(r, did)
      );
    },

    // Tries common dept identifiers used by APIs
    matchesDept(row, deptIdStr) {
      if (!deptIdStr) return false;
      const candidates = [
        row?.account_id,
        row?.dept_account_id,
        row?.department_id,
        row?.canvas_account_id,
        row?.parent_account_id
      ].map(x => (x == null ? '' : String(x)));

      return candidates.includes(deptIdStr);
    },

    // ---------- Helpers ----------
    avgLikertPct(surveysObj) {
      const likerts = surveysObj?.likerts;
      if (!Array.isArray(likerts) || !likerts.length) return 0;

      const scores = likerts
        .map(x => Number(x?.score))
        .filter(v => Number.isFinite(v));

      if (!scores.length) return 0;
      const avg = scores.reduce((s, v) => s + v, 0) / scores.length;
      return Math.max(0, Math.min(100, Math.round(avg * 1000) / 10)); // 1 decimal %
    }
  }
});
