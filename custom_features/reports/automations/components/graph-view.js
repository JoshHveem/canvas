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
        (r) => vm.shared.styles.statusStyle(r?._metrics?.status),
        (r) => U.safeStr(r?._metrics?.status)
      ),

      new ReportColumn(
        "ID",
        "Automation ID",
        "3rem",
        false,
        "string",
        (r) => `${r?.automation_id ?? ""}`,
        null,
        (r) => r?.automation_id
      ),

      new ReportColumn(
        "Automation",
        "Automation name",
        "18rem",
        false,
        "string",
        (r) => U.safeStr(r?.name),
        null,
        (r) => U.safeStr(r?.name)
      ),

      // Chart container. Rendering happens after DOM paint.
      new ReportColumn(
        "Graph",
        "Runs chart (30 days)",
        "1fr",
        false,
        "string",
        (r) => {
          const id = r?.automation_id ?? "";
          return `<div id="chart_${id}" style="min-width:260px;"></div>`;
        },
        () => ({ whiteSpace: "normal", overflow: "visible" }),
        () => 0
      ),
    ];
  }

  function filterRows(vm, rows) {
    const U = vm.util;
    const f = vm.filters || {};
    let out = Array.isArray(rows) ? rows : [];

    const q = U.safeStr(f.q).trim().toLowerCase();
    if (q) {
      out = out.filter((r) => {
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

    const ownerKey = U.safeStr(f.owner).trim();
    if (ownerKey) {
      out = out.filter((r) => {
        const key =
          U.safeStr(r?.owner_email).trim() || U.safeStr(r?.owner_name).trim();
        return key === ownerKey;
      });
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

    // ✅ contract from template.vue
    props: {
      shared: { type: Object, required: true },
      automations: { type: Array, required: true },
      runs: { type: Array, required: true }, // unused here; kept for consistency
      colors: { type: Object, required: true },
      filters: { type: Object, required: true },
      util: { type: Object, required: true },
    },

    data() {
      const table = new ReportTable({
        rows: [],
        columns: [],
        sort_column: "Status",
        sort_dir: 1,
        colors: this.colors,
      });

      table.setColumns(buildColumns(this));
      return { table };
    },

    computed: {
      visibleRows() {
        const filtered = filterRows(this, this.automations);
        this.table.setRows(filtered);
        return this.table.getSortedRows();
      },
    },

    watch: {
      // rerender charts whenever the visible set changes
      visibleRows() {
        this.$nextTick(this.renderCharts);
      },
    },

    mounted() {
      this.renderCharts();
    },

    methods: {
      getColumnsWidthsString() {
        return this.table.getColumnsWidthsString();
      },

      setSortColumn(name) {
        this.table.setSortColumn(name);
        this.$nextTick(this.renderCharts);
      },

      renderCharts() {
        // Guard: graph view needs charts.js
        if (!RA.charts?.renderRuns30) return;

        const U = this.util;
        for (const r of this.visibleRows || []) {
          const id = r?.automation_id;
          if (id === undefined || id === null) continue;

          const node = document.getElementById(`chart_${id}`);
          if (node) RA.charts.renderRuns30(node, r, this.colors, U);
        }
      },
    },

    // ✅ self-contained "table-like" shell (same as table-view)
    template: `
      <div>
        <!-- Header Row -->
        <div
          style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; user-select:none;"
          :style="{ 'grid-template-columns': getColumnsWidthsString() }"
        >
          <div
            v-for="col in table.getVisibleColumns()"
            :key="col.name"
            :title="col.description"
            style="display:inline-block; cursor:pointer;"
            @click="setSortColumn(col.name)"
          >
            <span><b>{{ col.name }}</b></span>
            <span style="margin-left:.25rem;">
              <svg style="width:.75rem;height:.75rem;" viewBox="0 0 490 490" aria-hidden="true">
                <g>
                  <polygon :style="{ fill: col.sort_state < 0 ? '#000' : '#E0E0E0' }"
                    points="85.877,154.014 85.877,428.309 131.706,428.309 131.706,154.014 180.497,221.213 217.584,194.27 108.792,44.46 0,194.27 37.087,221.213"/>
                  <polygon :style="{ fill: col.sort_state > 0 ? '#000' : '#E0E0E0' }"
                    points="404.13,335.988 404.13,61.691 358.301,61.691 358.301,335.99 309.503,268.787 272.416,295.73 381.216,445.54 490,295.715 452.913,268.802"/>
                </g>
              </svg>
            </span>
          </div>
        </div>

        <!-- Rows -->
        <div
          v-for="(row, i) in visibleRows"
          :key="row.automation_id || i"
          style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; line-height:1.35rem;"
          :style="{
            'grid-template-columns': getColumnsWidthsString(),
            'background-color': (i % 2) ? 'white' : '#F8F8F8'
          }"
        >
          <div
            v-for="col in table.getVisibleColumns()"
            :key="col.name"
            style="display:inline-block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;"
            :title="col.getTooltip(row)"
          >
            <span
              :class="col.style_formula ? 'btech-pill-text' : ''"
              :style="col.get_style(row)"
              v-html="col.getContent(row)"
            ></span>
          </div>
        </div>
      </div>
    `,
  };
})();
