export const tablesUtils = {
  createColors() {
    return window.bridgetools?.colors || {
      red: '#b20b0f',
      orange: '#f59e0b',
      yellow: '#eab308',
      green: '#16a34a',
      gray: '#e5e7eb',
      black: '#111827',
      white: '#fff'
    };
  },

  createTable(sortColumn, colors) {
    return new window.ReportTable({
      rows: [],
      columns: [],
      sort_column: sortColumn,
      sort_dir: 1,
      colors
    });
  }
};

export const tables = {
  computed: {
    visibleRows() {
      this.table.setRows(this.rows);
      return this.table.getSortedRows();
    }
  },
  methods: {
    withColumnWrap(column, wrap = true) {
      if (column && typeof column === 'object') {
        column.wrap = !!wrap;
      }
      return column;
    }
  }
};
