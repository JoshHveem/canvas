// reports/automations/report.js
(async function () {
  async function loadScriptOnce(url) {
    if (document.querySelector(`script[src="${url}"]`)) return;
    await $.getScript(url);
  }

  try {
    if (!window.Vue) {
      await loadScriptOnce("https://bridgetools.dev/canvas/external-libraries/vue.2.6.12.js");
    }

    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/_core/report_core.js");
    await loadScriptOnce("https://d3js.org/d3.v7.min.js");
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/charts.js");

    // Components
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/components/AutomationsTableView.js");
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/components/AutomationsGraphView.js");
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/components/AutomationsFlaggedView.js");

    // Views (each view owns its rows+columns+filtering)
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/views/table_view.js");
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/views/graph_view.js");
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/views/flagged_view.js");

  } catch (e) {
    console.error("Failed to load automations report dependencies", e);
    return;
  }

  const RC = window.ReportCore;
  const RA = window.ReportAutomations;
  const U = RC?.util;

  if (!RC?.util || !RC?.ui) return console.error("ReportCore not initialized correctly.");
  if (!RA?.views?.Table || !RA?.views?.Graph || !RA?.views?.Flagged) {
    return console.error("Views not loaded. Expected RA.views.Table/Graph/Flagged.");
  }

  const API_BASE = "https://reports.bridgetools.dev";
  const API_URL = `${API_BASE}/api/automations`;
  const TEMPLATE_URL = "https://bridgetools.dev/canvas/custom_features/reports/automations/template.vue";
  const DEFAULT_RUNS_LIMIT = 200;

  const rootEl = await RC.ui.mountIntoContentWithTemplate({
    templateUrl: TEMPLATE_URL,
    hostId: "automations-report-host",
    rootId: "automations-report-root",
    contentSelector: "#content",
  });
  if (!rootEl) return;

  new Vue({
    el: rootEl,

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

      // One ReportTable per view => independent sort state
      const tables = {
        table: new ReportTable({ rows: [], columns: [], sort_column: "Status", sort_dir: 1, colors }),
        graph: new ReportTable({ rows: [], columns: [], sort_column: "Status", sort_dir: 1, colors }),
        flagged: new ReportTable({ rows: [], columns: [], sort_column: "Started", sort_dir: -1, colors }),
      };

      return {
        colors,
        tables,

        loading: false,
        error: "",

        raw: [],

        filters: {
          q: "",
          owner: "",
          status: "All",
          hideHealthy: false,
        },

        viewMode: "table", // "table" | "graph" | "flagged"
      };
    },

    computed: {
      activeView() {
        if (this.viewMode === "graph") return RA.views.Graph;
        if (this.viewMode === "flagged") return RA.views.Flagged;
        return RA.views.Table;
      },

      activeTable() {
        return this.tables[this.viewMode] || this.tables.table;
      },

      // view controls row shape + filtering
      visibleRows() {
        const raw = Array.isArray(this.raw) ? this.raw : [];
        const view = this.activeView;

        const baseRows = view.buildRows(this, raw);
        const filtered = view.filterRows ? view.filterRows(this, baseRows) : baseRows;

        this.activeTable.setRows(filtered);
        return this.activeTable.getSortedRows();
      },

      ownerOptions() {
        // Let view decide where owner list comes from.
        // Default: derive from raw automations list.
        const raw = Array.isArray(this.raw) ? this.raw : [];
        if (this.activeView.ownerOptions) return this.activeView.ownerOptions(this, raw);

        const seen = new Map();
        for (const r of raw) {
          const email = U.safeStr(r?.owner_email).trim();
          const name = U.safeStr(r?.owner_name).trim();
          const key = email || name;
          if (!key) continue;
          const label = email && name ? `${name} (${email})` : (name || email);
          if (!seen.has(key)) seen.set(key, { key, label, name, email });
        }

        const opts = Array.from(seen.values()).sort((a, b) => {
          const an = (a.name || a.email || "").toLowerCase();
          const bn = (b.name || b.email || "").toLowerCase();
          if (an < bn) return -1;
          if (an > bn) return 1;
          return (a.email || "").toLowerCase().localeCompare((b.email || "").toLowerCase());
        });

        return [{ key: "", label: "All owners" }, ...opts];
      },
    },

    watch: {
      viewMode() {
        // ensure columns are set for that view table
        this.ensureColumnsForView(this.viewMode);

        // give the view a post-render hook (graph charts etc)
        this.$nextTick(() => {
          const v = this.activeView;
          if (typeof v.afterRender === "function") v.afterRender(this, this.visibleRows);
        });
      },

      visibleRows() {
        // re-render if view needs it (graph)
        this.$nextTick(() => {
          const v = this.activeView;
          if (typeof v.afterRender === "function") v.afterRender(this, this.visibleRows);
        });
      },
    },

    async created() {
      // Initialize all view columns once
      this.ensureColumnsForView("table");
      this.ensureColumnsForView("graph");
      this.ensureColumnsForView("flagged");

      await this.load();
    },

    methods: {
      ensureColumnsForView(viewKey) {
        const view =
          viewKey === "graph" ? RA.views.Graph :
          viewKey === "flagged" ? RA.views.Flagged :
          RA.views.Table;

        const table = this.tables[viewKey];
        if (!table) return;

        // only set once unless you want dynamic columns; you can reset if needed
        if (!table.columns || table.columns.length === 0) {
          table.setColumns(view.buildColumns(this));
        }
      },

      getColumnsWidthsString(table) {
        return table.getColumnsWidthsString();
      },

      setSortColumn(table, name) {
        table.setSortColumn(name);
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

          this.raw = list;
        } catch (e) {
          this.error = String(e?.message || e);
          this.raw = [];
        } finally {
          this.loading = false;
        }
      },

      // keep your existing style helpers here if columns need them
      statusStyle(status) {
        const s = U.safeStr(status);
        if (s === "Healthy") return { backgroundColor: this.colors.green, color: this.colors.white };
        if (s === "Flagged") return { backgroundColor: this.colors.yellow, color: this.colors.white };
        if (s === "Error") return { backgroundColor: this.colors.red, color: this.colors.white };
        if (s === "No Runs") return { backgroundColor: this.colors.gray, color: this.colors.black };
        return { backgroundColor: this.colors.gray, color: this.colors.black };
      },
    },
  });
})();
