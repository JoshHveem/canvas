Vue.component('reports-departments', {
  props: {
    subMenu: { type: [Number, String], required: true }
  },

  template: `
    <div>
      <reports-departments-syllabi
        v-if="subMenu == 'syllabi'"
        @drill-report="$emit('drill-report', $event)"
      ></reports-departments-syllabi>
    </div>
  `
});
