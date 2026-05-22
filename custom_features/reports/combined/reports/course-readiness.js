Vue.component('reports-course-readiness', {
  props: {
    subMenu: { type: [Number, String], required: true },
    reportContext: { type: Object, default: () => ({}) }
  },

  template: `
    <div>
      <reports-departments-course-readiness
        v-if="subMenu == 'summary'"
        :report-context="reportContext"
        @drill-report="$emit('drill-report', $event)"
      ></reports-departments-course-readiness>

      <reports-department-course-readiness
        v-if="subMenu == 'course-status'"
        :report-context="reportContext"
      ></reports-department-course-readiness>
    </div>
  `
});
