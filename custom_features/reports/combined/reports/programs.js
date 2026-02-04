// programs.js
Vue.component('reports-programs', {
  template: `
    <div>
      <reports-programs-completion
        v-if="subMenu == 'completion'"
        :year="year"
        :programs="programsClean"
        @drill-program="$emit('drill-program', $event)"
      ></reports-programs-completion>

      <reports-programs-placements
        v-if="subMenu == 'placements'"
        :year="year"
        :programs="programsClean"
        @drill-program="$emit('drill-program', $event)"
      ></reports-programs-placements>
 
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
    programsRaw: 'rebuildPrograms'
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
    }
  }
});
