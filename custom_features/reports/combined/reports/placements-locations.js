Vue.component('reports-placements-locations', {
  mixins: [window.ReportMixins.formatting],

  props: {
    reportContext: { type: Object, default: () => ({}) }
  },

  data() {
    const colors = window.ReportUtils.createColors();
    return {
      colors,
      table: window.ReportUtils.createTable('Students', colors),
      outcomes: [],
      selectedAcademicYear: '',
      loading: false,
      loadError: ''
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn('Placement Location', 'Employer or placement location. Unknown is estimated from employer-known counts and rates.', '24rem', false, 'string', row => this.escapeHtml(row.location), null, row => row.location.toLowerCase()),
      new window.ReportColumn('Students', 'Students placed at this location.', '8rem', false, 'number', row => this.numberText(row.students), null, row => -row.students),
      new window.ReportColumn('Share', 'Share of estimated placements in the selected academic year.', '8rem', false, 'number', row => this.percent(row.share), null, row => -row.share),
      new window.ReportColumn('Programs', 'Number of programs reporting this placement location.', '8rem', false, 'number', row => String(row.programs), null, row => -row.programs)
    ]);
  },

  computed: {
    academicYears() {
      return Array.from(new Set(this.outcomes.map(row => row.academic_year).filter(Number.isFinite))).sort((a, b) => b - a);
    },

    placementRows() {
      const year = Number(this.selectedAcademicYear);
      if (!Number.isFinite(year)) return [];
      const locations = new Map();
      let estimatedTotal = 0;

      this.outcomes.filter(row => row.academic_year === year).forEach(outcome => {
        const known = outcome.num_students__employer_known;
        const knownRate = outcome.perc_students__employer_known;
        if (known !== null && knownRate !== null && knownRate > 0) {
          const estimatedProgramTotal = known / knownRate;
          estimatedTotal += estimatedProgramTotal;
          this.addLocation(locations, 'Unknown', Math.max(0, estimatedProgramTotal - known), outcome.program_code);
        }

        outcome.placement_locations.forEach(location => {
          this.addLocation(locations, location.placement_location, location.num_students, outcome.program_code);
        });
      });

      return Array.from(locations.values())
        .filter(row => row.students > 0)
        .map(row => ({ ...row, programs: row.programCodes.size, share: estimatedTotal > 0 ? row.students / estimatedTotal : 0 }))
        .sort((a, b) => b.students - a.students || a.location.localeCompare(b.location));
    },

    visibleRows() {
      this.table.setRows(this.placementRows);
      return this.table.getSortedRows();
    }
  },

  methods: {
    numberValue(value) {
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    },

    numberText(value) {
      const number = this.numberValue(value);
      if (number === null) return '—';
      return Number.isInteger(number) ? String(number) : number.toFixed(1);
    },

    percent(value) {
      const number = this.numberValue(value);
      return number === null ? '—' : `${(number * 100).toFixed(1)}%`;
    },

    addLocation(locations, location, students, programCode) {
      const name = String(location ?? '').trim() || 'Unknown';
      const count = this.numberValue(students);
      if (count === null || count <= 0) return;
      const key = name.toLocaleLowerCase();
      const entry = locations.get(key) || { location: name, students: 0, programCodes: new Set() };
      entry.students += count;
      if (programCode) entry.programCodes.add(programCode);
      locations.set(key, entry);
    },

    normalizeOutcomes(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        program_code: String(row?.program_code ?? '').trim(),
        academic_year: this.numberValue(row?.academic_year),
        num_students__employer_known: this.numberValue(row?.num_students__employer_known),
        perc_students__employer_known: this.numberValue(row?.perc_students__employer_known),
        placement_locations: (Array.isArray(row?.placement_locations) ? row.placement_locations : []).map(location => ({
          placement_location: String(location?.placement_location ?? '').trim(),
          num_students: this.numberValue(location?.num_students)
        }))
      }));
    },

    selectInitialAcademicYear() {
      if (this.academicYears.includes(Number(this.selectedAcademicYear))) return;
      this.selectedAcademicYear = this.academicYears[0] ?? '';
    },

    async loadData() {
      try {
        this.loading = true;
        this.loadError = '';
        this.outcomes = this.normalizeOutcomes(await this.fetchReportDataset({}, { dataset: 'programs_placement_outcomes' }));
        this.selectInitialAcademicYear();
        if (!this.outcomes.length) this.loadError = 'No placement outcomes are available.';
      } catch (error) {
        console.warn('Failed to load placement outcomes', error);
        this.outcomes = [];
        this.loadError = 'Unable to load placement outcomes.';
      } finally {
        this.loading = false;
      }
    }
  },

  mounted() {
    this.loadData();
  },

  template: `
  <report-table-shell
    title-html="Placement Locations"
    :table="table"
    :rows="visibleRows"
    :loading="loading"
    :load-error="loadError"
    loading-text="Loading placement outcomes..."
    :row-key-fn="row => row.location"
  >
    <template #description>
      Placement locations ranked across all programs. Unknown estimates students without a known employer or placement location.
    </template>
    <template #filters>
      <label style="font-size:.75rem;font-weight:600;" for="placements-locations-academic-year">Academic year</label>
      <select id="placements-locations-academic-year" v-model.number="selectedAcademicYear" style="font-size:.75rem;">
        <option v-for="year in academicYears" :key="year" :value="year">{{ year }}-{{ String(year + 1).slice(-2) }}</option>
      </select>
    </template>
  </report-table-shell>
  `
});
