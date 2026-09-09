Vue.component('reports-graduation-students', {
  mixins: [window.ReportMixins.formatting],

  props: {
    reportContext: { type: Object, default: () => ({}) }
  },

  data() {
    const colors = window.ReportUtils.createColors();
    const activeTable = window.ReportUtils.createTable('Projected Exit', colors);
    const exitedTable = window.ReportUtils.createTable('Exit Date', colors);
    return {
      colors,
      activeTable,
      exitedTable,
      activeRows: [],
      exitedRows: [],
      loading: false,
      loadError: ''
    };
  },

  created() {
    this.activeTable.setColumns([
      this.studentColumn('Student'),
      this.sisIdColumn(),
      this.programColumn(),
      this.dateColumn('Target Exit', 'Program target exit date.', 'exit_at__target'),
      this.dateColumn('Projected Exit', 'Projected exit date based on the student\'s current pace.', 'exit_at__projected'),
      new window.ReportColumn('Pace Multiplier', 'Current pace divided by the pace required to meet the target exit date.', '9rem', false, 'number', row => this.paceText(row.progress_pace_multiplier), row => this.paceStyle(row.progress_pace_multiplier), row => this.sortNumber(row.progress_pace_multiplier)),
      new window.ReportColumn('Program Progress', 'Progress through the program.', '9rem', false, 'number', row => this.percent(row.progress__program), row => this.progressStyle(row.progress__program), row => this.sortNumber(row.progress__program))
    ]);

    this.exitedTable.setColumns([
      this.studentColumn('Student'),
      this.sisIdColumn(),
      this.programColumn(),
      this.dateColumn('Exit Date', 'Actual student exit date.', 'exit_at'),
      new window.ReportColumn('Graduate', 'Whether the exited student counted as a graduate.', '8rem', false, 'boolean', row => this.boolText(row.is_graduate), row => this.boolPillStyle(row.is_graduate), row => this.boolSort(row.is_graduate)),
      new window.ReportColumn('Completer', 'Whether the student completed the program.', '8rem', false, 'boolean', row => this.boolText(row.is_completer), row => this.boolPillStyle(row.is_completer), row => this.boolSort(row.is_completer))
    ]);
  },

  computed: {
    visibleActiveRows() {
      this.activeTable.setRows(this.activeRows);
      return this.activeTable.getSortedRows();
    },

    visibleExitedRows() {
      this.exitedTable.setRows(this.exitedRows);
      return this.exitedTable.getSortedRows();
    }
  },

  methods: {
    studentColumn(name) {
      return new window.ReportColumn(name, 'Student name.', '14rem', false, 'string', row => this.escapeHtml(this.studentName(row)), null, row => this.studentName(row).toLowerCase());
    },

    sisIdColumn() {
      return new window.ReportColumn('SIS ID', 'Student information system ID.', '8rem', false, 'string', row => this.escapeHtml(row.sis_user_id || '—'), null, row => String(row.sis_user_id || '').toLowerCase());
    },

    programColumn() {
      return new window.ReportColumn('Program', 'Program and campus.', '12rem', false, 'string', row => this.escapeHtml([row.program_code, row.campus_code].filter(Boolean).join(' · ') || '—'), null, row => [row.program_code, row.campus_code].join(' ').toLowerCase());
    },

    dateColumn(name, description, field) {
      return new window.ReportColumn(name, description, '9rem', false, 'date', row => this.dateText(row[field]), null, row => this.dateSort(row[field]));
    },

    studentName(row) {
      const name = [row.first_name, row.last_name].filter(Boolean).join(' ').trim();
      return name || `SIS User ${row.sis_user_id || '—'}`;
    },

    numberValue(value) {
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    },

    sortNumber(value) {
      const number = this.numberValue(value);
      return number === null ? Number.POSITIVE_INFINITY : number;
    },

    dateSort(value) {
      const time = Date.parse(value);
      return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY;
    },

    dateText(value) {
      const time = Date.parse(value);
      if (!Number.isFinite(time)) return '—';
      return new Date(time).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    },

    percent(value) {
      const number = this.numberValue(value);
      return number === null ? '—' : `${(number * 100).toFixed(1)}%`;
    },

    paceText(value) {
      const number = this.numberValue(value);
      return number === null ? '—' : `${number.toFixed(2)}×`;
    },

    paceStyle(value) {
      const number = this.numberValue(value);
      if (number === null) return { backgroundColor: this.colors.gray, color: this.colors.black };
      if (number < 0.9) return { backgroundColor: this.colors.red, color: this.colors.white };
      if (number < 1) return { backgroundColor: this.colors.yellow, color: this.colors.black };
      return { backgroundColor: this.colors.green, color: this.colors.white };
    },

    progressStyle(value) {
      const number = this.numberValue(value);
      if (number === null) return { backgroundColor: this.colors.gray, color: this.colors.black };
      return { backgroundColor: this.colors.cyan || '#06b6d4', color: this.colors.black };
    },

    booleanValue(value) {
      return value === true || value === 1 || value === '1' || String(value ?? '').toLowerCase() === 'true';
    },

    normalizeRows(rows, studentMetadataBySisId) {
      return (Array.isArray(rows) ? rows : []).map(row => {
        const sisUserId = String(row?.sis_user_id ?? '').trim();
        const metadata = studentMetadataBySisId.get(sisUserId) || {};
        return {
          ...row,
          sis_user_id: sisUserId,
          program_code: String(row?.program_code ?? '').trim(),
          campus_code: String(row?.campus_code ?? '').trim(),
          canvas_user_id: String(row?.canvas_user_id ?? metadata.canvas_user_id ?? '').trim(),
          first_name: String(row?.first_name ?? metadata.first_name ?? '').trim(),
          last_name: String(row?.last_name ?? metadata.last_name ?? '').trim(),
          is_exited: this.booleanValue(row?.is_exited),
          is_graduate: this.booleanValue(row?.is_graduate),
          is_completer: this.booleanValue(row?.is_completer)
        };
      });
    },

    async loadStudentMetadata(sisUserIds) {
      if (!sisUserIds.length) return new Map();
      const headerRows = await this.fetchReportDataset(
        { sis_user_id: sisUserIds },
        { dataset: 'student_header' }
      );
      return new Map((Array.isArray(headerRows) ? headerRows : [])
        .map(row => [
          String(row?.sis_user_id ?? '').trim(),
          {
            canvas_user_id: String(row?.canvas_user_id ?? '').trim(),
            first_name: String(row?.first_name ?? '').trim(),
            last_name: String(row?.last_name ?? '').trim()
          }
        ])
        .filter(([sisUserId]) => Boolean(sisUserId)));
    },

    async loadData() {
      try {
        this.loading = true;
        this.loadError = '';
        const academicYear = new Date().getFullYear();
        const completionRows = await this.fetchReportDataset(
          { academic_year: academicYear },
          { dataset: 'program_student_completion' }
        );
        const sisUserIds = Array.from(new Set((Array.isArray(completionRows) ? completionRows : [])
          .map(row => String(row?.sis_user_id ?? '').trim())
          .filter(Boolean)));
        let studentMetadataBySisId = new Map();
        try {
          studentMetadataBySisId = await this.loadStudentMetadata(sisUserIds);
        } catch (error) {
          console.warn('Failed to load graduation student metadata', error);
        }
        const normalizedRows = this.normalizeRows(completionRows, studentMetadataBySisId);
        const rows = await this.hydrateSisUserIds(normalizedRows, { hydrate_sis_user_id: true });
        this.activeRows = rows.filter(row => !row.is_exited);
        this.exitedRows = rows.filter(row => row.is_exited);
        if (!rows.length) this.loadError = 'No program-student completion records are available for the current academic year.';
      } catch (error) {
        console.warn('Failed to load graduation students', error);
        this.activeRows = [];
        this.exitedRows = [];
        this.loadError = 'Unable to load graduation students.';
      } finally {
        this.loading = false;
      }
    }
  },

  mounted() {
    this.loadData();
  },

  template: `
  <div style="display:flex; flex-direction:column; gap:12px; flex:1 1 auto; min-height:0; overflow:auto;">
    <report-table-shell
      title-html="Active Students"
      :table="activeTable"
      :rows="visibleActiveRows"
      :loading="loading"
      :load-error="loadError"
      loading-text="Loading active students..."
      :row-key-fn="(row, index) => ['active', row.sis_user_id, row.program_code, row.campus_code, index].join(':')"
    >
      <template #description>
        Current academic-year students, ordered by projected exit date. Pace multipliers below 1.00 indicate a projected finish after the target date.
      </template>
    </report-table-shell>

    <report-table-shell
      title-html="Exited Students"
      :table="exitedTable"
      :rows="visibleExitedRows"
      :loading="loading"
      :load-error="loadError"
      loading-text="Loading exited students..."
      :row-key-fn="(row, index) => ['exited', row.sis_user_id, row.program_code, row.campus_code, index].join(':')"
    >
      <template #description>
        Current academic-year exits, including whether each student counted as a graduate.
      </template>
    </report-table-shell>
  </div>
  `
});
