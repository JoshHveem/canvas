Vue.component('occupations-report', {
  template: `
    <div>
      <!-- Could show a loading indicator if you like -->
      <department-cpl
        v-for="campus in cpl"
        :cpl="campus"
        :year="year"
      />

      <div class="btech-card btech-theme" style="margin-bottom:12px; padding:12px;" aria-label="Occupation">
        <!-- Header -->
        <div class="btech-row" style="align-items:center; margin-bottom:8px;">
          <h4 class="btech-card-title" style="margin:0; font-size:16px;">Placement Stats</h4>
        </div>

        <!-- KPI Tiles -->
        <div class="btech-grid-3" style="margin-bottom:8px;">
          <kpi-tile
            label="Students Placed"
            :value="statistics.placed"
            :decimals="0"
            unit=""
            title="Number of students placed this year"
          />
          <kpi-tile
            label="Starting Wage"
            :value="statistics.placed_starting_wage"
            :decimals="0"
            unit="$"
            title="Median starting wage for students that reported their wage to us this year."
          />
        </div>
      </div>

      <department-occupations
        :occupations="occupations"
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
    statistics() {
      let list = this.department_metrics?.statistics?? [];
      if (!list.length) return [];
      const yr = Number(this.year) || new Date().getFullYear();
      list = (list.filter(d => Number(d.academic_year) === yr)) || []
      return list;
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
