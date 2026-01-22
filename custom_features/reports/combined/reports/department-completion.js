Vue.component('reports-department-completion', {
  template: `
    <div>
      <department-cpl
        v-for="campus in cpl"
        :key="campus?.div_code || campus?.dept || campus?.id || JSON.stringify(campus)"
        :cpl="campus"
        :year="year"
      />

      <div class="completion-chart">
        <div class="chart-header">
          <h3>Credits Remaining (Distribution)</h3>
          <div class="chart-sub">
            {{ totalStudents }} students • Median {{ medianCredits }} • Avg {{ avgCredits }}
          </div>
        </div>

        <div ref="chartWrap" class="chart-wrap">
          <svg ref="chartSvg"></svg>
          <div ref="tooltip" class="chart-tooltip" style="opacity:0;"></div>
        </div>
      </div>
    </div>
  `,
  props: {
    year: { type: [Number, String], required: true },
    statistics: { type: Object, required: true },
    cpl: { type: [Object, Array], required: true },

    // FIX: spelling + casing
    creditsRemaining: { type: Array, required: true }
  },
  data() {
    return {
      loading: false,
      resizeObserver: null
    };
  },
  computed: {
    creditsValues() {
      // Defensive: coerce to finite numbers and drop junk
      return (this.creditsRemaining || [])
        .map(d => Number(d?.credits_remaining))
        .filter(n => Number.isFinite(n) && n >= 0);
    },
    totalStudents() {
      return this.creditsValues.length;
    },
    avgCredits() {
      const v = this.creditsValues;
      if (!v.length) return 0;
      const sum = v.reduce((a, b) => a + b, 0);
      return Math.round((sum / v.length) * 10) / 10;
    },
    medianCredits() {
      const v = [...this.creditsValues].sort((a, b) => a - b);
      if (!v.length) return 0;
      const mid = Math.floor(v.length / 2);
      return v.length % 2 ? v[mid] : Math.round(((v[mid - 1] + v[mid]) / 2) * 10) / 10;
    }
  },
  mounted() {
    // Render once, then keep responsive
    this.renderCreditsHistogram();

    // Re-render on resize of the chart container (more reliable than window resize)
    const wrap = this.$refs.chartWrap;
    if (wrap && window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => {
        this.renderCreditsHistogram();
      });
      this.resizeObserver.observe(wrap);
    } else {
      window.addEventListener('resize', this.renderCreditsHistogram);
    }
  },
  beforeDestroy() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    window.removeEventListener('resize', this.renderCreditsHistogram);
  },
  watch: {
    creditsRemaining: {
      deep: true,
      handler() {
        this.renderCreditsHistogram();
      }
    }
  },
  methods: {
    renderCreditsHistogram() {
      const values = this.creditsValues;

      const svgEl = this.$refs.chartSvg;
      const wrapEl = this.$refs.chartWrap;
      const tipEl = this.$refs.tooltip;
      if (!svgEl || !wrapEl) return;

      // Clear previous render
      const svg = d3.select(svgEl);
      svg.selectAll("*").remove();

      const width = wrapEl.clientWidth || 800;
      const height = 320;

      const margin = { top: 20, right: 20, bottom: 48, left: 52 };
      const innerW = Math.max(200, width - margin.left - margin.right);
      const innerH = Math.max(120, height - margin.top - margin.bottom);

      svg
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", `0 0 ${width} ${height}`);

      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      if (!values.length) {
        g.append("text")
          .attr("x", 0)
          .attr("y", 20)
          .text("No credits remaining data to display.");
        return;
      }

      const maxVal = d3.max(values);

      // Choose a nice bin size. For credits, 5-credit bins read well.
      const binSize = 5;
      const domainMax = Math.ceil(maxVal / binSize) * binSize;

      const x = d3.scaleLinear()
        .domain([0, domainMax])
        .range([0, innerW]);

      const bins = d3.bin()
        .domain(x.domain())
        .thresholds(d3.range(0, domainMax + binSize, binSize))(values);

      const y = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length) || 1])
        .nice()
        .range([innerH, 0]);

      // Axes
      g.append("g")
        .attr("transform", `translate(0,${innerH})`)
        .call(d3.axisBottom(x).ticks(Math.min(10, domainMax / binSize)))
        .call(ax => ax.selectAll("text").style("font-size", "12px"));

      g.append("g")
        .call(d3.axisLeft(y).ticks(5))
        .call(ax => ax.selectAll("text").style("font-size", "12px"));

      // Axis labels
      g.append("text")
        .attr("x", innerW / 2)
        .attr("y", innerH + 40)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Credits remaining");

      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerH / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Students");

      // Gridlines (light)
      g.append("g")
        .attr("class", "y-grid")
        .call(
          d3.axisLeft(y)
            .ticks(5)
            .tickSize(-innerW)
            .tickFormat("")
        )
        .call(grid => {
          grid.selectAll("line").attr("stroke", "currentColor").attr("opacity", 0.08);
          grid.selectAll("path").attr("opacity", 0);
        });

      // Bars
      const bar = g.selectAll(".bar")
        .data(bins)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.x0) + 1)
        .attr("y", d => y(d.length))
        .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 2))
        .attr("height", d => innerH - y(d.length))
        .attr("rx", 4);

      // Tooltip
      const tip = d3.select(tipEl);

      const showTip = (event, d) => {
        const [mx, my] = d3.pointer(event, wrapEl);
        tip
          .style("opacity", 1)
          .style("left", `${mx + 10}px`)
          .style("top", `${my + 10}px`)
          .html(`
            <div style="font-weight:600;">${d.x0}–${d.x1} credits</div>
            <div>${d.length} student${d.length === 1 ? "" : "s"}</div>
          `);
      };

      const hideTip = () => {
        tip.style("opacity", 0);
      };

      bar
        .on("mousemove", (event, d) => showTip(event, d))
        .on("mouseenter", (event, d) => showTip(event, d))
        .on("mouseleave", hideTip);
    }
  }
});
