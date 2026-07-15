Vue.component('reports-outcomes-cpl-historic', {
  mixins: [
    window.ReportMixins.formatting,
    window.ReportMixins.programScoped({
      includeAcademicYear: false,
      emptySelectionMessage: 'Select a program.',
      loadErrorMessage: 'Unable to load CPL history.',
      optionsLoadErrorMessage: 'Unable to load program list.'
    })
  ],

  computed: {
    sortedRows() {
      return [...this.rows].sort((a, b) => {
        const yearDiff = Number(a?.academic_year ?? 0) - Number(b?.academic_year ?? 0);
        if (yearDiff !== 0) return yearDiff;
        return String(a?.program_name ?? '').localeCompare(String(b?.program_name ?? ''));
      });
    },

    yearRangeLabel() {
      if (!this.sortedRows.length) return 'No historic CPL data';
      const firstYear = Number(this.sortedRows[0]?.academic_year);
      const lastYear = Number(this.sortedRows[this.sortedRows.length - 1]?.academic_year);
      if (!Number.isFinite(firstYear) || !Number.isFinite(lastYear)) return 'No historic CPL data';
      return firstYear === lastYear ? `${firstYear}` : `${firstYear} - ${lastYear}`;
    },

    metricCards() {
      return [
        {
          key: 'completion',
          title: 'Completion',
          subtitle: 'Program completion rate by year',
          stroke: '#0f766e',
          latestStyle: this.completionPillStyle(this.latestMetricValue('completion'))
        },
        {
          key: 'placement',
          title: 'Placement',
          subtitle: 'Program placement rate by year',
          stroke: '#1d4ed8',
          latestStyle: this.outcomePillStyle(this.latestMetricValue('placement'))
        },
        {
          key: 'licensure',
          title: 'Licensure',
          subtitle: 'Program licensure rate by year',
          stroke: '#7c3aed',
          latestStyle: this.outcomePillStyle(this.latestMetricValue('licensure'))
        }
      ].map(card => ({
        ...card,
        chart: this.buildLineChart(card.key, card.stroke)
      }));
    }
  },

  methods: {
    mapRows(rows) {
      return (Array.isArray(rows) ? rows : [])
        .map(row => ({
          ...row,
          academic_year: Number(row?.academic_year),
          program_name: String(row?.program_name ?? '').trim(),
          program_code: String(row?.program_code ?? '').trim(),
          completion: Number(row?.completion),
          placement: Number(row?.placement),
          licensure: Number(row?.licensure)
        }))
        .filter(row => row.program_code);
    },

    latestMetricValue(metric) {
      const series = this.metricSeries(metric);
      const lastPoint = series[series.length - 1];
      return Number(lastPoint?.value);
    },

    metricSeries(metric) {
      const buckets = new Map();

      this.sortedRows.forEach(row => {
        const year = Number(row?.academic_year);
        const value = Number(row?.[metric]);
        if (!Number.isFinite(year) || !Number.isFinite(value)) return;

        if (!buckets.has(year)) buckets.set(year, []);
        buckets.get(year).push(value);
      });

      return Array.from(buckets.entries())
        .sort((a, b) => a[0] - b[0])
        .map(([year, values]) => ({
          year,
          value: values.reduce((sum, current) => sum + current, 0) / values.length
        }));
    },

    buildLineChart(metric, stroke) {
      const points = this.metricSeries(metric);
      const width = 760;
      const height = 220;
      const margin = { top: 18, right: 24, bottom: 36, left: 52 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      if (!points.length) {
        return {
          width,
          height,
          path: '',
          areaPath: '',
          points: [],
          xTicks: [],
          yTicks: [],
          targetY: null,
          hasData: false
        };
      }

      const xMin = points[0].year;
      const xMax = points[points.length - 1].year;
      const xSpan = Math.max(xMax - xMin, 1);
      const yMax = 1;
      const yMin = 0;

      const xFor = year => margin.left + ((year - xMin) / xSpan) * innerWidth;
      const yFor = value => margin.top + (1 - ((value - yMin) / (yMax - yMin || 1))) * innerHeight;

      const chartPoints = points.map(point => ({
        ...point,
        x: xFor(point.year),
        y: yFor(point.value),
        label: this.pctText(point.value)
      }));

      const path = chartPoints
        .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
        .join(' ');
      const areaPath = chartPoints.length
        ? `${path} L${chartPoints[chartPoints.length - 1].x.toFixed(2)},${(margin.top + innerHeight).toFixed(2)} L${chartPoints[0].x.toFixed(2)},${(margin.top + innerHeight).toFixed(2)} Z`
        : '';
      const xTicks = chartPoints.map(point => ({
        key: point.year,
        x: point.x,
        label: String(point.year)
      }));
      const yTicks = [0, 0.25, 0.5, 0.75, 1].map(value => ({
        key: value,
        y: yFor(value),
        label: this.pctText(value)
      }));
      const targetY = yFor(metric === 'completion' ? 0.7 : 0.8);

      return {
        width,
        height,
        path,
        areaPath,
        points: chartPoints,
        xTicks,
        yTicks,
        targetY,
        stroke,
        hasData: true
      };
    },

    bandStyle(value, warnMin, passMin) {
      const n = Number(value);
      if (!Number.isFinite(n)) {
        return { backgroundColor: this.colors.gray, color: this.colors.black };
      }

      return {
        backgroundColor: n < warnMin
          ? this.colors.red
          : (n < passMin ? this.colors.yellow : this.colors.green),
        color: this.colors.white
      };
    },

    completionPillStyle(value) {
      return this.bandStyle(value, 0.6, 0.7);
    },

    outcomePillStyle(value) {
      return this.bandStyle(value, 0.7, 0.8);
    }
  },

  data() {
    return {
      colors: window.ReportUtils.createColors()
    };
  },

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px; display:flex; flex-direction:column; gap:12px; min-height:0; overflow:auto;">
    <div class="btech-row" style="align-items:center; gap:12px; flex-wrap:wrap;">
      <div style="display:flex; align-items:center; gap:.5rem;">
        <label class="btech-muted" style="font-size:.75rem;">Program</label>
        <select v-model="selectedProgramCode" v-bind="filterAttrs('program_code')" style="font-size:.75rem; min-width:260px; max-width:360px;">
          <option value="">Select a program</option>
          <option v-for="option in programOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <span v-if="loadedProgramName" class="btech-pill">{{ loadedProgramName }}</span>
      <span class="btech-pill">Years: {{ yearRangeLabel }}</span>
      <span class="btech-pill">Rows: {{ sortedRows.length }}</span>
    </div>

    <div v-if="loadingPrograms || loading" class="btech-muted" style="text-align:center; padding:18px;">
      Loading CPL history...
    </div>

    <div v-else-if="loadError" class="btech-muted" style="text-align:center; padding:18px;">
      {{ loadError }}
    </div>

    <div v-else-if="!sortedRows.length" class="btech-muted" style="text-align:center; padding:18px;">
      No CPL history matched the selected program.
    </div>

    <div v-else style="display:grid; gap:12px;">
      <div
        v-for="card in metricCards"
        :key="card.key"
        class="btech-card"
        style="padding:12px; border:1px solid #e5e7eb; background:#fff;"
      >
        <div class="btech-row" style="align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap;">
          <h4 class="btech-card-title" style="margin:0;">{{ card.title }}</h4>
          <span class="btech-pill" :style="card.latestStyle">Latest: {{ pctText(latestMetricValue(card.key)) }}</span>
          <span class="btech-muted" style="font-size:.75rem;">{{ card.subtitle }}</span>
        </div>

        <svg
          v-if="card.chart.hasData"
          :viewBox="'0 0 ' + card.chart.width + ' ' + card.chart.height"
          width="100%"
          height="220"
          preserveAspectRatio="none"
          role="img"
          :aria-label="card.title + ' historic line chart'"
          style="display:block; background:linear-gradient(180deg, #ffffff 0%, #f8fafc 100%); border-radius:10px;"
        >
          <line
            v-for="tick in card.chart.yTicks"
            :key="'y-' + card.key + '-' + tick.key"
            :x1="52"
            :x2="736"
            :y1="tick.y"
            :y2="tick.y"
            stroke="#e5e7eb"
            stroke-dasharray="4 4"
          />
          <text
            v-for="tick in card.chart.yTicks"
            :key="'yl-' + card.key + '-' + tick.key"
            x="44"
            :y="tick.y + 4"
            text-anchor="end"
            fill="#6b7280"
            style="font-size:11px;"
          >{{ tick.label }}</text>

          <line
            x1="52"
            x2="736"
            :y1="card.chart.targetY"
            :y2="card.chart.targetY"
            :stroke="card.chart.stroke"
            stroke-dasharray="6 6"
            stroke-opacity=".45"
          />

          <path :d="card.chart.areaPath" :fill="card.chart.stroke" fill-opacity=".08"></path>
          <path :d="card.chart.path" fill="none" :stroke="card.chart.stroke" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"></path>

          <g v-for="point in card.chart.points" :key="card.key + '-' + point.year">
            <circle :cx="point.x" :cy="point.y" r="4.5" :fill="card.chart.stroke"></circle>
            <text
              :x="point.x"
              :y="point.y - 10"
              text-anchor="middle"
              fill="#111827"
              style="font-size:11px; font-weight:600;"
            >{{ point.label }}</text>
          </g>

          <text
            v-for="tick in card.chart.xTicks"
            :key="'x-' + card.key + '-' + tick.key"
            :x="tick.x"
            y="210"
            text-anchor="middle"
            fill="#6b7280"
            style="font-size:11px;"
          >{{ tick.label }}</text>
        </svg>
      </div>
    </div>
  </div>
  `
});
