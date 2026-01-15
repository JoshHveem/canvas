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
  if (!window.ReportTable || !window.ReportColumn) {
    console.error("ReportTable / ReportColumn globals missing.");
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
      };
    },

    async created() {
      // Columns come from columns.js
      this.table.setColumns(RA.columns.buildColumns(this));
      await this.load();
    },

    computed: {
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

        const owner = String(this.filters.owner || "").trim().toLowerCase();
        if (owner) {
          rows = rows.filter(
            (r) =>
              U.safeStr(r?.owner_email).toLowerCase().includes(owner) ||
              U.safeStr(r?.owner_name).toLowerCase().includes(owner)
          );
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
