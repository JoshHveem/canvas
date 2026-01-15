(function () {
  const RA = (window.ReportAutomations = window.ReportAutomations || {});
  RA.views = RA.views || {};

  function U() {
    const util = window.ReportCore?.util;
    if (!util) throw new Error("ReportCore.util not loaded yet");
    return util;
  }

  function getRuns(a) {
    return a?.runs || a?.recent_runs || a?.automation_runs || a?.recentRuns || [];
  }

  function getFlags(run) {
    return run?.flags || run?._flags || run?.flag_data || run?.flagData || null;
  }

  function hasFlags(run) {
    const util = U();
    const flags = getFlags(run);
    if (!flags) return false;
    if (Array.isArray(flags)) return flags.length > 0;
    if (typeof flags === "object") return Object.keys(flags).length > 0;
    return Boolean(util.safeStr(flags).trim());
  }

  function prettyFlagsHtml(flags) {
    const util = U();
    if (!flags) return `<span class="btech-muted">—</span>`;

    if (typeof flags === "object" && !Array.isArray(flags)) {
      const entries = Object.entries(flags);
      if (!entries.length) return `<span class="btech-muted">—</span>`;
      return `
        <div style="white-space:normal; line-height:1.25;">
          ${entries.map(([k, v]) => {
            const vv = typeof v === "object" ? JSON.stringify(v) : util.safeStr(v);
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

  RA.views.Flagged = {
    key: "flagged",
    title: "Flagged",

    buildRows(vm, raw) {
      const util = U();
      const out = [];

      const automations = Array.isArray(raw) ? raw : [];
      for (const a of automations) {
        for (const run of getRuns(a)) {
          if (!hasFlags(run)) continue;

          out.push({
            automation_id: a?.automation_id ?? a?.id,
            automation_name: util.safeStr(a?.name),
            owner_name: util.safeStr(a?.owner_name),
            owner_email: util.safeStr(a?.owner_email),
            _run: run,
          });
        }
      }
      return out;
    },

    filterRows(vm, rows) {
      const util = U();
      let out = Array.isArray(rows) ? rows : [];

      const q = util.safeStr(vm.filters?.q).trim().toLowerCase();
      if (q) {
        out = out.filter((rr) => {
          const run = rr?._run;
          const hay = [
            rr?.automation_name,
            rr?.automation_id,
            rr?.owner_name,
            rr?.owner_email,
            run?.id,
            run?.run_id,
            run?.status,
            JSON.stringify(getFlags(run) || ""),
          ].map((x) => util.safeStr(x).toLowerCase()).join(" ");
          return hay.includes(q);
        });
      }

      const ownerKey = util.safeStr(vm.filters?.owner).trim();
      if (ownerKey) {
        out = out.filter((rr) => {
          const key = util.safeStr(rr?.owner_email).trim() || util.safeStr(rr?.owner_name).trim();
          return key === ownerKey;
        });
      }

      const status = util.safeStr(vm.filters?.status);
      if (status && status !== "All") {
        out = out.filter((rr) => util.safeStr(rr?._run?.status) === status);
      }

      return out;
    },

    buildColumns(vm) {
      const util = U();
      const runOf = (r) => r?._run || r;

      return [
        new ReportColumn("Automation", "Automation name", "18rem", false, "string",
          (r) => util.safeStr(r?.automation_name), null, (r) => util.safeStr(r?.automation_name)
        ),

        new ReportColumn("Run ID", "Unique run id", "8rem", false, "string",
          (r) => util.safeStr(runOf(r)?.id || runOf(r)?.run_id), null,
          (r) => util.safeStr(runOf(r)?.id || runOf(r)?.run_id)
        ),

        new ReportColumn("Status", "Run status", "7rem", false, "string",
          (r) => util.safeStr(runOf(r)?.status), null, (r) => util.safeStr(runOf(r)?.status)
        ),

        new ReportColumn("Started", "Run start time", "14rem", false, "number",
          (r) => {
            const t = runOf(r)?.started_at || runOf(r)?.start_time || runOf(r)?.created_at;
            return t ? util.fmtDateTime(t) : "n/a";
          },
          null,
          (r) => util.parseTs(runOf(r)?.started_at || runOf(r)?.start_time || runOf(r)?.created_at)
        ),

        new ReportColumn("Duration", "Run duration", "8rem", false, "number",
          (r) => util.msToPretty(runOf(r)?.duration_ms || runOf(r)?.durationMs),
          null,
          (r) => Number(runOf(r)?.duration_ms ?? runOf(r)?.durationMs ?? NaN)
        ),

        new ReportColumn("Flags", "Flag payload", "1fr", false, "string",
          (r) => prettyFlagsHtml(getFlags(runOf(r))),
          () => ({ whiteSpace: "normal", overflowWrap: "anywhere", lineHeight: "1.25" }),
          (r) => {
            const flags = getFlags(runOf(r));
            if (Array.isArray(flags)) return flags.length;
            if (flags && typeof flags === "object") return Object.keys(flags).length;
            return util.safeStr(flags).length;
          }
        ),
      ];
    },
  };
})();
