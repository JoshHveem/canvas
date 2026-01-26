Vue.component('reports-programs', {
  template: `
    <div>
    <programs-completion
        v-if="subMenu == 'completion'"
        :year="year"
        :programs="programsClean"
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
      const yr = this.yearNum;

      this.programsClean = this.programsRaw;
    },
  }
});
