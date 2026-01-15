(function () {
  window.ReportAutomations = window.ReportAutomations || {};
  window.ReportAutomations.components = window.ReportAutomations.components || {};

  window.ReportAutomations.components.AutomationsFlaggedView = {
    name: "AutomationsFlaggedView",
    components: {
      SortableTableShell: window.ReportAutomations.components.SortableTableShell,
    },
    props: {
      rows: { type: Array, required: true },
      statusStyle: { type: Function, required: true },

      sortKey: { type: String, required: true },
      sortDir: { type: Number, required: true },
      setSort: { type: Function, required: true },
    },
    computed: {
      columns() {
        return [
          {
            key: "status",
            label: "Status",
            width: "6rem",
            sortValue: r => (r?._metrics?.status || ""),
          },
          {
            key: "automation_id",
            label: "ID",
            width: "4rem",
            sortValue: r => Number(r?.automation_id) || 0,
          },
          {
            key: "name",
            label: "Name",
            width: "1fr",
            sortValue: r => (r?.name || ""),
          },
          {
            key: "flags",
            label: "Flags",
            width: "18rem",
            sort: false, // later you may add flags sort, but for now no
          },
        ];
      },
    },
    template: `
      <div>
        <div class="btech-muted" style="font-size:12px; margin-bottom:8px;">
          (Placeholder) Later: show only flagged and list which checks triggered.
        </div>

        <sortable-table-shell
          :rows="rows"
          :columns="columns"
          :sort-key="sortKey"
          :sort-dir="sortDir"
          @sort-change="(k, d) => setSort(k, d)"
        >
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
        </sortable-table-shell>
      </div>
    `,
  };
})();
