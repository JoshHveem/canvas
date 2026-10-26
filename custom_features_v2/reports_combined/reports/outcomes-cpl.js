Vue.component('reports-outcomes-cpl', {
  mixins: [
    window.ReportMixins.requests,
    window.ReportMixins.formatting,
    window.ReportMixins.tables,
    window.ReportMixins.cplMetrics,
    window.ReportMixins.labels,
    window.ReportMixins.filters,
    window.ReportMixins.datasets,
    window.ReportMixins.yearSummary({
      loadErrorMessage: 'Unable to load CPL summary.'
    })
  ],

  data() {
    const colors = window.ReportUtils.createColors();
    const table = window.ReportUtils.createTable('Program', colors);

    return {
      colors,
      table
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'Program', 'Program name.', '18rem', false, 'string',
        row => this.anonymous ? 'PROGRAM' : this.escapeHtml(this.programName(row)),
        null,
        row => this.programName(row).toLowerCase()
      ),
      new window.ReportColumn(
        'Campus', 'Campus code.', '6rem', false, 'string',
        row => this.escapeHtml(String(row?.campus_code ?? '').trim() || '-'),
        null,
        row => String(row?.campus_code ?? '').trim().toLowerCase()
      ),
      new window.ReportColumn(
        'Completion', 'Program completion rate.', '8rem', false, 'number',
        row => this.pctText(row?.completion),
        row => this.completionPillStyle(row?.completion),
        row => Number(row?.completion ?? -1)
      ),
      new window.ReportColumn(
        'Placement', 'Program placement rate.', '8rem', false, 'number',
        row => this.pctText(row?.placement),
        row => this.outcomePillStyle(row?.placement),
        row => Number(row?.placement ?? -1)
      ),
      new window.ReportColumn(
        'Licensure', 'Program licensure rate.', '8rem', false, 'number',
        row => this.pctText(row?.licensure),
        row => this.outcomePillStyle(row?.licensure),
        row => Number(row?.licensure ?? -1)
      )
    ]);
  },

  methods: {
    drillToHistoric(row) {
      this.$emit('drill-report', {
        report: 'outcomes',
        subMenu: 'cpl-historic',
        campus_code: String(row?.campus_code ?? '').trim(),
        program_code: String(row?.program_code ?? '').trim(),
        program_name: this.programName(row)
      });
    },

    mapRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        ...row,
        academic_year: Number(row?.academic_year),
        program_name: String(row?.program_name ?? '').trim(),
        program_code: String(row?.program_code ?? '').trim(),
        campus_code: String(row?.campus_code ?? '').trim(),
        completion: Number(row?.completion),
        placement: Number(row?.placement),
        licensure: Number(row?.licensure)
      }));
    }
  },

  template: `
    <report-table-shell
    title-html="Programs - CPL Summary"
    :table="table"
    :rows="visibleRows"
    :loading="loading"
    :load-error="loadError"
    loading-text="Loading CPL summary..."
    :row-key-fn="(row, index) => [row.program_code || row.program_name || 'x', row.campus_code || 'y', index].join(':')"
    :row-clickable="true"
    @row-click="drillToHistoric"
  >
    <template #filters>
      <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
        <label class="btech-muted" style="font-size:.75rem;">Year</label>
        <select v-model.number="year" v-bind="filterAttrs('academic_year')" style="font-size:.75rem; min-width:90px;">
          <option
            v-for="optionYear in Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)"
            :key="optionYear"
            :value="optionYear"
          >{{ optionYear }}</option>
        </select>
      </div>
    </template>
  </report-table-shell>
  `
});
