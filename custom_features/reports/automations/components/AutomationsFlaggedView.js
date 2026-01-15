(function () {
  window.ReportAutomations = window.ReportAutomations || {};
  window.ReportAutomations.components = window.ReportAutomations.components || {};

  window.ReportAutomations.components.AutomationsFlaggedView = {
    name: "AutomationsFlaggedView",
    props: {
      table: { type: Object, required: true },
      rows: { type: Array, required: true },
      getColumnsWidthsString: { type: Function, required: true },
      setSortColumn: { type: Function, required: true },
    },
    template: `
      <div>
        <div class="btech-muted" style="font-size:12px; margin-bottom:8px;">
          (Placeholder) Later: show only flagged and list which checks triggered.
        </div>

        <automations-table-view
          :table="table"
          :rows="rows"
          :get-columns-widths-string="getColumnsWidthsString"
          :set-sort-column="setSortColumn"
        ></automations-table-view>
      </div>
    `,
  };
})();
