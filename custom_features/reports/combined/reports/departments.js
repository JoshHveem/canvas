Vue.component('reports-syllabi', {
  props: {
    subMenu: { type: [Number, String], required: true },
    reportContext: { type: Object, default: () => ({}) }
  },

  template: `
    <div>
      <reports-departments-syllabi
        v-if="subMenu == 'summary'"
        :report-context="reportContext"
        @drill-report="$emit('drill-report', $event)"
      ></reports-departments-syllabi>

      <reports-department-syllabi
        v-if="subMenu == 'course-status'"
        :report-context="reportContext"
      ></reports-department-syllabi>
    </div>
  `
});
