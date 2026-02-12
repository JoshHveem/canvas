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

  // ---- schema helpers (NEW) ----
  function getSchema(opts) {
    const mode = (opts && opts.mode) || "completion";
    if (mode === "graduation") {
      return {
        mode: "graduation",
        probField: "chance_to_graduate",
        okField: "is_graduate",
        okPlural: "graduates",
        notOkPlural: "nonGraduates",
      };
    }
    // default: completion
    return {
      mode: "completion",
      probField: "chance_to_complete",
      okField: "is_completer",
      okPlural: "completers",
      notOkPlural: "nonCompleters",
    };
  }

  function boolField(s, field) {
    return !!(s && s[field]);
  }

  function probField(s, field) {
    return COMPLETION.safeProb(s ? s[field] : undefined);
  }

  // ---- data helpers ----
  COMPLETION.getStudentsFromProgram = function (p) {
    const s = p?.completion?.students ?? p?.students ?? [];
    return Array.isArray(s) ? s : [];
  };

  // generalized exiter counts (UPDATED)
  COMPLETION.getExiterCounts = function (students, opts) {
    const schema = getSchema(opts);
    const list = Array.isArray(students) ? students : [];
    const exiters = list.filter((s) => !!s?.is_exited);

    const ok = exiters.filter((s) => boolField(s, schema.okField));
    const notOk = exiters.filter((s) => !boolField(s, schema.okField));

    // return both generic + mode-named keys for convenience
    const out = { exiters, ok, notOk };
    out[schema.okPlural] = ok;
    out[schema.notOkPlural] = notOk;

    return out;
  };

  // candidates: actives with valid probField, sorted high->low
  COMPLETION.getCandidates = function (students, opts) {
    const options = opts || {};
    const schema = getSchema(options);

    const projectedEndDateFn = options.projectedEndDateFn || null;
    const safeNameFn = options.safeNameFn || null;

    const list = Array.isArray(students) ? students : [];

    const out = list
      .filter((s) => !s?.is_exited)
      .map((s) => ({ s, prob: probField(s, schema.probField) }))
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

  // minimum additional projected ok needed to reach target
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
    const schema = getSchema(options);
    const target = Number.isFinite(Number(options.target)) ? Number(options.target) : 0.60;

    const counts = COMPLETION.getExiterCounts(students, options);
    const exiters = counts.exiters;

    const ok = counts.ok;       // completers OR graduates
    const notOk = counts.notOk; // nonCompleters OR nonGraduates

    const baseE = exiters.length;
    const baseC = ok.length;

    const currentRate = baseE ? (baseC / baseE) : null;

    const candidates = COMPLETION.getCandidates(students, options);

    const neededMin = minNeeded(baseE, baseC, candidates, target);
    const chosenMin = candidates.slice(0, neededMin);

    const barChosen = chooseForBar(baseE, baseC, candidates, target);

    const statusBucket =
      (!baseE) ? "green" :
      (Number.isFinite(currentRate) && currentRate >= target) ? "green" :
      (chosenMin.length ? (COMPLETION.bucketFromChance(chosenMin[chosenMin.length - 1]?.prob) || "red") : "red");

    // Build return object with mode-specific arrays
    const ret = {
      mode: schema.mode,
      target,
      baseE,
      baseC,
      currentRate,
      exiters,
      candidates,
      neededMin,
      barChosen,
      statusBucket,
    };

    // expose mode-named keys
    ret[schema.okPlural] = ok;
    ret[schema.notOkPlural] = notOk;

    // OPTIONAL: if you want legacy keys always present, uncomment:
    // ret.completers = ok;
    // ret.nonCompleters = notOk;

    return ret;
  };

  COMPLETION.computeProgram = function (program, opts) {
    return COMPLETION.computeStudents(COMPLETION.getStudentsFromProgram(program), opts);
  };

  w.COMPLETION = COMPLETION;
})(window);
