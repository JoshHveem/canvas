Vue.component('department-report', {
  template: `
    <div>
      <!-- Could show a loading indicator if you like -->
      <department-cpl
        v-for="campus in cpl"
        :cpl="campus"
        :year="year"
      />

      <department-statistics
        :statistics="statistics"
        :year="year"
      />

      <department-instructor-metrics
        :instructor-metrics="instructorMetrics"
        :year="year"
      />

      <department-instructor-surveys
        :surveys="instructorSurveys"
        :year="year"
      />
      <department-course-surveys
        :surveys="courseSurveys"
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
