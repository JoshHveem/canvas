//reports/combined/reports/departments.js
Vue.component('reports-program', {
  template: `
    <div>
      <reports-program-completion
        v-if="subMenu == 'completion'"
        :year="year"
        :campus="program?.campus ?? ''"
        :projected-non-completers="program?.projected_non_completers ?? 0"
        :students="program?.students ?? []"
      ></reports-program-completion>
      <reports-program-employment-skills
        v-if="subMenu == 'employment-skills'"
        :year="year"
        :campus="program?.campus ?? ''"
        :students="program?.students ?? []"
      ></reports-program-employment-skills>
      <reports-program-syllabi
        v-if="subMenu == 'syllabi'"
        :year="year"
        :campus="program?.campus ?? ''"
        :syllabi-data="program?.syllabi ?? {}"
        :syllabi="program?.syllabi?.syllabi ?? []"
      ></reports-program-employment-skills>
      <reports-program-placements
         v-if="subMenu == 'placements'"
         :year="year"
        :campus="program?.campus ?? ''"
        :projected-non-completers="program?.projected_non_completers ?? 0"
        :students="program?.students ?? []"
      ></reports-program-placements>
    </div>
  `,
  props: {
    year: { type: [Number], required: true },
    selectedProgram: { type: [String], required: true },
    selectedCampus: { type: [String], required: true },
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
    program() {
      const list = Array.isArray(this.programsRaw) ? this.programsRaw : [];

      const year   = Number(this.year); // or this.settings.filters.year
      const code   = String(this.selectedProgram || '').trim(); // whatever prop holds the program code
      const campus = String(this.selectedCampus || '').trim();

      let program = (
        list.find(p =>
          Number(p?.academic_year) === year &&
          String(p?.program || '').trim() === code &&
          String(p?.campus || '').trim() === campus
        ) || null
      );
      console.log(program);
      return program;
    } 
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
