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

    // ✅ only table view for now
    await loadScriptOnce("https://bridgetools.dev/canvas/custom_features/reports/automations/components/table-view.js");
  } catch (e) {
    console.error("Failed to load automations report dependencies", e);
    return;
  }

  const RC = window.ReportCore;
  const RA = window.ReportAutomations;
  const U = RC?.util;

  if (!RC?.util || !RC?.ui) return console.error("ReportCore not initialized correctly.");
  if (!RA?.metrics?.computeAutomationMetrics) return console.error("Automations metrics not loaded.");
  if (!RA?.components?.AutomationsTableView) return console.error("AutomationsTableView not loaded.");

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
        colors,
        loading: false,
        error: "",
        automations: [],
        filters: { q: "", owner: "", status: "All", hideHealthy: false },
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

          // ✅ only processing here
          this.automations = autos.map(RA.metrics.computeAutomationMetrics);
        } catch (e) {
          this.error = String(e?.message || e);
          this.automations = [];
        } finally {
          this.loading = false;
        }
      },
    },
  });
})();
