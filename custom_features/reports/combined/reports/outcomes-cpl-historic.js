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
    campusOptions() {
      return Array.from(
        new Set(
          this.optionRows
            .map(row => String(row?.campus_code ?? '').trim())
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b));
    },

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
          cutoff: 0.6,
          latestStyle: this.completionPillStyle(this.latestMetricValue('completion'))
        },
        {
          key: 'placement',
          title: 'Placement',
          subtitle: 'Program placement rate by year',
          stroke: '#1d4ed8',
          cutoff: 0.7,
          latestStyle: this.outcomePillStyle(this.latestMetricValue('placement'))
        },
        {
          key: 'licensure',
          title: 'Licensure',
          subtitle: 'Program licensure rate by year',
          stroke: '#7c3aed',
          cutoff: 0.7,
          latestStyle: this.outcomePillStyle(this.latestMetricValue('licensure'))
        }
      ].map(card => ({
        ...card,
        chart: this.buildLineChart(card.key, card.stroke, card.cutoff)
      }));
    }
  },

  methods: {
    syncFromReportContext() {
      if (typeof window.ReportMixins.programScoped === 'function') {
        const base = window.ReportMixins.programScoped({ includeAcademicYear: false }).methods?.syncFromReportContext;
        if (typeof base === 'function') base.call(this);
      }

      const nextCampusCode = String(
        this.getSharedFilterValue('campus_code', this.selectedCampusCode) ?? ''
      ).trim();
      if (nextCampusCode !== this.selectedCampusCode) {
        this.selectedCampusCode = nextCampusCode;
      }
    },

    getRequestFilters() {
      const filters = {
        program_code: this.selectedProgramCode
      };
      const campusCode = String(this.selectedCampusCode ?? '').trim();
      if (campusCode) filters.campus_code = campusCode;
      return filters;
    },

    async loadProgramOptions(forceReloadData = false) {
      const requestId = ++this.loadProgramsRequestId;
      try {
        this.loadingPrograms = true;
        this.loadError = '';

        const rows = await this.fetchReportDataset(
          {},
          { dataset: 'program_cpl' }
        );

        this.optionRows = (Array.isArray(rows) ? rows : []).map(row => ({
          program_code: String(row?.program_code ?? '').trim(),
          program_name: String(row?.program_name ?? row?.program_code ?? '').trim(),
          campus_code: String(row?.campus_code ?? '').trim()
        }));

        const campusCode = String(this.selectedCampusCode ?? '').trim();
        const filteredOptionRows = campusCode
          ? this.optionRows.filter(row => row.campus_code === campusCode)
          : this.optionRows;

        const options = Array.from(
          new Map(
            filteredOptionRows
              .map(row => ({
                value: row.program_code,
                label: row.program_name
              }))
              .filter(option => option.value && option.label)
              .map(option => [option.value, option])
          ).values()
        ).sort((a, b) => a.label.localeCompare(b.label));

        this.programOptions = options;
        const nextProgramCode = this.resolveDeferredSelection({
          filterKey: 'program_code',
          options,
          currentValue: this.selectedProgramCode,
          routeValue: this.getProgramCode()
        });

        if (!this.filterValuesEqual(nextProgramCode, this.selectedProgramCode)) {
          this.selectedProgramCode = nextProgramCode;
          return;
        }

        const selectedOption = options.find(option => this.filterValuesEqual(option.value, nextProgramCode));
        if (selectedOption?.label) {
          this.loadedProgramName = selectedOption.label;
          this.setSharedFilterValue('program_name', selectedOption.label);
        }
        if (forceReloadData) this.loadData();
      } catch (e) {
        console.warn('Failed to load program options', e);
        this.programOptions = [];
        this.optionRows = [];
        if (!this.selectedProgramCode) {
          this.loadError = this.getProgramOptionsLoadErrorMessage();
        }
      } finally {
        if (requestId === this.loadProgramsRequestId) {
          this.loadingPrograms = false;
        }
      }
    },

    mapRows(rows) {
      return (Array.isArray(rows) ? rows : [])
        .map(row => ({
          ...row,
          academic_year: Number(row?.academic_year),
          program_name: String(row?.program_name ?? '').trim(),
          program_code: String(row?.program_code ?? '').trim(),
          campus_code: String(row?.campus_code ?? '').trim(),
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

    pointStatusColor(value, cutoff) {
      const n = Number(value);
      const threshold = Number(cutoff);
      if (!Number.isFinite(n) || !Number.isFinite(threshold)) return this.colors.gray;
      if (n < threshold) return this.colors.red;
      if (n > threshold + 0.1) return this.colors.green;
      return this.colors.yellow;
    },

    segmentStatusColor(delta) {
      const diff = Number(delta);
      if (!Number.isFinite(diff)) return this.colors.gray;
      if (diff > 0) return this.colors.green;
      if (diff <= -0.05) return this.colors.red;
      return this.colors.yellow;
    },

    buildLineChart(metric, stroke, cutoff) {
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
          segments: [],
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
        label: this.pctText(point.value),
        fill: this.pointStatusColor(point.value, cutoff)
      }));

      const path = chartPoints
        .map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
        .join(' ');
      const areaPath = chartPoints.length
        ? `${path} L${chartPoints[chartPoints.length - 1].x.toFixed(2)},${(margin.top + innerHeight).toFixed(2)} L${chartPoints[0].x.toFixed(2)},${(margin.top + innerHeight).toFixed(2)} Z`
        : '';
      const segments = chartPoints.slice(1).map((point, index) => {
        const previous = chartPoints[index];
        const delta = point.value - previous.value;
        return {
          key: `${previous.year}-${point.year}`,
          x1: previous.x,
          y1: previous.y,
          x2: point.x,
          y2: point.y,
          stroke: this.segmentStatusColor(delta)
        };
      });
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
      const targetY = yFor(cutoff);

      return {
        width,
        height,
        path,
        areaPath,
        points: chartPoints,
        segments,
        xTicks,
        yTicks,
        targetY,
        cutoff,
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
      colors: window.ReportUtils.createColors(),
      optionRows: [],
      selectedCampusCode: ''
    };
  },

  watch: {
    selectedCampusCode() {
      this.setSharedFilterValue('campus_code', this.selectedCampusCode);
      this.loadProgramOptions(true);
    }
  },

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px; display:flex; flex-direction:column; gap:12px; min-height:0; overflow:auto;">
    <div class="btech-row" style="align-items:center; gap:12px; flex-wrap:wrap;">
      <div style="display:flex; align-items:center; gap:.5rem;">
        <label class="btech-muted" style="font-size:.75rem;">Campus</label>
        <select v-model="selectedCampusCode" v-bind="filterAttrs('campus_code')" style="font-size:.75rem; min-width:120px;">
          <option value="">All campuses</option>
          <option v-for="campus in campusOptions" :key="campus" :value="campus">
            {{ campus }}
          </option>
        </select>
      </div>

      <div style="display:flex; align-items:center; gap:.5rem;">
        <label class="btech-muted" style="font-size:.75rem;">Program</label>
        <select v-model="selectedProgramCode" v-bind="filterAttrs('program_code')" style="font-size:.75rem; min-width:260px; max-width:360px;">
          <option value="">Select a program</option>
          <option v-for="option in programOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <span v-if="selectedCampusCode" class="btech-pill">Campus: {{ selectedCampusCode }}</span>
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
            stroke="#6b7280"
            stroke-dasharray="6 6"
            stroke-opacity=".45"
          />
          <text
            x="736"
            :y="card.chart.targetY - 6"
            text-anchor="end"
            fill="#6b7280"
            style="font-size:11px; font-weight:600;"
          >Cutoff: {{ pctText(card.chart.cutoff) }}</text>

          <path :d="card.chart.areaPath" :fill="card.chart.stroke" fill-opacity=".08"></path>
          <line
            v-for="segment in card.chart.segments"
            :key="'segment-' + card.key + '-' + segment.key"
            :x1="segment.x1"
            :y1="segment.y1"
            :x2="segment.x2"
            :y2="segment.y2"
            :stroke="segment.stroke"
            stroke-width="3"
            stroke-linecap="round"
          />

          <g v-for="point in card.chart.points" :key="card.key + '-' + point.year">
            <circle :cx="point.x" :cy="point.y" r="5" :fill="point.fill" stroke="#ffffff" stroke-width="1.5"></circle>
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
