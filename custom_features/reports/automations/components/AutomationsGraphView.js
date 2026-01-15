(function () {
  window.ReportAutomations = window.ReportAutomations || {};
  window.ReportAutomations.components = window.ReportAutomations.components || {};

  window.ReportAutomations.components.AutomationsGraphView = {
    name: "AutomationsGraphView",
    props: {
      table: { type: Object, required: true },
      rows: { type: Array, required: true },
      getColumnsWidthsString: { type: Function, required: true },
      setSortColumn: { type: Function, required: true },
    },
    template: `
      <automations-table-view
        :table="table"
        :rows="rows"
        :get-columns-widths-string="getColumnsWidthsString"
        :set-sort-column="setSortColumn"
      ></automations-table-view>
    `,
    // reuse AutomationsTableView template by registering it globally in report.js components
  };
})();
