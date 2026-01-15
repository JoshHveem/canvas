(function () {
  window.ReportAutomations = window.ReportAutomations || {};
  window.ReportAutomations.components = window.ReportAutomations.components || {};

  window.ReportAutomations.components.AutomationsTableView = {
    name: "AutomationsTableView",
    components: {
      SortableTableShell: window.ReportAutomations.components.SortableTableShell,
    },
    props: {
      rows: { type: Array, required: true },
      columns: { type: Array, required: true },

      sortKey: { type: String, required: true },
      sortDir: { type: Number, required: true },

      // pass-through v-model handlers
      setSort: { type: Function, required: true },
    },
    template: `
      <sortable-table-shell
        :rows="rows"
        :columns="columns"
        :sort-key="sortKey"
        :sort-dir="sortDir"
        @update:sortKey="(k) => setSort(k, sortDir)"
        @update:sortDir="(d) => setSort(sortKey, d)"
        @sort-change="(k, d) => setSort(k, d)"
      >
        <template #cell="{ row, col }">
          <span
            :class="col.styleClass ? col.styleClass(row) : ''"
            :style="col.style ? col.style(row) : null"
            v-html="col.html ? col.html(row) : (col.text ? col.text(row) : '')"
          ></span>
        </template>
      </sortable-table-shell>
    `,
  };
})();
