Vue.component('report-table-shell', {
  props: {
    titleHtml: { type: String, default: '' },
    table: { type: Object, required: true },
    rows: { type: Array, default: () => [] },
    loading: { type: Boolean, default: false },
    loadError: { type: String, default: '' },
    loadingText: { type: String, default: 'Loading...' },
    rowKeyFn: { type: Function, default: null },
    rowClickable: { type: Boolean, default: false }
  },

  data() {
    return {
      tableTick: 0
    };
  },

  computed: {
    rowCount() {
      return Array.isArray(this.rows) ? this.rows.length : 0;
    },
    columnsWidthString() {
      return this.table?.getColumnsWidthsString ? this.table.getColumnsWidthsString() : '';
    },
    visibleColumns() {
      return this.table?.getVisibleColumns ? this.table.getVisibleColumns() : [];
    }
  },

  methods: {
    setSortColumn(name) {
      if (!this.table?.setSortColumn) return;
      this.table.setSortColumn(name);
      this.tableTick += 1;
    },
    getRowKey(row, index) {
      if (typeof this.rowKeyFn === 'function') {
        return this.rowKeyFn(row, index);
      }
      return row?.id ?? index;
    },
    onRowClick(row, index) {
      if (!this.rowClickable) return;
      this.$emit('row-click', row, index);
    }
  },

  template: `
  <div class="btech-card btech-theme" style="padding:12px; margin-top:12px; display:flex; flex-direction:column; flex:1 1 auto; min-height:0; height:100%; overflow:hidden;">
    <div style="flex:0 0 auto; background:#fff; padding-bottom:8px;">
      <div class="btech-row" style="align-items:center; margin-bottom:8px;">
        <h4 class="btech-card-title" style="margin:0;" v-html="titleHtml"></h4>
        <div style="flex:1;"></div>
        <span class="btech-pill">Rows: {{ rowCount }}</span>
      </div>

      <div v-if="$slots.filters" class="btech-row" style="gap:.75rem; margin-bottom:8px; align-items:center; justify-content:flex-start; flex-wrap:wrap;">
        <slot name="filters"></slot>
      </div>
    </div>

    <div v-if="loading" class="btech-muted" style="text-align:center; padding:10px; flex:1 1 auto; overflow:auto;">
      {{ loadingText }}
    </div>

    <div v-else-if="loadError" class="btech-muted" style="text-align:center; padding:10px; flex:1 1 auto; overflow:auto;">
      {{ loadError }}
    </div>

    <div v-else style="flex:1 1 auto; min-height:0; overflow:auto; max-width:100%;">
      <div style="min-width:100%; width:max-content;">
        <div
          style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; user-select:none; position:sticky; top:0; z-index:2; background:#fff;"
          :style="{ 'grid-template-columns': columnsWidthString }"
        >
          <div
            v-for="col in visibleColumns"
            :key="col.name"
            :title="col.description"
            style="display:inline-block; cursor:pointer;"
            @click="setSortColumn(col.name)"
          >
            <span><b>{{ col.name }}</b></span>
            <span style="margin-left:.25rem;">
              <svg style="width:.75rem;height:.75rem;" viewBox="0 0 490 490" aria-hidden="true">
                <g>
                  <polygon :style="{ fill: col.sort_state < 0 ? '#000' : '#E0E0E0' }"
                    points="85.877,154.014 85.877,428.309 131.706,428.309 131.706,154.014 180.497,221.213 217.584,194.27 108.792,44.46 0,194.27 37.087,221.213"/>
                  <polygon :style="{ fill: col.sort_state > 0 ? '#000' : '#E0E0E0' }"
                    points="404.13,335.988 404.13,61.691 358.301,61.691 358.301,335.99 309.503,268.787 272.416,295.73 381.216,445.54 490,295.715 452.913,268.802"/>
                </g>
              </svg>
            </span>
          </div>
        </div>

        <div
          v-for="(row, index) in rows"
          :key="getRowKey(row, index)"
          @click="onRowClick(row, index)"
          style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; line-height:1.5rem;"
          :style="{
            'grid-template-columns': columnsWidthString,
            'background-color': (index % 2) ? 'white' : '#F8F8F8',
            'cursor': rowClickable ? 'pointer' : 'default'
          }"
        >
          <div
            v-for="col in visibleColumns"
            :key="col.name"
            :style="col.wrap
              ? 'display:block; overflow:visible; white-space:normal; text-overflow:clip; line-height:1.2rem; padding:.125rem 0;'
              : 'display:inline-block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;'"
          >
            <span
              :class="col.style_formula ? 'btech-pill-text' : ''"
              :style="col.wrap
                ? Object.assign({}, col.get_style(row), { display: 'block', whiteSpace: 'normal' })
                : col.get_style(row)"
              v-html="col.getContent(row)"
            ></span>
          </div>
        </div>
      </div>
    </div>
  </div>
  `
});
