Vue.component('reports-graduation-summary', {
  mixins: [window.ReportMixins.formatting],

  props: {
    reportContext: { type: Object, default: () => ({}) }
  },

  data() {
    const colors = window.ReportUtils.createColors();
    const table = window.ReportUtils.createTable('Projection Status', colors);
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
      new window.ReportColumn('Grad Rate to Date', 'Actual graduation rate to date for this academic year.', '8rem', false, 'number', row => this.percent(row.perc_students__graduate), null, row => this.sortNumber(row.perc_students__graduate)),
      new window.ReportColumn('Projected Grad Rate', 'Projected graduation rate and its 80% forecast range.', '13rem', false, 'number', row => this.projectedRateText(row), null, row => this.sortNumber(row.perc_students__graduate__projected)),
      new window.ReportColumn('Projection Status', 'Forecast interpretation based on the projection strength score.', '10rem', false, 'number', row => this.escapeHtml(this.statusText(row)), row => this.statusStyle(row), row => this.statusSort(row)),
      new window.ReportColumn('Trend Since July', 'Change in projected graduation rate since July.', '9rem', false, 'number', row => this.trendText(row), row => this.trendStyle(row), row => this.sortNumber(row.change_perc_students__graduate__projected__since_july)),
      new window.ReportColumn('Projected Graduates / Exiters', 'Projected end-of-year graduate and exiter counts.', '11rem', false, 'number', row => this.projectedCountsText(row), null, row => this.sortNumber(row.num_students__graduate__projected)),
      new window.ReportColumn('Graduates Short of 60% Target', 'Projected graduates needed to reach 60% of projected exiters.', '12rem', false, 'number', row => this.shortfallText(row), row => this.shortfallStyle(row), row => this.shortfallSort(row)),
      new window.ReportColumn('Active Enrollment vs Historic', 'Current active enrollment compared with the average at this point in the prior three academic years.', '11rem', false, 'string', row => this.enrollmentComparisonText(row), row => this.enrollmentComparisonStyle(row), row => this.enrollmentComparisonSort(row))
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
      return { backgroundColor: this.colors.green, color: this.colors.white };
    },

    projectedRateText(row) {
      if (!this.isValidatedForecast(row)) return 'Insufficient evidence';
      const value = `${this.percent(row.perc_students__graduate__projected)} (${this.percent(row.perc_students__graduate__projected__low_80)}–${this.percent(row.perc_students__graduate__projected__high_80)})`;
      const details = `Method: ${String(row.projection_method__historic || 'unavailable')}. 90% range: ${this.percent(row.perc_students__graduate__projected__low_90)}–${this.percent(row.perc_students__graduate__projected__high_90)}.`;
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

    enrollmentComparison(row) {
      const current = this.numberValue(row.current_active_enrollment);
      const historic = this.numberValue(row.historic_active_average);
      if (current === null || historic === null || historic <= 0) return null;
      return (current - historic) / historic;
    },

    enrollmentComparisonText(row) {
      const comparison = this.enrollmentComparison(row);
      if (comparison === null) return 'No historic data';
      const label = comparison > 0.1 ? 'Above avg' : (comparison < -0.1 ? 'Below avg' : 'Near avg');
      return `<span title="${this.wholeNumber(row.current_active_enrollment)} active vs ${this.wholeNumber(row.historic_active_average)} historic average">${label}</span>`;
    },

    enrollmentComparisonStyle(row) {
      const comparison = this.enrollmentComparison(row);
      if (comparison === null) return { backgroundColor: this.colors.gray, color: this.colors.black };
      if (comparison > 0.1) return { backgroundColor: this.colors.green, color: this.colors.white };
      if (comparison < -0.1) return { backgroundColor: this.colors.red, color: this.colors.white };
      return { backgroundColor: this.colors.yellow, color: this.colors.black };
    },

    enrollmentComparisonSort(row) {
      const comparison = this.enrollmentComparison(row);
      return comparison === null ? -2 : comparison;
    },

    currentAcademicMonth() {
      return ((new Date().getMonth() + 6) % 12) + 1;
    },

    buildRows(projections, monthlyRows) {
      const selectedAcademicYear = new Date().getFullYear();
      const activePrograms = (Array.isArray(projections) ? projections : [])
        .filter(row => row?.is_on_campus && String(row?.program_name ?? '').trim())
        .filter(row => Number(row.academic_year) === selectedAcademicYear);
      const currentAcademicMonth = this.currentAcademicMonth();

      return activePrograms.map(row => {
        const programCode = String(row.program_code ?? '').trim();
        const campusCode = String(row.campus_code ?? '').trim();
        const matchingRows = (Array.isArray(monthlyRows) ? monthlyRows : []).filter(monthly => (
          String(monthly?.program_code ?? '').trim() === programCode
          && String(monthly?.campus_code ?? '').trim() === campusCode
        ));
        const currentRow = matchingRows.find(monthly => (
          Number(monthly.academic_year) === selectedAcademicYear
          && Number(monthly.academic_year_month) === currentAcademicMonth
        ));
        const historicActive = matchingRows
          .filter(monthly => Number(monthly.academic_year_month) === currentAcademicMonth)
          .filter(monthly => Number(monthly.academic_year) < selectedAcademicYear && Number(monthly.academic_year) >= selectedAcademicYear - 3)
          .map(monthly => this.numberValue(monthly.num_students__active))
          .filter(value => value !== null);
        const currentActive = this.numberValue(currentRow?.num_students__active);
        const historicAverage = historicActive.length
          ? historicActive.reduce((sum, value) => sum + value, 0) / historicActive.length
          : null;
        return {
          ...row,
          program_name: String(row.program_name ?? '').trim(),
          campus_name: String(row.campus_name ?? row.campus_code ?? '').trim(),
          current_active_enrollment: currentActive,
          historic_active_average: historicAverage
        };
      }).sort((a, b) => {
        const statusDifference = this.statusSort(a) - this.statusSort(b);
        if (statusDifference !== 0) return statusDifference;
        return this.shortfallSort(b) - this.shortfallSort(a);
      });
    },

    async loadData() {
      try {
        this.loading = true;
        this.loadError = '';
        const [projections, monthlyRows] = await Promise.all([
          this.fetchReportDataset({}, { dataset: 'programs_graduates_projections' }),
          this.fetchReportDataset({}, { dataset: 'programs_graduates_monthly' })
        ]);
        this.rows = this.buildRows(projections, monthlyRows);
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
