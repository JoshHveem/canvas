Vue.component('reports-department-instructors', {
  template: `
    <div>
      <department-instructor-metrics
        :instructor-metrics="instructorMetrics"
        :year="year"
      />

      <department-instructor-surveys
        :surveys="instructorSurveys"
        :year="year"
      />
    </div>
  `,
  props: {
    year: { type: [Number, String], required: true },
    statistics: { type: Object, required: true },
    cpl: { type: Object, required: true },
    instructorMetrics: { type: Object, required: true },
    instructorSurveys: { type: Object, required: true },
    courseSurveys: { type: Object, required: true },
  },
  data() {
    return {
      loading: false,
      department_metrics: {}
    }
  },
  computed: {
  },
  async mounted() {
  },
  methods: {
  },
});
