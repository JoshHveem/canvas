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
      enrollmentMonths: [
        { month: 'July', new: 8, progressing: 14, inactive: 2, graduated: 0, otherExit: 1 },
        { month: 'August', new: 5, progressing: 14, inactive: 2, graduated: 1, otherExit: 1 },
        { month: 'September', new: 6, progressing: 16, inactive: 2, graduated: 1, otherExit: 1 },
        { month: 'October', new: 3, progressing: 11, inactive: 1, graduated: 5, otherExit: 1, projectedGraduates: 5 },
        { month: 'November', new: 1, progressing: 10, inactive: 3, graduated: 3, otherExit: 1 },
        { month: 'December', new: 0, progressing: 2, inactive: 1, graduated: 1, otherExit: 1 }
      ]
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

    ratePoints() {
      const chartHeight = 144;
      const chartTop = 18;
      const chartLeft = 58;
      const chartWidth = 570;
      const rateToY = rate => chartTop + ((100 - rate) / 100) * chartHeight;
      return this.historicRates.map((rate, index) => ({
        ...rate,
        x: chartLeft + ((index + 0.5) * (chartWidth / this.historicRates.length)),
        endOfYearY: rateToY(rate.endOfYear),
        atThisPointY: rateToY(rate.atThisPoint)
      }));
    },

    enrollmentLegend() {
      return [
        { key: 'new', label: 'New', color: this.colors.orange || this.colors.yellow },
        { key: 'progressing', label: 'Progressing', color: this.colors.green },
        { key: 'inactive', label: 'Inactive', color: this.colors.yellow },
        { key: 'graduated', label: 'Graduated', color: this.colors.black },
        { key: 'otherExit', label: 'Other Exit', color: this.colors.red }
      ];
    },

    enrollmentRatePoints() {
      const chartHeight = 128;
      const chartTop = 18;
      const chartLeft = 50;
      const chartWidth = 590;
      const values = this.historicEnrollmentRates.flatMap(rate => [rate.currentYear, rate.historicAverage])
        .filter(value => Number.isFinite(value));
      const maxCount = Math.max(...values, 1);
      const countToY = count => chartTop + ((maxCount - count) / maxCount) * chartHeight;

      return this.historicEnrollmentRates.map((rate, index) => ({
        ...rate,
        x: chartLeft + (index * (chartWidth / (this.historicEnrollmentRates.length - 1))),
        currentYearY: Number.isFinite(rate.currentYear) ? countToY(rate.currentYear) : null,
        historicAverageY: countToY(rate.historicAverage)
      }));
    },

    enrollmentBarGroups() {
      const chartHeight = 178;
      const baseline = 222;
      const chartLeft = 66;
      const groupWidth = 66;
      const groupGap = 30;
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

    rateChangeText(value, sinceJuly = false) {
      const change = this.numberValue(value);
      if (change === null) return '';
      const arrow = change >= 0 ? '\u2191' : '\u2193';
      const previousMonth = sinceJuly ? 'July' : new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toLocaleString('en-US', { month: 'long' });
      return `${arrow} ${Math.abs(change * 100).toFixed(1)} pts since ${previousMonth}`;
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

    async loadData() {
      try {
        this.loading = true;
        this.loadError = '';
        this.projections = this.normalizeProjections(await this.fetchReportDataset({}, { dataset: 'programs_graduates_projections' }));
        if (!this.projectionOptions.length) this.loadError = 'No on-campus program projections are available for the current academic year.';
        else if (!this.projectionOptions.some(row => row.key === this.selectedProjectionKey)) this.selectedProjectionKey = this.projectionOptions[0].key;
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
      return ['new', 'progressing', 'inactive', 'graduated', 'otherExit']
        .reduce((total, key) => total + (Number(month?.[key]) || 0), 0);
    }
  },

  mounted() {
    this.loadData();
  },

  template: `
  <div class="btech-card btech-theme" style="padding:16px; margin-top:12px; overflow:auto;">
    <div class="btech-row" style="align-items:center; margin-bottom:4px;">
      <h4 class="btech-card-title" style="margin:0;">Graduation Outlook</h4>
      <div style="flex:1;"></div>
      <select v-if="projectionOptions.length" v-model="selectedProjectionKey" aria-label="Select program projection" style="min-width:18rem; max-width:28rem;"><option v-for="projection in projectionOptions" :key="projection.key" :value="projection.key">{{ projectionLabel(projection) }}</option></select>
    </div>
    <div class="btech-muted" style="font-size:.8rem; margin-bottom:16px;">Projection cards use live program data. The charts below remain placeholders until their datasets are available.</div>

    <div v-if="loading" class="btech-muted" style="padding:16px;">Loading graduation projections...</div>
    <div v-else-if="loadError" class="btech-muted" style="padding:16px;">{{ loadError }}</div>
    <template v-else-if="selectedProjection">
    <div style="font-size:.85rem; font-weight:600; margin-bottom:8px;">{{ projectionLabel(selectedProjection) }} - {{ selectedProjection.academic_year }}</div>
    <div style="display:grid; grid-template-columns:repeat(3, minmax(14rem, 1fr)); gap:12px; min-width:48rem; margin-bottom:20px;">
      <div :title="projectionDetails(selectedProjection)" style="border:1px solid #e5e7eb; border-radius:6px; padding:14px;"><div class="btech-muted" style="font-size:.8rem;">Projected Exiters</div><div style="font-size:1.8rem; font-weight:700;">{{ wholeNumber(selectedProjection.num_students__exiter__projected) }}</div><div class="btech-muted" style="font-size:.8rem;">{{ hasValidatedForecast ? asymmetricRange(selectedProjection.num_students__exiter__projected, selectedProjection.num_students__exiter__projected__low_80, selectedProjection.num_students__exiter__projected__high_80) : 'Insufficient history' }}</div></div>
      <div :title="projectionDetails(selectedProjection)" style="border:1px solid #e5e7eb; border-radius:6px; padding:14px;"><div class="btech-muted" style="font-size:.8rem;">Projected Graduates</div><div style="font-size:1.8rem; font-weight:700;">{{ wholeNumber(selectedProjection.num_students__graduate__projected) }}</div><div class="btech-muted" style="font-size:.8rem;">{{ hasValidatedForecast ? asymmetricRange(selectedProjection.num_students__graduate__projected, selectedProjection.num_students__graduate__projected__low_80, selectedProjection.num_students__graduate__projected__high_80) : 'Insufficient history' }}</div></div>
      <div :title="projectionDetails(selectedProjection)" style="border:1px solid #e5e7eb; border-radius:6px; padding:14px;"><div class="btech-muted" style="font-size:.8rem;">Projected Graduation Rate</div><div style="font-size:1.8rem; font-weight:700; margin-top:4px; color:#111827;">{{ percent(selectedProjection.perc_students__graduate__projected) }} <span class="btech-muted" style="font-size:.8rem; font-weight:600; white-space:nowrap;">{{ hasValidatedForecast ? asymmetricRange(selectedProjection.perc_students__graduate__projected, selectedProjection.perc_students__graduate__projected__low_80, selectedProjection.perc_students__graduate__projected__high_80, true) : 'Insufficient history' }}</span></div><div v-if="hasValidatedForecast" style="margin-top:8px;"><span :style="outlookStyle(selectedProjection.score_graduation_projection_strength)">{{ outlookText(selectedProjection.score_graduation_projection_strength) }}</span><span v-if="rateChangeText(selectedProjection.change_perc_students__graduate__projected__since_july, true)" class="btech-muted" style="font-size:.75rem; margin-left:6px;">{{ rateChangeText(selectedProjection.change_perc_students__graduate__projected__since_july, true) }}</span></div><div v-else class="btech-muted" style="font-size:.8rem; margin-top:8px;">Insufficient history</div></div>
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
      <h5 style="margin:0 0:4px; font-size:1rem;">Historic Graduation Rates</h5>
      <div class="btech-muted" style="font-size:.8rem; margin-bottom:8px;">Each year compares the final graduation rate with the rate at this same point in the year.</div>
      <div style="display:flex; gap:14px; align-items:center; font-size:.8rem; margin-bottom:4px;">
        <span><i style="display:inline-block; width:.65rem; height:.65rem; border-radius:50%; background:#111827;"></i> End of year</span>
        <span><i :style="{ display:'inline-block', width:'.65rem', height:'.65rem', borderRadius:'50%', background:(colors.orange || colors.yellow) }"></i> At this point in year</span>
      </div>
      <svg width="680" height="212" viewBox="0 0 680 212" role="img" aria-label="Placeholder historic graduation rates">
        <line x1="58" y1="18" x2="58" y2="162" stroke="#cbd5e1"></line>
        <line x1="58" y1="162" x2="628" y2="162" stroke="#cbd5e1"></line>
        <text x="49" y="22" text-anchor="end" font-size="10" fill="#64748b">100%</text>
        <text x="49" y="94" text-anchor="end" font-size="10" fill="#64748b">50%</text>
        <text x="49" y="166" text-anchor="end" font-size="10" fill="#64748b">0%</text>
        <g v-for="point in ratePoints" :key="point.year">
          <line :x1="point.x" :x2="point.x" :y1="point.endOfYearY" :y2="point.atThisPointY" stroke="#94a3b8" stroke-dasharray="3 3"></line>
          <circle :cx="point.x" :cy="point.endOfYearY" r="5" :fill="colors.black"><title>{{ point.year }} end of year: {{ point.endOfYear }}%</title></circle>
          <circle :cx="point.x" :cy="point.atThisPointY" r="5" :fill="colors.orange || colors.yellow"><title>{{ point.year }} at this point: {{ point.atThisPoint }}%</title></circle>
          <text :x="point.x" y="184" text-anchor="middle" font-size="11" fill="#334155">{{ point.year }}</text>
          <text :x="point.x" y="199" text-anchor="middle" font-size="10" fill="#64748b">{{ point.atThisPoint }}% / {{ point.endOfYear }}%</text>
        </g>
      </svg>
    </section>

    <section style="flex:1 1 42rem; min-width:42rem;">
      <h5 style="margin:0 0:4px; font-size:1rem;">Historic Enrollment Rates</h5>
      <div class="btech-muted" style="font-size:.8rem; margin-bottom:8px;">Compare this year's monthly enrollment to the historic average to see when students normally enter the program.</div>
      <div style="display:flex; gap:14px; align-items:center; font-size:.8rem; margin-bottom:4px;">
        <span><i :style="{ display:'inline-block', width:'.65rem', height:'.65rem', borderRadius:'50%', background:colors.green }"></i> Current year</span>
        <span><i :style="{ display:'inline-block', width:'.65rem', height:'.65rem', borderRadius:'50%', background:colors.black }"></i> Historic average</span>
      </div>
      <svg width="680" height="202" viewBox="0 0 680 202" role="img" aria-label="Placeholder historic enrollment rates from July through June">
        <line x1="50" y1="18" x2="50" y2="146" stroke="#cbd5e1"></line>
        <line x1="50" y1="146" x2="640" y2="146" stroke="#cbd5e1"></line>
        <polyline :points="enrollmentRatePoints.filter(point => point.currentYearY !== null).map(point => point.x + ',' + point.currentYearY).join(' ')" fill="none" :stroke="colors.green" stroke-width="1.5" stroke-dasharray="4 3"></polyline>
        <polyline :points="enrollmentRatePoints.map(point => point.x + ',' + point.historicAverageY).join(' ')" fill="none" :stroke="colors.black" stroke-width="1.5" stroke-dasharray="2 3"></polyline>
        <g v-for="point in enrollmentRatePoints" :key="point.month">
          <circle :cx="point.x" :cy="point.historicAverageY" r="4" :fill="colors.black"><title>{{ point.month }} historic average: {{ point.historicAverage }}</title></circle>
          <circle v-if="point.currentYearY !== null" :cx="point.x" :cy="point.currentYearY" r="4" :fill="colors.green"><title>{{ point.month }} current year: {{ point.currentYear }}</title></circle>
          <text :x="point.x" y="163" text-anchor="middle" font-size="9" fill="#334155">{{ point.month }}</text>
        </g>
      </svg>
    </section>

    <section style="flex:1 1 42rem; min-width:42rem;">
      <h5 style="margin:0 0:4px; font-size:1rem;">Current Academic Year Enrollment and Graduation Projection</h5>
      <div class="btech-muted" style="font-size:.8rem; margin-bottom:8px;">Monthly totals are stacked by current student status. October includes five projected graduates.</div>
      <div style="display:flex; gap:12px; flex-wrap:wrap; font-size:.8rem; margin-bottom:4px;">
        <span v-for="item in enrollmentLegend" :key="item.key"><i :style="{ display:'inline-block', width:'.65rem', height:'.65rem', background:item.color }"></i> {{ item.label }}</span>
      </div>
      <svg width="680" height="278" viewBox="0 0 680 278" role="img" aria-label="Placeholder monthly enrollment and graduation projection">
        <line x1="52" y1="222.5" x2="650" y2="222.5" stroke="#cbd5e1"></line>
        <g v-for="group in enrollmentBarGroups" :key="group.month">
          <rect v-for="segment in group.segments" :key="segment.key" :x="segment.x" :y="segment.y" :width="segment.width" :height="segment.height" :fill="segment.color"><title>{{ group.month }}: {{ segment.label }} {{ segment.count }}</title></rect>
          <text :x="group.labelX" :y="group.totalY" text-anchor="middle" font-size="11" fill="#111827">{{ group.total }}</text>
          <text :x="group.labelX" y="240" text-anchor="middle" font-size="11" fill="#334155">{{ group.month }}</text>
          <text v-if="group.projectedGraduates" :x="group.labelX" y="257" text-anchor="middle" font-size="10" :fill="colors.green">{{ group.projectedGraduates }} projected graduates</text>
        </g>
      </svg>
    </section>
    </div>
    </template>
  </div>
  `
});
