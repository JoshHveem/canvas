(function () {
  const RA = (window.ReportAutomations = window.ReportAutomations || {});
  RA.components = RA.components || {};

  RA.components.AutomationsGraphView = {
    name: "AutomationsGraphView",
    props: {
      table: { type: Object, required: true },
      rows: { type: Array, required: true },
      getColumnsWidthsString: { type: Function, required: true },
      setSortColumn: { type: Function, required: true },
    },

    // IMPORTANT: register AutomationsTableView so Vue knows what it is
    components: {
      AutomationsTableView: RA.components.AutomationsTableView,
    },

    template: `
      <AutomationsTableView
        :table="table"
        :rows="rows"
        :get-columns-widths-string="getColumnsWidthsString"
        :set-sort-column="setSortColumn"
      />
    `,
  };
})();
