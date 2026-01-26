//reports/combined/reports/departments.js
Vue.component('reports-program', {
  template: `
    <div>
      <reports-program-completion
        v-if="subMenu == 'completion'"
        :year="year"
        :campus="campus"
        :students="program.students"
      ></reports-department-overview>
    </div>
  `,
  props: {
    year: { type: [Number], required: true },
    program: { type: [String], required: true },
    campus: { type: [String], required: true },
    subMenu: { type: [Number, String], required: true },
    programsRaw: { type: Array, default: () => [] }, // big list of all programs, need to get the one 

    instructorId: {
      type: [Number, String],
      default: () => (typeof ENV !== 'undefined' ? ENV.current_user_id : null)
    }
  },

  data() {
    return {
      // keep if you want to show a spinner until departmentsRaw arrives
      loading: false,
    };
  },

  computed: {
    // ✅ single source of truth: pull the one department from cached list
    program() {
      const list = Array.isArray(this.programsRaw) ? this.programsRaw: [];
      let program = list.filter() // year, program, and campus

      // departments/full returns either {dept: Number} or maybe dept is a string—handle both
      return program || {};
    },
  },

  watch: {
    // no fetch needed; computed reacts automatically.
    // if you still want a loading flag:
    programsRaw: {
      immediate: true,
      handler(v) {
        this.loading = !Array.isArray(v) || v.length === 0;
      }
    }
  },

  methods: {
    dateToString(date) {
      date = new Date(Date.parse(date));
      return date.getFullYear() + "-" + (date.getMonth() + 1) + "-" + date.getDate();
    },
  },
});
