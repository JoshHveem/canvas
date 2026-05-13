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
        sortDir: this.defaultSortDir === -1 ? -1 : 1,
        tagSelections: {},
        openTagFilterKey: ""
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

      sourceColumns() {
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

      tagFilterColumns() {
        return this.sourceColumns.filter((column) => this.isTagsColumn(column));
      },

      resolvedColumns() {
        const columns = [];

        this.sourceColumns.forEach((column) => {
          if (!this.isTagsColumn(column)) {
            columns.push(column);
            return;
          }

          this.getSelectedTags(column).forEach((tagName) => {
            columns.push(this.buildTagColumn(column, tagName));
          });
        });

        return columns;
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

      isTagsColumn(column) {
        const kind = String(column?.type || column?.format || "").trim().toLowerCase();
        return kind === "tags";
      },

      getColumnKey(column) {
        return String(column?.key || `column-${column?._index || 0}`);
      },

      parseTagsObject(value) {
        let source = value;

        if (typeof source === "string") {
          const trimmed = source.trim();
          if (!trimmed) return {};

          try {
            source = JSON.parse(trimmed);
          } catch (error) {
            return {};
          }
        }

        if (!source || typeof source !== "object" || Array.isArray(source)) {
          return {};
        }

        return Object.fromEntries(
          Object.entries(source)
            .map(([name, count]) => [String(name || "").trim(), Number(count)])
            .filter(([name, count]) => name && Number.isFinite(count) && count > 0)
        );
      },

      getTagOptions(column) {
        const totals = new Map();

        (Array.isArray(this.rows) ? this.rows : []).forEach((row) => {
          const tags = this.parseTagsObject(this.getRawValue(row, column));

          Object.entries(tags).forEach(([name, count]) => {
            totals.set(name, (totals.get(name) || 0) + count);
          });
        });

        return Array.from(totals.entries())
          .map(([value, count]) => ({ value, label: value, count }))
          .sort((a, b) => a.label.localeCompare(b.label, undefined, { numeric: true }));
      },

      getSelectedTags(column) {
        const value = this.tagSelections[this.getColumnKey(column)];
        return Array.isArray(value) ? value : [];
      },

      isTagSelected(column, tagName) {
        return this.getSelectedTags(column).includes(tagName);
      },

      setTagSelected(column, tagName, selected) {
        const key = this.getColumnKey(column);
        const current = this.getSelectedTags(column);
        const next = selected
          ? Array.from(new Set([...current, tagName]))
          : current.filter((value) => value !== tagName);

        this.$set(this.tagSelections, key, next);

        if (!selected && this.sortKey === this.getTagColumnKey(column, tagName)) {
          this.sortKey = this.defaultSortKey || this.resolvedColumns[0]?.key || "";
          this.sortDir = this.defaultSortDir === -1 ? -1 : 1;
        }
      },

      clearTagSelection(column) {
        const hadSortedTag = this.getSelectedTags(column).some((tagName) =>
          this.sortKey === this.getTagColumnKey(column, tagName)
        );

        this.$set(this.tagSelections, this.getColumnKey(column), []);

        if (hadSortedTag) {
          this.sortKey = this.defaultSortKey || this.resolvedColumns[0]?.key || "";
          this.sortDir = this.defaultSortDir === -1 ? -1 : 1;
        }
      },

      toggleTagFilter(column) {
        const key = this.getColumnKey(column);
        this.openTagFilterKey = this.openTagFilterKey === key ? "" : key;
      },

      isTagFilterOpen(column) {
        return this.openTagFilterKey === this.getColumnKey(column);
      },

      tagFilterButtonLabel(column) {
        const count = this.getSelectedTags(column).length;
        if (!count) return "Select tags";
        if (count === 1) return "1 tag selected";
        return `${count} tags selected`;
      },

      getTagColumnKey(column, tagName) {
        return `${this.getColumnKey(column)}__tag__${tagName}`;
      },

      getTagDenominator(row, column) {
        if (typeof column.denominator === "function") {
          return column.denominator(row, column);
        }

        const denominatorKey = column.denominatorKey || column.denominator;
        if (denominatorKey) {
          return getByPath(row, denominatorKey);
        }

        return null;
      },

      getTagRatio(row, column, tagName) {
        const tags = this.parseTagsObject(this.getRawValue(row, column));
        const numerator = toNumber(tags[tagName]);
        const denominator = toNumber(this.getTagDenominator(row, column));

        if (numerator == null || denominator == null || denominator <= 0) {
          return null;
        }

        return numerator / denominator;
      },

      buildTagColumn(column, tagName) {
        return {
          align: "right",
          format: "percent",
          sortable: true,
          placeholder: column.placeholder || "-",
          width: column.tagWidth || column.width || "7rem",
          decimals: Number.isFinite(Number(column.decimals)) ? Number(column.decimals) : 1,
          pillBands: column.pillBands,
          key: this.getTagColumnKey(column, tagName),
          label: tagName,
          description: column.denominatorLabel
            ? `${tagName} / ${column.denominatorLabel}`
            : tagName,
          value: (row) => this.getTagRatio(row, column, tagName),
          sortValue: (row) => this.getTagRatio(row, column, tagName),
          cellStyle: column.tagCellStyle || column.cellStyle
        };
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

      hasComponent(column) {
        return !!(column && column.component);
      },

      getComponentProps(row, column) {
        const raw = this.getRawValue(row, column);
        const extras = typeof column.componentProps === "function"
          ? column.componentProps(row, column, raw)
          : column.componentProps;

        return {
          value: raw,
          row,
          column,
          ...(extras && typeof extras === "object" ? extras : {})
        };
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
      <div class="btech-card btech-theme" style="padding:0; overflow:visible; display:inline-block; width:fit-content; max-width:100%; vertical-align:top;">
        <div
          v-if="tagFilterColumns.length"
          style="display:flex; gap:12px; align-items:flex-start; flex-wrap:wrap; padding:12px; border-bottom:1px solid #e2e8f0; background:#fff;"
        >
          <div
            v-for="column in tagFilterColumns"
            :key="getColumnKey(column)"
            style="position:relative; min-width:240px;"
          >
            <label
              class="btech-muted"
              style="display:block; font-size:12px; margin-bottom:4px;"
            >
              {{ column.label }}
            </label>

            <button
              type="button"
              :aria-expanded="isTagFilterOpen(column) ? 'true' : 'false'"
              @click="toggleTagFilter(column)"
              style="width:100%; display:flex; justify-content:space-between; align-items:center; gap:10px; padding:7px 8px; border:1px solid #d1d5db; border-radius:6px; background:#fff; color:#111827; cursor:pointer;"
            >
              <span>{{ tagFilterButtonLabel(column) }}</span>
              <span>{{ isTagFilterOpen(column) ? '^' : 'v' }}</span>
            </button>

            <div
              v-if="isTagFilterOpen(column)"
              style="position:absolute; top:100%; left:0; right:0; z-index:30; margin-top:4px; border:1px solid #cbd5e1; border-radius:8px; background:#fff; box-shadow:0 12px 24px rgba(15,23,42,0.14); overflow:hidden;"
            >
              <div style="max-height:260px; overflow:auto; padding:6px;">
                <label
                  v-for="option in getTagOptions(column)"
                  :key="option.value"
                  style="display:flex; align-items:center; gap:8px; padding:6px 8px; border-radius:6px; cursor:pointer; font-size:12px;"
                >
                  <input
                    type="checkbox"
                    :checked="isTagSelected(column, option.value)"
                    @change="setTagSelected(column, option.value, $event.target.checked)"
                  >
                  <span style="flex:1 1 auto; white-space:normal;">{{ option.label }}</span>
                </label>

                <div
                  v-if="!getTagOptions(column).length"
                  class="btech-muted"
                  style="padding:8px; font-size:12px;"
                >
                  No tags available.
                </div>
              </div>

              <div style="display:flex; justify-content:flex-end; gap:8px; padding:8px; border-top:1px solid #e2e8f0; background:#f8fafc;">
                <button
                  type="button"
                  @click="clearTagSelection(column)"
                  style="border:1px solid #cbd5e1; background:#fff; color:#334155; border-radius:6px; padding:5px 8px; cursor:pointer; font-size:12px;"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>

        <div style="overflow:auto; max-width:100%;">
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
                  <component
                    v-else-if="hasComponent(column)"
                    :is="column.component"
                    v-bind="getComponentProps(row, column)"
                  ></component>
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
