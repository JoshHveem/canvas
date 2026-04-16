(function () {
  function getByPath(source, path) {
    if (!source || !path) return undefined;

    return String(path)
      .split(".")
      .reduce((value, part) => (value == null ? undefined : value[part]), source);
  }

  function toNumber(value) {
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  Vue.component("reports-v3-table", {
    props: {
      rows: {
        type: Array,
        default: function () {
          return [];
        }
      },
      columns: {
        type: Array,
        default: function () {
          return [];
        }
      },
      rowKey: {
        type: [String, Function],
        default: "id"
      },
      defaultSortKey: {
        type: String,
        default: ""
      },
      defaultSortDir: {
        type: Number,
        default: 1
      },
      emptyMessage: {
        type: String,
        default: "No rows to display."
      }
    },

    data() {
      return {
        sortKey: this.defaultSortKey || this.columns[0]?.key || "",
        sortDir: this.defaultSortDir === -1 ? -1 : 1
      };
    },

    computed: {
      colors() {
        const palette = window.bridgetools?.colors || {};
        return {
          green: palette.green || "#16a34a",
          yellow: palette.yellow || "#eab308",
          red: palette.red || "#dc2626",
          gray: palette.gray || "#e5e7eb",
          white: palette.white || "#ffffff",
          black: palette.black || "#111827"
        };
      },

      resolvedColumns() {
        return (Array.isArray(this.columns) ? this.columns : []).map((column, index) => ({
          align: "left",
          format: "text",
          sortable: true,
          placeholder: "-",
          width: "",
          whiteSpace: "nowrap",
          ...column,
          _index: index
        }));
      },

      sortedRows() {
        const rows = Array.isArray(this.rows) ? this.rows.slice() : [];
        const sortColumn = this.resolvedColumns.find((column) => column.key === this.sortKey);

        if (!sortColumn || sortColumn.sortable === false) {
          return rows;
        }

        rows.sort((a, b) => this.compareRows(a, b, sortColumn));
        return rows;
      }
    },

    methods: {
      compareRows(a, b, column) {
        const left = this.getSortValue(a, column);
        const right = this.getSortValue(b, column);

        if (left == null && right == null) return 0;
        if (left == null) return 1;
        if (right == null) return -1;

        if (typeof left === "number" && typeof right === "number") {
          return (left - right) * this.sortDir;
        }

        return String(left).localeCompare(String(right), undefined, { numeric: true }) * this.sortDir;
      },

      getRowKey(row, index) {
        if (typeof this.rowKey === "function") {
          return this.rowKey(row, index);
        }

        return getByPath(row, this.rowKey) ?? index;
      },

      getRawValue(row, column) {
        if (typeof column.value === "function") {
          return column.value(row, column);
        }

        return getByPath(row, column.key);
      },

      getSortValue(row, column) {
        if (typeof column.sortValue === "function") {
          return column.sortValue(row, column);
        }

        const raw = this.getRawValue(row, column);
        if (column.format === "percent" || column.format === "number" || column.format === "integer" || column.format === "currency") {
          return toNumber(raw);
        }

        return raw;
      },

      formatValue(row, column) {
        const raw = this.getRawValue(row, column);

        if (typeof column.formatter === "function") {
          return column.formatter(raw, row, column);
        }

        if (raw == null || raw === "") {
          return column.placeholder;
        }

        const decimals = Number.isFinite(Number(column.decimals)) ? Number(column.decimals) : undefined;

        switch (column.format) {
          case "percent": {
            const num = toNumber(raw);
            if (num == null) return column.placeholder;
            const places = decimals == null ? 0 : decimals;
            return `${(num * 100).toFixed(places)}%`;
          }
          case "number": {
            const num = toNumber(raw);
            if (num == null) return column.placeholder;
            return num.toLocaleString(undefined, {
              minimumFractionDigits: decimals == null ? 0 : decimals,
              maximumFractionDigits: decimals == null ? 2 : decimals
            });
          }
          case "integer": {
            const num = toNumber(raw);
            if (num == null) return column.placeholder;
            return Math.round(num).toLocaleString();
          }
          case "currency": {
            const num = toNumber(raw);
            if (num == null) return column.placeholder;
            return num.toLocaleString(undefined, {
              style: "currency",
              currency: "USD",
              minimumFractionDigits: decimals == null ? 0 : decimals,
              maximumFractionDigits: decimals == null ? 0 : decimals
            });
          }
          default:
            return String(raw);
        }
      },

      hasBandPill(column) {
        return !!(column && column.pillBands && typeof column.pillBands === "object");
      },

      getBandPillStyle(row, column) {
        const band = this.getBandPillBand(row, column);

        if (!band) {
          return {
            display: "inline-block",
            padding: "2px 8px",
            borderRadius: "999px",
            backgroundColor: this.colors.gray,
            color: this.colors.black,
            fontWeight: 600
          };
        }

        const backgroundColor = this.getBandColor(band);
        const color = band === "warning" ? this.colors.black : this.colors.white;

        return {
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: "999px",
          backgroundColor,
          color,
          fontWeight: 600
        };
      },

      getBandPillBand(row, column) {
        const raw = this.getRawValue(row, column);
        const num = toNumber(raw);
        const bands = Object.entries(column?.pillBands || {})
          .filter(([, threshold]) => Number.isFinite(Number(threshold)))
          .map(([name, threshold]) => ({ name, threshold: Number(threshold) }))
          .sort((a, b) => b.threshold - a.threshold);

        if (num == null || !bands.length) return null;

        const matched = bands.find((band) => num >= band.threshold);
        if (matched) return matched.name;

        return bands[bands.length - 1]?.name || null;
      },

      getBandColor(band) {
        if (band === "good") return this.colors.green;
        if (band === "warning") return this.colors.yellow;
        if (band === "bad") return this.colors.red;
        return this.colors.gray;
      },

      setSort(column) {
        if (column.sortable === false) return;

        if (this.sortKey === column.key) {
          this.sortDir = this.sortDir === 1 ? -1 : 1;
          return;
        }

        this.sortKey = column.key;
        this.sortDir = 1;
      },

      headerStyle(column) {
        return {
          width: column.width || undefined,
          textAlign: column.align || "left"
        };
      },

      cellStyle(column, row) {
        const base = {
          textAlign: column.align || "left",
          whiteSpace: column.whiteSpace || "nowrap"
        };

        if (typeof column.cellStyle === "function") {
          return { ...base, ...column.cellStyle(row, column) };
        }

        if (column.cellStyle && typeof column.cellStyle === "object") {
          return { ...base, ...column.cellStyle };
        }

        return base;
      }
    },

    template: `
      <div class="btech-card btech-theme" style="padding:0; overflow:hidden;">
        <div style="overflow:auto;">
          <table style="width:100%; border-collapse:collapse; table-layout:fixed;">
            <colgroup>
              <col
                v-for="column in resolvedColumns"
                :key="column.key || column._index"
                :style="{ width: column.width || undefined }"
              >
            </colgroup>

            <thead>
              <tr style="background:#f8fafc; border-bottom:1px solid #e2e8f0;">
                <th
                  v-for="column in resolvedColumns"
                  :key="column.key || column._index"
                  @click="setSort(column)"
                  :title="column.description || ''"
                  :style="headerStyle(column)"
                  style="padding:10px 12px; font-size:12px; font-weight:600; cursor:pointer;"
                >
                  <span>{{ column.label }}</span>
                  <span v-if="sortKey === column.key" style="margin-left:6px;">{{ sortDir === 1 ? '^' : 'v' }}</span>
                </th>
              </tr>
            </thead>

            <tbody v-if="sortedRows.length">
              <tr
                v-for="(row, index) in sortedRows"
                :key="getRowKey(row, index)"
                :style="{ background: index % 2 ? '#ffffff' : '#fbfdff' }"
              >
                <td
                  v-for="column in resolvedColumns"
                  :key="column.key || column._index"
                  :style="cellStyle(column, row)"
                  style="padding:10px 12px; font-size:12px; border-top:1px solid #eef2f7; overflow:hidden; text-overflow:ellipsis;"
                >
                  <span
                    v-if="hasBandPill(column)"
                    :style="getBandPillStyle(row, column)"
                  >{{ formatValue(row, column) }}</span>
                  <span v-else-if="column.allowHtml" v-html="formatValue(row, column)"></span>
                  <span v-else>{{ formatValue(row, column) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="!sortedRows.length" class="btech-muted" style="padding:16px;">
          {{ emptyMessage }}
        </div>
      </div>
    `
  });
})();
