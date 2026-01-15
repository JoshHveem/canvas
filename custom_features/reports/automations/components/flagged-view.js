(function () {
  const RA = (window.ReportAutomations = window.ReportAutomations || {});
  RA.components = RA.components || {};

  function getFlags(run) {
    return run?.flags || run?._flags || run?.flag_data || run?.flagData || null;
  }

  function flagsCount(U, flags) {
    if (!flags) return 0;
    if (Array.isArray(flags)) return flags.length;
    if (typeof flags === "object") return Object.keys(flags).length;
    return U.safeStr(flags).trim() ? 1 : 0;
  }

  function prettyFlagsHtml(U, flags) {
    if (!flags) return `<span class="btech-muted">—</span>`;

    // object => key/value lines
    if (typeof flags === "object" && !Array.isArray(flags)) {
      const entries = Object.entries(flags);
      if (!entries.length) return `<span class="btech-muted">—</span>`;
      return `
        <div style="white-space:normal; line-height:1.25;">
          ${entries
            .map(([k, v]) => {
              const vv = typeof v === "object" ? JSON.stringify(v) : U.safeStr(v);
              return `<div><b>${U.safeStr(k)}:</b> ${U.safeStr(vv)}</div>`;
            })
            .join("")}
        </div>
      `;
    }

    // array => bullet-ish list
    if (Array.isArray(flags)) {
      return `
        <div style="white-space:normal; line-height:1.25;">
          ${flags.map((x) => `<div>• ${U.safeStr(x)}</div>`).join("")}
        </div>
      `;
    }

    // string fallback
    return `<div style="white-space:normal;">${U.safeStr(flags)}</div>`;
  }

  function buildColumns(vm) {
    const U = vm.util;

    return [
      new ReportColumn(
        "Run Status",
        "Status of this run",
        "7rem",
        false,
        "string",
        (r) => U.safeStr((r?._run || {})?.run_status),
        (r) => vm.shared.styles.statusStyle(r?._run?.run_status),
        (r) => U.safeStr((r?._run || {})?.run_status)
      ),
      new ReportColumn(
        "Automation",
        "Automation name",
        "18rem",
        false,
        "string",
        (r) => U.safeStr(r?.automation_name),
        null,
        (r) => U.safeStr(r?.automation_name)
      ),


      new ReportColumn(
        "Started",
        "Run start time",
        "14rem",
        false,
        "number",
        (r) => {
          const run = r?._run || {};
          const t = run?.run_time;
          return t ? U.fmtDateTime(t) : "n/a";
        },
        null,
        (r) => {
          const run = r?._run || {};
          const t = run?.run_time;
          return U.parseTs(t);
        }
      ),

      new ReportColumn(
        "Duration",
        "Run duration",
        "8rem",
        false,
        "number",
        (r) => {
          const run = r?._run || {};
          return U.msToPretty(run?.duration_ms || run?.durationMs);
        },
        null,
        (r) => {
          const run = r?._run || {};
          return Number(run?.duration_ms ?? run?.durationMs ?? NaN);
        }
      ),

      new ReportColumn(
        "Flags",
        "Flag payload for this run",
        "1fr",
        false,
        "string",
        (r) => {
          const run = r?._run || {};
          return prettyFlagsHtml(U, getFlags(run));
        },
        () => ({
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          lineHeight: "1.25",
        }),
        (r) => {
          const run = r?._run || {};
          return flagsCount(U, getFlags(run));
        }
      ),
    ];
  }

  function filterRows(vm, rows) {
    const U = vm.util;
    const f = vm.filters || {};
    let out = Array.isArray(rows) ? rows : [];

    // ✅ Only flagged runs
    out = out.filter((r) => flagsCount(U, getFlags(r?._run)) > 0);

    // Search
    const q = U.safeStr(f.q).trim().toLowerCase();
    if (q) {
      out = out.filter((rr) => {
        const run = rr?._run || {};
        const hay = [
          rr?.automation_name,
          rr?.automation_id,
          rr?.owner_name,
          rr?.owner_email,
          run?.id,
          run?.run_id,
          run?.status,
          JSON.stringify(getFlags(run) || ""),
        ]
          .map((x) => U.safeStr(x).toLowerCase())
          .join(" ");
        return hay.includes(q);
      });
    }

    // Owner filter
    const ownerKey = U.safeStr(f.owner).trim();
    if (ownerKey) {
      out = out.filter((r) => {
        const key =
          U.safeStr(r?.owner_email).trim() || U.safeStr(r?.owner_name).trim();
        return key === ownerKey;
      });
    }

    // Optional: treat "status" filter as run status in this view
    const status = U.safeStr(f.status);
    if (status && status !== "All") {
      out = out.filter((r) => U.safeStr((r?._run || {})?.status) === status);
    }

    return out;
  }

  RA.components.AutomationsFlaggedView = {
    name: "AutomationsFlaggedView",

    props: {
      shared: { type: Object, required: true },
      automations: { type: Array, required: true }, // unused, but kept for consistent signature
      runs: { type: Array, required: true },        // ✅ this is the input for this view
      colors: { type: Object, required: true },
      filters: { type: Object, required: true },
      util: { type: Object, required: true },
    },

    data() {
      const table = new ReportTable({
        rows: [],
        columns: [],
        sort_column: "Started",
        sort_dir: -1,
        colors: this.colors,
      });

      table.setColumns(buildColumns(this));
      return { table };
    },

    computed: {
      visibleRows() {
        const filtered = filterRows(this, this.runs);
        this.table.setRows(filtered);
        return this.table.getSortedRows();
      },

      flaggedCount() {
        return (this.visibleRows || []).length;
      },
    },

    methods: {
      getColumnsWidthsString() {
        return this.table.getColumnsWidthsString();
      },

      setSortColumn(name) {
        this.table.setSortColumn(name);
      },
    },

    template: `
      <div>
        <div class="btech-muted" style="font-size:12px; margin-bottom:8px;">
          Showing only runs with flags ({{ flaggedCount }}).
        </div>

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
          :key="(row._run && (row._run.id || row._run.run_id)) || (row.automation_id + '_' + i)"
          style="padding:.25rem .5rem; display:grid; align-items: center; font-size:.75rem; line-height:1.35rem;"
          :style="{
            'grid-template-columns': getColumnsWidthsString(),
            'background-color': (i % 2) ? 'white' : '#F8F8F8'
          }"
        >
        <div
          v-for="col in table.getVisibleColumns()"
          :key="col.name"
          :title="col.getTooltip(row)"
          :style="Object.assign(
            { display:'inline-block', overflow:'hidden', textOverflow:'ellipsis' },
            col.get_style(row) || {}
          )"
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
