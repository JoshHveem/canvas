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
          cutoff: 0.6,
          trendMonth: 5,
          trendDay: 30,
          latestStyle: this.completionPillStyle(this.latestMetricValue('completion'))
        },
        {
          key: 'placement',
          title: 'Placement',
          subtitle: 'Program placement rate by year',
          cutoff: 0.7,
          trendMonth: 8,
          trendDay: 30,
          latestStyle: this.outcomePillStyle(this.latestMetricValue('placement'))
        },
        {
          key: 'licensure',
          title: 'Licensure',
          subtitle: 'Program licensure rate by year',
          cutoff: 0.7,
          trendMonth: 5,
          trendDay: 30,
          latestStyle: this.outcomePillStyle(this.latestMetricValue('licensure'))
        }
      ].map(card => ({
        ...card,
        series: this.metricSeries(card.key),
        trendSeries: this.metricTrendSeries(card.key, card.trendMonth, card.trendDay)
      }))
        .filter(card => card.series.some(point => Number(point?.value) !== 0));
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

    metricTrendSeries(metric, month, day) {
      return this.metricSeries(metric)
        .filter(point => this.isTrendYearEligible(point.year, month, day));
    },

    isTrendYearEligible(academicYear, month, day) {
      const year = Number(academicYear);
      if (!Number.isFinite(year)) return false;

      const now = new Date();
      const cutoffDate = new Date(year + 1, Number(month), Number(day), 23, 59, 59, 999);
      return now.getTime() >= cutoffDate.getTime();
    },

    buildTrendLine(trendSeries) {
      const points = Array.isArray(trendSeries) ? trendSeries : [];
      if (points.length < 2) return null;

      const n = points.length;
      const sumX = points.reduce((sum, point) => sum + Number(point.year), 0);
      const sumY = points.reduce((sum, point) => sum + Number(point.value), 0);
      const sumXY = points.reduce((sum, point) => sum + (Number(point.year) * Number(point.value)), 0);
      const sumXX = points.reduce((sum, point) => sum + (Number(point.year) * Number(point.year)), 0);
      const denominator = (n * sumXX) - (sumX * sumX);

      if (!Number.isFinite(denominator) || denominator === 0) return null;

      const slope = ((n * sumXY) - (sumX * sumY)) / denominator;
      const intercept = (sumY - (slope * sumX)) / n;
      return {
        slope,
        intercept,
        throughYear: Number(points[points.length - 1].year)
      };
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

    renderCharts() {
      if (!window.d3 || !this.$el) return;

      const cardsByKey = new Map(this.metricCards.map(card => [card.key, card]));
      const chartEls = Array.from(this.$el.querySelectorAll('[data-cpl-chart-key]'));
      chartEls.forEach(el => {
        const key = String(el.getAttribute('data-cpl-chart-key') || '').trim();
        const card = cardsByKey.get(key);
        this.renderSingleChart(el, card);
      });
    },

    renderSingleChart(container, card) {
      if (!container || !card || !window.d3) return;

      const d3 = window.d3;
      const series = Array.isArray(card.series) ? card.series : [];
      const width = Math.max(container.clientWidth || 760, 320);
      const height = 220;
      const margin = { top: 18, right: 24, bottom: 36, left: 52 };
      const innerWidth = Math.max(width - margin.left - margin.right, 40);
      const innerHeight = Math.max(height - margin.top - margin.bottom, 40);

      const svg = d3.select(container);
      svg.selectAll('*').remove();

      svg
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('width', '100%')
        .attr('height', height)
        .attr('preserveAspectRatio', 'none')
        .style('display', 'block')
        .style('background', 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)')
        .style('border-radius', '10px');

      if (!series.length) return;

      const years = series.map(point => Number(point.year)).filter(Number.isFinite);
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      const xDomain = minYear === maxYear ? [minYear - 1, maxYear + 1] : [minYear, maxYear];

      const xScale = d3.scaleLinear()
        .domain(xDomain)
        .range([margin.left, margin.left + innerWidth]);

      const yScale = d3.scaleLinear()
        .domain([0, 1])
        .range([margin.top + innerHeight, margin.top]);

      const g = svg.append('g');

      g.selectAll('.grid-line')
        .data([0, 0.25, 0.5, 0.75, 1])
        .enter()
        .append('line')
        .attr('x1', margin.left)
        .attr('x2', margin.left + innerWidth)
        .attr('y1', value => yScale(value))
        .attr('y2', value => yScale(value))
        .attr('stroke', '#e5e7eb')
        .attr('stroke-dasharray', '4 4');

      g.selectAll('.grid-label')
        .data([0, 0.25, 0.5, 0.75, 1])
        .enter()
        .append('text')
        .attr('x', margin.left - 8)
        .attr('y', value => yScale(value) + 4)
        .attr('text-anchor', 'end')
        .attr('fill', '#6b7280')
        .style('font-size', '11px')
        .text(value => this.pctText(value));

      const cutoffY = yScale(card.cutoff);
      g.append('line')
        .attr('x1', margin.left)
        .attr('x2', margin.left + innerWidth)
        .attr('y1', cutoffY)
        .attr('y2', cutoffY)
        .attr('stroke', '#6b7280')
        .attr('stroke-dasharray', '6 6')
        .attr('stroke-opacity', 0.45);

      g.append('text')
        .attr('x', margin.left + innerWidth)
        .attr('y', cutoffY - 6)
        .attr('text-anchor', 'end')
        .attr('fill', '#6b7280')
        .style('font-size', '11px')
        .style('font-weight', 600)
        .text(`Cutoff: ${this.pctText(card.cutoff)}`);

      const area = d3.area()
        .x(point => xScale(point.year))
        .y0(margin.top + innerHeight)
        .y1(point => yScale(point.value));

      g.append('path')
        .datum(series)
        .attr('d', area)
        .attr('fill', card.key === 'completion' ? '#0f766e' : (card.key === 'placement' ? '#1d4ed8' : '#7c3aed'))
        .attr('fill-opacity', 0.08);

      const segments = series.slice(1).map((point, index) => ({
        start: series[index],
        end: point,
        delta: Number(point.value) - Number(series[index].value)
      }));

      const trendLine = this.buildTrendLine(card.trendSeries);

      g.selectAll('.segment')
        .data(segments)
        .enter()
        .append('line')
        .attr('x1', segment => xScale(segment.start.year))
        .attr('y1', segment => yScale(segment.start.value))
        .attr('x2', segment => xScale(segment.end.year))
        .attr('y2', segment => yScale(segment.end.value))
        .attr('stroke', segment => this.segmentStatusColor(segment.delta))
        .attr('stroke-width', 3)
        .attr('stroke-linecap', 'round');

      if (trendLine) {
        const visibleStartYear = Number(series[0]?.year);
        const visibleEndYear = Number(series[series.length - 1]?.year);
        const startValue = trendLine.intercept + (trendLine.slope * visibleStartYear);
        const endValue = trendLine.intercept + (trendLine.slope * visibleEndYear);

        g.append('line')
          .attr('x1', xScale(visibleStartYear))
          .attr('y1', yScale(Math.max(0, Math.min(1, startValue))))
          .attr('x2', xScale(visibleEndYear))
          .attr('y2', yScale(Math.max(0, Math.min(1, endValue))))
          .attr('stroke', '#111827')
          .attr('stroke-width', 2)
          .attr('stroke-dasharray', '10 6')
          .attr('stroke-opacity', 0.85);

        g.append('text')
          .attr('x', margin.left + innerWidth)
          .attr('y', margin.top + 10)
          .attr('text-anchor', 'end')
          .attr('fill', '#111827')
          .style('font-size', '11px')
          .style('font-weight', 600)
          .text(`Trend based on data through ${trendLine.throughYear}`);
      }

      const pointGroups = g.selectAll('.point-group')
        .data(series)
        .enter()
        .append('g');

      pointGroups.append('circle')
        .attr('cx', point => xScale(point.year))
        .attr('cy', point => yScale(point.value))
        .attr('r', 5)
        .attr('fill', point => this.pointStatusColor(point.value, card.cutoff))
        .attr('stroke', '#ffffff')
        .attr('stroke-width', 1.5);

      pointGroups.append('text')
        .attr('x', point => xScale(point.year))
        .attr('y', point => yScale(point.value) - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#111827')
        .style('font-size', '11px')
        .style('font-weight', 600)
        .text(point => this.pctText(point.value));

      g.selectAll('.x-label')
        .data(series)
        .enter()
        .append('text')
        .attr('x', point => xScale(point.year))
        .attr('y', height - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', '#6b7280')
        .style('font-size', '11px')
        .text(point => String(point.year));
    },

    scheduleRender() {
      this.$nextTick(() => this.renderCharts());
    },

    handleResize() {
      this.renderCharts();
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

  mounted() {
    this._handleResize = () => this.handleResize();
    window.addEventListener('resize', this._handleResize);
    this.scheduleRender();
  },

  beforeDestroy() {
    window.removeEventListener('resize', this._handleResize);
  },

  watch: {
    selectedCampusCode() {
      this.setSharedFilterValue('campus_code', this.selectedCampusCode);
      this.loadProgramOptions(true);
    },
    rows: {
      deep: true,
      handler() {
        this.scheduleRender();
      }
    },
    metricCards: {
      deep: true,
      handler() {
        this.scheduleRender();
      }
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
          v-if="card.series.length"
          :data-cpl-chart-key="card.key"
          role="img"
          :aria-label="card.title + ' historic line chart'"
          style="display:block; width:100%; height:220px;"
        ></svg>
      </div>
    </div>
  </div>
  `
});
