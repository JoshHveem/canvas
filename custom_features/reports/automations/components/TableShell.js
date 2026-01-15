(function () {
  window.ReportAutomations = window.ReportAutomations || {};
  window.ReportAutomations.components = window.ReportAutomations.components || {};

  /**
   * A lightweight table renderer:
   * - columns: [{ key, label, width?, title?, align? }]
   * - rowKey: function(row, i) -> string|number
   *
   * Uses a scoped slot "cell" so each view can define its cell content.
   */
  window.ReportAutomations.components.TableShell = {
    name: "TableShell",
    props: {
      rows: { type: Array, required: true },
      columns: { type: Array, required: true },
      rowKey: { type: Function, required: false },
    },
    methods: {
      _rowKey(row, i) {
        return this.rowKey ? this.rowKey(row, i) : (row?.automation_id || i);
      },
      gridTemplate() {
        // if no width provided, default to 1fr
        return (this.columns || [])
          .map(c => (c.width ? c.width : "1fr"))
          .join(" ");
      },
      cellStyle(col) {
        const s = { overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" };
        if (col.align) s.textAlign = col.align;
        return s;
      },
    },
    template: `
      <div>
        <!-- Header -->
        <div
          style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; user-select:none; border-bottom:1px solid #eee;"
          :style="{ 'grid-template-columns': gridTemplate() }"
        >
          <div
            v-for="c in columns"
            :key="c.key"
            :title="c.title || ''"
            style="font-weight:700;"
          >
            {{ c.label }}
          </div>
        </div>

        <!-- Rows -->
        <div
          v-for="(row, i) in rows"
          :key="_rowKey(row, i)"
          style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; line-height:1.35rem;"
          :style="{
            'grid-template-columns': gridTemplate(),
            'background-color': (i % 2) ? 'white' : '#F8F8F8'
          }"
        >
          <div
            v-for="c in columns"
            :key="c.key"
            :style="cellStyle(c)"
            :title="(c.tooltip && c.tooltip(row)) ? c.tooltip(row) : ''"
          >
            <slot name="cell" :row="row" :col="c" :i="i">
              {{ row[c.key] }}
            </slot>
          </div>
        </div>
      </div>
    `,
  };
})();
