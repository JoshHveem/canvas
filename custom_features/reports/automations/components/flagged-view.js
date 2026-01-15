(function () {
  const RA = (window.ReportAutomations = window.ReportAutomations || {});
  RA.components = RA.components || {};

  function getFlags(run) {
    return run?.flags || run?._flags || run?.flag_data || run?.flagData || null;
  }

  function flagsCount(util, flags) {
    if (!flags) return 0;
    if (Array.isArray(flags)) return flags.length;
    if (typeof flags === "object") return Object.keys(flags).length;
    return util.safeStr(flags).trim() ? 1 : 0;
  }

  function prettyFlagsHtml(util, flags) {
    if (!flags) return `<span class="btech-muted">—</span>`;

    if (typeof flags === "object" && !Array.isArray(flags)) {
      const entries = Object.entries(flags);
      if (!entries.length) return `<span class="btech-muted">—</span>`;
      return `
        <div style="white-space:normal; line-height:1.25;">
          ${entries.map(([k, v]) => {
            const vv = (typeof v === "object") ? JSON.stringify(v) : util.safeStr(v);
            return `<div><b>${util.safeStr(k)}:</b> ${util.safeStr(vv)}</div>`;
          }).join("")}
        </div>
      `;
    }

    if (Array.isArray(flags)) {
      return `
        <div style="white-space:normal; line-height:1.25;">
          ${flags.map((x) => `<div>• ${util.safeStr(x)}</div>`).join("")}
        </div>
      `;
    }

    return `<div style="white-space:normal;">${util.safeStr(flags)}</div>`;
  }

  function buildColumns(vm) {
    const U = vm.util;

    return [
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
        "Run ID",
        "Unique run identifier",
        "7rem",
        false,
        "string",
        (r) => U.safeStr(r?._run?.id || r?._run?.run_id),
        null,
        (r) => U.safeStr(r?._run?.id || r?._run?.run_id)
      ),

      new ReportColumn(
        "Run Status",
        "Status of this run",
        "7rem",
        false,
        "string",
        (r) => U.safeStr(r?._run?.status),
        null,
        (r) => U.safeStr(r?._run?.status)
      ),

      new ReportColumn(
        "Started",
        "Run start time",
        "14rem",
        false,
        "number",
        (r) => {
          const t = r?._run?.started_at || r?._run?.start_time || r?._run?.created_at;
          return t ? U.fmtDateTime(t) : "n/a";
        },
        null,
        (r) => {
          const t = r?._run?.started_at || r?._run?.start_time || r?._run?.created_at;
          return U.parseTs(t);
        }
      ),

      new ReportColumn(
        "Duration",
        "Run duration",
        "8rem",
        false,
        "number",
        (r) => U.msToPretty(r?._run?.duration_ms || r?._run?.durationMs),
        null,
        (r) => Number(r?._run?.duration_ms ?? r?._run?.durationMs ?? NaN)
      ),

      new ReportColumn(
        "Flags",
        "Flag payload for this run",
        "1fr",
        false,
        "string",
        (r) => prettyFlagsHtml(U, getFlags(r?._run)),
        () => ({ whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: "1.25" }),
        (r) => flagsCount(U, getFlags(r?._run))
      ),
    ];
  }

  function filterRows(vm, rows) {
    const U = vm.util;
    const f = vm.filters || {};
    let out = Array.isArray(rows) ? rows : [];

    // Only flagged runs
    out = out.filter((r) => flagsCount(U, getFlags(r?._run)) > 0);

    const q = U.safeStr(f.q).trim().toLowerCase();
    if (q) {
      out = out.filter((rr) => {
        const run = rr?._run;
        const hay = [
          rr?.automation_name,
          rr?.automation_id,
          rr?.owner_name,
          rr?.owner_email,
          run?.id,
          run?.status,
          JSON.stringify(getFlags(run) || ""),
        ].map((x) => U.safeStr(x).toLowerCase()).join(" ");
        return hay.includes(q);
      });
    }

    const ownerKey = U.safeStr(f.owner).trim();
    if (ownerKey) {
      out = out.filter((r) => (U.safeStr(r?.owner_email).trim() || U.safeStr(r?.owner_name).trim()) === ownerKey);
    }

    // allow "status" filter to apply to run.status (optional but useful)
    const status = U.safeStr(f.status);
    if (status && status !== "All") {
      out = out.filter((r) => U.safeStr(r?._run?.status) === status);
    }

    return out;
  }

  RA.components.AutomationsFlaggedView = {
    name: "AutomationsFlaggedView",
    props: {
      automations: { type: Array, required: true }, // unused
      runs: { type: Array, required: true },
      colors: { type: Object, required: true },
      filters: { type: Object, required: true },
      util: { type: Object, required: true },
    },

    data() {
      const table = new ReportTable({ rows: [], columns: [], sort_column: "Started", sort_dir: -1, colors: this.colors });
      table.setColumns(buildColumns(this));
      return { table };
    },

    computed: {
      rows() {
        const filtered = filterRows(this, this.runs);
        this.table.setRows(filtered);
        return this.table.getSortedRows();
      },
    },

    methods: {
      getColumnsWidthsString(table) {
        return table.getColumnsWidthsString();
      },
      setSortColumn(table, name) {
        table.setSortColumn(name);
      },
    },

    template: `
      <div>
        <div class="btech-muted" style="font-size:12px; margin-bottom:8px;">
          Showing only runs with flags.
        </div>
        ${window.ReportAutomations.components.AutomationsTableView.template}
      </div>
    `,
  };
})();
