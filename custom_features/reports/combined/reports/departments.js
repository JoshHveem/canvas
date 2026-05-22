Vue.component('reports-departments', {
  props: {
    subMenu: { type: [Number, String], required: true },
    reportContext: { type: Object, default: () => ({}) }
  },

  template: `
    <div>
      <reports-departments-syllabi
        v-if="subMenu == 'syllabi'"
        :report-context="reportContext"
        @drill-report="$emit('drill-report', $event)"
      ></reports-departments-syllabi>
    </div>
  `
});
