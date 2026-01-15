(function () {
  const RA = (window.ReportAutomations = window.ReportAutomations || {});
  RA.components = RA.components || {};

  RA.components.AutomationsFlaggedView = {
    name: "AutomationsFlaggedView",
    props: {
      table: { type: Object, required: true },
      rows: { type: Array, required: true },
      getColumnsWidthsString: { type: Function, required: true },
      setSortColumn: { type: Function, required: true },
    },

    // ✅ make AutomationsTableView available here
    components: {
      AutomationsTableView: RA.components.AutomationsTableView,
    },

    template: `
      <div>
        <div class="btech-muted" style="font-size:12px; margin-bottom:8px;">
          (Placeholder) Later: show only flagged and list which checks triggered.
        </div>

        <AutomationsTableView
          :table="table"
          :rows="rows"
          :get-columns-widths-string="getColumnsWidthsString"
          :set-sort-column="setSortColumn"
        />
      </div>
    `,
  };
})();
