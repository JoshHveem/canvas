Vue.component('reports-instructors', {
  template: `
    <div>
        <reports-instructor-overview
            v-if="subMenu == 'overview'"
            :account="account"
            :year="year"
            :instructors="normalizedInstructors"
            :instructor-id="instructorId"
        ></reports-instructor-overview>
        <reports-instructor-surveys
            v-if="subMenu == 'surveys'"
            :year="year"
            :instructors="normalizedInstructors"
        ></reports-instructor-surveys>
    </div>
  `,
  props: {
    year: { type: [Number, String], required: true },
    account: { type: [Number, String], required: true },
    subMenu: { type: [Number, String], required: true },
    instructorId: { type: [Number, String], default: () => (typeof ENV !== 'undefined' ? ENV.current_user_id : null) }
  },
  data() {
    return {
      loading: false,
      instructors: [] 
    }
  },
  computed: {
    yearNum() { return Number(this.year) || new Date().getFullYear(); },
    normalizedInstructors() {
        console.log(this.instructors);
        let instructors = (Array.isArray(this.instructors) ? this.instructors : [])
        .map(i => this._forYear(i, this.yearNum))
        .filter(i => (Number(i?.grading?.assignments_graded) > 0 || Number(i?.surveys?.num_surveys) > 0))
        ;
        console.log(instructors);
        return instructors;
    },
  },
  watch: {
    year: 'loadInstructorMetrics',
    account: 'loadInstructorMetrics'
  },
  async mounted() {
    await this.loadInstructorMetrics();
  },
  methods: {
      async loadInstructorMetrics() {
      try {
        this.loading = true;
        this.selected = null; // reset selection on reload
        const url = `https://reports.bridgetools.dev/api/instructors?dept_head_account_ids[]=${this.account}`;
        const resp = await bridgetools.req(url);

        const incoming = resp?.data || [];
        // enrich names from Canvas
        for (let i = 0; i < incoming.length; i++) {
          try {
            const canvasData = (await canvasGet(`/api/v1/users/${incoming[i].canvas_id}`))[0];
            incoming[i].first_name = canvasData?.first_name || incoming[i].first_name;
            incoming[i].last_name  = canvasData?.last_name  || incoming[i].last_name;
          } catch (e) {
            // non-fatal; keep whatever we have
          }
        }
        this.instructors = incoming;
        console.log(this.instructors);

        // if exactly one, auto-select it
        if (this.normalizedInstructors.length === 1) {
          this.selected = this.normalizedInstructors[0];
        }
      } catch (e) {
        console.error('Failed to load instructor metrics', e);
        this.instructors = [];
        this.selected = null;
      } finally {
        this.loading = false;
      }
    },
        // Normalize one instructor to a single-year snapshot
    _forYear(raw, yr) {
      const pickYear = (arr) => Array.isArray(arr)
        ? (arr.find(d => Number(d?.academic_year) === yr) || {})
        : {};

      const oneOrYear = (val) => Array.isArray(val)
        ? pickYear(val)
        : (val && Number(val.academic_year)
            ? (Number(val.academic_year) === yr ? val : {})
            : (val || {}));

      return {
        first_name: raw?.first_name || raw?.firstName || '',
        last_name:  raw?.last_name  || raw?.lastName  || '',
        canvas_user_id: raw?.canvas_user_id || raw?.canvasId || raw?.canvas_id || raw?.canvas_id || null,
        div_code: raw?.div_code || null,
        academic_year: yr,

        grading:        oneOrYear(raw?.grading),
        support_hours:  oneOrYear(raw?.support_hours || raw?.supportHours),
        interactions:   oneOrYear(raw?.interactions),
        surveys:        oneOrYear(raw?.surveys)
      };
    },
  }
});
