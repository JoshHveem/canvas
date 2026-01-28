// completion.js
(function (w) {
  const COMPLETION = {};

  // ---- tiny primitives ----
  COMPLETION.safeProb = function (v) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : NaN;
  };

  COMPLETION.bucketFromChance = function (prob) {
    const n = COMPLETION.safeProb(prob);
    if (!Number.isFinite(n)) return null;
    if (n >= 0.80) return "green";
    if (n >= 0.50) return "yellow";
    if (n >= 0.20) return "orange";
    return "red";
  };

  COMPLETION.getColors = function (colors) {
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

  COMPLETION.bucketColor = function (bucket, colors) {
    const c = COMPLETION.getColors(colors);
    if (bucket === "green") return c.green;
    if (bucket === "yellow") return c.yellow;
    if (bucket === "orange") return c.orange;
    if (bucket === "red") return c.red;
    return c.gray;
  };

  // ---- data helpers ----
  COMPLETION.getStudentsFromProgram = function (p) {
    const s = p?.completion?.students ?? p?.students ?? [];
    return Array.isArray(s) ? s : [];
  };

  COMPLETION.getExiterCounts = function (students) {
    const list = Array.isArray(students) ? students : [];
    const exiters = list.filter((s) => !!s?.is_exited);
    const completers = exiters.filter((s) => !!s?.is_completer);
    const nonCompleters = exiters.filter((s) => !s?.is_completer);
    return { exiters, completers, nonCompleters };
  };

  // candidates: actives with valid chance_to_complete, sorted high->low
  // optional tie-breakers for the single-program view
  COMPLETION.getCandidates = function (students, opts) {
    const options = opts || {};
    const projectedEndDateFn = options.projectedEndDateFn || null;
    const safeNameFn = options.safeNameFn || null;

    const list = Array.isArray(students) ? students : [];

    const out = list
      .filter((s) => !s?.is_exited)
      .map((s) => ({ s, prob: COMPLETION.safeProb(s?.chance_to_complete) }))
      .filter((x) => Number.isFinite(x.prob));

    out.sort((a, b) => {
      if (a.prob !== b.prob) return b.prob - a.prob;

      const da = projectedEndDateFn?.(a.s)?.getTime?.() ?? Infinity;
      const db = projectedEndDateFn?.(b.s)?.getTime?.() ?? Infinity;
      if (da !== db) return da - db;

      const na = (safeNameFn?.(a.s) ?? "").toLowerCase();
      const nb = (safeNameFn?.(b.s) ?? "").toLowerCase();
      return na.localeCompare(nb);
    });

    return out;
  };

  // minimum additional projected completers needed to reach target
  function minNeeded(E, C, candidates, target) {
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

    // even everyone doesn’t get you there => “needed” is all candidates
    return list.length;
  }

  // bar selection:
  // - if all greens would reach target => show ALL greens
  // - else show minimum prefix to reach target (or all if cannot)
  function chooseForBar(E, C, candidates, target) {
    const list = Array.isArray(candidates) ? candidates : [];
    if (!E || !list.length) return [];

    const greens = list.filter((x) => COMPLETION.bucketFromChance(x?.prob) === "green");
    const rateIfAllGreens =
      (E + greens.length) ? ((C + greens.length) / (E + greens.length)) : null;

    if (Number.isFinite(rateIfAllGreens) && rateIfAllGreens >= target) return greens;

    const chosen = [];
    let add = 0;
    for (const x of list) {
      chosen.push(x);
      add += 1;
      const denom = E + add;
      const num = C + add;
      if (denom > 0 && (num / denom) >= target) break;
    }
    return chosen;
  }

  // ---- main compute ----
  COMPLETION.computeStudents = function (students, opts) {
    const options = opts || {};
    const target = Number.isFinite(Number(options.target)) ? Number(options.target) : 0.60;

    const { exiters, completers, nonCompleters } = COMPLETION.getExiterCounts(students);
    const baseE = exiters.length;
    const baseC = completers.length;

    const currentRate = baseE ? (baseC / baseE) : null;

    const candidates = COMPLETION.getCandidates(students, options);

    const neededMin = minNeeded(baseE, baseC, candidates, target);
    const chosenMin = candidates.slice(0, neededMin);

    const barChosen = chooseForBar(baseE, baseC, candidates, target);

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
      neededMin,
      barChosen,
      statusBucket
    };
  };

  COMPLETION.computeProgram = function (program, opts) {
    return COMPLETION.computeStudents(COMPLETION.getStudentsFromProgram(program), opts);
  };

  w.COMPLETION = COMPLETION;
})(window);
