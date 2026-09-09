Vue.component('reports-graduation-students', {
  mixins: [window.ReportMixins.formatting],
  props: { reportContext: { type: Object, default: () => ({}) } },

  data() {
    const colors = window.ReportUtils.createColors();
    return { colors, activeTable: window.ReportUtils.createTable('Projected Exit', colors), exitedTable: window.ReportUtils.createTable('Exit Date', colors), projections: [], selectedProgramKey: '', hasLoadedProjections: false, activeRows: [], exitedRows: [], loading: false, loadError: '' };
  },

  created() {
    this.activeTable.setColumns([
      this.studentColumn(), this.sisIdColumn(), this.programColumn(), this.campusColumn(),
      this.dateColumn('Target Exit', 'Program target exit date.', 'exit_at__target'),
      this.dateColumn('Projected Exit', 'Projected exit date based on the student\'s current pace.', 'exit_at__projected'),
      new window.ReportColumn('Pace Multiplier', 'Current pace divided by the pace required to meet the target exit date.', '9rem', false, 'number', row => this.paceText(row.progress_pace_multiplier), row => this.paceStyle(row.progress_pace_multiplier), row => this.sortNumber(row.progress_pace_multiplier)),
      new window.ReportColumn('Program Progress', 'Blue is current program progress. Red shows the progress needed today to meet the target exit date when the student is behind pace.', '13rem', false, 'number', row => this.progressHtml(row), null, row => this.sortNumber(row.progress__program))
    ]);
    this.exitedTable.setColumns([
      this.studentColumn(), this.sisIdColumn(), this.programColumn(), this.campusColumn(),
      this.dateColumn('Exit Date', 'Actual student exit date.', 'exit_at'),
      new window.ReportColumn('Graduate', 'Whether the exited student counted as a graduate.', '8rem', false, 'boolean', row => this.boolText(row.is_graduate), row => this.boolPillStyle(row.is_graduate), row => this.boolSort(row.is_graduate)),
      new window.ReportColumn('Completer', 'Whether the student completed the program.', '8rem', false, 'boolean', row => this.boolText(row.is_completer), row => this.boolPillStyle(row.is_completer), row => this.boolSort(row.is_completer))
    ]);
  },

  computed: {
    programOptions() {
      const currentYear = new Date().getFullYear();
      const eligible = this.projections.filter(row => row.is_on_campus && row.program_name);
      const current = eligible.filter(row => Number(row.academic_year) === currentYear);
      return (current.length ? current : eligible).sort((a, b) => this.programLabel(a).localeCompare(this.programLabel(b)));
    },
    selectedProgram() { return this.programOptions.find(row => row.key === this.selectedProgramKey) || this.programOptions[0] || null; },
    visibleActiveRows() { this.activeTable.setRows(this.activeRows); return this.activeTable.getSortedRows(); },
    visibleExitedRows() { this.exitedTable.setRows(this.exitedRows); return this.exitedTable.getSortedRows(); }
  },

  methods: {
    studentColumn() { return new window.ReportColumn('Student', 'Student name from Canvas.', '14rem', false, 'string', row => this.escapeHtml(this.studentName(row)), null, row => this.studentName(row).toLowerCase()); },
    sisIdColumn() { return new window.ReportColumn('SIS ID', 'Student information system ID.', '8rem', false, 'string', row => this.escapeHtml(row.sis_user_id || '—'), null, row => String(row.sis_user_id || '').toLowerCase()); },
    programColumn() { return new window.ReportColumn('Program', 'Student program.', '16rem', false, 'string', row => this.escapeHtml(row.program_name || row.program_code || '—'), null, row => String(row.program_name || row.program_code || '').toLowerCase()); },
    campusColumn() { return new window.ReportColumn('Campus', 'Campus code.', '6rem', false, 'string', row => this.escapeHtml(row.campus_code || '—'), null, row => String(row.campus_code || '').toLowerCase()); },
    dateColumn(name, description, field) { return new window.ReportColumn(name, description, '9rem', false, 'date', row => this.dateText(row[field]), null, row => this.dateSort(row[field])); },
    programLabel(row) { return [String(row?.program_name ?? '').trim(), String(row?.campus_name ?? row?.campus_code ?? '').trim()].filter(Boolean).join(' - '); },
    studentName(row) { return [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || `Canvas User ${row.canvas_user_id || row.sis_user_id || '—'}`; },
    numberValue(value) { const number = Number(value); return Number.isFinite(number) ? number : null; },
    sortNumber(value) { return this.numberValue(value) ?? Number.POSITIVE_INFINITY; },
    dateSort(value) { const time = Date.parse(value); return Number.isFinite(time) ? time : Number.POSITIVE_INFINITY; },
    dateText(value) { const time = Date.parse(value); return Number.isFinite(time) ? new Date(time).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '—'; },
    paceText(value) { const number = this.numberValue(value); return number === null || number === 0 ? '—' : `${number.toFixed(2)}×`; },
    paceStyle(value) {
      const number = this.numberValue(value);
      if (number === null || number === 0) return {};
      if (number < 0.9) return { backgroundColor: this.colors.red, color: this.colors.white };
      if (number < 1) return { backgroundColor: this.colors.yellow, color: this.colors.black };
      return { backgroundColor: this.colors.green, color: this.colors.white };
    },
    progressHtml(row) {
      const progress = this.numberValue(row.progress__program);
      if (progress === null) return '—';
      const actual = Math.max(0, Math.min(1, progress));
      const pace = this.numberValue(row.progress_pace_multiplier);
      const expected = pace !== null && pace > 0 && pace < 1 ? Math.min(1, actual / pace) : null;
      const actualPercent = Math.round(actual * 1000) / 10;
      const expectedPercent = expected === null ? null : Math.round(expected * 1000) / 10;
      const targetSegment = expectedPercent === null || expectedPercent <= actualPercent ? '' : `<span style="position:absolute;left:${actualPercent}%;width:${expectedPercent - actualPercent}%;top:0;bottom:0;background:${this.colors.red};opacity:.72;"></span>`;
      const label = expectedPercent === null ? `${actualPercent.toFixed(1)}% complete` : `${actualPercent.toFixed(1)}% complete · ${expectedPercent.toFixed(1)}% needed`;
      return `<span style="display:block;min-width:11rem;padding-right:.5rem;"><span style="position:relative;display:block;height:.65rem;background:#e5e7eb;border-radius:999px;overflow:hidden;" role="progressbar" aria-label="Program progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${actualPercent}"><span style="position:absolute;left:0;width:${actualPercent}%;top:0;bottom:0;background:#2563eb;"></span>${targetSegment}</span><span style="display:block;margin-top:.15rem;color:#374151;font-size:.7rem;line-height:1rem;">${label}</span></span>`;
    },
    booleanValue(value) { return value === true || value === 1 || value === '1' || String(value ?? '').toLowerCase() === 'true'; },
    normalizeProjections(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({ ...row, key: [row?.program_code, row?.campus_code, row?.academic_year].map(value => String(value ?? '').trim()).join('|'), program_name: String(row?.program_name ?? '').trim(), campus_name: String(row?.campus_name ?? '').trim(), campus_code: String(row?.campus_code ?? '').trim(), is_on_campus: this.booleanValue(row?.is_on_campus) }));
    },
    selectProgramFromContext() {
      const programCode = String(this.getSharedFilterValue('program_code', this.reportContext?.routeFilters?.programCode) ?? '').trim();
      const campusCode = String(this.getSharedFilterValue('campus_code', this.reportContext?.routeFilters?.campusCode) ?? '').trim();
      const match = this.programOptions.find(row => String(row.program_code ?? '').trim() === programCode && (!campusCode || String(row.campus_code ?? '').trim() === campusCode));
      this.selectedProgramKey = match?.key || (this.programOptions.some(row => row.key === this.selectedProgramKey) ? this.selectedProgramKey : this.programOptions[0]?.key || '');
    },
    normalizeRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({ ...row, sis_user_id: String(row?.sis_user_id ?? '').trim(), canvas_user_id: String(row?.canvas_user_id ?? '').trim(), program_code: String(row?.program_code ?? '').trim(), program_name: String(row?.program_name ?? '').trim(), campus_code: String(row?.campus_code ?? '').trim(), is_exited: this.booleanValue(row?.is_exited), is_graduate: this.booleanValue(row?.is_graduate), is_completer: this.booleanValue(row?.is_completer) }));
    },
    async loadCompletionData() {
      const program = this.selectedProgram;
      if (!program) return;
      try {
        this.loading = true; this.loadError = '';
        const rows = await this.fetchReportDataset({ academic_year: new Date().getFullYear(), program_code: program.program_code, campus_code: program.campus_code }, { dataset: 'program_student_completion' });
        const hydratedRows = await this.hydrateSisUserIds(this.normalizeRows(rows), { hydrate_sis_user_id: true });
        this.activeRows = hydratedRows.filter(row => !row.is_exited);
        this.exitedRows = hydratedRows.filter(row => row.is_exited);
        if (!hydratedRows.length) this.loadError = 'No program-student completion records are available for this program in the current academic year.';
      } catch (error) {
        console.warn('Failed to load graduation students', error); this.activeRows = []; this.exitedRows = []; this.loadError = 'Unable to load graduation students.';
      } finally { this.loading = false; }
    },
    async loadData() {
      try {
        this.loading = true; this.loadError = '';
        this.projections = this.normalizeProjections(await this.fetchReportDataset({}, { dataset: 'programs_graduates_projections' }));
        this.selectProgramFromContext();
        if (!this.selectedProgram) this.loadError = 'No on-campus program projections are available for the current academic year.';
        else await this.loadCompletionData();
        this.hasLoadedProjections = true;
      } catch (error) {
        console.warn('Failed to load graduation programs', error); this.loadError = 'Unable to load graduation programs.';
      } finally { this.loading = false; }
    }
  },

  mounted() { this.loadData(); },
  watch: {
    selectedProgramKey() { if (this.hasLoadedProjections) this.loadCompletionData(); },
    reportContext() { this.selectProgramFromContext(); }
  },

  template: `
  <div style="display:flex;flex-direction:column;gap:12px;flex:1 1 auto;min-height:0;overflow:auto;">
    <report-table-shell title-html="Active Students" :table="activeTable" :rows="visibleActiveRows" :loading="loading" :load-error="loadError" loading-text="Loading active students..." :row-key-fn="(row, index) => ['active', row.sis_user_id, row.program_code, row.campus_code, index].join(':')">
      <template #description>Current academic-year students, ordered by projected exit date. Blue shows actual progress; red shows the additional progress needed today when the student is behind pace.</template>
      <template #filters><label style="font-size:.75rem;font-weight:600;" for="graduation-students-program">Program</label><select id="graduation-students-program" v-model="selectedProgramKey" aria-label="Select graduation program" style="min-width:18rem;max-width:28rem;font-size:.75rem;"><option v-for="program in programOptions" :key="program.key" :value="program.key">{{ programLabel(program) }}</option></select></template>
    </report-table-shell>
    <report-table-shell title-html="Exited Students" :table="exitedTable" :rows="visibleExitedRows" :loading="loading" :load-error="loadError" loading-text="Loading exited students..." :row-key-fn="(row, index) => ['exited', row.sis_user_id, row.program_code, row.campus_code, index].join(':')">
      <template #description>Current academic-year exits for the selected program, including whether each student counted as a graduate.</template>
    </report-table-shell>
  </div>`
});
