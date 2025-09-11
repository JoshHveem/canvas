Vue.component('department-report', {
  template: `
    <div>
      <!-- Could show a loading indicator if you like -->
      <div
            class="btech-card btech-theme"
            v-if="cpl"
            aria-label="CPL"
        >
          <!-- Header -->
          <div class="btech-row" style="margin-bottom:12px;">
              <h4 class="btech-card-title">Department Overview</h4>
              <span class="btech-pill" :title="'Filters: ' + (year || '')">
              {{ year || '—' }}
              </span>
          </div>

          <!-- KPI Tiles -->
          <div class="btech-grid-3" style="margin-bottom:12px;">
              <div class="btech-tile" title="Percentage of completers">
                <div class="btech-kpi-label">Completion</div>
                <div class="btech-kpi-value">{{ (cpl.completion|| 0).toLocaleString() }}</div>
              </div>
              <div class="btech-tile" title="Total number of submissions graded">
                <div class="btech-kpi-label">Placement</div>
                <div class="btech-kpi-value">{{ (cpl.placement|| 0).toLocaleString() }}</div>
              </div>
              <div class="btech-tile" title="Total number of submissions graded">
                <div class="btech-kpi-label">Licensure</div>
                <div class="btech-kpi-value">{{ (cpl.licensure|| 0).toLocaleString() }}</div>
              </div>
          </div>
    </div>
  `,
  props: {
    year: { type: [Number, String], required: true },
    account: { type: [Number, String], required: true },
    instructorId: { type: [Number, String], default: () => (typeof ENV !== 'undefined' ? ENV.current_user_id : null) }
  },
  data() {
    return {
      loading: false,
      department_metrics: {}
    }
  },
  computed: {
    cpl() {
      let list = this.department_metrics?.cpl ?? [];
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
