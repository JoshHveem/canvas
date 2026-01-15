(function () {
  const RA = (window.ReportAutomations = window.ReportAutomations || {});
  RA.columns = RA.columns || {};

  function util() {
    const U = window.ReportCore?.util;
    if (!U) throw new Error("ReportCore.util not loaded yet");
    return U;
  }

  RA.columns.buildColumns = function buildColumns(vm) {
    const U = util();

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
          return em
            ? `${nm}<br><span class="btech-muted">${em}</span>`
            : nm;
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
          if (!t) return "n/a";
          return `${U.fmtDateTime(t)}`;
        },
        (r) => vm.lastRunStyle(r),
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
  };

  RA.columns.buildGraphColumns = function buildGraphColumns(vm) {
    const U = util();

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
        (r) => `${U.safeStr(r?.name)}`,
        null,
        (r) => U.safeStr(r?.name)
      ),

      // The "Graph" cell is just a container; report.js will render into it by id
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
        () => ({
          whiteSpace: "normal",
          overflow: "visible",
        }),
        () => 0
      ),
    ];
  };

  RA.columns.buildFlaggedColumns = function buildFlaggedColumns(vm) {
    const U = util();

    function getRun(r) {
      return r?._run || r;
    }

    function getFlags(run) {
      return run?.flags || run?._flags || run?.flag_data || run?.flagData || null;
    }

    function flagsToText(flags) {
      if (!flags) return "";
      if (Array.isArray(flags)) return flags.join(", ");
      if (typeof flags === "object") return Object.keys(flags).join(", ");
      return U.safeStr(flags);
    }

    function prettyFlagsHtml(flags) {
      if (!flags) return `<span class="btech-muted">—</span>`;

      // If flags is an object, show key/value list
      if (typeof flags === "object" && !Array.isArray(flags)) {
        const entries = Object.entries(flags);
        if (!entries.length) return `<span class="btech-muted">—</span>`;

        return `
          <div style="white-space:normal; line-height:1.25;">
            ${entries
              .map(([k, v]) => {
                const vv = (typeof v === "object") ? JSON.stringify(v) : U.safeStr(v);
                return `<div><b>${U.safeStr(k)}:</b> ${U.safeStr(vv)}</div>`;
              })
              .join("")}
          </div>
        `;
      }

      // If array, show bullet-ish list
      if (Array.isArray(flags)) {
        return `
          <div style="white-space:normal; line-height:1.25;">
            ${flags.map((x) => `<div>• ${U.safeStr(x)}</div>`).join("")}
          </div>
        `;
      }

      // fallback string
      return `<div style="white-space:normal;">${U.safeStr(flags)}</div>`;
    }

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
        (r) => {
          const run = getRun(r);
          return U.safeStr(run?.id || run?.run_id);
        },
        null,
        (r) => U.safeStr(getRun(r)?.id || getRun(r)?.run_id)
      ),

      new ReportColumn(
        "Run Status",
        "Status of this run",
        "7rem",
        false,
        "string",
        (r) => U.safeStr(getRun(r)?.status),
        null,
        (r) => U.safeStr(getRun(r)?.status)
      ),

      new ReportColumn(
        "Started",
        "Run start time",
        "14rem",
        false,
        "number",
        (r) => {
          const run = getRun(r);
          const t = run?.started_at || run?.start_time || run?.created_at;
          return t ? U.fmtDateTime(t) : "n/a";
        },
        null,
        (r) => {
          const run = getRun(r);
          return U.parseTs(run?.started_at || run?.start_time || run?.created_at);
        }
      ),

      new ReportColumn(
        "Duration",
        "Run duration",
        "8rem",
        false,
        "number",
        (r) => {
          const run = getRun(r);
          const ms = run?.duration_ms || run?.durationMs;
          return U.msToPretty(ms);
        },
        null,
        (r) => Number(getRun(r)?.duration_ms ?? getRun(r)?.durationMs ?? NaN)
      ),

      new ReportColumn(
        "Flags",
        "Flag payload for this run",
        "1fr",
        false,
        "string",
        (r) => {
          const run = getRun(r);
          return prettyFlagsHtml(getFlags(run));
        },
        () => ({
          whiteSpace: "normal",
          overflowWrap: "anywhere",
          lineHeight: "1.25",
        }),
        (r) => {
          const run = getRun(r);
          const flags = getFlags(run);
          // sort by "how many flags" if possible
          if (Array.isArray(flags)) return flags.length;
          if (typeof flags === "object" && flags) return Object.keys(flags).length;
          return flagsToText(flags).length;
        }
      ),
    ];
  };

})();
