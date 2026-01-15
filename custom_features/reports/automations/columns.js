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
        "10rem",
        false,
        "string",
        (r) => U.safeStr(r?._metrics?.status),
        (r) => vm.statusStyle(r?._metrics?.status),
        (r) => U.safeStr(r?._metrics?.status)
      ),

      new ReportColumn(
        "Automation",
        "Name (automation_id)",
        "18rem",
        false,
        "string",
        (r) =>
          `${U.safeStr(r?.name)} <span class="btech-muted">(#${U.safeStr(
            r?.automation_id
          )})</span>`,
        null,
        (r) => U.safeStr(r?.name)
      ),

      new ReportColumn(
        "Owner",
        "Owner name/email",
        "16rem",
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
          const ok = r?._metrics?.last_run_success;
          if (!t) return "n/a";
          const label = ok === true ? "success" : ok === false ? "FAIL" : "n/a";
          return `${U.fmtDateTime(t)}<br><span class="btech-muted">${label}</span>`;
        },
        (r) => vm.lastRunStyle(r),
        (r) => parseTs(r?._metrics?.last_success_time)
      ),

      new ReportColumn(
        "Days Since",
        "Days since last run",
        "7rem",
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
        "Fail Streak",
        "Consecutive failures since last success",
        "8rem",
        false,
        "number",
        (r) => Number(r?._metrics?.fails_since_success ?? 0),
        (r) => vm.failStreakStyle(r?._metrics?.fails_since_success),
        (r) => Number(r?._metrics?.fails_since_success ?? 0)
      ),

      new ReportColumn(
        "Runs",
        "Total runs in window",
        "5rem",
        false,
        "number",
        (r) => Number(r?._metrics?.total_runs ?? 0),
        null,
        (r) => Number(r?._metrics?.total_runs ?? 0)
      ),

      new ReportColumn(
        "Success %",
        "Success rate over window",
        "7rem",
        false,
        "number",
        (r) => {
          const p = r?._metrics?.success_rate;
          return Number.isFinite(p) ? (p * 100).toFixed(0) + "%" : "n/a";
        },
        (r) => vm.successPctStyle(r?._metrics?.success_rate),
        (r) => Number(r?._metrics?.success_rate ?? NaN)
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
    ];
  };
})();
