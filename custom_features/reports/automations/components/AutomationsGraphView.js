(function () {
  window.ReportAutomations = window.ReportAutomations || {};
  window.ReportAutomations.components = window.ReportAutomations.components || {};

  window.ReportAutomations.components.AutomationsGraphView = {
    name: "AutomationsGraphView",
    props: {
      visibleRows: { type: Array, required: true },
      statusStyle: { type: Function, required: true },
    },
    template: `
      <div>
        <div
          v-for="row in visibleRows"
          :key="row.automation_id"
          style="display:flex; gap:10px; align-items:center; padding:6px 8px; border-bottom:1px solid #eee;"
        >
          <div style="width:5rem;">
            <span class="btech-pill-text" :style="statusStyle(row?._metrics?.status)">
              {{ row?._metrics?.status }}
            </span>
          </div>

          <div style="width:3rem; font-family:monospace;">
            {{ row.automation_id }}
          </div>

          <div style="width:18rem; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            {{ row.name }}
          </div>

          <div style="flex:1; min-width:260px;">
            <div :ref="'chart_' + row.automation_id"></div>
          </div>
        </div>
      </div>
    `,
  };
})();
