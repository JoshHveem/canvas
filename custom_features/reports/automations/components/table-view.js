(function () {
  window.ReportAutomations = window.ReportAutomations || {};
  window.ReportAutomations.components = window.ReportAutomations.components || {};

  const RA = window.ReportAutomations;
  const U = window.ReportCore?.util;

  if (!U) {
    console.error("ReportCore.util not loaded before table-view.js");
    return;
  }
  if (!window.ReportTable || !window.ReportColumn) {
    console.error("ReportTable/ReportColumn not available. Make sure report_core.js is loaded first.");
    return;
  }

  function buildColumns(vm) {
    // vm = this component instance
    return [
      new ReportColumn(
        "Status",
        "Health status computed from recent runs.",
        "5rem",
        false,
        "string",
        (r) => U.safeStr(r?._metrics?.status),
        (r) => vm.statusStyle(r?._metrics?.status),
        (r) => U.safeStr(r?._metrics?.status)
      ),

      new ReportColumn(
        "ID",
        "Automation ID",
        "3rem",
        false,
        "number",
        (r) => `${r?.automation_id ?? ""}`,
        null,
        (r) => Number(r?.automation_id ?? NaN)
      ),

      new ReportColumn(
        "Automation",
        "Automation name",
        "18rem",
        false,
        "string",
        (r) => `${U.safeStr(r?.name)}`,
        null,
        (r) => U.safeStr(r?.name)
      ),

      new ReportColumn(
        "Description",
        "Automation description",
        "24rem",
        false,
        "string",
        (r) => `<p style="margin:0;">${U.safeStr(r?.description)}</p>`,
        () => ({
          whiteSpace: "normal",
          wordBreak: "break-word",
          overflowWrap: "anywhere",
          lineHeight: "1.25",
        }),
        (r) => U.safeStr(r?.description)
      ),

      new ReportColumn(
        "Owner",
        "Owner name/email",
        "10rem",
        false,
        "string",
        (r) => {
          const nm = U.safeStr(r?.owner_name);
          const em = U.safeStr(r?.owner_email);
          return em ? `${nm}<br><span class="btech-muted">${em}</span>` : nm;
        },
        null,
        (r) => `${U.safeStr(r?.owner_name)} ${U.safeStr(r?.owner_email)}`
      ),

      new ReportColumn(
        "Last Run",
        "Most recent run time",
        "14rem",
        false,
        "number",
        (r) => {
          const t = r?._metrics?.last_run_time;
          return t ? U.fmtDateTime(t) : "n/a";
        },
        () => null,
        (r) => U.parseTs(r?._metrics?.last_run_time)
      ),

      new ReportColumn(
        "Days Since",
        "Days since last run",
        "6rem",
        false,
        "number",
        (r) => {
          const d = r?._metrics?.days_since_last_run;
          return Number.isFinite(d) ? d.toFixed(1) : "n/a";
        },
        (r) => vm.daysSinceStyle(r?._metrics?.days_since_last_run),
        (r) => Number(r?._metrics?.days_since_last_run)
      ),

      new ReportColumn(
        "Avg Duration",
        "Average duration across runs with duration_ms",
        "9rem",
        false,
        "number",
        (r) => U.msToPretty(r?._metrics?.avg_duration_ms),
        null,
        (r) => Number(r?._metrics?.avg_duration_ms ?? NaN)
      ),
    ];
  }

  RA.components.AutomationsTableView = {
    name: "AutomationsTableView",
    props: {
      automations: { type: Array, required: true }, // raw-but-processed by metrics.js
      filters: { type: Object, required: true },    // shared filters object from report.js
      colors: { type: Object, required: true },     // shared palette
    },

    data() {
      return {
        table: new ReportTable({
          rows: [],
          columns: [],
          sort_column: "Status",
          sort_dir: 1,
          colors: this.colors,
        }),
      };
    },

    created() {
      this.table.setColumns(buildColumns(this));
    },

    computed: {
      visibleRows() {
        let rows = Array.isArray(this.automations) ? this.automations : [];

        const q = String(this.filters.q || "").trim().toLowerCase();
        if (q) {
          rows = rows.filter((r) => {
            const hay = [
              r?.name,
              r?.description,
              r?.owner_name,
              r?.owner_email,
              r?.automation_id,
              r?._metrics?.status,
            ]
              .map((x) => U.safeStr(x).toLowerCase())
              .join(" ");
            return hay.includes(q);
          });
        }

        const ownerKey = U.safeStr(this.filters.owner).trim();
        if (ownerKey) {
          rows = rows.filter((r) => {
            const key = U.safeStr(r?.owner_email).trim() || U.safeStr(r?.owner_name).trim();
            return key === ownerKey;
          });
        }

        const status = this.filters.status;
        if (status && status !== "All") {
          rows = rows.filter((r) => U.safeStr(r?._metrics?.status) === status);
        }

        if (this.filters.hideHealthy) {
          rows = rows.filter((r) => U.safeStr(r?._metrics?.status) !== "Healthy");
        }

        this.table.setRows(rows);
        return this.table.getSortedRows();
      },
    },

    methods: {
      // TableShell-y helpers live here now
      getColumnsWidthsString() {
        return this.table.getColumnsWidthsString();
      },

      setSortColumn(name) {
        this.table.setSortColumn(name);
      },

      // styles live here (view owns it)
      statusStyle(status) {
        const s = U.safeStr(status);
        if (s === "Healthy") return { backgroundColor: this.colors.green, color: this.colors.white };
        if (s === "Flagged") return { backgroundColor: this.colors.yellow, color: this.colors.white };
        if (s === "Error") return { backgroundColor: this.colors.red, color: this.colors.white };
        if (s === "No Runs") return { backgroundColor: this.colors.gray, color: this.colors.black };
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
