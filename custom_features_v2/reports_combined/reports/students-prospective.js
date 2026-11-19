Vue.component('reports-students-prospective', {
  mixins: [
    window.ReportMixins.anonymization,
    window.ReportMixins.requests,
    window.ReportMixins.formatting,
    window.ReportMixins.dates,
    window.ReportMixins.students,
    window.ReportMixins.filters,
    window.ReportMixins.datasets
  ],

  props: {
    reportContext: { type: Object, default: () => ({}) }
  },

  data() {
    const colors = window.ReportUtils.createColors();
    return {
      colors,
      table: window.ReportUtils.createTable('Student', colors),
      rows: [],
      programs: [],
      selectedProgramName: '',
      minimumProgramProgressPercent: 0,
      minimumLastActivityAcademicYear: this.currentAcademicYear() - 4,
      loadedWaitlistMode: null,
      hasLoadedPrograms: false,
      loading: false,
      loadError: ''
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn('Student', 'Prospective student name. Opens the student report.', '14rem', false, 'string', row => this.studentNameLinkHtml(row), null, row => this.studentName(row).toLowerCase()),
      new window.ReportColumn('Email', 'Student email address.', '17rem', false, 'string', row => this.emailHtml(row.email_address), null, row => String(row.email_address || '').toLowerCase()),
      new window.ReportColumn('Former HS', 'Whether the student is a former high-school student who never enrolled.', '7rem', false, 'boolean', row => this.checkmarkHtml(row.is_former_hs_student_never_enrolled, 'Former high-school student'), null, row => this.boolSort(row.is_former_hs_student_never_enrolled)),
      new window.ReportColumn('Current HS', 'Whether the student is currently enrolled in high school.', '7rem', false, 'boolean', row => this.checkmarkHtml(row.is_active_hs_student, 'Current high-school student'), null, row => this.boolSort(row.is_active_hs_student)),
      new window.ReportColumn('Other Program', 'Whether the student is currently enrolled in another program.', '9rem', false, 'boolean', row => this.checkmarkHtml(row.is_current_student__other_program, 'Enrolled in another program'), null, row => this.boolSort(row.is_current_student__other_program)),
      new window.ReportColumn('Last Activity', 'Academic year containing the most recent recorded activity.', '9rem', false, 'number', row => this.academicYearText(row.last_activity_at), null, row => this.academicYearSort(row.last_activity_at)),
      new window.ReportColumn('Program Progress', 'Student progress through the program.', '13rem', false, 'number', row => this.progressHtml(row.perc_program__completed), null, row => this.sortNumber(row.perc_program__completed))
    ]);
  },

  computed: {
    programOptions() {
      const currentYear = new Date().getFullYear();
      const currentPrograms = this.programs.filter(row => Number(row.academic_year) === currentYear && row.is_on_campus && row.program_name);
      return Array.from(new Map(currentPrograms
        .map(row => [row.program_name, { value: row.program_name, label: row.program_name }]))
        .values())
        .sort((a, b) => a.label.localeCompare(b.label));
    },

    isWaitlistReport() {
      return String(this.reportContext?.subMenu ?? '').trim() === 'waitlist';
    },

    reportTitle() {
      return this.isWaitlistReport ? 'Waitlisted Students' : 'Prospective Students';
    },

    lastActivityYearMinimum() {
      return this.currentAcademicYear() - 4;
    },

    lastActivityYearMaximum() {
      return this.currentAcademicYear();
    },

    visibleRows() {
      this.table.setRows(this.filteredRows);
      return this.table.getSortedRows();
    },

    filteredRows() {
      const minProgress = Math.max(0, this.numberValue(this.minimumProgramProgressPercent) || 0) / 100;
      const minLastActivityYear = this.numberValue(this.minimumLastActivityAcademicYear) || this.lastActivityYearMinimum;

      return this.rows.filter(row => {
        const progress = this.numberValue(row.perc_program__completed) || 0;
        if (progress < minProgress) return false;
        const activityYear = this.lastActivityAcademicYear(row.last_activity_at);
        return activityYear !== null && activityYear >= minLastActivityYear;
      });
    }
  },

  methods: {
    currentAcademicYear() {
      const today = new Date();
      return today.getFullYear() - (today.getMonth() < 6 ? 1 : 0);
    },

    studentNameLinkHtml(row) {
      const name = this.escapeHtml(this.studentName(row));
      const canvasUserId = String(row?.canvas_user_id ?? '').trim();
      if (!canvasUserId) return name;
      const url = `/users/${encodeURIComponent(canvasUserId)}`;
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${name}</a>`;
    },

    checkmarkHtml(value, label) {
      return value ? `<span style="color:#15803d;font-size:1rem;" aria-label="${this.escapeHtml(label)}">✓</span>` : '';
    },

    emailHtml(value) {
      const email = String(value ?? '').trim();
      if (!email) return '—';
      return `<a href="mailto:${encodeURIComponent(email)}">${this.escapeHtml(email)}</a>`;
    },

    lastActivityAcademicYear(value) {
      const time = this.dateValue(value);
      if (time === null) return null;
      const date = new Date(time);
      return date.getFullYear() - (date.getMonth() < 6 ? 1 : 0);
    },

    academicYearText(value) {
      const year = this.lastActivityAcademicYear(value);
      return year === null ? '—' : String(year);
    },

    academicYearSort(value) {
      return this.lastActivityAcademicYear(value) ?? Number.POSITIVE_INFINITY;
    },

    progressHtml(value) {
      const progress = this.numberValue(value);
      if (progress === null) return '—';
      const percent = Math.max(0, Math.min(100, progress * 100));
      const label = `${percent.toFixed(1)}% complete`;
      return `<span style="display:block;min-width:11rem;padding-right:.5rem;"><span style="position:relative;display:block;height:.65rem;background:#e5e7eb;border-radius:999px;overflow:hidden;" role="progressbar" aria-label="Program progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"><span style="position:absolute;left:0;width:${percent}%;top:0;bottom:0;background:#2563eb;"></span></span><span style="display:block;margin-top:.15rem;color:#374151;font-size:.7rem;line-height:1rem;">${label}</span></span>`;
    },

    decimal(value) {
      const number = this.numberValue(value);
      return number === null ? '—' : number.toFixed(1);
    },

    normalizeRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        ...row,
        sis_user_id: String(row?.sis_user_id ?? '').trim(),
        canvas_user_id: String(row?.canvas_user_id ?? '').trim(),
        first_name: String(row?.first_name ?? '').trim(),
        last_name: String(row?.last_name ?? '').trim(),
        email_address: String(row?.email_address ?? '').trim(),
        program_code: String(row?.program_code ?? '').trim(),
        program_name: String(row?.program_name ?? '').trim(),
        outreach_reason: String(row?.outreach_reason ?? '').trim(),
        candidacy_stage_code: String(row?.candidacy_stage_code ?? '').trim(),
        is_waitlisted: this.booleanValue(row?.is_waitlisted),
        is_active_hs_student: this.booleanValue(row?.is_active_hs_student),
        is_former_hs_student_never_enrolled: this.booleanValue(row?.is_former_hs_student_never_enrolled),
        is_current_student__other_program: this.booleanValue(row?.is_current_student__other_program),
        perc_program__completed: this.numberValue(row?.perc_program__completed),
        last_activity_at: String(row?.last_activity_at ?? '').trim()
      }));
    },

    normalizePrograms(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        program_code: String(row?.program_code ?? '').trim(),
        program_name: String(row?.program_name ?? '').trim(),
        academic_year: Number(row?.academic_year),
        is_on_campus: this.booleanValue(row?.is_on_campus)
      }));
    },

    selectProgramFromContext() {
      const contextProgramName = String(this.getSharedFilterValue('program_name', this.reportContext?.routeFilters?.programName) ?? '').trim();
      const selected = this.programOptions.some(program => program.value === contextProgramName)
        ? contextProgramName
        : this.programOptions.some(program => program.value === this.selectedProgramName)
          ? this.selectedProgramName
          : this.programOptions[0]?.value || '';
      this.selectedProgramName = selected;
    },

    syncSelectedProgramToSharedFilters() {
      this.setSharedFilterValue('program_name', this.selectedProgramName);
      this.setSharedFilterValue('program_code', '');
      this.setSharedFilterValue('campus_code', '');
    },

    async loadProspectiveStudents() {
      const programName = this.selectedProgramName;
      const isWaitlist = this.isWaitlistReport;
      return this.runReportRequest('data', {
        onError: error => {
          console.warn('Failed to load prospective students', error);
          this.rows = [];
          this.loadError = 'Unable to load prospective students.';
        }
      }, async request => {
        if (!programName) {
          this.rows = [];
          return;
        }
        const rows = await request.wait(this.fetchReportDataset(
          { academic_year: new Date().getFullYear(), program_name: programName, is_waitlisted: isWaitlist },
          { dataset: 'program_student_prospective' }
        ));
        this.rows = this.normalizeRows(rows).filter(row => row.is_waitlisted === isWaitlist);
        this.loadedWaitlistMode = isWaitlist;
        if (!this.rows.length) this.loadError = `No ${isWaitlist ? 'waitlisted' : 'prospective'} students are available for this program in the current academic year.`;
      });
    },

    async loadData() {
      return this.runReportRequest('programs', {
        invalidate: ['data'],
        onError: error => {
          console.warn('Failed to load prospective students', error);
          this.rows = [];
          this.loadError = 'Unable to load prospective students.';
        }
      }, async request => {
        const programs = await request.wait(this.fetchReportDataset({}, { dataset: 'programs_graduates_projections' }));
        this.programs = this.normalizePrograms(programs);
        const previousProgramName = this.selectedProgramName;
        this.hasLoadedPrograms = true;
        this.selectProgramFromContext();
        // Changed selections load through the watcher; refresh unchanged ones here.
        if (!this.selectedProgramName) this.loadError = 'No on-campus programs are available for the current academic year.';
        else if (previousProgramName === this.selectedProgramName) this.loadProspectiveStudents();
      });
    }
  },

  mounted() {
    this.loadData();
  },

  watch: {
    selectedProgramName() {
      if (!this.hasLoadedPrograms) return;
      this.syncSelectedProgramToSharedFilters();
      this.loadProspectiveStudents();
    },
    reportContext() {
      const previousProgramName = this.selectedProgramName;
      this.selectProgramFromContext();
      if (this.hasLoadedPrograms && previousProgramName === this.selectedProgramName && this.loadedWaitlistMode !== this.isWaitlistReport) {
        this.loadProspectiveStudents();
      }
    }
  },

  template: `
  <report-table-shell
    :title-html="reportTitle"
    :table="table"
    :rows="visibleRows"
    :loading="loading"
    :load-error="loadError"
    loading-text="Loading prospective students..."
    :row-key-fn="(row, index) => row.canvas_user_id || row.sis_user_id || index"
  >
    <template #description>
      Current academic-year {{ isWaitlistReport ? 'waitlisted' : 'prospective' }} students.
    </template>
    <template #filters>
      <label style="font-size:.75rem;font-weight:600;" for="prospective-students-program">Program</label>
      <select id="prospective-students-program" v-model="selectedProgramName" aria-label="Filter prospective students by program" style="min-width:18rem;max-width:28rem;font-size:.75rem;">
        <option v-for="program in programOptions" :key="program.value" :value="program.value">{{ displayFilterOption(program, 'program_name', 'Program') }}</option>
      </select>
      <label style="font-size:.75rem;font-weight:600;" for="prospective-students-min-progress">Min. progress</label>
      <input id="prospective-students-min-progress" v-model="minimumProgramProgressPercent" type="number" min="0" max="100" step="1" aria-label="Minimum high-school program progress percentage" style="width:5rem;font-size:.75rem;">
      <span class="btech-muted" style="font-size:.75rem;">%</span>
      <label style="font-size:.75rem;font-weight:600;" for="prospective-students-last-activity">Last activity: {{ minimumLastActivityAcademicYear }} onward</label>
      <input id="prospective-students-last-activity" v-model.number="minimumLastActivityAcademicYear" type="range" :min="lastActivityYearMinimum" :max="lastActivityYearMaximum" step="1" aria-label="Minimum academic year of last activity" style="width:9rem;">
    </template>
  </report-table-shell>
  `
});
