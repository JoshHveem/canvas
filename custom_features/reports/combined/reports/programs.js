// programs.js
Vue.component('reports-programs', {
  template: `
    <div>
    <programs-completion
        v-if="subMenu == 'completion'"
        :year="year"
        :programs="programsClean"
        @drill-program="$emit('drill-program', $event)"
      ></programs-completion>
 
    </div>
  `,

  props: {
    year: { type: [Number, String], required: true },
    subMenu: { type: [Number, String], required: true },
    programsRaw: { type: Array, default: () => [] }
  },

  data() {
    return {
      programsClean: [],
      allSurveyTags: []
    };
  },

  computed: {
    yearNum() { return Number(this.year) || new Date().getFullYear(); }
  },

  watch: {
    year: 'rebuildPrograms',
    programsRaw: 'rebuildPrograms' // ✅ FIX
  },

  mounted() {
    this.rebuildPrograms();
  },

  methods: {
    rebuildPrograms() {
        const list = Array.isArray(this.programsRaw) ? this.programsRaw : [];
        const year = this.yearNum;

        const programs = list.filter(p => Number(p?.academic_year) === Number(year));
        this.programsClean = programs;

        console.log({ year, total: list.length, matched: programs.length });
        }

  }
});
