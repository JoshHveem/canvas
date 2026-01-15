(function () {
  const RA = (window.ReportAutomations = window.ReportAutomations || {});
  RA.charts = RA.charts || {};

  function dayKey(tsMs) {
    const d = new Date(tsMs);
    // local day bucket; if you want UTC day buckets, use getUTC*
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${dd}`;
  }
  function hasAnyFlags(run) {
    const f = run?.flags;
    if (!f) return false;
    if (Array.isArray(f)) return f.length > 0;
    if (typeof f === "object") return Object.keys(f).length > 0;
    return Boolean(f); // last-resort
  }


  RA.charts.renderRuns30 = function renderRuns30(container, row, colors, U) {
    if (!window.d3) return;

    // Clear previous render
    container.innerHTML = "";

    const runs = Array.isArray(row?._runs_sorted) ? row._runs_sorted : (Array.isArray(row?.runs) ? row.runs : []);
    const now = Date.now();
    const start = now - 30 * 24 * 60 * 60 * 1000;

    // Prebuild day bins for last 30 days (so empty days still show)
    const bins = [];
    const byDay = new Map();
    for (let i = 29; i >= 0; i--) {
      const t = now - i * 24 * 60 * 60 * 1000;
      const k = dayKey(t);
      const obj = { day: k, success: 0, flagged_success: 0, fail: 0, total: 0 };

      bins.push(obj);
      byDay.set(k, obj);
    }

    // Fill counts
    for (const r of runs) {
      const t = U.parseTs(r?.run_time);
      if (!Number.isFinite(t) || t < start) continue;

      const k = dayKey(t);
      const b = byDay.get(k);
      if (!b) continue;

      const s = r?.success;
      const ok = (s === true || s === "true" || s === 1 || s === "1");
      const bad = (s === false || s === "false" || s === 0 || s === "0");

      if (ok) {
        if (hasAnyFlags(r)) b.flagged_success += 1;
        else b.success += 1;
      } else if (bad) {
        b.fail += 1;
      }

      b.total = b.success + b.flagged_success + b.fail;
    }
 

    const data = bins;
    const maxY = Math.max(1, ...data.map(d => d.total));

    // Dimensions
    const width = Math.max(260, container.clientWidth || 260);
    const height = 36;
    const margin = { top: 4, right: 6, bottom: 10, left: 6 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;

    const svg = d3.select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height);

    const g = svg.append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
      .domain(data.map(d => d.day))
      .range([0, innerW])
      .padding(0.1);

    const y = d3.scaleLinear()
      .domain([0, maxY])
      .range([innerH, 0]);

    // stacked bars: success bottom, fail on top (or swap)
    const bar = g.selectAll("g.bar")
      .data(data)
      .enter()
      .append("g")
      .attr("class", "bar")
      .attr("transform", d => `translate(${x(d.day)},0)`);

    // clean success portion (green)
    bar.append("rect")
      .attr("x", 0)
      .attr("y", d => y(d.success))
      .attr("width", x.bandwidth())
      .attr("height", d => innerH - y(d.success))
      .attr("fill", colors.green);

    // flagged success portion stacked above clean success (yellow)
    bar.append("rect")
      .attr("x", 0)
      .attr("y", d => y(d.success + d.flagged_success))
      .attr("width", x.bandwidth())
      .attr("height", d => y(d.success) - y(d.success + d.flagged_success))
      .attr("fill", colors.yellow);

    // fail portion stacked above successes (red)
    bar.append("rect")
      .attr("x", 0)
      .attr("y", d => y(d.success + d.flagged_success + d.fail))
      .attr("width", x.bandwidth())
      .attr("height", d => y(d.success + d.flagged_success) - y(d.success + d.flagged_success + d.fail))
      .attr("fill", colors.red);


    // tooltip (simple title)
    bar.append("title")
      .text(d => `${d.day}: ${d.success} clean, ${d.flagged_success} flagged, ${d.fail} fail`);


    // optional mini x-axis ticks (every ~7 days)
    const ticks = data.filter((_, i) => i % 7 === 0).map(d => d.day);
    g.selectAll("text.tick")
      .data(ticks)
      .enter()
      .append("text")
      .attr("class", "tick")
      .attr("x", d => x(d) + x.bandwidth() / 2)
      .attr("y", innerH + 9)
      .attr("text-anchor", "middle")
      .attr("font-size", 8)
      .attr("fill", "#666")
      .text(d => d.slice(5)); // MM-DD
  };
})();
