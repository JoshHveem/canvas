Vue.component('reports-graduation-outlook', {
  data() {
    const colors = window.ReportUtils.createColors();
    return {
      colors,
      summary: {
        activeStudents: 26,
        graduatesToDate: 14,
        projectedGraduates: 26
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

    enrollmentTotal(month) {
      return ['new', 'progressing', 'inactive', 'graduated', 'otherExit']
        .reduce((total, key) => total + (Number(month?.[key]) || 0), 0);
    }
  },

  template: `
  <div class="btech-card btech-theme" style="padding:16px; margin-top:12px; overflow:auto;">
    <div class="btech-row" style="align-items:center; margin-bottom:4px;">
      <h4 class="btech-card-title" style="margin:0;">Graduation Outlook</h4>
      <div style="flex:1;"></div>
      <span class="btech-pill">Placeholder data</span>
    </div>
    <div class="btech-muted" style="font-size:.8rem; margin-bottom:16px;">Live enrollment and graduation data will replace these sample values.</div>

    <div style="display:grid; grid-template-columns:repeat(3, minmax(11rem, 1fr)); gap:12px; min-width:42rem; margin-bottom:20px;">
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
    </div>

    <section style="min-width:42rem; margin-bottom:22px;">
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

    <section style="min-width:42rem; margin-bottom:22px;">
      <h5 style="margin:0 0:4px; font-size:1rem;">Historic Enrollment Rates</h5>
      <div class="btech-muted" style="font-size:.8rem; margin-bottom:8px;">Compare this year’s monthly enrollment to the historic average to see when students normally enter the program.</div>
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

    <section style="min-width:42rem;">
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
  `
});
