(function () {
  const RA = (window.ReportAutomations = window.ReportAutomations || {});
  const U = window.ReportCore?.util;

  RA.metrics = RA.metrics || {};

  function hasAnyFlags(run) {
    const f = run?.flags;
    if (!f) return false;
    if (Array.isArray(f)) return f.length > 0;
    if (typeof f === "object") return Object.keys(f).length > 0;
    return Boolean(f);
  }

  function computeRunStatus(r) {
    // Normalize success like you did in chart code
    const s = r?.success;
    const ok  = (s === true || s === "true" || s === 1 || s === "1");
    const bad = (s === false || s === "false" || s === 0 || s === "0");

    if (bad) return "Error";
    if (ok) return hasAnyFlags(r) ? "Flagged" : "Healthy";
    return "Unknown";
  }

  RA.metrics.computeAutomationMetrics = function computeAutomationMetrics(a) {
    const runs = Array.isArray(a?.runs) ? a.runs.slice() : [];
    runs.sort((x, y) => U.parseTs(y?.run_time) - U.parseTs(x?.run_time));

    // --- preprocess runs ONCE ---
    const runs_pre = runs.map(r => {
      if (!r) return r;
      const run_status = computeRunStatus(r);
      return { ...r, run_status };
    });

    const lastRun = runs_pre[0] || null;
    const lastRunTime = lastRun?.run_time ?? null;
    const lastRunStatus = lastRun?.run_status ?? (lastRun ? "Unknown" : null);

    const lastSuccess = runs_pre.find((r) => r && r.run_status === "Healthy") || null;
    const lastSuccessTime = lastSuccess?.run_time ?? null;

    // Fail streak (count errors until first non-error)
    let failsSinceNonError = 0;
    for (const r of runs_pre) {
      if (!r) continue;
      if (r.run_status !== "Error") break;
      failsSinceNonError += 1;
    }

    const total = runs_pre.length;
    const successes = runs_pre.filter((r) => r?.run_status === "Healthy").length;
    const flagged = runs_pre.filter((r) => r?.run_status === "Flagged").length;
    const errors = runs_pre.filter((r) => r?.run_status === "Error").length;

    const successRate = total ? successes / total : NaN;

    const durations = runs_pre
      .map((r) => Number(r?.duration_ms))
      .filter((n) => Number.isFinite(n) && n >= 0);

    const avgDuration = durations.length
      ? durations.reduce((s, n) => s + n, 0) / durations.length
      : NaN;

    const daysSinceLast = lastRunTime ? U.daysAgo(lastRunTime) : NaN;

    // --- automation-level status derived from ONE consistent notion ---
    // Priority: Error > Flagged > Healthy, plus your "staleness/streak" overrides.
    let status = "Unknown";
    if (!lastRun) status = "No Runs";
    else if (
      lastRunStatus === "Error" ||
      failsSinceNonError >= 3 ||
      (Number.isFinite(daysSinceLast) && daysSinceLast >= 7)
    ) {
      status = "Error";
    } else if (
      lastRunStatus === "Flagged" ||                 // <--- NEW: flags matter
      failsSinceNonError >= 1 ||
      (Number.isFinite(daysSinceLast) && daysSinceLast >= 3)
    ) {
      status = "Flagged";
    } else {
      status = "Healthy";
    }

    return {
      ...a,
      _runs_sorted: runs_pre,
      _metrics: {
        total_runs: total,
        successes,
        flagged,
        errors,
        success_rate: successRate,
        avg_duration_ms: avgDuration,
        last_run_time: lastRunTime,
        last_run_status: lastRunStatus,             // <--- NEW
        last_run_success: lastRun
          ? (lastRunStatus !== "Error")             // optional: keep old field for compatibility
          : null,
        last_success_time: lastSuccessTime,
        fails_since_nonerror: failsSinceNonError,   // <--- renamed semantics; optional
        days_since_last_run: daysSinceLast,
        status,
      },
    };
  };
})();
