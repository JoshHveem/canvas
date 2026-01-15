// reports/automations/report.js
(async function () {
  /********************************************************************
   * Minimal deps + helpers
   ********************************************************************/
  const API_BASE = "https://reports.bridgetools.dev";
  const API_URL = `${API_BASE}/api/automations`; // supports ?runs_limit=...

  function msToPretty(ms) {
    const n = Number(ms);
    if (!Number.isFinite(n) || n < 0) return "n/a";
    if (n < 1000) return `${Math.round(n)} ms`;
    const s = n / 1000;
    if (s < 60) return `${s.toFixed(1)} s`;
    const m = s / 60;
    if (m < 60) return `${m.toFixed(1)} min`;
    const h = m / 60;
    return `${h.toFixed(1)} hr`;
  }

  function parseTs(v) {
    const t = Date.parse(v || "");
    return Number.isFinite(t) ? t : NaN;
  }

  function fmtDateTime(v) {
    const t = parseTs(v);
    if (!Number.isFinite(t)) return "n/a";
    const d = new Date(t);
    return d.toLocaleString();
  }

  function daysAgo(v) {
    const t = parseTs(v);
    if (!Number.isFinite(t)) return NaN;
    return (Date.now() - t) / (1000 * 60 * 60 * 24);
  }

  function safeStr(v) {
    return (v === null || v === undefined) ? "" : String(v);
  }

  async function httpGetJson(url) {
    // Prefer bridgetools.req if it exists (matches your existing ecosystem)
    if (window.bridgetools?.req) {
      const resp = await window.bridgetools.req(url);
      // bridgetools.req usually returns the json directly or {data: ...}
      return resp?.data ?? resp;
    }

    const resp = await fetch(url, { credentials: "include" });
    if (!resp.ok) throw new Error(`GET failed: ${resp.status}`);
    return await resp.json();
  }

  /********************************************************************
   * ReportColumn + ReportTable (tiny subset)
   * - If you already have these globally, we’ll reuse them.
   ********************************************************************/
  class ReportColumn {
    constructor(
      name, description, width, average, sort_type,
      getContent = (row) => row?.name ?? "",
      style_formula = null,
      sort_val_func = null,
      get_tooltip_func = null
    ) {
      this.name = name;
      this.description = description;
      this.width = width;
      this.average = average;
      this.sort_type = sort_type;
      this.sort_state = 0;
      this.visible = true;

      this.getContent = getContent;
      this.style_formula = style_formula;
      this.sort_val_func = sort_val_func;
      this.get_tooltip_func = get_tooltip_func ?? getContent;
    }

    get_style(row) {
      return this.style_formula ? this.style_formula(row) : {};
    }

    getTooltip(row) {
      if (typeof this.get_tooltip_func === "function") {
        const t = this.get_tooltip_func(row);
        return (t === null || t === undefined) ? "" : String(t);
      }
      return this.description ? String(this.description) : "";
    }

    getSortValue(row) {
      if (typeof this.sort_val_func === "function") return this.sort_val_func(row);

      const raw = this.getContent(row);
      if (this.sort_type === "number") {
        const n = Number(String(raw ?? "").replace("%", "").trim());
        return Number.isFinite(n) ? n : NaN;
      }
      return ("" + (raw ?? "")).toUpperCase();
    }
  }

  class ReportTable {
    constructor({ rows = [], columns = [], sort_column = null, sort_dir = 1, colors = null } = {}) {
      this.rows = rows;
      this.columns = columns;
      this.sort_column = sort_column || (columns[0]?.name ?? "");
      this.sort_dir = sort_dir;

      this.colors = colors || {
        red: "#b20b0f", orange: "#f59e0b", yellow: "#eab308",
        green: "#16a34a", gray: "#e5e7eb", black: "#111827", white: "#fff"
      };
    }

    setRows(rows) { this.rows = rows || []; }
    setColumns(columns) {
      this.columns = columns || [];
      if (!this.sort_column && this.columns[0]) this.sort_column = this.columns[0].name;
    }
    getVisibleColumns() { return (this.columns || []).filter(c => c.visible); }
    getColumnsWidthsString() { return this.getVisibleColumns().map(c => c.width).join(" "); }

    setSortColumn(name) {
      if (this.sort_column === name) this.sort_dir *= -1;
      else { this.sort_column = name; this.sort_dir = 1; }
      (this.columns || []).forEach(c => c.sort_state = (c.name === name ? this.sort_dir : 0));
    }

    sortRows(rows) {
      const col = (this.columns || []).find(c => c.name === this.sort_column);
      const sortType = col ? col.sort_type : "string";
      const dir = this.sort_dir || 1;

      const toStringKey = v => ("" + (v ?? "")).toUpperCase();

      return (rows || []).slice().sort((a, b) => {
        let av = col?.getSortValue ? col.getSortValue(a) : undefined;
        let bv = col?.getSortValue ? col.getSortValue(b) : undefined;

        if (sortType === "string") {
          av = toStringKey(av);
          bv = toStringKey(bv);
        } else {
          av = Number(av);
          bv = Number(bv);
        }

        const aNaN = Number.isNaN(av);
        const bNaN = Number.isNaN(bv);

        let comp;
        if (aNaN && bNaN) comp = 0;
        else if (aNaN) comp = 1;
        else if (bNaN) comp = -1;
        else comp = av > bv ? 1 : (av < bv ? -1 : 0);

        return comp * dir;
      });
    }

    getSortedRows() { return this.sortRows(this.rows); }
  }

  // Reuse global if present
  window.ReportColumn = window.ReportColumn || ReportColumn;
  window.ReportTable = window.ReportTable || ReportTable;

  /********************************************************************
   * Metric computation (client-side, from runs[])
   ********************************************************************/
  function computeAutomationMetrics(a) {
    const runs = Array.isArray(a?.runs) ? a.runs.slice() : [];

    // newest first
    runs.sort((x, y) => parseTs(y?.run_time) - parseTs(x?.run_time));

    const lastRun = runs[0] || null;
    const lastRunTime = lastRun?.run_time ?? null;
    const lastSuccess = runs.find(r => r && r.success === true) || null;
    const lastSuccessTime = lastSuccess?.run_time ?? null;

    // consecutive failures since last success (starting from most recent)
    let failsSinceSuccess = 0;
    for (const r of runs) {
      if (!r) continue;
      if (r.success === true) break;
      if (r.success === false) failsSinceSuccess += 1;
    }

    // success rate in window
    const total = runs.length;
    const successes = runs.filter(r => r?.success === true).length;
    const successRate = total ? (successes / total) : NaN;

    // avg duration (on successful runs OR all runs? choose all runs with numeric duration)
    const durations = runs
      .map(r => Number(r?.duration_ms))
      .filter(n => Number.isFinite(n) && n >= 0);
    const avgDuration = durations.length
      ? (durations.reduce((s, n) => s + n, 0) / durations.length)
      : NaN;

    // “staleness” / how long since last run
    const daysSinceLast = lastRunTime ? daysAgo(lastRunTime) : NaN;

    // status band
    // - Red: last run failed OR 7+ days since last run OR 3+ consecutive failures
    // - Yellow: 3-7 days since last run OR 1-2 failures since success
    // - Green: last run success AND recent
    let status = "Unknown";
    if (!lastRun) status = "No Runs";
    else if (lastRun.success === false || failsSinceSuccess >= 3 || (Number.isFinite(daysSinceLast) && daysSinceLast >= 7)) status = "Needs Attention";
    else if (failsSinceSuccess >= 1 || (Number.isFinite(daysSinceLast) && daysSinceLast >= 3)) status = "Watch";
    else status = "Healthy";

    return {
      ...a,
      _runs_sorted: runs,
      _metrics: {
        total_runs: total,
        successes,
        success_rate: successRate,
        avg_duration_ms: avgDuration,
        last_run_time: lastRunTime,
        last_run_success: lastRun ? Boolean(lastRun.success) : null,
        last_success_time: lastSuccessTime,
        fails_since_success: failsSinceSuccess,
        days_since_last_run: daysSinceLast,
        status,
      }
    };
  }

  /********************************************************************
   * Vue component: Automations table
   ********************************************************************/
  Vue.component("reports-automations", {
    props: {
      // optional if you want to pass a limit from a parent shell
      runsLimit: { type: [Number, String], required: false, default: 100 },
    },

    data() {
      const colors = (window.bridgetools?.colors) || {
        red: "#b20b0f", orange: "#f59e0b", yellow: "#eab308",
        green: "#16a34a", gray: "#e5e7eb", black: "#111827", white: "#fff"
      };

      const table = new window.ReportTable({
        rows: [],
        columns: [],
        sort_column: "Status",
        sort_dir: 1,
        colors
      });

      return {
        colors,
        table,
        tableTick: 0,

        loading: false,
        error: "",
        rows: [],

        filters: {
          q: "",
          owner: "",
          status: "All",
          hideHealthy: false,
        },
      };
    },

    async created() {
      this.table.setColumns([
        new window.ReportColumn(
          "Status",
          "Health status computed from recent runs.",
          "10rem",
          false,
          "string",
          r => safeStr(r?._metrics?.status),
          r => this.statusStyle(r?._metrics?.status),
          r => safeStr(r?._metrics?.status)
        ),

        new window.ReportColumn(
          "Automation",
          "Name (automation_id)",
          "18rem",
          false,
          "string",
          r => `${safeStr(r?.name)} <span class="btech-muted">(#${safeStr(r?.automation_id)})</span>`,
          null,
          r => safeStr(r?.name)
        ),

        new window.ReportColumn(
          "Owner",
          "Owner name/email",
          "16rem",
          false,
          "string",
          r => {
            const nm = safeStr(r?.owner_name);
            const em = safeStr(r?.owner_email);
            return em ? `${nm}<br><span class="btech-muted">${em}</span>` : nm;
          },
          null,
          r => `${safeStr(r?.owner_name)} ${safeStr(r?.owner_email)}`
        ),

        new window.ReportColumn(
          "Last Run",
          "Most recent run time + success/fail",
          "14rem",
          false,
          "number",
          r => {
            const t = r?._metrics?.last_run_time;
            const ok = r?._metrics?.last_run_success;
            if (!t) return "n/a";
            const label = ok === true ? "success" : (ok === false ? "FAIL" : "n/a");
            return `${fmtDateTime(t)}<br><span class="btech-muted">${label}</span>`;
          },
          r => this.lastRunStyle(r),
          r => parseTs(r?._metrics?.last_run_time)
        ),

        new window.ReportColumn(
          "Days Since",
          "Days since last run",
          "7rem",
          false,
          "number",
          r => {
            const d = r?._metrics?.days_since_last_run;
            return Number.isFinite(d) ? d.toFixed(1) : "n/a";
          },
          r => this.daysSinceStyle(r?._metrics?.days_since_last_run),
          r => Number(r?._metrics?.days_since_last_run)
        ),

        new window.ReportColumn(
          "Fail Streak",
          "Consecutive failures since last success",
          "8rem",
          false,
          "number",
          r => Number(r?._metrics?.fails_since_success ?? 0),
          r => this.failStreakStyle(r?._metrics?.fails_since_success),
          r => Number(r?._metrics?.fails_since_success ?? 0)
        ),

        new window.ReportColumn(
          "Runs",
          "Total runs in window",
          "5rem",
          false,
          "number",
          r => Number(r?._metrics?.total_runs ?? 0),
          null,
          r => Number(r?._metrics?.total_runs ?? 0)
        ),

        new window.ReportColumn(
          "Success %",
          "Success rate over window",
          "7rem",
          false,
          "number",
          r => {
            const p = r?._metrics?.success_rate;
            return Number.isFinite(p) ? (p * 100).toFixed(0) + "%" : "n/a";
          },
          r => this.successPctStyle(r?._metrics?.success_rate),
          r => Number(r?._metrics?.success_rate ?? NaN)
        ),

        new window.ReportColumn(
          "Avg Duration",
          "Average duration across runs with duration_ms",
          "9rem",
          false,
          "number",
          r => msToPretty(r?._metrics?.avg_duration_ms),
          null,
          r => Number(r?._metrics?.avg_duration_ms ?? NaN)
        ),

        new window.ReportColumn(
          "Description",
          "Automation description",
          "24rem",
          false,
          "string",
          r => safeStr(r?.description),
          null,
          r => safeStr(r?.description)
        ),
      ]);

      await this.load();
    },

    computed: {
      visibleRows() {
        let rows = Array.isArray(this.rows) ? this.rows : [];

        const q = String(this.filters.q || "").trim().toLowerCase();
        if (q) {
          rows = rows.filter(r => {
            const hay = [
              r?.name, r?.description, r?.owner_name, r?.owner_email, r?.automation_id
            ].map(x => safeStr(x).toLowerCase()).join(" ");
            return hay.includes(q);
          });
        }

        const owner = String(this.filters.owner || "").trim().toLowerCase();
        if (owner) {
          rows = rows.filter(r => safeStr(r?.owner_email).toLowerCase().includes(owner) ||
                                 safeStr(r?.owner_name).toLowerCase().includes(owner));
        }

        const status = this.filters.status;
        if (status && status !== "All") {
          rows = rows.filter(r => safeStr(r?._metrics?.status) === status);
        }

        if (this.filters.hideHealthy) {
          rows = rows.filter(r => safeStr(r?._metrics?.status) !== "Healthy");
        }

        this.table.setRows(rows);
        return this.table.getSortedRows();
      },

      summary() {
        const rows = Array.isArray(this.visibleRows) ? this.visibleRows : [];
        const counts = rows.reduce((acc, r) => {
          const s = safeStr(r?._metrics?.status) || "Unknown";
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        }, {});
        return counts;
      }
    },

    methods: {
      getColumnsWidthsString() { return this.table.getColumnsWidthsString(); },
      setSortColumn(name) { this.table.setSortColumn(name); this.tableTick++; },

      statusStyle(status) {
        const s = safeStr(status);
        if (s === "Healthy") return { backgroundColor: this.colors.green, color: this.colors.white };
        if (s === "Watch") return { backgroundColor: this.colors.yellow, color: this.colors.black };
        if (s === "Needs Attention") return { backgroundColor: this.colors.red, color: this.colors.white };
        if (s === "No Runs") return { backgroundColor: this.colors.gray, color: this.colors.black };
        return { backgroundColor: this.colors.gray, color: this.colors.black };
      },

      lastRunStyle(r) {
        const ok = r?._metrics?.last_run_success;
        if (ok === true) return { backgroundColor: this.colors.green, color: this.colors.white };
        if (ok === false) return { backgroundColor: this.colors.red, color: this.colors.white };
        return { backgroundColor: this.colors.gray, color: this.colors.black };
      },

      daysSinceStyle(days) {
        const d = Number(days);
        if (!Number.isFinite(d)) return { backgroundColor: this.colors.gray, color: this.colors.black };
        if (d >= 7) return { backgroundColor: this.colors.red, color: this.colors.white };
        if (d >= 3) return { backgroundColor: this.colors.yellow, color: this.colors.black };
        return { backgroundColor: this.colors.green, color: this.colors.white };
      },

      failStreakStyle(n) {
        const x = Number(n);
        if (!Number.isFinite(x)) return { backgroundColor: this.colors.gray, color: this.colors.black };
        if (x >= 3) return { backgroundColor: this.colors.red, color: this.colors.white };
        if (x >= 1) return { backgroundColor: this.colors.yellow, color: this.colors.black };
        return { backgroundColor: this.colors.green, color: this.colors.white };
      },

      successPctStyle(p) {
        const n = Number(p);
        if (!Number.isFinite(n)) return { backgroundColor: this.colors.gray, color: this.colors.black };
        const pct = n * 100;
        if (pct < 80) return { backgroundColor: this.colors.red, color: this.colors.white };
        if (pct < 90) return { backgroundColor: this.colors.yellow, color: this.colors.black };
        return { backgroundColor: this.colors.green, color: this.colors.white };
      },

      async load() {
        this.loading = true;
        this.error = "";
        try {
          const limit = Number(this.runsLimit) || 100;
          const url = `${API_URL}?runs_limit=${encodeURIComponent(limit)}`;

          const docs = await httpGetJson(url);
          const list = Array.isArray(docs) ? docs : (Array.isArray(docs?.data) ? docs.data : []);

          this.rows = list.map(computeAutomationMetrics);
        } catch (e) {
          this.error = String(e?.message || e);
          this.rows = [];
        } finally {
          this.loading = false;
        }
      },
    },

    template: `
    <div class="btech-card btech-theme" style="padding:12px; margin-top:12px;">
      <div class="btech-row" style="align-items:center; margin-bottom:10px;">
        <h4 class="btech-card-title" style="margin:0;">Automation Status</h4>
        <div style="flex:1;"></div>

        <button class="Button" @click="load()" :disabled="loading" style="margin-left:8px;">
          {{ loading ? "Refreshing..." : "Refresh" }}
        </button>
      </div>

      <div class="btech-row" style="gap:10px; flex-wrap:wrap; align-items:flex-end; margin-bottom:10px;">
        <div style="min-width:240px;">
          <label class="btech-muted" style="display:block; font-size:12px; margin-bottom:4px;">Search</label>
          <input v-model="filters.q" type="text"
            placeholder="name, owner, description..."
            style="width:100%; padding:6px 8px; border:1px solid #d1d5db; border-radius:6px; background:#fff;" />
        </div>

        <div style="min-width:220px;">
          <label class="btech-muted" style="display:block; font-size:12px; margin-bottom:4px;">Owner</label>
          <input v-model="filters.owner" type="text"
            placeholder="email or name..."
            style="width:100%; padding:6px 8px; border:1px solid #d1d5db; border-radius:6px; background:#fff;" />
        </div>

        <div style="min-width:160px;">
          <label class="btech-muted" style="display:block; font-size:12px; margin-bottom:4px;">Status</label>
          <select v-model="filters.status"
            style="width:100%; padding:6px 8px; border:1px solid #d1d5db; border-radius:6px; background:#fff;">
            <option>All</option>
            <option>Healthy</option>
            <option>Watch</option>
            <option>Needs Attention</option>
            <option>No Runs</option>
            <option>Unknown</option>
          </select>
        </div>

        <label style="display:flex; gap:8px; align-items:center; font-size:12px; margin-left:6px;">
          <input type="checkbox" v-model="filters.hideHealthy" />
          Hide Healthy
        </label>

        <div style="flex:1;"></div>

        <span class="btech-pill">Healthy: {{ summary["Healthy"] || 0 }}</span>
        <span class="btech-pill">Watch: {{ summary["Watch"] || 0 }}</span>
        <span class="btech-pill">Needs Attention: {{ summary["Needs Attention"] || 0 }}</span>
        <span class="btech-pill">No Runs: {{ summary["No Runs"] || 0 }}</span>
      </div>

      <div v-if="error" class="btech-muted" style="padding:8px; color:#b20b0f;">
        {{ error }}
      </div>

      <div v-if="loading" class="btech-muted" style="text-align:center; padding:10px;">
        Loading automations…
      </div>

      <div v-else>
        <!-- Column headers -->
        <div
          style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; user-select:none;"
          :style="{ 'grid-template-columns': getColumnsWidthsString() }"
        >
          <div
            v-for="col in table.getVisibleColumns()"
            :key="col.name"
            :title="col.description"
            style="display:inline-block; cursor:pointer;"
            @click="setSortColumn(col.name)"
          >
            <span><b>{{ col.name }}</b></span>
            <span style="margin-left:.25rem;">
              <svg style="width:.75rem;height:.75rem;" viewBox="0 0 490 490" aria-hidden="true">
                <g>
                  <polygon :style="{ fill: col.sort_state < 0 ? '#000' : '#E0E0E0' }"
                    points="85.877,154.014 85.877,428.309 131.706,428.309 131.706,154.014 180.497,221.213 217.584,194.27 108.792,44.46 0,194.27 37.087,221.213"/>
                  <polygon :style="{ fill: col.sort_state > 0 ? '#000' : '#E0E0E0' }"
                    points="404.13,335.988 404.13,61.691 358.301,61.691 358.301,335.99 309.503,268.787 272.416,295.73 381.216,445.54 490,295.715 452.913,268.802"/>
                </g>
              </svg>
            </span>
          </div>
        </div>

        <!-- Rows -->
        <div
          v-for="(row, i) in visibleRows"
          :key="row.automation_id || i"
          style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; line-height:1.35rem;"
          :style="{
            'grid-template-columns': getColumnsWidthsString(),
            'background-color': (i % 2) ? 'white' : '#F8F8F8'
          }"
        >
          <div
            v-for="col in table.getVisibleColumns()"
            :key="col.name"
            style="display:inline-block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;"
            :title="col.getTooltip(row)"
          >
            <span
              :class="col.style_formula ? 'btech-pill-text' : ''"
              :style="col.get_style(row)"
              v-html="col.getContent(row)"
            ></span>
          </div>
        </div>
      </div>
    </div>
    `
  });

  /********************************************************************
   * Mount (standalone)
   * - This makes a simple page-friendly mount if you load this script alone.
   ********************************************************************/
    /********************************************************************
   * Mount (page replaces #content)
   ********************************************************************/
  function mountIntoContent() {
    const host = document.querySelector("#content");
    if (!host) {
      console.error("Expected #content on page, but it was not found.");
      return null;
    }

    // nuke page content
    host.innerHTML = "";

    // create mount root
    const root = document.createElement("div");
    root.id = "reports-automations-root";
    root.style.padding = "12px";
    host.appendChild(root);

    return root;
  }

  if (!window.Vue) {
    console.error("Vue not found. Load vue.2.6.12.js before this report.");
    return;
  }

  const root = mountIntoContent();
  if (!root) return;

  new Vue({
    el: "#reports-automations-root",
    template: `<reports-automations :runsLimit="200" />`
  });

})();
