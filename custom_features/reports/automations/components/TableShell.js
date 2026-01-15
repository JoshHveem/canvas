(function () {
  window.ReportAutomations = window.ReportAutomations || {};
  window.ReportAutomations.components = window.ReportAutomations.components || {};

  /**
   * SortableTableShell
   *
   * columns: [{
   *   key: string,
   *   label: string,
   *   width?: string,               // e.g. "6rem", "1fr"
   *   description?: string,         // header tooltip
   *   sort?: boolean,               // default true
   *   sortValue?: (row) => any,     // optional sort extractor
   *   tooltip?: (row) => string,    // cell tooltip
   *   align?: "left"|"right"|"center",
   * }]
   *
   * Props:
   * - rows: array
   * - sortKey: string
   * - sortDir: number (1 asc, -1 desc)
   *
   * Emits:
   * - "update:sortKey"
   * - "update:sortDir"
   * - "sort-change" (key, dir)
   *
   * Slot:
   * - <template #cell="{ row, col }">...</template>
   */
  window.ReportAutomations.components.SortableTableShell = {
    name: "SortableTableShell",
    props: {
      rows: { type: Array, required: true },
      columns: { type: Array, required: true },

      sortKey: { type: String, default: "" },
      sortDir: { type: Number, default: 1 },

      rowKey: { type: Function, required: false },
    },

    computed: {
      sortedRows() {
        const rows = Array.isArray(this.rows) ? [...this.rows] : [];
        const key = this.sortKey;
        const dir = this.sortDir || 1;
        if (!key) return rows;

        const col = (this.columns || []).find(c => c.key === key);
        if (!col) return rows;

        const getVal = (r) => {
          try {
            return col.sortValue ? col.sortValue(r) : r?.[key];
          } catch (e) {
            return r?.[key];
          }
        };

        const norm = (v) => {
          if (v == null) return "";
          if (typeof v === "number") return v;
          if (typeof v === "boolean") return v ? 1 : 0;
          const s = String(v).toLowerCase();
          // numeric-ish strings sort like numbers
          const n = Number(s);
          return Number.isFinite(n) && s.trim() !== "" ? n : s;
        };

        rows.sort((a, b) => {
          const av = norm(getVal(a));
          const bv = norm(getVal(b));

          if (av < bv) return -1 * dir;
          if (av > bv) return 1 * dir;
          return 0;
        });

        return rows;
      },
    },

    methods: {
      _rowKey(row, i) {
        return this.rowKey ? this.rowKey(row, i) : (row?.automation_id || i);
      },

      gridTemplate() {
        return (this.columns || [])
          .map(c => (c.width ? c.width : "1fr"))
          .join(" ");
      },

      headerCellStyle(col) {
        return {
          display: "inline-flex",
          alignItems: "center",
          gap: ".35rem",
          cursor: (col.sort === false) ? "default" : "pointer",
          userSelect: "none",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        };
      },

      cellStyle(col) {
        const s = {
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        };
        if (col.align) s.textAlign = col.align;
        return s;
      },

      isSortable(col) {
        return col.sort !== false;
      },

      setSort(colKey) {
        const col = (this.columns || []).find(c => c.key === colKey);
        if (!col || !this.isSortable(col)) return;

        // toggle if same column, else switch to new column ascending
        let nextKey = colKey;
        let nextDir = 1;

        if (this.sortKey === colKey) {
          nextDir = (this.sortDir || 1) * -1;
        }

        this.$emit("update:sortKey", nextKey);
        this.$emit("update:sortDir", nextDir);
        this.$emit("sort-change", nextKey, nextDir);
      },

      sortState(colKey) {
        if (this.sortKey !== colKey) return 0;
        return this.sortDir || 1; // 1 asc, -1 desc
      },
    },

    template: `
      <div>
        <!-- Header -->
        <div
          style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; border-bottom:1px solid #eee;"
          :style="{ 'grid-template-columns': gridTemplate() }"
        >
          <div
            v-for="c in columns"
            :key="c.key"
            :title="c.description || ''"
            :style="headerCellStyle(c)"
            @click="setSort(c.key)"
          >
            <span style="font-weight:700;">{{ c.label }}</span>

            <!-- sort icon (only if sortable) -->
            <span v-if="isSortable(c)" aria-hidden="true" style="display:inline-flex;">
              <svg style="width:.75rem;height:.75rem;" viewBox="0 0 490 490">
                <g>
                  <polygon
                    :style="{ fill: sortState(c.key) < 0 ? '#000' : '#E0E0E0' }"
                    points="85.877,154.014 85.877,428.309 131.706,428.309 131.706,154.014 180.497,221.213 217.584,194.27 108.792,44.46 0,194.27 37.087,221.213"
                  />
                  <polygon
                    :style="{ fill: sortState(c.key) > 0 ? '#000' : '#E0E0E0' }"
                    points="404.13,335.988 404.13,61.691 358.301,61.691 358.301,335.99 309.503,268.787 272.416,295.73 381.216,445.54 490,295.715 452.913,268.802"
                  />
                </g>
              </svg>
            </span>
          </div>
        </div>

        <!-- Rows -->
        <div
          v-for="(row, i) in sortedRows"
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
            <slot name="cell" :row="row" :col="c">
              {{ row[c.key] }}
            </slot>
          </div>
        </div>
      </div>
    `,
  };
})();
