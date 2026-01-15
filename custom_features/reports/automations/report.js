
// reports/automations/report.js
(async function () {
  const _loaded = new Set();
  $("#content").empty();
  document.title = "Automations";

  async function loadScriptOnce(url) {
    if (_loaded.has(url)) return;
    await $.getScript(url);
    _loaded.add(url);
  }

  /********************************************************************
   * Dependencies (ORDER MATTERS)
   ********************************************************************/
  try {
    if (!window.Vue) {
      await loadScriptOnce(
        "https://bridgetools.dev/canvas/external-libraries/vue.2.6.12.js"
      );
    }
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/_core/report_core.js");
    await loadScriptOnce("https://d3js.org/d3.v7.min.js");
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/charts.js");
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/metrics.js");


    // Views (each view owns its own columns/rows/table/filtering)
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/components/table-view.js");
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/components/graph-view.js");
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/components/flagged-view.js");

    // If graph-view needs d3/charts, load those here too (safe even if graph-view is stubbed)
    // Uncomment when graph-view starts rendering charts.
    // await loadScriptOnce("https://d3js.org/d3.v7.min.js");
    // await loadScriptOnce(
    //   "https://bridgetools.dev/canvas/custom_features/reports/automations/charts.js"
    // );

  } catch (e) {
    console.error("Failed to load automations report dependencies", e);
    return;
  }

  /********************************************************************
   * Sanity checks
   ********************************************************************/
  const RC = window.ReportCore;
  const RA = window.ReportAutomations;
  const U = RC?.util;

  if (!RC?.util || !RC?.ui) {
    console.error("ReportCore not initialized correctly.");
    return;
  }
  if (!RA?.metrics?.computeAutomationMetrics) {
    console.error("Automations metrics not loaded.");
    return;
  }

  // Views must exist because template uses <component :is="...">
  const C = RA?.components;
  if (
    !C?.AutomationsTableView ||
    !C?.AutomationsGraphView ||
    !C?.AutomationsFlaggedView
  ) {
    console.error(
      "One or more view components not loaded.",
      Object.keys(C || {})
    );
    return;
  }

  /********************************************************************
   * Config
   ********************************************************************/
  const API_BASE = "https://reports.bridgetools.dev";
  const API_URL = `${API_BASE}/api/automations`;
  const TEMPLATE_URL =
    "https://bridgetools.dev/canvas/custom_features/reports/automations/template.vue";
  const DEFAULT_RUNS_LIMIT = 200;

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
   * Helpers
   ********************************************************************/
  function extractAutomations(payload) {
    return Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload?.automations)
      ? payload.automations
      : [];
  }

  function flattenRuns(processedAutomations) {
    const out = [];
    for (const a of processedAutomations || []) {
      const runs =
        a?._runs_sorted ||
        a?.runs ||
        [];

      for (const run of runs || []) {
        out.push({
          automation_id: a?.automation_id ?? a?.id,
          automation_name: U.safeStr(a?.name),
          owner_name: U.safeStr(a?.owner_name),
          owner_email: U.safeStr(a?.owner_email),
          _metrics: a?._metrics, // optional context
          _run: run,            // the raw run object
        });
      }
    }
    console.log(out);
    return out;
  }

  /********************************************************************
   * Vue app
   ********************************************************************/
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

      return {
        U,
        colors,

        shared: {
          styles: {}, // assigned in created() so `this` exists
          fmt: {},    // optional helpers that depend on U
        },
        loading: false,
        error: "",

        // processed only by metrics.js (views decide everything else)
        automations: [],
        runs: [],

        filters: {
          q: "",
          owner: "",
          status: "All",
          hideHealthy: false,
        },

        // report controls which view is active
        viewMode: "table", // "table" | "graph" | "flagged"
      };
    },

    computed: {
      activeViewComponent() {
        if (this.viewMode === "graph") return "AutomationsGraphView";
        if (this.viewMode === "flagged") return "AutomationsFlaggedView";
        return "AutomationsTableView";
      },
    },

    async created() {
      // Shared formatting helpers
      this.shared.fmt = {
        fmtDateTime: (t) => (t ? this.U.fmtDateTime(t) : "n/a"),
        parseTs: (t) => this.U.parseTs(t),
        msToPretty: (ms) => this.U.msToPretty(ms),
        safeStr: (v) => this.U.safeStr(v),
      };

      // Shared style helpers (centralize “what does healthy look like?”)
      this.shared.styles = {
        statusStyle: (status) => {
          const s = this.U.safeStr(status);
          if (s === "Healthy") return { backgroundColor: this.colors.green, color: this.colors.white };
          if (s === "Flagged") return { backgroundColor: this.colors.yellow, color: this.colors.white };
          if (s === "Error")   return { backgroundColor: this.colors.red, color: this.colors.white };
          if (s === "No Runs") return { backgroundColor: this.colors.gray, color: this.colors.black };
          return { backgroundColor: this.colors.gray, color: this.colors.black };
        },

        lastRunStyle: (automationRow) => {
          const ok = automationRow?._metrics?.last_run_success;
          if (ok === true)  return { backgroundColor: this.colors.green, color: this.colors.white };
          if (ok === false) return { backgroundColor: this.colors.red, color: this.colors.white };
          return { backgroundColor: this.colors.gray, color: this.colors.black };
        },

        daysSinceStyle: (days) => {
          const d = Number(days);
          if (!Number.isFinite(d)) return { backgroundColor: this.colors.gray, color: this.colors.black };
          if (d >= 7) return { backgroundColor: this.colors.red, color: this.colors.white };
          if (d >= 3) return { backgroundColor: this.colors.yellow, color: this.colors.black };
          return { backgroundColor: this.colors.green, color: this.colors.white };
        },
      };

      await this.load();
    },


    methods: {
      async load() {
        this.loading = true;
        this.error = "";
        try {
          const url = `${API_URL}?runs_limit=${encodeURIComponent(
            DEFAULT_RUNS_LIMIT
          )}`;
          const payload = await this.U.httpGetJson(url);
          const autos = extractAutomations(payload);
          console.log(autos);

          // ✅ ONLY processing here: attach _metrics
          const processed = autos.map(RA.metrics.computeAutomationMetrics);

          this.automations = processed;
          console.log(this.automations);
          this.runs = flattenRuns(processed);
          console.log(this.runs);
        } catch (e) {
          this.error = String(e?.message || e);
          this.automations = [];
          this.runs = [];
        } finally {
          this.loading = false;
        }
      },
    },
  });
})();
