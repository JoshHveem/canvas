// reports/automations/report.js
(async function () {
  /********************************************************************
   * Script loader helpers
   ********************************************************************/
  async function loadScriptOnce(url) {
    // Prevent double-loading if user navigates / reopens
    if (document.querySelector(`script[src="${url}"]`)) return;

    await $.getScript(url);
  }

  /********************************************************************
   * Ensure dependencies (ORDER MATTERS)
   ********************************************************************/
  try {
    // Vue (if not already globally loaded)
    if (!window.Vue) {
      await loadScriptOnce(
        "https://bridgetools.dev/canvas/external-libraries/vue.2.6.12.js"
      );
    }

    // Shared core (utils + template mounting)
    await loadScriptOnce(
      "https://bridgetools.dev/canvas/custom_features/reports/_core/report_core.js"
    );

    // Report-specific logic
    await loadScriptOnce(
      "https://bridgetools.dev/canvas/custom_features/reports/automations/metrics.js"
    );

    await loadScriptOnce(
      "https://bridgetools.dev/canvas/custom_features/reports/automations/columns.js"
    );
    // D3 (pick a version you’ve used; v7 shown)
    await loadScriptOnce("https://d3js.org/d3.v7.min.js");

    await loadScriptOnce(
      "https://bridgetools.dev/canvas/custom_features/reports/automations/components/TableShell.js"
    );

    // chart renderer
    await loadScriptOnce(
      "https://bridgetools.dev/canvas/custom_features/reports/automations/charts.js"
    );
    await loadScriptOnce(
      "https://bridgetools.dev/canvas/custom_features/reports/automations/components/AutomationsTableView.js"
    );
    await loadScriptOnce(
      "https://bridgetools.dev/canvas/custom_features/reports/automations/components/AutomationsGraphView.js"
    );
    await loadScriptOnce(
      "https://bridgetools.dev/canvas/custom_features/reports/automations/components/AutomationsFlaggedView.js"
    );

  } catch (e) {
    console.error("Failed to load automations report dependencies", e);
    return;
  }

  /********************************************************************
   * Sanity checks (fail fast, readable errors)
   ********************************************************************/
  const RC = window.ReportCore;
  const RA = window.ReportAutomations;

  if (!RC?.util || !RC?.ui) {
    console.error("ReportCore not initialized correctly.");
    return;
  }
  if (!RA?.metrics?.computeAutomationMetrics) {
    console.error("Automations metrics not loaded.");
    return;
  }
  if (!RA?.columns?.buildColumns) {
    console.error("Automations columns not loaded.");
    return;
  }

  /********************************************************************
   * Config (kept here, as requested)
   ********************************************************************/
  const API_BASE = "https://reports.bridgetools.dev";
  const API_URL = `${API_BASE}/api/automations`;
  const TEMPLATE_URL =
    "https://bridgetools.dev/canvas/custom_features/reports/automations/template.vue";
  const DEFAULT_RUNS_LIMIT = 200;

  const U = RC.util;

  /********************************************************************
   * Mount template
   ********************************************************************/
  const rootEl = await RC.ui.mountIntoContentWithTemplate({
    templateUrl: TEMPLATE_URL,
    hostId: "automations-report-host",
    rootId: "automations-report-root",
    contentSelector: "#content",
  });

  if (!rootEl) return;

  /********************************************************************
   * Vue app
   ********************************************************************/
  new Vue({
    el: rootEl,
    watch: {
      viewMode() { this.$nextTick(this.renderAllCharts); },
      visibleRows() { if (this.viewMode === "graph") this.$nextTick(this.renderAllCharts); }
    },

    components: {
      AutomationsTableView: RA.components.AutomationsTableView,
      AutomationsGraphView: RA.components.AutomationsGraphView,
      AutomationsFlaggedView: RA.components.AutomationsFlaggedView,
    },


    data() {
      const colors = window.bridgetools?.colors || {
        red: "#b20b0f",
        orange: "#f59e0b",
        yellow: "#eab308",
        green: "#16a34a",
        gray: "#e5e7eb",
        black: "#111827",
        white: "#fff",
      };

      const table = new ReportTable({
        rows: [],
        columns: [],
        sort_column: "Status",
        sort_dir: 1,
        colors,
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
        viewMode: "table", // "table" | "graph"
      };
    },

    async created() {
      // Columns come from columns.js
      this.table.setColumns(RA.columns.buildColumns(this));
      await this.load();
    },

    computed: {
      ownerOptions() {
        const rows = Array.isArray(this.rows) ? this.rows : [];

        // Build a stable key so duplicate names don’t collide.
        // Prefer email; fall back to name.
        const seen = new Map(); // key -> { key, label, name, email }

        for (const r of rows) {
          const email = U.safeStr(r?.owner_email).trim();
          const name = U.safeStr(r?.owner_name).trim();

          const key = email || name;
          if (!key) continue;

          const label = email && name ? `${name} (${email})`
                      : name ? name
                      : email;

          if (!seen.has(key)) {
            seen.set(key, { key, label, name, email });
          }
        }

        // Sort nicely by name then email
        const opts = Array.from(seen.values()).sort((a, b) => {
          const an = (a.name || a.email || "").toLowerCase();
          const bn = (b.name || b.email || "").toLowerCase();
          if (an < bn) return -1;
          if (an > bn) return 1;
          const ae = (a.email || "").toLowerCase();
          const be = (b.email || "").toLowerCase();
          return ae.localeCompare(be);
        });

        // Include "All"
        return [{ key: "", label: "All owners" }, ...opts];
      },

      visibleRows() {
        let rows = Array.isArray(this.rows) ? this.rows : [];

        const q = String(this.filters.q || "").trim().toLowerCase();
        if (q) {
          rows = rows.filter((r) => {
            const hay = [
              r?.name,
              r?.description,
              r?.owner_name,
              r?.owner_email,
              r?.automation_id,
            ]
              .map((x) => U.safeStr(x).toLowerCase())
              .join(" ");
            return hay.includes(q);
          });
        }

        const ownerKey = U.safeStr(this.filters.owner).trim();
        if (ownerKey) {
          rows = rows.filter((r) => {
            const email = U.safeStr(r?.owner_email).trim();
            const name = U.safeStr(r?.owner_name).trim();
            const key = email || name;
            return key === ownerKey;
          });
        }


        const status = this.filters.status;
        if (status && status !== "All") {
          rows = rows.filter((r) => U.safeStr(r?._metrics?.status) === status);
        }

        if (this.filters.hideHealthy) {
          rows = rows.filter(
            (r) => U.safeStr(r?._metrics?.status) !== "Healthy"
          );
        }

        this.table.setRows(rows);
        return this.table.getSortedRows();
      },

      summary() {
        return (this.visibleRows || []).reduce((acc, r) => {
          const s = U.safeStr(r?._metrics?.status) || "Unknown";
          acc[s] = (acc[s] || 0) + 1;
          return acc;
        }, {});
      },
    },

    methods: {
      renderAllCharts() {
        if (this.viewMode !== "graph") return;

        const gv = this.$refs.graphView;
        if (!gv) return;

        const rows = this.visibleRows || [];
        for (const r of rows) {
          const id = r?.automation_id;
          const el = gv.$refs[`chart_${id}`];
          const node = Array.isArray(el) ? el[0] : el;
          if (node) RA.charts.renderRuns30(node, r, this.colors, U);
        }
      },

      getColumnsWidthsString() {
        return this.table.getColumnsWidthsString();
      },
      setSortColumn(name) {
        this.table.setSortColumn(name);
        this.tableTick++;
      },

      // --- styles (unchanged) ---
      statusStyle(status) {
        const s = U.safeStr(status);
        if (s === "Healthy") return { backgroundColor: this.colors.green, color: this.colors.white };
        if (s === "Flagged") return { backgroundColor: this.colors.yellow, color: this.colors.white };
        if (s === "Error") return { backgroundColor: this.colors.red, color: this.colors.white };
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
          const url = `${API_URL}?runs_limit=${encodeURIComponent(DEFAULT_RUNS_LIMIT)}`;
          const docs = await U.httpGetJson(url);

          const list =
            Array.isArray(docs) ? docs :
            Array.isArray(docs?.data) ? docs.data :
            Array.isArray(docs?.automations) ? docs.automations :
            [];

          this.rows = list.map(RA.metrics.computeAutomationMetrics);
        } catch (e) {
          this.error = String(e?.message || e);
          this.rows = [];
        } finally {
          this.loading = false;
        }
      },
    },
  });
})();
