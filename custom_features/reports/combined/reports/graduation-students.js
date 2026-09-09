Vue.component('reports-graduation-students', {
  mixins: [window.ReportMixins.formatting],
  props: { reportContext: { type: Object, default: () => ({}) } },

  data() {
    const colors = window.ReportUtils.createColors();
    return { colors, activeTable: window.ReportUtils.createTable('Projected Exit', colors), exitedTable: window.ReportUtils.createTable('Exit Date', colors), projections: [], selectedProgramKey: '', predictedGraduateOverride: null, predictedExitOverride: null, hasLoadedProjections: false, activeRows: [], exitedRows: [], loading: false, loadError: '' };
  },

  created() {
    this.activeTable.setColumns([
      this.studentColumn(), this.sisIdColumn(),
      this.dateColumn('Target Exit', 'Program target exit date.', 'exit_at__target'),
      new window.ReportColumn('Projected Exit', 'Projected exit date based on the student\'s current pace. Green: by June 30 of the academic year end; yellow: by July 31; red: later.', '9rem', false, 'date', row => this.dateText(row.exit_at__projected), row => this.projectedExitStyle(row), row => this.dateSort(row.exit_at__projected)),
      new window.ReportColumn('Pace Multiplier', 'Current pace divided by the pace required to meet the target exit date.', '9rem', false, 'number', row => this.paceText(row.progress_pace_multiplier), row => this.paceStyle(row.progress_pace_multiplier), row => this.sortNumber(row.progress_pace_multiplier)),
      new window.ReportColumn('Program Progress', 'Blue is current program progress. Red shows the progress needed today to meet the target exit date when the student is behind pace.', '13rem', false, 'number', row => this.progressHtml(row), null, row => this.sortNumber(row.progress__program))
    ]);
    this.exitedTable.setColumns([
      this.studentColumn(), this.sisIdColumn(),
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
    visibleExitedRows() { this.exitedTable.setRows(this.exitedRows); return this.exitedTable.getSortedRows(); },
    projectionBaseline() {
      const projection = this.selectedProgram;
      const actualExiters = this.numberValue(projection?.num_students__exiter);
      const projectedExiters = this.numberValue(projection?.num_students__exiter__projected);
      const actualGraduates = this.numberValue(projection?.num_students__graduate);
      const projectedGraduates = this.numberValue(projection?.num_students__graduate__projected);
      if ([actualExiters, projectedExiters, actualGraduates, projectedGraduates].some(value => value === null)) return null;

      const totalExiters = Math.max(projectedExiters, actualExiters, 0);
      const actualGraduateCount = Math.min(Math.max(actualGraduates, 0), actualExiters, totalExiters);
      const projectedGraduateCount = Math.min(Math.max(projectedGraduates, actualGraduateCount), totalExiters);
      const pendingGraduateCount = Math.max(0, projectedGraduateCount - actualGraduateCount);
      const projectedGraduateCountByDate = this.activeRows.filter(row => this.isProjectedGraduateBeforeAcademicYearEnd(row)).length;
      const identifiedProjectedGraduateCount = Math.min(projectedGraduateCountByDate, pendingGraduateCount);
      const predictedGraduateCount = Math.max(0, pendingGraduateCount - identifiedProjectedGraduateCount);
      const actualNonGraduateCount = Math.max(0, actualExiters - actualGraduateCount);
      const predictedExitCount = Math.max(0, totalExiters - actualExiters - identifiedProjectedGraduateCount - predictedGraduateCount);
      return {
        actualExiters,
        actualGraduateCount,
        identifiedProjectedGraduateCount,
        predictedGraduateCount,
        actualNonGraduateCount,
        predictedExitCount,
        projectedGraduateTotal: projectedGraduateCount,
        projectedExiterTotal: totalExiters
      };
    },
    scenarioPredictedGraduateCount: {
      get() { return this.nonNegativeNumber(this.predictedGraduateOverride) ?? this.projectionBaseline?.projectedGraduateTotal ?? 0; },
      set(value) { this.predictedGraduateOverride = this.nonNegativeNumber(value); }
    },
    scenarioPredictedExitCount: {
      get() { return this.nonNegativeNumber(this.predictedExitOverride) ?? this.projectionBaseline?.projectedExiterTotal ?? 0; },
      set(value) { this.predictedExitOverride = this.nonNegativeNumber(value); }
    },
    projectionBreakdown() {
      const baseline = this.projectionBaseline;
      if (!baseline) return null;
      const totalExiters = Math.max(baseline.actualExiters, this.scenarioPredictedExitCount);
      const maximumGraduateCount = Math.max(baseline.actualGraduateCount, totalExiters - baseline.actualNonGraduateCount);
      const projectedGraduateCount = Math.min(maximumGraduateCount, Math.max(baseline.actualGraduateCount, this.scenarioPredictedGraduateCount));
      const remainingProjectedGraduates = projectedGraduateCount - baseline.actualGraduateCount;
      const identifiedProjectedGraduateCount = Math.min(baseline.identifiedProjectedGraduateCount, remainingProjectedGraduates);
      const predictedGraduateCount = Math.max(0, remainingProjectedGraduates - identifiedProjectedGraduateCount);
      const predictedExitCount = Math.max(0, totalExiters - baseline.actualExiters - identifiedProjectedGraduateCount - predictedGraduateCount);
      const rate = totalExiters ? projectedGraduateCount / totalExiters : null;

      return {
        actualExiters: baseline.actualExiters,
        assumedExiters: Math.max(0, totalExiters - baseline.actualExiters),
        totalExiters,
        projectedGraduateCount,
        rate,
        segments: [
          { key: 'actual-graduates', value: baseline.actualGraduateCount, color: '#1e3a8a', opacity: 1, label: 'Actual graduates' },
          { key: 'projected-graduates', value: identifiedProjectedGraduateCount, color: '#2563eb', opacity: .72, label: 'Projected graduates by academic-year end date' },
          { key: 'predicted-graduates', value: predictedGraduateCount, color: '#2563eb', opacity: .32, label: 'Predicted graduates' },
          { key: 'actual-non-graduates', value: baseline.actualNonGraduateCount, color: '#9ca3af', opacity: 1, label: 'Actual exited, not graduated' },
          { key: 'predicted-exits', value: predictedExitCount, color: '#d1d5db', opacity: 1, label: 'Predicted exits' }
        ].filter(segment => segment.value > 0)
      };
    }
  },

  methods: {
    studentColumn() { return new window.ReportColumn('Student', 'Student name from Canvas.', '14rem', false, 'string', row => this.escapeHtml(this.studentName(row)), null, row => this.studentName(row).toLowerCase()); },
    sisIdColumn() { return new window.ReportColumn('SIS ID', 'Student information system ID.', '8rem', false, 'string', row => this.escapeHtml(row.sis_user_id || '—'), null, row => String(row.sis_user_id || '').toLowerCase()); },
    dateColumn(name, description, field) { return new window.ReportColumn(name, description, '9rem', false, 'date', row => this.dateText(row[field]), null, row => this.dateSort(row[field])); },
    programLabel(row) { return [String(row?.program_name ?? '').trim(), String(row?.campus_name ?? row?.campus_code ?? '').trim()].filter(Boolean).join(' - '); },
    studentName(row) { return [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || `Canvas User ${row.canvas_user_id || row.sis_user_id || '—'}`; },
    numberValue(value) { const number = Number(value); return Number.isFinite(number) ? number : null; },
    nonNegativeNumber(value) {
      if (value === null || value === undefined || String(value).trim() === '') return null;
      const number = this.numberValue(value);
      return number === null ? null : Math.max(0, number);
    },
    sortNumber(value) { return this.numberValue(value) ?? Number.POSITIVE_INFINITY; },
    resetScenario() { this.predictedGraduateOverride = null; this.predictedExitOverride = null; },
    dateValue(value) {
      const dateOnly = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateOnly) return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])).getTime();
      const time = Date.parse(value);
      return Number.isFinite(time) ? time : null;
    },
    dateSort(value) { return this.dateValue(value) ?? Number.POSITIVE_INFINITY; },
    dateText(value) { const time = this.dateValue(value); return time === null ? '—' : new Date(time).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }); },
    projectedExitStyle(row) {
      const projectedExit = this.dateValue(row?.exit_at__projected);
      const academicYear = Number(row?.academic_year);
      if (!Number.isFinite(projectedExit) || !Number.isFinite(academicYear)) return { backgroundColor: this.colors.gray, color: this.colors.black };
      const academicYearEnd = new Date(academicYear + 1, 5, 30).getTime();
      const gracePeriodEnd = new Date(academicYear + 1, 6, 31, 23, 59, 59, 999).getTime();
      if (projectedExit <= academicYearEnd) return { backgroundColor: this.colors.green, color: this.colors.white };
      if (projectedExit <= gracePeriodEnd) return { backgroundColor: this.colors.yellow, color: this.colors.black };
      return { backgroundColor: this.colors.red, color: this.colors.white };
    },
    paceText(value) { const number = this.numberValue(value); return number === null || number === 0 ? '—' : `${number.toFixed(2)}×`; },
    paceStyle(value) {
      const number = this.numberValue(value);
      if (number === null || number === 0) return {};
      if (number < 0.9) return { backgroundColor: this.colors.red, color: this.colors.white };
      if (number < 1) return { backgroundColor: this.colors.yellow, color: this.colors.black };
      return { backgroundColor: this.colors.green, color: this.colors.white };
    },
    projectionSegmentValue(key) {
      const segment = this.projectionBreakdown?.segments.find(candidate => candidate.key === key);
      return segment ? segment.value : 0;
    },
    isProjectedGraduateBeforeAcademicYearEnd(row) {
      const projectedExit = this.dateValue(row?.exit_at__projected);
      const academicYear = Number(row?.academic_year);
      if (!Number.isFinite(projectedExit) || !Number.isFinite(academicYear)) return false;
      return projectedExit <= new Date(academicYear + 1, 5, 30, 23, 59, 59, 999).getTime();
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
      const programName = String(this.getSharedFilterValue('program_name', this.reportContext?.routeFilters?.programName) ?? '').trim();
      const match = this.programOptions.find(row => String(row.program_code ?? '').trim() === programCode && (!campusCode || String(row.campus_code ?? '').trim() === campusCode))
        || this.programOptions.find(row => String(row.program_name ?? '').trim() === programName);
      this.selectedProgramKey = match?.key || (this.programOptions.some(row => row.key === this.selectedProgramKey) ? this.selectedProgramKey : this.programOptions[0]?.key || '');
    },
    syncSelectedProgramToSharedFilters() {
      const program = this.selectedProgram;
      if (!program) return;
      this.setSharedFilterValue('program_code', String(program.program_code ?? '').trim());
      this.setSharedFilterValue('campus_code', String(program.campus_code ?? '').trim());
      this.setSharedFilterValue('program_name', String(program.program_name ?? '').trim());
    },
    normalizeRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => {
        const sisUserId = String(row?.sis_user_id ?? '').trim();
        return {
          ...row,
          sis_user_id: sisUserId,
          canvas_user_id: String(row?.canvas_user_id ?? '').trim(),
          program_code: String(row?.program_code ?? '').trim(),
          program_name: String(row?.program_name ?? '').trim(),
          campus_code: String(row?.campus_code ?? '').trim(),
          is_exited: this.booleanValue(row?.is_exited),
          is_graduate: this.booleanValue(row?.is_graduate),
          is_completer: this.booleanValue(row?.is_completer)
        };
      });
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
    selectedProgramKey() { this.resetScenario(); this.syncSelectedProgramToSharedFilters(); if (this.hasLoadedProjections) this.loadCompletionData(); },
    reportContext() { this.selectProgramFromContext(); }
  },

  template: `
  <div style="display:flex;flex-direction:column;gap:12px;flex:1 1 auto;height:100%;min-height:0;overflow:hidden;">
    <div class="btech-card btech-theme" style="padding:12px;flex:0 0 auto;">
      <label style="font-size:.75rem;font-weight:600;" for="graduation-students-program">Program</label>
      <select id="graduation-students-program" v-model="selectedProgramKey" aria-label="Select graduation program" style="min-width:18rem;max-width:28rem;margin-left:.5rem;font-size:.75rem;"><option v-for="program in programOptions" :key="program.key" :value="program.key">{{ programLabel(program) }}</option></select>
    </div>
    <div style="display:grid;grid-template-rows:minmax(0, 2fr) minmax(0, 1fr);gap:12px;flex:1 1 auto;min-height:0;overflow:hidden;">
    <report-table-shell :embedded="true" title-html="Active Students" :table="activeTable" :rows="visibleActiveRows" :loading="loading" :load-error="loadError" loading-text="Loading active students..." :row-key-fn="(row, index) => ['active', row.sis_user_id, row.program_code, row.campus_code, index].join(':')">
      <template #description>
        <div>Current academic-year students, ordered by projected exit date. Blue shows actual progress; red shows the additional progress needed today when the student is behind pace.</div>
        <div style="margin-top:10px;max-width:100%;">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:baseline;margin-bottom:4px;color:#374151;"><strong style="font-size:.78rem;">Projected graduation rate</strong><span style="font-size:.75rem;">{{ projectionBreakdown === null || projectionBreakdown.rate === null ? 'Insufficient projection data' : (projectionBreakdown.rate * 100).toFixed(1) + '% (' + projectionBreakdown.projectedGraduateCount.toFixed(1) + ' / ' + projectionBreakdown.totalExiters.toFixed(1) + ')' }}</span></div>
          <div style="position:relative;height:18px;border-radius:4px;overflow:hidden;background:#e5e7eb;">
            <div v-if="projectionBreakdown && projectionBreakdown.segments.length" style="position:absolute;inset:0;display:flex;">
              <span v-for="segment in projectionBreakdown.segments" :key="segment.key" :title="segment.label + ': ' + segment.value.toFixed(1)" :style="{ flex: segment.value + ' 1 0', backgroundColor: segment.color, opacity: segment.opacity, borderRight:'1px solid rgba(255,255,255,.75)' }"></span>
            </div>
            <div style="position:absolute;left:60%;top:0;bottom:0;width:2px;background:#111827;" title="60% graduation-rate target"></div>
          </div>
          <div v-if="projectionBreakdown" style="display:flex;gap:12px;flex-wrap:wrap;margin-top:4px;font-size:.7rem;color:#4b5563;"><span><i style="display:inline-block;width:8px;height:8px;background:#1e3a8a;margin-right:3px;"></i>Actual graduates: {{ projectionSegmentValue('actual-graduates').toFixed(1) }}</span><span><i style="display:inline-block;width:8px;height:8px;background:#2563eb;opacity:.72;margin-right:3px;"></i>Projected graduates: {{ projectionSegmentValue('projected-graduates').toFixed(1) }}</span><span><i style="display:inline-block;width:8px;height:8px;background:#9ca3af;margin-right:3px;"></i>Actual exits (not graduated): {{ projectionSegmentValue('actual-non-graduates').toFixed(1) }}</span><span><i style="display:inline-block;width:2px;height:10px;background:#111827;margin:0 4px -1px 0;"></i>60% target</span></div>
          <div v-if="projectionBreakdown" style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:8px;font-size:.75rem;">
            <i style="display:inline-block;width:8px;height:8px;background:#2563eb;opacity:.32;"></i>
            <label for="graduation-students-predicted-graduates">Total graduates</label>
            <input id="graduation-students-predicted-graduates" v-model.number="scenarioPredictedGraduateCount" type="number" :min="projectionBaseline ? projectionBaseline.actualGraduateCount : 0" :max="projectionBaseline ? Math.max(projectionBaseline.actualGraduateCount, scenarioPredictedExitCount - projectionBaseline.actualNonGraduateCount) : scenarioPredictedExitCount" step="1" aria-label="Scenario total graduates" style="width:4.5rem;font-size:.75rem;">
            <i style="display:inline-block;width:8px;height:8px;background:#d1d5db;"></i>
            <label for="graduation-students-predicted-exits">Total exits</label>
            <input id="graduation-students-predicted-exits" v-model.number="scenarioPredictedExitCount" type="number" :min="projectionBaseline ? projectionBaseline.actualExiters : 0" step="1" aria-label="Scenario total exits" style="width:4.5rem;font-size:.75rem;">
            <button type="button" @click="resetScenario" style="font-size:.75rem;">Reset</button>
          </div>
        </div>
      </template>
    </report-table-shell>
    <report-table-shell :embedded="true" title-html="Exited Students" :table="exitedTable" :rows="visibleExitedRows" :loading="loading" :load-error="loadError" loading-text="Loading exited students..." :row-key-fn="(row, index) => ['exited', row.sis_user_id, row.program_code, row.campus_code, index].join(':')">
      <template #description>Current academic-year exits for the selected program, including whether each student counted as a graduate.</template>
    </report-table-shell>
    </div>
  </div>`
});
