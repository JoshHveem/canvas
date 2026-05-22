Vue.component('reports-department', {
  props: {
    subMenu: { type: [Number, String], required: true },
    departmentCode: { type: [Number, String], default: '' },
    departmentName: { type: String, default: '' }
  },

  template: `
    <div>
      <reports-department-syllabi
        v-if="subMenu == 'syllabi'"
        :department-code="departmentCode"
        :department-name="departmentName"
      ></reports-department-syllabi>
    </div>
  `
});
