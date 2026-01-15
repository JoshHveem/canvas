(function () {
  const RA = (window.ReportAutomations = window.ReportAutomations || {});
  RA.components = RA.components || {};

  RA.components.AutomationsGraphView = {
    name: "AutomationsGraphView",

    props: {
      automations: { type: Array, required: true },
      runs: { type: Array, required: true },
      colors: { type: Object, required: true },
      filters: { type: Object, required: true },
      util: { type: Object, required: true },
    },

    components: {
      AutomationsTableView: RA.components.AutomationsTableView,
    },

    // Graph view uses its own table + rows, but renders via the TableView component shell.
    data() {
      const table = new ReportTable({
        rows: [],
        columns: [],
        sort_column: "Status",
        sort_dir: 1,
        colors: this.colors,
      });

      // Build your graph columns HERE (inside the view)
      table.setColumns(this.buildGraphColumns());

      return { table };
    },

    computed: {
      rows() {
        // Build/filter rows HERE (inside the view)
        const filtered = this.filterAutomations(this.automations);
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
      buildGraphColumns() {
        const U = this.util;

        return [
          new ReportColumn(
            "Status",
            "Health status computed from recent runs.",
            "5rem",
            false,
            "string",
            (r) => U.safeStr(r?._metrics?.status),
            (r) => this.$parent.statusStyle(r?._metrics?.status),
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
      },

      filterAutomations(rows) {
        // keep same filter behavior as table-view, but local to this view
        const U = this.util;
        const f = this.filters || {};
        let out = Array.isArray(rows) ? rows : [];

        const q = U.safeStr(f.q).trim().toLowerCase();
        if (q) {
          out = out.filter((r) => {
            const hay = [r?.name, r?.description, r?.owner_name, r?.owner_email, r?.automation_id]
              .map((x) => U.safeStr(x).toLowerCase())
              .join(" ");
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

    template: `
      <AutomationsTableView
        :table="table"
        :rows="rows"
        :get-columns-widths-string="(t)=>t.getColumnsWidthsString()"
        :set-sort-column="(t,name)=>{ t.setSortColumn(name); $nextTick(renderCharts); }"
      />
    `,
  };
})();
