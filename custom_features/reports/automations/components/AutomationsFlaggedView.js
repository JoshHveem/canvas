(function () {
  window.ReportAutomations = window.ReportAutomations || {};
  window.ReportAutomations.components = window.ReportAutomations.components || {};

  window.ReportAutomations.components.AutomationsFlaggedView = {
    name: "AutomationsFlaggedView",
    props: {
      visibleRows: { type: Array, required: true },
      statusStyle: { type: Function, required: true },
    },
    template: `
      <div class="btech-card btech-theme" style="padding:12px; background:#fafafa;">
        <div class="btech-row" style="align-items:center; gap:10px; margin-bottom:8px;">
          <h4 class="btech-card-title" style="margin:0;">Flagged Runs</h4>
          <div class="btech-muted" style="font-size:12px;">
            Shows flagged automations and which checks were triggered
          </div>
        </div>

        <div class="btech-muted" style="font-size:12px; margin-bottom:10px;">
          (Placeholder) Later: show only flagged, list flag reasons, and show recent flagged timestamps.
        </div>

        <div style="border-top:1px solid #eee;">
          <div
            v-for="(row, i) in visibleRows"
            :key="row.automation_id || i"
            style="display:flex; gap:12px; align-items:center; padding:8px 6px; border-bottom:1px solid #eee;"
          >
            <div style="width:5rem;">
              <span class="btech-pill-text" :style="statusStyle(row?._metrics?.status)">
                {{ row?._metrics?.status }}
              </span>
            </div>

            <div style="width:3.5rem; font-family:monospace;">
              {{ row.automation_id }}
            </div>

            <div style="flex:1; min-width:180px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
              {{ row.name }}
            </div>

            <div style="min-width:260px;">
              <span class="btech-muted" style="font-size:12px;">
                flags: (to be implemented)
              </span>
            </div>
          </div>
        </div>
      </div>
    `,
  };
})();
