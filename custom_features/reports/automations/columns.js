(function () {
  const RA = (window.ReportAutomations = window.ReportAutomations || {});
  const U = window.ReportCore?.util;

  RA.columns = RA.columns || {};

  RA.columns.buildColumns = function buildColumns(vm) {
    // vm is the Vue instance (`this`) so we can call vm.statusStyle etc.
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
        "Name",
        "2rem",
        false,
        "string",
        (r) =>
          `${r?.automation_id}`,
        null,
        (r) => r?.automation_id
      ),

      new ReportColumn(
        "Automation",
        "Name",
        "18rem",
        false,
        "string",
        (r) =>
          `${U.safeStr(r?.name)}`,
        null,
        (r) => U.safeStr(r?.name)
      ),

      new ReportColumn(
        "Description",
        "Automation description",
        "24rem",
        false,
        "string",
        (r) => U.safeStr(r?.description),
        null,
        (r) => U.safeStr(r?.description)
      ),

      new ReportColumn(
        "Owner",
        "Owner name/email",
        "8rem",
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
        "Most recent run time + success/fail",
        "14rem",
        false,
        "number",
        (r) => {
          const t = r?._metrics?.last_success_time;
          if (!t) return "n/a";
          return `${U.fmtDateTime(t)}`;
        },
        (r) => vm.lastRunStyle(r),
        (r) => U.parseTs(r?._metrics?.last_success_time)
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
})();
