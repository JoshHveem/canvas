Vue.component('reports-graduation-outlook', {
  mixins: [window.ReportMixins.formatting],

  props: {
    reportContext: { type: Object, default: () => ({}) }
  },

  data() {
    const colors = window.ReportUtils.createColors();
    return {
      colors,
      projections: [],
      monthlyRows: [],
      selectedProjectionKey: '',
      loading: false,
      loadError: '',
      summary: {
        activeStudents: 26,
        graduatesToDate: 14,
        projectedGraduates: 26,
        projectedGraduationRate: 62
      },
      summaryChanges: {
        activeStudents: 8,
        graduatesToDate: -6,
        projectedGraduates: 12
      },
      historicRates: [
        { year: '2022–23', endOfYear: 84, atThisPoint: 76 },
        { year: '2023–24', endOfYear: 88, atThisPoint: 80 },
        { year: '2024–25', endOfYear: 86, atThisPoint: 78 },
        { year: '2025–26', endOfYear: 91, atThisPoint: 84 }
      ],
      historicEnrollmentRates: [
        { month: 'July', currentYear: 25, historicAverage: 22 },
        { month: 'August', currentYear: 23, historicAverage: 24 },
        { month: 'September', currentYear: 26, historicAverage: 25 },
        { month: 'October', currentYear: null, historicAverage: 23 },
        { month: 'November', currentYear: null, historicAverage: 21 },
        { month: 'December', currentYear: null, historicAverage: 18 },
        { month: 'January', currentYear: null, historicAverage: 16 },
        { month: 'February', currentYear: null, historicAverage: 19 },
        { month: 'March', currentYear: null, historicAverage: 21 },
        { month: 'April', currentYear: null, historicAverage: 18 },
        { month: 'May', currentYear: null, historicAverage: 14 },
        { month: 'June', currentYear: null, historicAverage: 12 }
      ],
    };
  },

  computed: {
    projectionOptions() {
      const currentYear = new Date().getFullYear();
      const eligible = this.projections.filter(row => row.is_on_campus && row.program_name);
      const current = eligible.filter(row => Number(row.academic_year) === currentYear);
      return (current.length ? current : eligible).sort((a, b) => this.projectionLabel(a).localeCompare(this.projectionLabel(b)));
    },

    selectedProjection() {
      return this.projectionOptions.find(row => row.key === this.selectedProjectionKey) || this.projectionOptions[0] || null;
    },

    hasValidatedForecast() {
      const projection = this.selectedProjection;
      return Boolean(projection && projection.projection_method__historic === 'size_matched' && Number(projection.num_academic_years__historic__size_matched) > 0);
    },

    graduationOutlookPoints() {
      const chartHeight = 144;
      const chartTop = 18;
      const chartLeft = 58;
      const chartWidth = 570;
      const projection = this.selectedProjection;
      const currentAcademicMonth = this.currentAcademicMonth();
      const months = ['July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'];
      const rowsByMonth = this.monthlyRows.reduce((map, row) => {
        if (Number(row.academic_year) === Number(projection?.academic_year)) {
          map[Number(row.academic_year_month)] = row;
        }
        return map;
      }, {});
      const rateToY = rate => chartTop + ((100 - (rate * 100)) / 100) * chartHeight;
      let previousRate = null;

      return months.map((month, index) => {
        const academicMonth = index + 1;
        const rate = academicMonth <= currentAcademicMonth
          ? this.numberValue(rowsByMonth[academicMonth]?.perc_students__graduate__projected__baseline)
          : null;
        const movement = rate === null || previousRate === null ? 0 : Math.sign(rate - previousRate);
        const isBelowRequirement = rate !== null && rate < 0.6;
        let color = this.colors.black;
        if (movement < 0) color = isBelowRequirement ? this.colors.red : this.colors.yellow;
        if (movement > 0) color = isBelowRequirement ? this.colors.yellow : this.colors.green;
        if (rate !== null) previousRate = rate;
        return {
          month,
          rate,
          movement,
          color,
          x: chartLeft + (index * (chartWidth / (months.length - 1))),
          y: rate === null ? null : rateToY(rate)
        };
      });
    },

    graduationTargetY() {
      const chartHeight = 144;
      const chartTop = 18;
      return chartTop + ((100 - 60) / 100) * chartHeight;
    },

    historicEndOfYearGraduationPoints() {
      const chartHeight = 144;
      const chartTop = 18;
      const chartLeft = 58;
      const chartWidth = 570;
      const selectedAcademicYear = Number(this.selectedProjection?.academic_year);
      const rowsByYear = this.monthlyRows.reduce((map, row) => {
        const academicYear = Number(row.academic_year);
        if (academicYear < selectedAcademicYear && this.numberValue(row.perc_students__graduate__actual) !== null) {
          if (!map[academicYear]) map[academicYear] = [];
          map[academicYear].push(row);
        }
        return map;
      }, {});
      const rates = Object.keys(rowsByYear)
        .map(Number)
        .sort((a, b) => a - b)
        .map(academicYear => {
          const rows = rowsByYear[academicYear];
          const finalRow = rows.find(row => Number(row.academic_year_month) === 12)
            || rows.slice().sort((a, b) => Number(b.academic_year_month) - Number(a.academic_year_month))[0];
          return {
            year: `${academicYear}-${String(academicYear + 1).slice(-2)}`,
            rate: this.numberValue(finalRow.perc_students__graduate__actual)
          };
        })
        .filter(point => point.rate !== null);
      const currentProjectedRate = this.numberValue(this.selectedProjection?.perc_students__graduate__projected);
      if (currentProjectedRate !== null) {
        rates.push({
          year: `${selectedAcademicYear}-${String(selectedAcademicYear + 1).slice(-2)}`,
          rate: currentProjectedRate,
          isProjected: true
        });
      }
      const rateToY = rate => chartTop + ((100 - (rate * 100)) / 100) * chartHeight;
      let previousRate = null;

      return rates.map((point, index) => {
        const movement = previousRate === null ? 0 : Math.sign(point.rate - previousRate);
        const isBelowRequirement = point.rate < 0.6;
        let color = this.colors.black;
        if (movement < 0) color = isBelowRequirement ? this.colors.red : this.colors.yellow;
        if (movement > 0) color = isBelowRequirement ? this.colors.yellow : this.colors.green;
        previousRate = point.rate;
        return {
          ...point,
          movement,
          color,
          x: chartLeft + ((index + 0.5) * (chartWidth / Math.max(rates.length, 1))),
          y: rateToY(point.rate)
        };
      });
    },

    historicEndOfYearGraduatePoints() {
      const chartHeight = 144;
      const chartTop = 18;
      const chartLeft = 58;
      const chartWidth = 570;
      const selectedAcademicYear = Number(this.selectedProjection?.academic_year);
      const rowsByYear = this.monthlyRows.reduce((map, row) => {
        const academicYear = Number(row.academic_year);
        if (academicYear < selectedAcademicYear && this.numberValue(row.num_students__graduate) !== null) {
          if (!map[academicYear]) map[academicYear] = [];
          map[academicYear].push(row);
        }
        return map;
      }, {});
      const graduates = Object.keys(rowsByYear)
        .map(Number)
        .sort((a, b) => a - b)
        .map(academicYear => {
          const rows = rowsByYear[academicYear];
          const finalRow = rows.find(row => Number(row.academic_year_month) === 12)
            || rows.slice().sort((a, b) => Number(b.academic_year_month) - Number(a.academic_year_month))[0];
          return {
            year: `${academicYear}-${String(academicYear + 1).slice(-2)}`,
            count: this.numberValue(finalRow.num_students__graduate__actual)
              ?? this.numberValue(finalRow.num_students__graduate__to_month)
          };
        })
        .filter(point => point.count !== null);
      const currentProjectedCount = this.numberValue(this.selectedProjection?.num_students__graduate__projected);
      if (currentProjectedCount !== null) {
        graduates.push({
          year: `${selectedAcademicYear}-${String(selectedAcademicYear + 1).slice(-2)}`,
          count: currentProjectedCount,
          isProjected: true
        });
      }
      const maxCount = Math.max(...graduates.map(point => point.count), 1);
      const countToY = count => chartTop + ((maxCount - count) / maxCount) * chartHeight;
      let previousCount = null;

      return graduates.map((point, index) => {
        const change = previousCount === null ? null : point.count - previousCount;
        const color = change === null ? this.colors.black : Math.abs(change) < 5 ? this.colors.yellow : change > 0 ? this.colors.green : this.colors.red;
        previousCount = point.count;
        return {
          ...point,
          change,
          color,
          x: chartLeft + ((index + 0.5) * (chartWidth / Math.max(graduates.length, 1))),
          y: countToY(point.count)
        };
      });
    },

    historicEndOfYearGraduateMaximum() {
      return Math.max(...this.historicEndOfYearGraduatePoints.map(point => point.count), 1);
    },

    enrollmentMonths() {
      const projection = this.selectedProjection;
      const currentAcademicMonth = this.currentAcademicMonth();
      const months = ['July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'];
      const rowsByMonth = this.monthlyRows.reduce((map, row) => {
        if (Number(row.academic_year) === Number(projection?.academic_year)) {
          map[Number(row.academic_year_month)] = row;
        }
        return map;
      }, {});

      return months.map((month, index) => {
        const academicMonth = index + 1;
        const row = rowsByMonth[academicMonth];
        const isProjected = academicMonth > currentAcademicMonth;
        const projectedActive = this.numberValue(row?.num_students__active__projected);
        const historicAverageActive = this.numberValue(row?.num_students__active__month_start__historic_average);
        return {
          month,
          isProjected,
          new: isProjected ? 0 : this.numberValue(row?.num_students__new) || 0,
          progressing: isProjected ? 0 : this.numberValue(row?.num_students__progressing) || 0,
          inactive: isProjected ? 0 : this.numberValue(row?.num_students__inactive) || 0,
          graduated: isProjected ? 0 : this.numberValue(row?.num_students__graduate) || 0,
          otherExit: isProjected ? 0 : this.numberValue(row?.num_students__other_exit) || 0,
          projectedActive: isProjected ? (projectedActive ?? historicAverageActive ?? 0) : 0,
          projectedGraduates: isProjected ? this.numberValue(row?.num_students__graduate__projected) || 0 : 0
        };
      });
    },

    enrollmentLegend() {
      return [
        { key: 'new', label: 'New', color: this.colors.blue },
        { key: 'progressing', label: 'Progressing', color: this.colors.cyan },
        { key: 'inactive', label: 'Inactive', color: this.colors.yellow },
        { key: 'graduated', label: 'Graduated', color: this.colors.green },
        { key: 'otherExit', label: 'Other Exit', color: this.colors.red },
        { key: 'projectedActive', label: 'Projected Active', color: this.colors.cyan, opacity: 0.5 },
        { key: 'projectedGraduates', label: 'Projected Graduates', color: this.colors.green, opacity: 0.5 }
      ];
    },

    enrollmentRatePoints() {
      const chartHeight = 128;
      const chartTop = 18;
      const chartLeft = 50;
      const chartWidth = 590;
      const projection = this.selectedProjection;
      const currentAcademicMonth = this.currentAcademicMonth();
      const months = ['July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March', 'April', 'May', 'June'];
      const rowsByYearMonth = this.monthlyRows.reduce((map, row) => {
        map[`${row.academic_year}:${row.academic_year_month}`] = row;
        return map;
      }, {});
      const selectedAcademicYear = Number(projection?.academic_year);
      const historicRows = this.monthlyRows.filter(row => {
        const academicYear = Number(row.academic_year);
        return Number.isFinite(selectedAcademicYear)
          && academicYear < selectedAcademicYear
          && academicYear >= selectedAcademicYear - 3;
      });
      const rates = months.map((month, index) => {
        const academicMonth = index + 1;
        const historicValues = historicRows
          .filter(row => Number(row.academic_year_month) === academicMonth)
          .map(row => this.numberValue(row.num_students__active))
          .filter(value => value !== null);
        const currentRow = projection ? rowsByYearMonth[`${projection.academic_year}:${academicMonth}`] : null;
        return {
          month,
          currentYear: academicMonth <= currentAcademicMonth ? this.numberValue(currentRow?.num_students__active) : null,
          historicAverage: historicValues.length ? historicValues.reduce((sum, value) => sum + value, 0) / historicValues.length : null
        };
      });
      const values = rates.flatMap(rate => [rate.currentYear, rate.historicAverage])
        .filter(value => Number.isFinite(value));
      const maxCount = Math.max(...values, 1);
      const countToY = count => chartTop + ((maxCount - count) / maxCount) * chartHeight;

      return rates.map((rate, index) => ({
        ...rate,
        x: chartLeft + (index * (chartWidth / (rates.length - 1))),
        currentYearY: Number.isFinite(rate.currentYear) ? countToY(rate.currentYear) : null,
        historicAverageY: Number.isFinite(rate.historicAverage) ? countToY(rate.historicAverage) : null
      }));
    },

    enrollmentBarGroups() {
      const chartHeight = 178;
      const baseline = 222;
      const chartLeft = 56;
      const chartWidth = 584;
      const groupWidth = Math.min(48, Math.max(24, (chartWidth / this.enrollmentMonths.length) * 0.7));
      const groupGap = this.enrollmentMonths.length > 1
        ? (chartWidth - (groupWidth * this.enrollmentMonths.length)) / (this.enrollmentMonths.length - 1)
        : 0;
      const maxTotal = Math.max(...this.enrollmentMonths.map(month => this.enrollmentTotal(month)), 1);

      return this.enrollmentMonths.map((month, index) => {
        let totalBelow = 0;
        const segments = this.enrollmentLegend.map(item => {
          const count = Number(month[item.key]) || 0;
          const height = (count / maxTotal) * chartHeight;
          totalBelow += count;
          return {
            ...item,
            count,
            x: chartLeft + (index * (groupWidth + groupGap)),
            y: baseline - ((totalBelow / maxTotal) * chartHeight),
            width: groupWidth,
            height
          };
        });

        return {
          ...month,
          total: this.enrollmentTotal(month),
          x: chartLeft + (index * (groupWidth + groupGap)),
          labelX: chartLeft + (index * (groupWidth + groupGap)) + (groupWidth / 2),
          totalY: baseline - ((this.enrollmentTotal(month) / maxTotal) * chartHeight) - 7,
          segments
        };
      });
    }
  },

  methods: {
    projectionLabel(row) {
      return [String(row?.program_name ?? '').trim(), String(row?.campus_name ?? row?.campus_code ?? '').trim()].filter(Boolean).join(' - ');
    },

    numberValue(value) {
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    },

    wholeNumber(value) {
      const number = this.numberValue(value);
      return number === null ? '-' : Math.round(number).toLocaleString();
    },

    percent(value) {
      const number = this.numberValue(value);
      return number === null ? '-' : `${(number * 100).toFixed(1)}%`;
    },

    rangeText(low, high, formatter) {
      const lowText = formatter(low);
      const highText = formatter(high);
      return lowText === '-' || highText === '-' ? 'Insufficient history' : `80% range: ${lowText}-${highText}`;
    },

    asymmetricRange(projected, low, high, isRate = false) {
      const center = this.numberValue(projected);
      const lowValue = this.numberValue(low);
      const highValue = this.numberValue(high);
      if (center === null || lowValue === null || highValue === null) return 'Insufficient history';
      const scale = isRate ? 100 : 1;
      const format = value => isRate ? value.toFixed(1) : Math.round(value).toLocaleString();
      return `+${format((highValue - center) * scale)} / -${format((center - lowValue) * scale)}${isRate ? ' pts' : ''}`;
    },

    rangeValues(low, high, formatter) {
      const lowText = formatter(low);
      const highText = formatter(high);
      return lowText === '-' || highText === '-' ? 'Insufficient history' : `${lowText} - ${highText}`;
    },

    rateChangeText(value, sinceJuly = false) {
      const change = this.numberValue(value);
      if (change === null) return '';
      const arrow = change >= 0 ? '\u2191' : '\u2193';
      const previousMonth = sinceJuly ? 'July' : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleString('en-US', { month: 'long' });
      return `${arrow} ${Math.abs(change * 100).toFixed(1)} pts since ${previousMonth}`;
    },

    rateChangeIndicator(value) {
      const change = this.numberValue(value);
      if (change === null || change === 0) return '';
      return change > 0 ? '\u25B2' : '\u25BC';
    },

    outlookText(value) {
      const labels = { '-2': 'Strong concern', '-1': 'At risk', '0': 'Uncertain', '1': 'Likely on track', '2': 'Strongly on track' };
      const score = this.numberValue(value);
      return score === null || !Object.prototype.hasOwnProperty.call(labels, String(score)) ? 'Insufficient history' : `${score > 0 ? '+' : ''}${score} ${labels[String(score)]}`;
    },

    outlookStyle(value) {
      const score = this.numberValue(value);
      const color = score === null || score === 0 ? this.colors.yellow : score > 0 ? this.colors.green : this.colors.red;
      return { backgroundColor: color, color: color === this.colors.yellow ? this.colors.black : this.colors.white, display: 'inline-block', padding: '.1rem .5rem', borderRadius: '999px' };
    },

    outlookColor(value) {
      const score = this.numberValue(value);
      if (score === null) return this.colors.black;
      if (score > 0) return this.colors.green;
      if (score < 0) return this.colors.red;
      return this.colors.yellow;
    },

    rateStyle(value) {
      const rate = this.numberValue(value);
      return { backgroundColor: rate !== null && rate > 0.5 ? this.colors.green : this.colors.red, color: this.colors.white, display: 'inline-block', padding: '.1rem .5rem', borderRadius: '999px' };
    },

    projectionDetails(projection) {
      return `Method: ${projection?.projection_method__historic || 'unavailable'}. 90% projected graduate range: ${this.wholeNumber(projection?.num_students__graduate__projected__low_90)}-${this.wholeNumber(projection?.num_students__graduate__projected__high_90)}. 90% projected exiter range: ${this.wholeNumber(projection?.num_students__exiter__projected__low_90)}-${this.wholeNumber(projection?.num_students__exiter__projected__high_90)}. 90% graduate-rate range: ${this.percent(projection?.perc_students__graduate__projected__low_90)}-${this.percent(projection?.perc_students__graduate__projected__high_90)}.`;
    },

    normalizeProjections(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        ...row,
        key: [row?.program_code, row?.campus_code, row?.academic_year].map(value => String(value ?? '').trim()).join('|'),
        program_name: String(row?.program_name ?? '').trim(),
        campus_name: String(row?.campus_name ?? '').trim(),
        campus_code: String(row?.campus_code ?? '').trim(),
        is_on_campus: row?.is_on_campus === true || String(row?.is_on_campus ?? '').trim().toLowerCase() === 'true',
        projection_method__historic: String(row?.projection_method__historic ?? '').trim().toLowerCase()
      }));
    },

    selectProjectionFromContext() {
      const programCode = String(this.getSharedFilterValue('program_code', this.reportContext?.routeFilters?.programCode) ?? '').trim();
      const campusCode = String(this.getSharedFilterValue('campus_code', this.reportContext?.routeFilters?.campusCode) ?? '').trim();
      const programName = String(this.getSharedFilterValue('program_name', this.reportContext?.routeFilters?.programName) ?? '').trim();
      const match = this.projectionOptions.find(row => (
        String(row.program_code ?? '').trim() === programCode
        && (!campusCode || String(row.campus_code ?? '').trim() === campusCode)
      )) || this.projectionOptions.find(row => String(row.program_name ?? '').trim() === programName);
      if (match && match.key !== this.selectedProjectionKey) this.selectedProjectionKey = match.key;
      return Boolean(match);
    },

    syncSelectedProjectionToSharedFilters() {
      const projection = this.selectedProjection;
      if (!projection) return;
      this.setSharedFilterValue('program_code', String(projection.program_code ?? '').trim());
      this.setSharedFilterValue('campus_code', String(projection.campus_code ?? '').trim());
      this.setSharedFilterValue('program_name', String(projection.program_name ?? '').trim());
    },

    currentAcademicMonth() {
      return ((new Date().getMonth() + 6) % 12) + 1;
    },

    async loadMonthlyData() {
      const projection = this.selectedProjection;
      if (!projection) return;
      try {
        const rows = await this.fetchReportDataset(
          { program_code: projection.program_code, campus_code: projection.campus_code },
          { dataset: 'programs_graduates_monthly' }
        );
        this.monthlyRows = Array.isArray(rows) ? rows : [];
      } catch (error) {
        console.warn('Failed to load monthly graduation data', error);
        this.monthlyRows = [];
      }
    },

    async loadData() {
      try {
        this.loading = true;
        this.loadError = '';
        this.projections = this.normalizeProjections(await this.fetchReportDataset({}, { dataset: 'programs_graduates_projections' }));
        if (!this.projectionOptions.length) this.loadError = 'No on-campus program projections are available for the current academic year.';
        else if (!this.selectProjectionFromContext() && !this.projectionOptions.some(row => row.key === this.selectedProjectionKey)) this.selectedProjectionKey = this.projectionOptions[0].key;
        await this.loadMonthlyData();
      } catch (error) {
        console.warn('Failed to load graduation projections', error);
        this.loadError = 'Unable to load graduation projections.';
      } finally {
        this.loading = false;
      }
    },

    trendArrow(change) {
      return Number(change) >= 0 ? '↑' : '↓';
    },

    trendColor(change) {
      return Number(change) >= 0 ? this.colors.green : this.colors.red;
    },

    trendText(change) {
      const magnitude = Math.abs(Number(change) || 0);
      return `${magnitude}% ${Number(change) >= 0 ? 'increase' : 'decrease'} from last year`;
    },

    projectedGraduationRateStyle() {
      return {
        backgroundColor: this.summary.projectedGraduationRate > 50 ? this.colors.green : this.colors.red,
        color: this.colors.white,
        display: 'inline-block',
        padding: '.1rem .5rem',
        borderRadius: '999px'
      };
    },

    enrollmentTotal(month) {
      return ['new', 'progressing', 'inactive', 'graduated', 'otherExit', 'projectedActive', 'projectedGraduates']
        .reduce((total, key) => total + (Number(month?.[key]) || 0), 0);
    }
  },

  mounted() {
    this.loadData();
  },

  watch: {
    selectedProjectionKey() {
      this.syncSelectedProjectionToSharedFilters();
      this.loadMonthlyData();
    },
    reportContext() {
      this.selectProjectionFromContext();
    }
  },

  template: `
  <div class="btech-card btech-theme" style="padding:16px; margin-top:12px; overflow:auto;">
    <div class="btech-row" style="align-items:center; margin-bottom:4px;">
      <h4 class="btech-card-title" style="margin:0;">Graduation Outlook</h4>
      <div style="flex:1;"></div>
      <select v-if="projectionOptions.length" v-model="selectedProjectionKey" aria-label="Select program projection" style="min-width:18rem; max-width:28rem;"><option v-for="projection in projectionOptions" :key="projection.key" :value="projection.key">{{ projectionLabel(projection) }}</option></select>
    </div>
    <div v-if="loading" class="btech-muted" style="padding:16px;">Loading graduation projections...</div>
    <div v-else-if="loadError" class="btech-muted" style="padding:16px;">{{ loadError }}</div>
    <template v-else-if="selectedProjection">
    <div style="font-size:.85rem; font-weight:600; margin-bottom:8px;">{{ projectionLabel(selectedProjection) }} - {{ selectedProjection.academic_year }}</div>
    <div style="display:grid; grid-template-columns:repeat(5, minmax(11rem, 1fr)); gap:12px; min-width:62rem; margin-bottom:20px;">
      <div :title="projectionDetails(selectedProjection)" style="border:1px solid #e5e7eb; border-radius:6px; padding:14px;"><div class="btech-muted" style="font-size:.8rem;">Exiters to Date</div><div style="font-size:1.8rem; font-weight:700;">{{ wholeNumber(selectedProjection.num_students__exiter) }}</div></div>
      <div :title="projectionDetails(selectedProjection)" style="border:1px solid #e5e7eb; border-radius:6px; padding:14px;"><div class="btech-muted" style="font-size:.8rem;">Projected Exiters</div><div v-if="hasValidatedForecast" style="font-size:1.25rem; font-weight:700; margin-top:8px;">{{ rangeValues(selectedProjection.num_students__exiter__projected__low_80, selectedProjection.num_students__exiter__projected__high_80, wholeNumber) }}</div><div v-else style="font-size:1rem; font-weight:700; margin-top:10px;">Insufficient history</div></div>
      <div :title="projectionDetails(selectedProjection)" style="border:1px solid #e5e7eb; border-radius:6px; padding:14px;"><div class="btech-muted" style="font-size:.8rem;">Graduates to Date</div><div style="font-size:1.8rem; font-weight:700;">{{ wholeNumber(selectedProjection.num_students__graduate) }}</div></div>
      <div :title="projectionDetails(selectedProjection)" style="border:1px solid #e5e7eb; border-radius:6px; padding:14px;"><div class="btech-muted" style="font-size:.8rem;">Projected Graduates</div><div v-if="hasValidatedForecast" style="font-size:1.25rem; font-weight:700; margin-top:8px;">{{ rangeValues(selectedProjection.num_students__graduate__projected__low_80, selectedProjection.num_students__graduate__projected__high_80, wholeNumber) }}</div><div v-else style="font-size:1rem; font-weight:700; margin-top:10px;">Insufficient history</div></div>
      <div :title="projectionDetails(selectedProjection)" style="border:1px solid #e5e7eb; border-radius:6px; padding:14px;"><div class="btech-muted" style="font-size:.8rem;">Projected Graduation Rate</div><div v-if="hasValidatedForecast" style="font-size:1.25rem; font-weight:700; margin-top:8px;"><span :style="outlookStyle(selectedProjection.score_graduation_projection_strength)">{{ rangeValues(selectedProjection.perc_students__graduate__projected__low_80, selectedProjection.perc_students__graduate__projected__high_80, percent) }}</span><span v-if="rateChangeIndicator(selectedProjection.change_perc_students__graduate__projected__since_july)" :style="{ color:numberValue(selectedProjection.change_perc_students__graduate__projected__since_july) > 0 ? colors.green : colors.red, marginLeft:'.4rem' }">{{ rateChangeIndicator(selectedProjection.change_perc_students__graduate__projected__since_july) }}</span></div><div v-else style="font-size:1rem; font-weight:700; margin-top:10px;">Insufficient history</div></div>
    </div>

    <div v-if="false" style="display:grid; grid-template-columns:repeat(4, minmax(11rem, 1fr)); gap:12px; min-width:54rem; margin-bottom:20px;">
      <div style="border:1px solid #e5e7eb; border-radius:6px; padding:14px;">
        <div class="btech-muted" style="font-size:.8rem;">Active Students</div>
        <div style="font-size:1.8rem; font-weight:700; color:#111827;">{{ summary.activeStudents }}</div>
        <div :style="{ color:trendColor(summaryChanges.activeStudents), fontSize:'.8rem', fontWeight:'600' }">{{ trendArrow(summaryChanges.activeStudents) }} {{ trendText(summaryChanges.activeStudents) }}</div>
      </div>
      <div style="border:1px solid #e5e7eb; border-radius:6px; padding:14px;">
        <div class="btech-muted" style="font-size:.8rem;">Graduates to Date <span style="white-space:nowrap;">(this academic year)</span></div>
        <div style="font-size:1.8rem; font-weight:700; color:#111827;">{{ summary.graduatesToDate }}</div>
        <div :style="{ color:trendColor(summaryChanges.graduatesToDate), fontSize:'.8rem', fontWeight:'600' }">{{ trendArrow(summaryChanges.graduatesToDate) }} {{ trendText(summaryChanges.graduatesToDate) }}</div>
      </div>
      <div style="border:1px solid #e5e7eb; border-radius:6px; padding:14px;">
        <div class="btech-muted" style="font-size:.8rem;">Total Projected Graduates</div>
        <div style="font-size:1.8rem; font-weight:700; color:#111827;">{{ summary.projectedGraduates }}</div>
        <div :style="{ color:trendColor(summaryChanges.projectedGraduates), fontSize:'.8rem', fontWeight:'600' }">{{ trendArrow(summaryChanges.projectedGraduates) }} {{ trendText(summaryChanges.projectedGraduates) }}</div>
      </div>
      <div style="border:1px solid #e5e7eb; border-radius:6px; padding:14px;">
        <div class="btech-muted" style="font-size:.8rem;">Projected Graduation Rate</div>
        <div style="font-size:1.8rem; font-weight:700; margin-top:4px;"><span :style="projectedGraduationRateStyle()">{{ summary.projectedGraduationRate }}%</span></div>
      </div>
    </div>

    <div style="display:flex; flex-wrap:wrap; gap:20px; align-items:flex-start;">
    <section style="flex:1 1 42rem; min-width:42rem;">
      <h5 style="margin:0 0:6px; font-size:1rem;">Historic End-of-Year Graduation Rate</h5>
      <div style="display:flex; gap:14px; align-items:center; font-size:.8rem; margin-bottom:4px;">
        <span><i style="display:inline-block; width:1rem; border-top:2px dashed #dc2626; vertical-align:middle;"></i> 60% requirement</span>
      </div>
      <svg width="680" height="212" viewBox="0 0 680 212" role="img" aria-label="Historic end-of-year graduation rates">
        <line x1="58" y1="18" x2="58" y2="162" stroke="#cbd5e1"></line>
        <line x1="58" y1="162" x2="628" y2="162" stroke="#cbd5e1"></line>
        <line x1="58" x2="628" :y1="graduationTargetY" :y2="graduationTargetY" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4 3"></line>
        <text x="49" y="22" text-anchor="end" font-size="10" fill="#64748b">100%</text>
        <text x="49" y="94" text-anchor="end" font-size="10" fill="#64748b">50%</text>
        <text x="49" y="166" text-anchor="end" font-size="10" fill="#64748b">0%</text>
        <g v-for="(point, index) in historicEndOfYearGraduationPoints" :key="point.year">
          <line v-if="index > 0" :x1="historicEndOfYearGraduationPoints[index - 1].x" :y1="historicEndOfYearGraduationPoints[index - 1].y" :x2="point.x" :y2="point.y" :stroke="point.color" stroke-width="2"></line>
          <circle :cx="point.x" :cy="point.y" r="4.5" :fill="point.color"><title>{{ point.year }} {{ point.isProjected ? 'projected' : 'final' }} graduation rate: {{ percent(point.rate) }}{{ point.movement > 0 ? ' (up from prior year)' : point.movement < 0 ? ' (down from prior year)' : '' }}</title></circle>
          <text :x="point.x" y="181" text-anchor="middle" font-size="10" fill="#334155">{{ point.year }}</text>
          <text :x="point.x" y="196" text-anchor="middle" font-size="10" fill="#64748b">{{ percent(point.rate) }}</text>
        </g>
      </svg>
    </section>

    <section style="flex:1 1 42rem; min-width:42rem;">
      <h5 style="margin:0 0:6px; font-size:1rem;">Historic End-of-Year Graduates</h5>
      <svg width="680" height="212" viewBox="0 0 680 212" role="img" aria-label="Historic end-of-year graduate counts">
        <line x1="58" y1="18" x2="58" y2="162" stroke="#cbd5e1"></line>
        <line x1="58" y1="162" x2="628" y2="162" stroke="#cbd5e1"></line>
        <text x="49" y="22" text-anchor="end" font-size="10" fill="#64748b">{{ historicEndOfYearGraduateMaximum }}</text>
        <text x="49" y="94" text-anchor="end" font-size="10" fill="#64748b">{{ Math.round(historicEndOfYearGraduateMaximum / 2) }}</text>
        <text x="49" y="166" text-anchor="end" font-size="10" fill="#64748b">0</text>
        <g v-for="(point, index) in historicEndOfYearGraduatePoints" :key="point.year">
          <line v-if="index > 0" :x1="historicEndOfYearGraduatePoints[index - 1].x" :y1="historicEndOfYearGraduatePoints[index - 1].y" :x2="point.x" :y2="point.y" :stroke="point.color" stroke-width="2"></line>
          <circle :cx="point.x" :cy="point.y" r="4.5" :fill="point.color"><title>{{ point.year }} {{ point.isProjected ? 'projected' : 'final' }} graduates: {{ wholeNumber(point.count) }}{{ point.change === null ? '' : point.change > 0 ? ' (up ' + wholeNumber(point.change) + ')' : point.change < 0 ? ' (down ' + wholeNumber(Math.abs(point.change)) + ')' : ' (unchanged)' }}</title></circle>
          <text :x="point.x" y="181" text-anchor="middle" font-size="10" fill="#334155">{{ point.year }}</text>
          <text :x="point.x" y="196" text-anchor="middle" font-size="10" fill="#64748b">{{ wholeNumber(point.count) }}</text>
        </g>
      </svg>
    </section>

    <section style="flex:1 1 42rem; min-width:42rem;">
      <h5 style="margin:0 0:6px; font-size:1rem;">Graduation Outlook Trend</h5>
      <div style="display:flex; gap:14px; align-items:center; font-size:.8rem; margin-bottom:4px;">
        <span><i style="display:inline-block; width:1rem; border-top:2px dashed #dc2626; vertical-align:middle;"></i> 60% requirement</span>
      </div>
      <svg width="680" height="212" viewBox="0 0 680 212" role="img" aria-label="Projected graduation-rate trend from July through June">
        <line x1="58" y1="18" x2="58" y2="162" stroke="#cbd5e1"></line>
        <line x1="58" y1="162" x2="628" y2="162" stroke="#cbd5e1"></line>
        <line x1="58" x2="628" :y1="graduationTargetY" :y2="graduationTargetY" stroke="#dc2626" stroke-width="1.5" stroke-dasharray="4 3"></line>
        <text x="49" y="22" text-anchor="end" font-size="10" fill="#64748b">100%</text>
        <text x="49" y="94" text-anchor="end" font-size="10" fill="#64748b">50%</text>
        <text x="49" y="166" text-anchor="end" font-size="10" fill="#64748b">0%</text>
        <g v-for="(point, index) in graduationOutlookPoints" :key="point.month">
          <line v-if="index > 0 && point.y !== null && graduationOutlookPoints[index - 1].y !== null" :x1="graduationOutlookPoints[index - 1].x" :y1="graduationOutlookPoints[index - 1].y" :x2="point.x" :y2="point.y" :stroke="point.color" stroke-width="2"></line>
          <circle v-if="point.y !== null" :cx="point.x" :cy="point.y" r="4.5" :fill="point.color"><title>{{ point.month }} projected graduation rate: {{ percent(point.rate) }}{{ point.movement > 0 ? ' (up from prior month)' : point.movement < 0 ? ' (down from prior month)' : '' }}</title></circle>
          <text :x="point.x" y="179" text-anchor="middle" font-size="9" fill="#334155">{{ point.month.slice(0, 3) }}</text>
        </g>
      </svg>
    </section>

    <section style="flex:1 1 42rem; min-width:42rem;">
      <h5 style="margin:0 0:6px; font-size:1rem;">Active Enrollment vs Historic Average</h5>
      <div style="display:flex; gap:14px; align-items:center; font-size:.8rem; margin-bottom:4px;">
        <span><i :style="{ display:'inline-block', width:'.65rem', height:'.65rem', borderRadius:'50%', background:colors.green }"></i> Current year</span>
        <span><i :style="{ display:'inline-block', width:'.65rem', height:'.65rem', borderRadius:'50%', background:colors.black }"></i> Historic average</span>
      </div>
      <svg width="680" height="202" viewBox="0 0 680 202" role="img" aria-label="Active enrollment compared with the historic average from July through June">
        <line x1="50" y1="18" x2="50" y2="146" stroke="#cbd5e1"></line>
        <line x1="50" y1="146" x2="640" y2="146" stroke="#cbd5e1"></line>
        <polyline :points="enrollmentRatePoints.filter(point => point.currentYearY !== null).map(point => point.x + ',' + point.currentYearY).join(' ')" fill="none" :stroke="colors.green" stroke-width="1.5" stroke-dasharray="4 3"></polyline>
        <polyline :points="enrollmentRatePoints.filter(point => point.historicAverageY !== null).map(point => point.x + ',' + point.historicAverageY).join(' ')" fill="none" :stroke="colors.black" stroke-width="1.5" stroke-dasharray="2 3"></polyline>
        <g v-for="point in enrollmentRatePoints" :key="point.month">
          <circle v-if="point.historicAverageY !== null" :cx="point.x" :cy="point.historicAverageY" r="4" :fill="colors.black"><title>{{ point.month }} historic average: {{ point.historicAverage }}</title></circle>
          <circle v-if="point.currentYearY !== null" :cx="point.x" :cy="point.currentYearY" r="4" :fill="colors.green"><title>{{ point.month }} current year: {{ point.currentYear }}</title></circle>
          <text :x="point.x" y="163" text-anchor="middle" font-size="9" fill="#334155">{{ point.month }}</text>
        </g>
      </svg>
    </section>

    <section style="flex:1 1 42rem; min-width:42rem;">
      <h5 style="margin:0 0:6px; font-size:1rem;">Current Academic Year Enrollment and Graduation Projection</h5>
      <div style="display:flex; gap:12px; flex-wrap:wrap; font-size:.8rem; margin-bottom:4px;">
        <span v-for="item in enrollmentLegend" :key="item.key"><i :style="{ display:'inline-block', width:'.65rem', height:'.65rem', background:item.color, opacity:item.opacity || 1 }"></i> {{ item.label }}</span>
      </div>
      <svg width="680" height="278" viewBox="0 0 680 278" role="img" aria-label="Monthly enrollment status and projected active enrollment">
        <line x1="52" y1="222.5" x2="650" y2="222.5" stroke="#cbd5e1"></line>
        <g v-for="group in enrollmentBarGroups" :key="group.month">
          <rect v-for="segment in group.segments" :key="segment.key" :x="segment.x" :y="segment.y" :width="segment.width" :height="segment.height" :fill="segment.color" :fill-opacity="segment.opacity || 1"><title>{{ group.month }}: {{ segment.label }} {{ segment.count }}</title></rect>
          <text :x="group.labelX" :y="group.totalY" text-anchor="middle" font-size="11" fill="#111827">{{ group.total }}</text>
          <text :x="group.labelX" y="240" text-anchor="middle" font-size="11" fill="#334155">{{ group.month }}</text>
        </g>
      </svg>
    </section>
    </div>
    </template>
  </div>
  `
});
