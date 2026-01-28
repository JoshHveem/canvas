// completion.js
(function (w) {
  const COMPLETION = {};

  // ---- tiny primitives ----
  COMPLETION.safeProb = function safeProb(v) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : NaN;
  };

  COMPLETION.bucketFromChance = function bucketFromChance(prob) {
    const n = COMPLETION.safeProb(prob);
    if (!Number.isFinite(n)) return null;
    if (n >= 0.80) return "green";
    if (n >= 0.50) return "yellow";
    if (n >= 0.20) return "orange";
    return "red";
  };

  // Optional: let caller pass colors, otherwise fall back to bridgetools/defaults.
  COMPLETION.getColors = function getColors(colors) {
    return (
      colors ||
      (w.bridgetools && w.bridgetools.colors) || {
        red: "#b20b0f",
        orange: "#f59e0b",
        yellow: "#eab308",
        green: "#16a34a",
        gray: "#e5e7eb",
        black: "#111827",
        white: "#fff",
      }
    );
  };

  COMPLETION.bucketColor = function bucketColor(bucket) {
    const c = bridgetools.colors;
    if (bucket === "green") return c.green;
    if (bucket === "yellow") return c.yellow;
    if (bucket === "orange") return c.orange;
    if (bucket === "red") return c.red;
    return c.gray;
  };

  // ---- data access helpers ----
  COMPLETION.getStudentsFromProgram = function getStudentsFromProgram(p) {
    const s = p?.completion?.students ?? p?.students ?? [];
    return Array.isArray(s) ? s : [];
  };

  COMPLETION.getExiterCounts = function getExiterCounts(students) {
    const list = Array.isArray(students) ? students : [];
    const exiters = list.filter((s) => !!s?.is_exited);
    const completers = exiters.filter((s) => !!s?.is_completer);
    const nonCompleters = exiters.filter((s) => !s?.is_completer);
    return { exiters, completers, nonCompleters };
  };

  // Candidates = actives with valid chance_to_complete
  // Tie-breakers optional: projectedEndDateFn, safeNameFn (for the individual view)
  COMPLETION.getCandidates = function getCandidates(students, opts) {
    const options = opts || {};
    const projectedEndDateFn = options.projectedEndDateFn || null;
    const safeNameFn = options.safeNameFn || null;

    const list = Array.isArray(students) ? students : [];

    const raw = list
      .filter((s) => !s?.is_exited)
      .map((s) => ({ s, prob: COMPLETION.safeProb(s?.chance_to_complete) }))
      .filter((x) => Number.isFinite(x.prob));

    raw.sort((a, b) => {
      if (a.prob !== b.prob) return b.prob - a.prob;

      // optional tie-breakers (match your single-program view)
      const da = projectedEndDateFn?.(a.s)?.getTime?.() ?? Infinity;
      const db = projectedEndDateFn?.(b.s)?.getTime?.() ?? Infinity;
      if (da !== db) return da - db;

      const na = (safeNameFn?.(a.s) ?? "").toLowerCase();
      const nb = (safeNameFn?.(b.s) ?? "").toLowerCase();
      return na.localeCompare(nb);
    });

    return raw;
  };

  // ---- core chooser (INDIVIDUAL REPORT behavior) ----
  // If ALL greens can reach target => choose ALL greens.
  // Else take greens until hit target, then spill into rest until hit.
  COMPLETION.chooseToHitTarget = function chooseToHitTarget(baseE, baseC, candidates, opts) {
    const options = opts || {};
    const target = Number.isFinite(Number(options.target)) ? Number(options.target) : 0.60;

    const E = Number(baseE) || 0;
    const C = Number(baseC) || 0;

    if (!E) return [];
    if ((C / E) >= target) return [];

    const list = Array.isArray(candidates) ? candidates : [];
    if (!list.length) return [];

    const greens = list.filter((x) => COMPLETION.bucketFromChance(x.prob) === "green");
    const rest = list.filter((x) => COMPLETION.bucketFromChance(x.prob) !== "green");

    const rateIfAllGreens =
      (E + greens.length) ? ((C + greens.length) / (E + greens.length)) : null;

    const hitsWithGreens = Number.isFinite(rateIfAllGreens) && rateIfAllGreens >= target;

    const chosen = [];
    let add = 0;

    const takeUntilHit = (arr) => {
      for (const x of arr) {
        chosen.push(x);
        add += 1;
        const denom = E + add;
        const num = C + add;
        if (denom > 0 && (num / denom) >= target) break;
      }
    };

    if (hitsWithGreens) {
      chosen.push(...greens); // <-- the key behavior you want everywhere
    } else {
      takeUntilHit(greens);
      if ((E + add) > 0 && ((C + add) / (E + add)) < target) {
        takeUntilHit(rest);
      }
    }

    return chosen;
  };

  COMPLETION.statusBucketFromChosen = function statusBucketFromChosen(chosen) {
    if (!Array.isArray(chosen) || !chosen.length) return "red";
    const last = chosen[chosen.length - 1];
    return COMPLETION.bucketFromChance(last?.prob) || "red";
  };

  // ---- convenience wrappers ----
  // Compute completion info given a student list
  COMPLETION.computeStudents = function computeStudents(students, opts) {
    const options = opts || {};
    const target = Number.isFinite(Number(options.target)) ? Number(options.target) : 0.60;

    const { exiters, completers, nonCompleters } = COMPLETION.getExiterCounts(students);
    const baseE = exiters.length;
    const baseC = completers.length;

    const currentRate = baseE ? (baseC / baseE) : null;

    const candidates = COMPLETION.getCandidates(students, options);

    // ✅ forecast for the bar (your “on track” definition)
    const predicted = candidates.filter(x => COMPLETION.bucketFromChance(x?.prob) === "green");

    // ✅ true minimum needed to hit target
    const neededMin = COMPLETION.minNeededToHitTarget(baseE, baseC, candidates, { target });

    // status should still reflect the *minimum-needed last student*, not the forecast
    const chosenMin = candidates.slice(0, neededMin);
    const statusBucket =
      (!baseE) ? "green" :
      (Number.isFinite(currentRate) && currentRate >= target) ? "green" :
      (neededMin <= 0) ? "green" :
      (COMPLETION.bucketFromChance(chosenMin[chosenMin.length - 1]?.prob) || "red");

    return {
      target,
      baseE,
      baseC,
      currentRate,
      exiters,
      completers,
      nonCompleters,
      candidates,

      predicted,   // bar uses this
      neededMin,   // Needed column uses this
      statusBucket // status uses minimum-needed last student
    };
  };

  // Compute completion info given a program object (multi-program view)
  COMPLETION.computeProgram = function computeProgram(program, opts) {
    const students = COMPLETION.getStudentsFromProgram(program);
    return COMPLETION.computeStudents(students, opts);
  };

  COMPLETION.minNeededToHitTarget = function minNeededToHitTarget(baseE, baseC, candidates, opts) {
    const options = opts || {};
    const target = Number.isFinite(Number(options.target)) ? Number(options.target) : 0.60;

    const E = Number(baseE) || 0;
    const C = Number(baseC) || 0;

    if (!E) return 0;
    if ((C / E) >= target) return 0;

    const list = Array.isArray(candidates) ? candidates : [];
    let add = 0;

    for (let i = 0; i < list.length; i++) {
      add += 1;
      const denom = E + add;
      const num = C + add;
      if (denom > 0 && (num / denom) >= target) return add;
    }
    return list.length;
  };

  COMPLETION.minNeededToHitTarget = function minNeededToHitTarget(baseE, baseC, candidates, opts) {
    const options = opts || {};
    const target = Number.isFinite(Number(options.target)) ? Number(options.target) : 0.60;

    const E = Number(baseE) || 0;
    const C = Number(baseC) || 0;

    if (!E) return 0;
    if ((C / E) >= target) return 0;

    const list = Array.isArray(candidates) ? candidates : [];
    let add = 0;

    for (let i = 0; i < list.length; i++) {
      add += 1;
      const denom = E + add;
      const num = C + add;
      if (denom > 0 && (num / denom) >= target) return add;
    }

    return list.length; // even everyone doesn't get you there -> "needed" is all
  };

  // ✅ bar selection rule you described
  COMPLETION.chooseForBar = function chooseForBar(baseE, baseC, candidates, opts) {
    const options = opts || {};
    const target = Number.isFinite(Number(options.target)) ? Number(options.target) : 0.60;

    const E = Number(baseE) || 0;
    const C = Number(baseC) || 0;

    const list = Array.isArray(candidates) ? candidates : [];
    if (!E || !list.length) return [];

    const current = (E > 0) ? (C / E) : null;

    // If already >= target: show greens (on-track forecast) rather than "minimum"
    // (change this if you’d prefer bar = 0 candidates when already compliant)
    const greens = list.filter(x => COMPLETION.bucketFromChance(x?.prob) === "green");
    const rateIfAllGreens =
      (E + greens.length) ? ((C + greens.length) / (E + greens.length)) : null;

    if (Number.isFinite(rateIfAllGreens) && rateIfAllGreens >= target) {
      // “If on-track gets you across threshold, show all green”
      return greens;
    }

    // Otherwise, show minimum candidates (across buckets) until hit target,
    // or all candidates if cannot hit.
    const chosen = [];
    let add = 0;

    for (const x of list) {
      chosen.push(x);
      add += 1;
      const denom = E + add;
      const num = C + add;
      if (denom > 0 && (num / denom) >= target) return chosen;
    }

    return chosen; // all candidates (still not enough)
  };

  // ---- computeStudents updated return payload ----
  const _oldComputeStudents = COMPLETION.computeStudents;

  COMPLETION.computeStudents = function computeStudents(students, opts) {
    const options = opts || {};
    const target = Number.isFinite(Number(options.target)) ? Number(options.target) : 0.60;

    const { exiters, completers, nonCompleters } = COMPLETION.getExiterCounts(students);
    const baseE = exiters.length;
    const baseC = completers.length;

    const currentRate = baseE ? (baseC / baseE) : null;

    const candidates = COMPLETION.getCandidates(students, options);

    const neededMin = COMPLETION.minNeededToHitTarget(baseE, baseC, candidates, { target });
    const chosenMin = candidates.slice(0, neededMin);

    const barChosen = COMPLETION.chooseForBar(baseE, baseC, candidates, { target });

    const statusBucket =
      (!baseE) ? "green" :
      (Number.isFinite(currentRate) && currentRate >= target) ? "green" :
      (chosenMin.length ? (COMPLETION.bucketFromChance(chosenMin[chosenMin.length - 1]?.prob) || "red") : "red");

    return {
      target,
      baseE,
      baseC,
      currentRate,
      exiters,
      completers,
      nonCompleters,
      candidates,

      // ✅ new: minimum needed for the Needed column / Status
      neededMin,
      chosenMin,

      // ✅ new: what the BAR should render (selection only; colors still by bucket)
      barChosen,

      statusBucket
    };
  };

  // convenience wrapper stays the same
  COMPLETION.computeProgram = function computeProgram(program, opts) {
    const students = COMPLETION.getStudentsFromProgram(program);
    return COMPLETION.computeStudents(students, opts);
  };


  // export
  w.COMPLETION = COMPLETION;
})(window);
