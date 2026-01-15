(function () {
  window.ReportAutomations = window.ReportAutomations || {};
  window.ReportAutomations.components = window.ReportAutomations.components || {};

  window.ReportAutomations.components.AutomationsTableView = {
    name: "AutomationsTableView",
    props: {
      table: { type: Object, required: true },
      rows: { type: Array, required: true },
      getColumnsWidthsString: { type: Function, required: true },
      setSortColumn: { type: Function, required: true },
    },
    template: `
      <div>
        <!-- Header -->
        <div
          style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; user-select:none;"
          :style="{ 'grid-template-columns': getColumnsWidthsString(table) }"
        >
          <div
            v-for="col in table.getVisibleColumns()"
            :key="col.name"
            :title="col.description"
            style="display:inline-block; cursor:pointer;"
            @click="setSortColumn(table, col.name)"
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

        <!-- Rows -->
        <div
          v-for="(row, i) in rows"
          :key="row.automation_id || i"
          style="padding:.25rem .5rem; display:grid; align-items:center; font-size:.75rem; line-height:1.35rem;"
          :style="{
            'grid-template-columns': getColumnsWidthsString(table),
            'background-color': (i % 2) ? 'white' : '#F8F8F8'
          }"
        >
          <div
            v-for="col in table.getVisibleColumns()"
            :key="col.name"
            style="display:inline-block; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;"
            :title="col.getTooltip(row)"
          >
            <span
              :class="col.style_formula ? 'btech-pill-text' : ''"
              :style="col.get_style(row)"
              v-html="col.getContent(row)"
            ></span>
          </div>
        </div>
      </div>
    `,
  };
})();
