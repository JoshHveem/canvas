Vue.component('reports-students-probations', {
  mixins: [
    window.ReportMixins.formatting
  ],

  props: {
    reportContext: { type: Object, default: () => ({}) },
    anonymous: { type: Boolean, default: false }
  },

  data() {
    const colors = window.ReportUtils.createColors();
    const table = window.ReportUtils.createTable('Student Name', colors);

    return {
      colors,
      table,
      loading: false,
      loadError: '',
      rows: []
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'Student Name', 'Student name pulled from Canvas.', '14rem', false, 'string',
        row => this.anonymous ? 'STUDENT' : this.escapeHtml(this.getStudentName(row)),
        null,
        row => this.getStudentName(row).toLowerCase()
      ),
      new window.ReportColumn(
        'Enrollment Type', 'Current enrollment type code.', '10rem', false, 'string',
        row => this.escapeHtml(String(row?.enrollment_type_code__current ?? '').trim() || '-'),
        null,
        row => String(row?.enrollment_type_code__current ?? '').trim().toLowerCase()
      ),
      new window.ReportColumn(
        'Standing', 'Current academic standing.', '10rem', false, 'string',
        row => this.escapeHtml(String(row?.academic_standing_name ?? '').trim() || '-'),
        row => this.standingPillStyle(row),
        row => String(row?.academic_standing_name ?? '').trim().toLowerCase()
      )
    ]);
  },

  mounted() {
    this.loadData();
  },

  computed: {
    visibleRows() {
      this.table.setRows(this.rows);
      return this.table.getSortedRows();
    }
  },

  methods: {
    getDataset() {
      return String(this.reportContext?.dataset || '').trim();
    },

    getStudentName(row) {
      const studentName = String(row?.sis_user_id ?? '').trim();
      if (studentName) return studentName;

      const canvasUserId = String(row?.canvas_user_id ?? '').trim();
      return canvasUserId ? `Canvas User ${canvasUserId}` : '-';
    },

    standingPillStyle(row) {
      const standingCode = String(row?.academic_standing_code ?? '').trim().toUpperCase();
      if (!standingCode) {
        return { backgroundColor: this.colors.gray, color: this.colors.black };
      }

      return {
        backgroundColor: standingCode.startsWith('W') ? this.colors.yellow : this.colors.red,
        color: standingCode.startsWith('W') ? this.colors.black : this.colors.white
      };
    },

    mapRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        ...row,
        sis_user_id: String(row?.sis_user_id ?? '').trim(),
        enrollment_type_code__current: String(row?.enrollment_type_code__current ?? '').trim(),
        canvas_user_id: Number(row?.canvas_user_id) || null,
        academic_standing_code: String(row?.academic_standing_code ?? '').trim(),
        academic_standing_name: String(row?.academic_standing_name ?? '').trim(),
        bridgetools_updated_at: String(row?.bridgetools_updated_at ?? '').trim()
      }));
    },

    async loadData() {
      try {
        this.loading = true;
        this.loadError = '';

        const rows = await bridgetools.req3(
          'reports',
          {},
          { dataset: this.getDataset() }
        );

        const normalizedRows = this.mapRows(rows);
        this.rows = await this.hydrateSisUserIds(normalizedRows, { hydrate_sis_user_id: true });
      } catch (e) {
        console.warn('Failed to load student probation dataset', e);
        this.rows = [];
        this.loadError = 'Unable to load student probations.';
      } finally {
        this.loading = false;
      }
    }
  },

  template: `
  <report-table-shell
    title-html="Students - Probations"
    :table="table"
    :rows="visibleRows"
    :loading="loading"
    :load-error="loadError"
    loading-text="Loading student probations..."
    :row-key-fn="(row, index) => row.canvas_user_id || row.sis_user_id || index"
  />
  `
});
