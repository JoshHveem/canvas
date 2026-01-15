// reports/automations/report.js
(async function () {
  const _loaded = new Set();

  async function loadScriptOnce(url) {
    if (_loaded.has(url)) return;
    await $.getScript(url);
    _loaded.add(url);
  }

  try {
    if (!window.Vue) {
      await loadScriptOnce("https://bridgetools.dev/canvas/external-libraries/vue.2.6.12.js");
    }

    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/_core/report_core.js");
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/metrics.js");

    // ✅ only table view
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/components/table-view.js");
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

  // ✅ only table view guard
  console.log("Loaded RA.components:", Object.keys(RA?.components || {}));
  if (!RA?.components?.AutomationsTableView) {
    console.error("AutomationsTableView not loaded.");
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

  new Vue({
    el: rootEl,

    components: {
      AutomationsTableView: RA.components.AutomationsTableView,
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

        loading: false,
        error: "",

        // ✅ raw-but-processed by metrics only
        automations: [],

        filters: {
          q: "",
          owner: "",
          status: "All",
          hideHealthy: false,
        },

        // ✅ only one mode for now
        viewMode: "table",
      };
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

          // ✅ only processing done here
          this.automations = autos.map(RA.metrics.computeAutomationMetrics);
        } catch (e) {
          this.error = String(e?.message || e);
          this.automations = [];
        } finally {
          this.loading = false;
        }
      },

      // keep shared styles here (views can call via parent if desired)
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
