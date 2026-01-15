(function () {
  window.ReportAutomations = window.ReportAutomations || {};
  window.ReportAutomations.components = window.ReportAutomations.components || {};

  window.ReportAutomations.components.AutomationsGraphView = {
    name: "AutomationsGraphView",
    components: {
      TableShell: window.ReportAutomations.components.TableShell,
    },
    props: {
      visibleRows: { type: Array, required: true },
      statusStyle: { type: Function, required: true },
    },
    computed: {
      columns() {
        // graph is a single long column
        return [
          { key: "status", label: "Status", width: "6rem" },
          { key: "automation_id", label: "ID", width: "4rem" },
          { key: "name", label: "Name", width: "18rem" },
          { key: "graph", label: "Runs (30d)", width: "1fr" }, // long column
        ];
      },
    },
    template: `
      <table-shell :rows="visibleRows" :columns="columns">
        <template #cell="{ row, col }">
          <template v-if="col.key === 'status'">
            <span class="btech-pill-text" :style="statusStyle(row?._metrics?.status)">
              {{ row?._metrics?.status }}
            </span>
          </template>

          <template v-else-if="col.key === 'automation_id'">
            <span style="font-family:monospace;">{{ row.automation_id }}</span>
          </template>

          <template v-else-if="col.key === 'name'">
            {{ row.name }}
          </template>

          <template v-else-if="col.key === 'graph'">
            <div :ref="'chart_' + row.automation_id"></div>
          </template>
        </template>
      </table-shell>
    `,
  };
})();
