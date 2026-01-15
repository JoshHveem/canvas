(function () {
  const RA = (window.ReportAutomations = window.ReportAutomations || {});
  const U = window.ReportCore?.util;

  RA.metrics = RA.metrics || {};

  RA.metrics.computeAutomationMetrics = function computeAutomationMetrics(a) {
    const runs = Array.isArray(a?.runs) ? a.runs.slice() : [];
    console.log(runs);
    runs.sort((x, y) => U.parseTs(y?.run_time) - U.parseTs(x?.run_time));

    const lastRun = runs[0] || null;
    const lastRunTime = lastRun?.run_time ?? null;
    const lastSuccess = runs.find((r) => r && r.success === true) || null;
    const lastSuccessTime = lastSuccess?.run_time ?? null;

    let failsSinceSuccess = 0;
    for (const r of runs) {
      if (!r) continue;
      if (r.success === true) break;
      if (r.success === false) failsSinceSuccess += 1;
    }

    const total = runs.length;
    const successes = runs.filter((r) => r?.success === true).length;
    const successRate = total ? successes / total : NaN;

    const durations = runs
      .map((r) => Number(r?.duration_ms))
      .filter((n) => Number.isFinite(n) && n >= 0);
    const avgDuration = durations.length
      ? durations.reduce((s, n) => s + n, 0) / durations.length
      : NaN;

    const daysSinceLast = lastRunTime ? U.daysAgo(lastRunTime) : NaN;

    let status = "Unknown";
    if (!lastRun) status = "No Runs";
    else if (
      lastRun.success === false ||
      failsSinceSuccess >= 3 ||
      (Number.isFinite(daysSinceLast) && daysSinceLast >= 7)
    )
      status = "Needs Attention";
    else if (
      failsSinceSuccess >= 1 ||
      (Number.isFinite(daysSinceLast) && daysSinceLast >= 3)
    )
      status = "Watch";
    else status = "Healthy";

    return {
      ...a,
      _runs_sorted: runs,
      _metrics: {
        total_runs: total,
        successes,
        success_rate: successRate,
        avg_duration_ms: avgDuration,
        last_run_time: lastRunTime,
        last_run_success: lastRun ? Boolean(lastRun.success) : null,
        last_success_time: lastSuccessTime,
        fails_since_success: failsSinceSuccess,
        days_since_last_run: daysSinceLast,
        status,
      },
    };
  };
})();
