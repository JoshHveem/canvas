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
      // keep for backwards compatibility if the API ever returns it
      department_metrics: {},
      departments: [],
      departmentsClean: []
    };
  },

  computed: {
    yearNum() { return Number(this.year) || new Date().getFullYear(); }
  },

  watch: {
    year: 'rebuildDepartments',
    // don't deep-watch unless you truly need it; it can fire constantly
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

        // Handle a few possible response shapes:
        // 1) { data: [...] }
        // 2) [...]  (already array)
        // 3) { departments: [...] }
        const depts =
          (Array.isArray(resp?.data) ? resp.data :
          (Array.isArray(resp) ? resp :
          (Array.isArray(resp?.departments) ? resp.departments : [])));

        this.departments = depts;

        // If the API ALSO returns a metrics object, keep it (optional)
        this.department_metrics = resp?.department_metrics || resp?.metrics || {};
      } catch (e) {
        console.warn('Failed to load department metrics', e);
        this.departments = [];
        this.department_metrics = {};
      } finally {
        this.loading = false;
        this.rebuildDepartments();
      }
    },

    rebuildDepartments() {
      const depts = Array.isArray(this.departments) ? this.departments : [];
      this.departmentsClean = depts.map(d => this.buildDeptRow(d));
    },

    // ---------- Core: take one dept and attach year-filtered metrics ----------
    buildDeptRow(dept) {
      const yr = this.yearNum;

      const deptId =
        dept?.account_id ??
        dept?.id ??
        dept?.dept_account_id ??
        dept?.canvas_account_id ??
        null;

      const out = Object.assign({}, dept, {
        deptId,
        year: yr
      });

      // If metrics live on each department, pull from dept first.
      // If you still have a legacy top-level metrics object, fall back to that.
      const src = this.resolveMetricSource(dept);

      out.statistics        = this.pickOne(src.statistics, yr, deptId);
      out.instructorMetrics = this.pickOne(src.instructor_metrics, yr, deptId);
      out.interactions      = this.pickOne(src.interactions, yr, deptId);
      out.grading           = this.pickOne(src.grading, yr, deptId);
      out.supportHours      = this.pickOne(src.support_hours, yr, deptId);
      out.courseSurveys     = this.pickOne(src.course_surveys, yr, deptId);
      out.instructorSurveys = this.pickOne(src.instructor_surveys, yr, deptId);

      out.occupations = this.pickMany(src.occupations, yr, deptId);
      out.cpl         = this.pickMany(src.cpl, yr, deptId);
      out.coe         = this.pickMany(src.coe, yr, deptId);

      // ---------- Derived KPIs ----------
      out.kpis = {
        instructors: Number(
          out.statistics?.num_instructors ??
          out.instructorMetrics?.num_instructors ??
          out.statistics?.instructors ??
          0
        ),
        courses: Number(out.statistics?.num_courses ?? out.statistics?.courses ?? 0),

        // survey averages (0–1 to pct)
        courseLikertPct:     this.avgLikertPct(out.courseSurveys),
        instructorLikertPct: this.avgLikertPct(out.instructorSurveys),

        // convenience: last update if present anywhere
        lastUpdate:
          out.statistics?.last_update ||
          out.courseSurveys?.last_update ||
          out.instructorSurveys?.last_update ||
          out.grading?.last_update ||
          out.interactions?.last_update ||
          dept?.last_update ||
          dept?.lastUpdate ||
          null
      };

      return out;
    },

    /**
     * Normalize metric sources into a consistent object with keys:
     * { statistics, instructor_metrics, ..., cpl, occupations, coe }
     *
     * Supports:
     * - dept.statistics / dept.course_surveys, etc
     * - dept.department_metrics.<key>
     * - dept.metrics.<key>
     * - legacy this.department_metrics.<key>
     */
    resolveMetricSource(dept) {
      const fromDept = (dept && typeof dept === 'object') ? dept : {};
      const nested =
        fromDept.department_metrics ||
        fromDept.metrics ||
        fromDept.departmentMetrics ||
        {};

      const legacy = (this.department_metrics && typeof this.department_metrics === 'object')
        ? this.department_metrics
        : {};

      // prefer dept-level, then nested, then legacy
      return {
        statistics:         fromDept.statistics         || nested.statistics         || legacy.statistics         || [],
        instructor_metrics: fromDept.instructor_metrics || nested.instructor_metrics || legacy.instructor_metrics || [],
        interactions:       fromDept.interactions       || nested.interactions       || legacy.interactions       || [],
        grading:            fromDept.grading            || nested.grading            || legacy.grading            || [],
        support_hours:      fromDept.support_hours      || nested.support_hours      || legacy.support_hours      || [],
        course_surveys:     fromDept.course_surveys     || nested.course_surveys     || legacy.course_surveys     || [],
        instructor_surveys: fromDept.instructor_surveys || nested.instructor_surveys || legacy.instructor_surveys || [],
        occupations:        fromDept.occupations        || nested.occupations        || legacy.occupations        || [],
        cpl:                fromDept.cpl                || nested.cpl                || legacy.cpl                || [],
        coe:                fromDept.coe                || nested.coe                || legacy.coe                || [],
      };
    },

    // ---------- Generic filters ----------
    pickOne(list, year, deptId) {
      const rows = Array.isArray(list) ? list : [];
      if (!rows.length) return {};

      const y = Number(year);
      const did = String(deptId ?? '');

      // if the rows are *already* “single object”, allow that too
      if (!Array.isArray(list) && typeof list === 'object') {
        // if it looks like a single year row, just return it
        return list;
      }

      return (
        rows.find(r =>
          Number(r?.academic_year ?? r?.year) === y &&
          this.matchesDept(r, did)
        ) || {}
      );
    },

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

    matchesDept(row, deptIdStr) {
      if (!deptIdStr) return false;
      const candidates = [
        row?.account_id,
        row?.dept_account_id,
        row?.department_id,
        row?.canvas_account_id,
        row?.parent_account_id,
        row?.accountId,
        row?.deptId
      ].map(x => (x == null ? '' : String(x)));

      return candidates.includes(deptIdStr);
    },

    // ---------- Helpers ----------
    avgLikertPct(surveysObj) {
      // support either:
      // surveysObj.likerts = [...]
      // OR surveysObj.surveys.likerts = [...]
      const likerts =
        surveysObj?.likerts ||
        surveysObj?.surveys?.likerts ||
        [];

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
