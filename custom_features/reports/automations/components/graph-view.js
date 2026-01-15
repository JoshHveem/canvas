(function () {
  const RA = (window.ReportAutomations = window.ReportAutomations || {});
  RA.components = RA.components || {};

  function buildColumns(vm) {
    const U = vm.util;

    return [
      new ReportColumn(
        "Status",
        "Health status computed from recent runs.",
        "5rem",
        false,
        "string",
        (r) => U.safeStr(r?._metrics?.status),
        (r) => vm.$parent.statusStyle(r?._metrics?.status),
        (r) => U.safeStr(r?._metrics?.status)
      ),

      new ReportColumn("ID", "Automation ID", "3rem", false, "string",
        (r) => `${r?.automation_id ?? ""}`, null, (r) => r?.automation_id
      ),

      new ReportColumn("Automation", "Automation name", "18rem", false, "string",
        (r) => U.safeStr(r?.name), null, (r) => U.safeStr(r?.name)
      ),

      new ReportColumn(
        "Graph",
        "Runs chart (30 days)",
        "1fr",
        false,
        "string",
        (r) => `<div id="chart_${r?.automation_id ?? ""}" style="min-width:260px;"></div>`,
        () => ({ whiteSpace: "normal", overflow: "visible" }),
        () => 0
      ),
    ];
  }

  function filterRows(vm, rows) {
    // same filters as Table view (copy/paste is fine since you want views self-contained)
    const U = vm.util;
    const f = vm.filters || {};
    let out = Array.isArray(rows) ? rows : [];

    const q = U.safeStr(f.q).trim().toLowerCase();
    if (q) {
      out = out.filter((r) => {
        const hay = [r?.name, r?.description, r?.owner_name, r?.owner_email, r?.automation_id]
          .map((x) => U.safeStr(x).toLowerCase()).join(" ");
        return hay.includes(q);
      });
    }

    const ownerKey = U.safeStr(f.owner).trim();
    if (ownerKey) {
      out = out.filter((r) => (U.safeStr(r?.owner_email).trim() || U.safeStr(r?.owner_name).trim()) === ownerKey);
    }

    const status = U.safeStr(f.status);
    if (status && status !== "All") {
      out = out.filter((r) => U.safeStr(r?._metrics?.status) === status);
    }

    if (f.hideHealthy) {
      out = out.filter((r) => U.safeStr(r?._metrics?.status) !== "Healthy");
    }

    return out;
  }

  RA.components.AutomationsGraphView = {
    name: "AutomationsGraphView",
    props: {
      automations: { type: Array, required: true },
      runs: { type: Array, required: true },
      colors: { type: Object, required: true },
      filters: { type: Object, required: true },
      util: { type: Object, required: true },
    },

    data() {
      const table = new ReportTable({ rows: [], columns: [], sort_column: "Status", sort_dir: 1, colors: this.colors });
      table.setColumns(buildColumns(this));
      return { table };
    },

    computed: {
      rows() {
        const filtered = filterRows(this, this.automations);
        this.table.setRows(filtered);
        return this.table.getSortedRows();
      },
    },

    watch: {
      rows() {
        this.$nextTick(this.renderCharts);
      },
    },

    mounted() {
      this.renderCharts();
    },

    methods: {
      getColumnsWidthsString(table) {
        return table.getColumnsWidthsString();
      },
      setSortColumn(table, name) {
        table.setSortColumn(name);
        this.$nextTick(this.renderCharts);
      },
      renderCharts() {
        const U = this.util;
        for (const r of this.rows || []) {
          const id = r?.automation_id;
          const node = document.getElementById(`chart_${id}`);
          if (node) RA.charts.renderRuns30(node, r, this.colors, U);
        }
      },
    },

    // reuse the same HTML table shell (copy is fine; again: view is self-contained)
    template: window.ReportAutomations.components.AutomationsTableView.template,
  };
})();
