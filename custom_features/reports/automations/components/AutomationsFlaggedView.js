(function () {
  window.ReportAutomations = window.ReportAutomations || {};
  window.ReportAutomations.components = window.ReportAutomations.components || {};

  window.ReportAutomations.components.AutomationsFlaggedView = {
    name: "AutomationsFlaggedView",
    components: {
      TableShell: window.ReportAutomations.components.TableShell,
    },
    props: {
      visibleRows: { type: Array, required: true },
      statusStyle: { type: Function, required: true },
    },
    computed: {
      columns() {
        return [
          { key: "status", label: "Status", width: "6rem" },
          { key: "automation_id", label: "ID", width: "4rem" },
          { key: "name", label: "Name", width: "1fr" },
          { key: "flags", label: "Flags", width: "18rem" },
        ];
      },
    },
    template: `
      <div>
        <div class="btech-muted" style="font-size:12px; margin-bottom:8px;">
          (Placeholder) Later: filter to flagged only and list which checks triggered.
        </div>

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

            <template v-else-if="col.key === 'flags'">
              <span class="btech-muted" style="font-size:12px;">(to be implemented)</span>
            </template>
          </template>
        </table-shell>
      </div>
    `,
  };
})();
