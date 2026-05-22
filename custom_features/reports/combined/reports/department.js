Vue.component('reports-department', {
  props: {
    subMenu: { type: [Number, String], required: true },
    reportContext: { type: Object, default: () => ({}) }
  },

  template: `
    <div>
      <reports-department-syllabi
        v-if="subMenu == 'syllabi'"
        :report-context="reportContext"
      ></reports-department-syllabi>
    </div>
  `
});
