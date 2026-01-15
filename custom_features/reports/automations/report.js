//reports/automations/report.js
/********************************************************************
 * Mount: load template.vue into #content and mount a root Vue app
 ********************************************************************/
const API_BASE = "https://reports.bridgetools.dev";
const API_URL  = `${API_BASE}/api/automations`;
async function mountIntoContentWithTemplate() {
  const content = document.querySelector("#content");
  if (!content) {
    console.error("Expected #content on page, but it was not found.");
    return null;
  }

  const templateHtml = await loadTemplateHtml();

  content.innerHTML = "";
  const host = document.createElement("div");
  host.id = "automations-report-host";
  host.innerHTML = templateHtml;
  content.appendChild(host);

  // template.vue root has this id
  const root = host.querySelector("#automations-report-root");
  if (!root) {
    console.error("template.vue must contain an element with id='automations-report-root'");
    return null;
  }

  return root;
}

if (!window.Vue) {
  console.error("Vue not found. Load vue.2.6.12.js before this report.");
  return;
}

const rootEl = await mountIntoContentWithTemplate();
if (!rootEl) return;

// ✅ Create ONE root Vue instance that matches the template.vue bindings
new Vue({
  el: rootEl,

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
    // columns (same as you already had inside the component)
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
          const hay = [r?.name, r?.description, r?.owner_name, r?.owner_email, r?.automation_id]
            .map(x => safeStr(x).toLowerCase())
            .join(" ");
          return hay.includes(q);
        });
      }

      const owner = String(this.filters.owner || "").trim().toLowerCase();
      if (owner) {
        rows = rows.filter(r =>
          safeStr(r?.owner_email).toLowerCase().includes(owner) ||
          safeStr(r?.owner_name).toLowerCase().includes(owner)
        );
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
      return rows.reduce((acc, r) => {
        const s = safeStr(r?._metrics?.status) || "Unknown";
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});
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
        const limit = 200; // or wire this to a UI / env / param
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
    }
  }
});
