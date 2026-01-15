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
        "Flags",
        "Which checks triggered (placeholder)",
        "1fr",
        false,
        "string",
        (r) => {
          // Placeholder for now; later you’ll format actual flags from r._metrics
          return `<span class="btech-muted" style="font-size:12px;">(flags coming soon)</span>`;
        },
        () => ({
          whiteSpace: "normal",
          overflowWrap: "anywhere",
        }),
        (r) => 0
      ),
    ];
  };
})();
