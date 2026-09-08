Vue.component('reports-graduation-summary', {
  mixins: [window.ReportMixins.formatting],

  props: {
    reportContext: { type: Object, default: () => ({}) }
  },

  data() {
    const colors = window.ReportUtils.createColors();
    const table = window.ReportUtils.createTable('Projected Grad Rate', colors);
    return {
      colors,
      table,
      rows: [],
      loading: false,
      loadError: ''
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn('Program', 'Active program.', '15rem', false, 'string', row => this.escapeHtml(row.program_name), null, row => row.program_name.toLowerCase()),
      new window.ReportColumn('Campus', 'Campus offering the program.', '10rem', false, 'string', row => this.escapeHtml(row.campus_name), null, row => row.campus_name.toLowerCase()),
      new window.ReportColumn('Grad Rate to Date', 'Actual graduation rate to date for this academic year.', '8rem', false, 'number', row => this.percent(row.perc_students__graduate), row => this.actualRateStyle(row), row => this.sortNumber(row.perc_students__graduate)),
      new window.ReportColumn('Projected Grad Rate', 'Projected graduation rate and its 80% forecast range. Pill color indicates the forecast interpretation.', '13rem', false, 'number', row => this.projectedRateText(row), row => this.statusStyle(row), row => this.triageSort(row)),
      new window.ReportColumn('Trend Since July', 'Change in projected graduation rate since July.', '9rem', false, 'number', row => this.trendText(row), row => this.trendStyle(row), row => this.sortNumber(row.change_perc_students__graduate__projected__since_july))
    ]);
  },

  computed: {
    visibleRows() {
      this.table.setRows(this.rows);
      return this.table.getSortedRows();
    }
  },

  methods: {
    numberValue(value) {
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    },

    sortNumber(value) {
      const number = this.numberValue(value);
      return number === null ? Number.POSITIVE_INFINITY : number;
    },

    wholeNumber(value) {
      const number = this.numberValue(value);
      return number === null ? '—' : Math.round(number).toLocaleString();
    },

    percent(value) {
      const number = this.numberValue(value);
      return number === null ? '—' : `${(number * 100).toFixed(1)}%`;
    },

    isValidatedForecast(row) {
      return row?.projection_method__historic === 'size_matched'
        && Number(row?.num_academic_years__historic__size_matched) > 0;
    },

    statusScore(row) {
      const score = this.numberValue(row?.score_graduation_projection_strength);
      return score === null ? null : Math.max(-2, Math.min(2, Math.round(score)));
    },

    statusText(row) {
      if (!this.isValidatedForecast(row)) return 'Insufficient evidence';
      return {
        '-2': 'Very likely miss',
        '-1': 'Likely miss',
        '0': 'Uncertain',
        '1': 'Likely meet',
        '2': 'Very likely meet'
      }[this.statusScore(row)] || 'Uncertain';
    },

    statusSort(row) {
      if (!this.isValidatedForecast(row)) return 5;
      return (this.statusScore(row) ?? 0) + 2;
    },

    statusStyle(row) {
      if (!this.isValidatedForecast(row)) return { backgroundColor: this.colors.gray, color: this.colors.black };
      const score = this.statusScore(row);
      if (score <= -2) return { backgroundColor: this.colors.red, color: this.colors.white };
      if (score < 0) return { backgroundColor: this.colors.orange || this.colors.yellow, color: this.colors.black };
      if (score === 0) return { backgroundColor: this.colors.yellow, color: this.colors.black };
      if (score === 1) return { backgroundColor: this.colors.yellowGreen, color: this.colors.black };
      return { backgroundColor: this.colors.green, color: this.colors.white };
    },

    actualRateStyle(row) {
      const rate = this.numberValue(row.perc_students__graduate);
      if (rate === null) return { backgroundColor: this.colors.gray, color: this.colors.black };
      if (rate < 0.6) return { backgroundColor: this.colors.red, color: this.colors.white };
      if (rate < 0.7) return { backgroundColor: this.colors.yellow, color: this.colors.black };
      return { backgroundColor: this.colors.green, color: this.colors.white };
    },

    triageSort(row) {
      const shortfall = this.graduateShortfall(row);
      return (this.statusSort(row) * 100000) - (shortfall === null ? -1 : shortfall);
    },

    projectedRateText(row) {
      if (!this.isValidatedForecast(row)) return 'Insufficient evidence';
      const value = `${this.percent(row.perc_students__graduate__projected__low_80)}–${this.percent(row.perc_students__graduate__projected__high_80)}`;
      const details = `${this.statusText(row)}. Method: ${String(row.projection_method__historic || 'unavailable')}. 90% range: ${this.percent(row.perc_students__graduate__projected__low_90)}–${this.percent(row.perc_students__graduate__projected__high_90)}.`;
      return `<span title="${this.escapeHtml(details)}">${value}</span>`;
    },

    trendText(row) {
      if (!this.isValidatedForecast(row)) return '—';
      const change = this.numberValue(row.change_perc_students__graduate__projected__since_july);
      if (change === null || change === 0) return '—';
      const arrow = change > 0 ? '▲' : '▼';
      return `${arrow} ${Math.abs(change * 100).toFixed(1)} pts`;
    },

    trendStyle(row) {
      const change = this.numberValue(row.change_perc_students__graduate__projected__since_july);
      if (change === null || change === 0) return {};
      return { color: change > 0 ? this.colors.green : this.colors.red, fontWeight: '600' };
    },

    projectedCountsText(row) {
      if (!this.isValidatedForecast(row)) return '—';
      return `${this.wholeNumber(row.num_students__graduate__projected)} / ${this.wholeNumber(row.num_students__exiter__projected)}`;
    },

    targetGraduates(row) {
      const exiters = this.numberValue(row.num_students__exiter__projected);
      return exiters === null ? null : Math.ceil(exiters * 0.6);
    },

    graduateShortfall(row) {
      if (!this.isValidatedForecast(row)) return null;
      const projectedGraduates = this.numberValue(row.num_students__graduate__projected);
      const targetGraduates = this.targetGraduates(row);
      return projectedGraduates === null || targetGraduates === null ? null : Math.max(0, targetGraduates - projectedGraduates);
    },

    shortfallText(row) {
      const shortfall = this.graduateShortfall(row);
      if (shortfall === null) return '—';
      if (shortfall === 0) return 'On target';
      return `${this.wholeNumber(shortfall)} short`;
    },

    shortfallStyle(row) {
      const shortfall = this.graduateShortfall(row);
      if (shortfall === null) return { backgroundColor: this.colors.gray, color: this.colors.black };
      return shortfall === 0
        ? { backgroundColor: this.colors.green, color: this.colors.white }
        : { backgroundColor: this.colors.red, color: this.colors.white };
    },

    shortfallSort(row) {
      const shortfall = this.graduateShortfall(row);
      return shortfall === null ? -1 : shortfall;
    },

    buildRows(projections) {
      const selectedAcademicYear = new Date().getFullYear();
      return (Array.isArray(projections) ? projections : [])
        .filter(row => row?.is_on_campus && String(row?.program_name ?? '').trim())
        .filter(row => Number(row.academic_year) === selectedAcademicYear)
        .map(row => ({
          ...row,
          program_name: String(row.program_name ?? '').trim(),
          campus_name: String(row.campus_name ?? row.campus_code ?? '').trim()
        }))
        .sort((a, b) => {
        const statusDifference = this.statusSort(a) - this.statusSort(b);
        if (statusDifference !== 0) return statusDifference;
        return this.shortfallSort(b) - this.shortfallSort(a);
      });
    },

    async loadData() {
      try {
        this.loading = true;
        this.loadError = '';
        const projections = await this.fetchReportDataset({}, { dataset: 'programs_graduates_projections' });
        this.rows = this.buildRows(projections);
        if (!this.rows.length) this.loadError = 'No active on-campus program projections are available for the current academic year.';
      } catch (error) {
        console.warn('Failed to load graduation summary', error);
        this.rows = [];
        this.loadError = 'Unable to load the graduation summary.';
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
    title-html="Graduation Summary"
    :table="table"
    :rows="visibleRows"
    :loading="loading"
    :load-error="loadError"
    loading-text="Loading active program projections..."
    :row-key-fn="(row, index) => [row.program_code, row.campus_code, row.academic_year, index].join(':')"
  >
    <template #description>
      Active on-campus programs for the current academic year, ordered from greatest projected concern to least. Projection ranges are 80% ranges; details remain available in the program overview.
    </template>
  </report-table-shell>
  `
});
