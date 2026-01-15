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

    // metrics helper (computes _metrics per automation)
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/metrics.js");

    // d3 + charts (graph view depends on it)
    await loadScriptOnce("https://d3js.org/d3.v7.min.js");
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/charts.js");

    // views (ALL view logic lives in these files)
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/components/table-view.js");
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/components/graph-view.js");
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/components/flagged-view.js");
  } catch (e) {
    console.error("Failed to load automations report dependencies", e);
    return;
  }

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
  if (!RA?.components?.AutomationsTableView || !RA?.components?.AutomationsGraphView || !RA?.components?.AutomationsFlaggedView) {
    console.error("One or more view components not loaded.");
    return;
  }

  const API_BASE = "https://reports.bridgetools.dev";
  const API_URL = `${API_BASE}/api/automations`;
  const TEMPLATE_URL = "https://bridgetools.dev/canvas/custom_features/reports/automations/template.vue";
  const DEFAULT_RUNS_LIMIT = 200;

  const U = RC.util;

  const rootEl = await RC.ui.mountIntoContentWithTemplate({
    templateUrl: TEMPLATE_URL,
    hostId: "automations-report-host",
    rootId: "automations-report-root",
    contentSelector: "#content",
  });

  if (!rootEl) return;

  function extractAutomations(payload) {
    return Array.isArray(payload) ? payload :
      Array.isArray(payload?.data) ? payload.data :
      Array.isArray(payload?.automations) ? payload.automations :
      [];
  }

  function flattenRuns(automations) {
    const out = [];
    for (const a of automations || []) {
      const runs =
        a?.runs ||
        a?.recent_runs ||
        a?.automation_runs ||
        a?.recentRuns ||
        [];

      for (const run of runs || []) {
        out.push({
          automation_id: a?.automation_id ?? a?.id,
          automation_name: U.safeStr(a?.name),
          owner_name: U.safeStr(a?.owner_name),
          owner_email: U.safeStr(a?.owner_email),
          _metrics: a?._metrics, // handy sometimes
          _run: run,
        });
      }
    }
    return out;
  }

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

      return {
        // exposed to template + views
        U,
        colors,

        loading: false,
        error: "",

        // processed raw data (views decide what to do with it)
        automations: [],
        runs: [],

        filters: {
          q: "",
          owner: "",
          status: "All",
          hideHealthy: false,
        },

        viewMode: "table",
      };
    },

    computed: {
      activeViewComponent() {
        if (this.viewMode === "graph") return "AutomationsGraphView";
        if (this.viewMode === "flagged") return "AutomationsFlaggedView";
        return "AutomationsTableView";
      },
    },

    components: {
      AutomationsTableView: RA.components.AutomationsTableView,
      AutomationsGraphView: RA.components.AutomationsGraphView,
      AutomationsFlaggedView: RA.components.AutomationsFlaggedView,
    },

    async created() {
      await this.load();
    },

    methods: {
      async load() {
        this.loading = true;
        this.error = "";
        try {
          const url = `${API_URL}?runs_limit=${encodeURIComponent(DEFAULT_RUNS_LIMIT)}`;
          const payload = await U.httpGetJson(url);
          const autos = extractAutomations(payload);

          // ✅ ONLY "processing" here: compute metrics onto each automation
          const processedAutomations = autos.map(RA.metrics.computeAutomationMetrics);

          this.automations = processedAutomations;
          this.runs = flattenRuns(processedAutomations);
        } catch (e) {
          this.error = String(e?.message || e);
          this.automations = [];
          this.runs = [];
        } finally {
          this.loading = false;
        }
      },

      // styles are allowed to live here (views can call them if needed)
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
    },
  });
})();
