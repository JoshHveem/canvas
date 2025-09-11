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
                <div class="btech-kpi-value">{{ (cpl.completion * 100 || 0).toLocaleString() }}%</div>
              </div>
              <div class="btech-tile" title="Total number of submissions graded">
                <div class="btech-kpi-label">Placement</div>
                <div class="btech-kpi-value">{{ (cpl.placement * 100 || 0).toLocaleString() }}%</div>
              </div>
              <div class="btech-tile" title="Total number of submissions graded">
                <div class="btech-kpi-label">Licensure</div>
                <div class="btech-kpi-value">{{ (cpl.licensure * 100 || 0).toLocaleString() }}%</div>
              </div>
          </div>
        </div>
      <div
            class="btech-card btech-theme"
            v-if="instructorMetrics"
            aria-label="Instructor Metrics"
        >
          <!-- Header -->
          <div class="btech-row" style="margin-bottom:12px;">
              <h4 class="btech-card-title">Instructors Overview</h4>
              <span class="btech-pill" :title="'Filters: ' + (year || '')">
              {{ year || '—' }}
              </span>
          </div>

          <!-- KPI Tiles -->
          <div class="btech-grid-3" style="margin-bottom:12px;">
              <div class="btech-tile" title="Graders that graded at least 5% of all submissions">
                <div class="btech-kpi-label">Active Graders</div>
                <div class="btech-kpi-value">{{ (instructorMetrics.num_instructors || 0).toLocaleString() }}</div>
              </div>
              <div class="btech-tile" title="Number of Assignments Graded">
                <div class="btech-kpi-label">Assignments Graded</div>
                <div class="btech-kpi-value">{{ (instructorMetrics.assignments_graded || 0).toLocaleString() }}</div>
              </div>
              <div class="btech-tile" title="Total number of assignments submissions graded">
                <div class="btech-kpi-label">Average Attempts</div>
                <div class="btech-kpi-value">{{ (instructorMetrics.average_attempts || 0).toLocaleString() }}</div>
              </div>
              <div class="btech-tile" title="Average days to grade">
                <div class="btech-kpi-label">Days to Grade</div>
                <div class="btech-kpi-value">
                  {{ (instructorMetrics.days_to_grade || 0).toLocaleString() }}
                  <span class="btech-muted">days</span>
                </div>
              </div>
              <div class="btech-tile" title="Total number of assignments submissions graded">
                <div class="btech-kpi-label">Comments per Submission</div>
                <div class="btech-kpi-value">{{ (instructorMetrics.comments_per_submission_graded || 0).toLocaleString() }}</div>
              </div>
              <div class="btech-tile" title="Total number of assignments submissions graded">
                <div class="btech-kpi-label">Graded with Rubric</div>
                <div class="btech-kpi-value">{{ (instructorMetrics.graded_with_rubric * 100 || 0).toLocaleString() }}%</div>
              </div>
          </div>
        </div>
      <department-instructor-surveys
        v-if="instructorSurveys && Object.keys(instructorSurveys).length"
        :surveys="instructorSurveys"
        :year="year"
      />
      <department-course-surveys
        v-if="courseSurveys && Object.keys(courseSurveys).length"
        :surveys="courseSurveys"
        :year="year"
      />
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
