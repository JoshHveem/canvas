Vue.component('reports-department-completion', {
  template: `
    <div>
      <department-cpl
        v-for="campus in cpl"
        :key="campus?.div_code || campus?.dept || campus?.id || JSON.stringify(campus)"
        :cpl="campus"
        :year="year"
      />

      <div ref="chartCard">
        <div ref="chartHeader">
          <div style="font-weight:700; font-size:16px; margin-bottom:4px;">
            Predicted Completions by Month
          </div>
          <div style="font-size:12px; opacity:0.8; margin-bottom:10px;">
            Assumption: 1 credit ≈ 2 weeks • {{ totalStudents }} students tracked
          </div>
        </div>

        <div ref="chartWrap">
          <svg ref="chartSvg"></svg>
          <div ref="tooltip" style="opacity:0;"></div>
        </div>
      </div>
    </div>
  `,
  props: {
    year: { type: [Number, String], required: true },
    statistics: { type: Object, required: true },
    cpl: { type: [Object, Array], required: true },
    creditsRemaining: { type: Array, required: true }
  },
  data() {
    return {
      resizeObserver: null,

      // tweakable controls
      monthsAhead: 12,        // show 12 months out
      weeksPerCredit: 2       // 1 credit ≈ 2 weeks
    };
  },
  computed: {
    creditsRows() {
      return (this.creditsRemaining || [])
        .map(d => ({
          sis_user_id: d?.sis_user_id,
          credits_remaining: Number(d?.credits_remaining),
          end_date: d?.end_date ? new Date(d.end_date) : null
        }))
        .filter(d => Number.isFinite(d.credits_remaining) && d.credits_remaining >= 0);
    },
    totalStudents() {
      return this.creditsRows.length;
    }
  },
  mounted() {
    this.applyInlineCardStyles();
    this.renderMonthlyForecast();

    const wrap = this.$refs.chartWrap;
    if (wrap && window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.renderMonthlyForecast());
      this.resizeObserver.observe(wrap);
    } else {
      window.addEventListener("resize", this.renderMonthlyForecast);
    }
  },
  beforeDestroy() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    window.removeEventListener("resize", this.renderMonthlyForecast);
  },
  watch: {
    creditsRemaining: {
      deep: true,
      handler() {
        this.renderMonthlyForecast();
      }
    }
  },
  methods: {
    applyInlineCardStyles() {
      // “Card” container
      const card = this.$refs.chartCard;
      if (card) {
        card.style.marginTop = "16px";
        card.style.padding = "12px 12px 10px 12px";
        card.style.border = "1px solid rgba(0,0,0,0.12)";
        card.style.borderRadius = "12px";
        card.style.background = "rgba(255,255,255,0.9)";
      }

      // Wrap
      const wrap = this.$refs.chartWrap;
      if (wrap) {
        wrap.style.position = "relative";
        wrap.style.width = "100%";
      }

      // Tooltip
      const tip = this.$refs.tooltip;
      if (tip) {
        tip.style.position = "absolute";
        tip.style.pointerEvents = "none";
        tip.style.padding = "8px 10px";
        tip.style.borderRadius = "10px";
        tip.style.background = "rgba(20, 20, 20, 0.92)";
        tip.style.color = "white";
        tip.style.fontSize = "12px";
        tip.style.lineHeight = "1.2";
        tip.style.boxShadow = "0 6px 18px rgba(0,0,0,0.22)";
        tip.style.transform = "translateZ(0)";
      }
    },

    // ---------- Forecast data ----------
    startOfMonth(d) {
      return new Date(d.getFullYear(), d.getMonth(), 1);
    },
    addMonths(d, n) {
      return new Date(d.getFullYear(), d.getMonth() + n, 1);
    },
    monthDiff(a, b) {
      // how many whole months from a to b (based on year/month only)
      return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
    },
    predictedFinishDate(row, now) {
      // Simple model: credits_remaining * weeksPerCredit
      const weeks = row.credits_remaining * this.weeksPerCredit;
      const days = Math.round(weeks * 7);

      // If you want to cap to end_date (optional), you could choose min(predicted, end_date)
      // but for now we’ll purely use credits_remaining pacing:
      const pred = new Date(now);
      pred.setDate(pred.getDate() + days);
      return pred;
    },

    // ---------- D3 render ----------
    renderMonthlyForecast() {
      const svgEl = this.$refs.chartSvg;
      const wrapEl = this.$refs.chartWrap;
      const tipEl = this.$refs.tooltip;
      if (!svgEl || !wrapEl) return;

      // Clear
      const svg = d3.select(svgEl);
      svg.selectAll("*").remove();

      const width = wrapEl.clientWidth || 800;
      const height = 340;

      // Inline SVG styles
      svg
        .attr("width", width)
        .attr("height", height)
        .style("display", "block");

      const margin = { top: 18, right: 16, bottom: 64, left: 52 };
      const innerW = Math.max(260, width - margin.left - margin.right);
      const innerH = Math.max(150, height - margin.top - margin.bottom);

      const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

      const now = new Date();
      const baseMonth = this.startOfMonth(now);

      // Build buckets for monthsAhead
      const buckets = Array.from({ length: this.monthsAhead + 1 }, (_, i) => {
        const m = this.addMonths(baseMonth, i);
        return {
          i,
          monthStart: m,
          label: d3.timeFormat("%b %Y")(m),
          count: 0
        };
      });

      // Assign each student to a month bucket
      for (const row of this.creditsRows) {
        const pred = this.predictedFinishDate(row, now);
        const idx = this.monthDiff(baseMonth, this.startOfMonth(pred));

        if (idx < 0) continue; // already “done”
        if (idx > this.monthsAhead) continue; // outside window
        buckets[idx].count += 1;
      }

      const maxCount = d3.max(buckets, d => d.count) || 1;

      // Scales
      const x = d3.scaleBand()
        .domain(buckets.map(d => d.label))
        .range([0, innerW])
        .padding(0.18);

      const y = d3.scaleLinear()
        .domain([0, maxCount])
        .nice()
        .range([innerH, 0]);

      // Gridlines
      g.append("g")
        .call(d3.axisLeft(y).ticks(5).tickSize(-innerW).tickFormat(""))
        .call(grid => {
          grid.selectAll("line").attr("stroke", "currentColor").attr("opacity", 0.10);
          grid.selectAll("path").attr("opacity", 0);
        });

      // Axes
      g.append("g")
        .call(d3.axisLeft(y).ticks(5))
        .call(ax => ax.selectAll("text").style("font-size", "12px"))
        .call(ax => ax.selectAll("path, line").attr("stroke", "currentColor").attr("opacity", 0.35));

      const xAxis = g.append("g")
        .attr("transform", `translate(0,${innerH})`)
        .call(d3.axisBottom(x));

      // Rotate x labels so 13 months fits
      xAxis.selectAll("text")
        .style("font-size", "11px")
        .attr("text-anchor", "end")
        .attr("transform", "rotate(-35)")
        .attr("dx", "-0.5em")
        .attr("dy", "0.2em");

      xAxis.selectAll("path, line")
        .attr("stroke", "currentColor")
        .attr("opacity", 0.35);

      // Y label
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerH / 2)
        .attr("y", -40)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .text("Predicted completers");

      // Bars
      const bars = g.selectAll("rect.bar")
        .data(buckets)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.label))
        .attr("y", d => y(d.count))
        .attr("width", x.bandwidth())
        .attr("height", d => innerH - y(d.count))
        .attr("rx", 8)
        .attr("fill", "currentColor")
        .attr("opacity", 0.85);

      // Optional: count labels on bars when there’s room
      g.selectAll("text.bar-label")
        .data(buckets)
        .enter()
        .append("text")
        .attr("class", "bar-label")
        .attr("x", d => x(d.label) + x.bandwidth() / 2)
        .attr("y", d => y(d.count) - 6)
        .attr("text-anchor", "middle")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .style("opacity", d => d.count === 0 ? 0 : 0.85)
        .text(d => d.count);

      // Tooltip
      const tip = d3.select(tipEl);

      const showTip = (event, d) => {
        const [mx, my] = d3.pointer(event, wrapEl);
        tip
          .style("opacity", 1)
          .style("left", `${mx + 10}px`)
          .style("top", `${my + 10}px`)
          .html(`
            <div style="font-weight:700; margin-bottom:2px;">${d.label}</div>
            <div>${d.count} predicted completion${d.count === 1 ? "" : "s"}</div>
            <div style="opacity:0.85; margin-top:4px;">Assumes 1 credit ≈ ${this.weeksPerCredit} weeks</div>
          `);
      };

      const hideTip = () => tip.style("opacity", 0);

      bars
        .on("mouseenter", (event, d) => showTip(event, d))
        .on("mousemove", (event, d) => showTip(event, d))
        .on("mouseleave", hideTip);
    }
  }
});
