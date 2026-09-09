Vue.component('reports-students-prospective', {
  mixins: [window.ReportMixins.formatting],

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
      maximumYearsSinceActivity: '',
      hasLoadedPrograms: false,
      loading: false,
      loadError: ''
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn('Student', 'Prospective student name.', '14rem', false, 'string', row => this.escapeHtml(this.studentName(row)), null, row => this.studentName(row).toLowerCase()),
      new window.ReportColumn('Email', 'Student email address.', '17rem', false, 'string', row => this.emailHtml(row.email_address), null, row => String(row.email_address || '').toLowerCase()),
      new window.ReportColumn('Former HS', 'Whether the student is a former high-school student who never enrolled.', '7rem', false, 'boolean', row => this.checkmarkHtml(row.is_former_hs_student_never_enrolled, 'Former high-school student'), null, row => this.boolSort(row.is_former_hs_student_never_enrolled)),
      new window.ReportColumn('Current HS', 'Whether the student is currently enrolled in high school.', '7rem', false, 'boolean', row => this.checkmarkHtml(row.is_active_hs_student, 'Current high-school student'), null, row => this.boolSort(row.is_active_hs_student)),
      new window.ReportColumn('Other Program', 'Whether the student is currently enrolled in another program.', '9rem', false, 'boolean', row => this.checkmarkHtml(row.is_current_student__other_program, 'Enrolled in another program'), null, row => this.boolSort(row.is_current_student__other_program)),
      new window.ReportColumn('Last Activity', 'Most recent recorded activity date.', '10rem', false, 'date', row => this.dateText(row.last_activity_at), null, row => this.dateSort(row.last_activity_at)),
      new window.ReportColumn('HS Program Progress', 'Program progress earned while in high school.', '11rem', false, 'number', row => this.percent(row.perc_program__completed__hs), null, row => this.sortNumber(row.perc_program__completed__hs)),
      new window.ReportColumn('HS Credits Remaining', 'Credits remaining in the program from the student’s high-school record.', '11rem', false, 'number', row => this.decimal(row.num_credits__program_remaining__hs), null, row => this.sortNumber(row.num_credits__program_remaining__hs))
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

    visibleRows() {
      this.table.setRows(this.filteredRows);
      return this.table.getSortedRows();
    },

    filteredRows() {
      const minProgress = Math.max(0, this.numberValue(this.minimumProgramProgressPercent) || 0) / 100;
      const maxYears = this.numberValue(this.maximumYearsSinceActivity);

      return this.rows.filter(row => {
        const progress = this.numberValue(row.perc_program__completed__hs) || 0;
        if (progress < minProgress) return false;
        if (maxYears === null || maxYears < 0) return true;
        const years = this.yearsSinceLastActivity(row.last_activity_at);
        return years !== null && years <= maxYears;
      });
    }
  },

  methods: {
    numberValue(value) {
      const number = Number(value);
      return Number.isFinite(number) ? number : null;
    },

    sortNumber(value) {
      return this.numberValue(value) ?? Number.POSITIVE_INFINITY;
    },

    studentName(row) {
      return [row.first_name, row.last_name].filter(Boolean).join(' ').trim() || `Canvas User ${row.canvas_user_id || row.sis_user_id || '—'}`;
    },

    checkmarkHtml(value, label) {
      return value ? `<span style="color:#15803d;font-size:1rem;" aria-label="${this.escapeHtml(label)}">✓</span>` : '';
    },

    emailHtml(value) {
      const email = String(value ?? '').trim();
      if (!email) return '—';
      return `<a href="mailto:${encodeURIComponent(email)}">${this.escapeHtml(email)}</a>`;
    },

    dateValue(value) {
      const dateOnly = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (dateOnly) return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3])).getTime();
      const time = Date.parse(value);
      return Number.isFinite(time) ? time : null;
    },

    dateSort(value) {
      return this.dateValue(value) ?? Number.POSITIVE_INFINITY;
    },

    yearsSinceLastActivity(value) {
      const time = this.dateValue(value);
      return time === null ? null : Math.max(0, (Date.now() - time) / (365.25 * 86400000));
    },

    dateText(value) {
      const time = this.dateValue(value);
      return time === null ? '—' : new Date(time).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    },

    percent(value) {
      const number = this.numberValue(value);
      return number === null ? '—' : `${(number * 100).toFixed(1)}%`;
    },

    decimal(value) {
      const number = this.numberValue(value);
      return number === null ? '—' : number.toFixed(1);
    },

    booleanValue(value) {
      return value === true || value === 1 || value === '1' || String(value ?? '').toLowerCase() === 'true';
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

    async loadProspectiveStudents() {
      if (!this.selectedProgramName) {
        this.rows = [];
        return;
      }
      const rows = await this.fetchReportDataset(
        { academic_year: new Date().getFullYear(), program_name: this.selectedProgramName, is_waitlisted: this.isWaitlistReport },
        { dataset: 'program_student_prospective' }
      );
      this.rows = this.normalizeRows(rows).filter(row => row.is_waitlisted === this.isWaitlistReport);
      if (!this.rows.length) this.loadError = `No ${this.isWaitlistReport ? 'waitlisted' : 'prospective'} students are available for this program in the current academic year.`;
    },

    async loadData() {
      try {
        this.loading = true;
        this.loadError = '';
        const programs = await this.fetchReportDataset({}, { dataset: 'programs_graduates_projections' });
        this.programs = this.normalizePrograms(programs);
        this.selectProgramFromContext();
        if (!this.selectedProgramName) this.loadError = 'No on-campus programs are available for the current academic year.';
        else await this.loadProspectiveStudents();
        this.hasLoadedPrograms = true;
      } catch (error) {
        console.warn('Failed to load prospective students', error);
        this.rows = [];
        this.loadError = 'Unable to load prospective students.';
      } finally {
        this.loading = false;
      }
    }
  },

  mounted() {
    this.loadData();
  },

  watch: {
    selectedProgramName() {
      if (!this.hasLoadedPrograms) return;
      this.loading = true;
      this.loadError = '';
      this.loadProspectiveStudents()
        .catch(error => {
          console.warn('Failed to load prospective students', error);
          this.rows = [];
          this.loadError = 'Unable to load prospective students.';
        })
        .finally(() => { this.loading = false; });
    },
    reportContext() {
      const previousProgramName = this.selectedProgramName;
      this.selectProgramFromContext();
      if (this.hasLoadedPrograms && previousProgramName === this.selectedProgramName) {
        this.loading = true;
        this.loadError = '';
        this.loadProspectiveStudents()
          .catch(error => {
            console.warn('Failed to load prospective students', error);
            this.rows = [];
            this.loadError = 'Unable to load prospective students.';
          })
          .finally(() => { this.loading = false; });
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
        <option v-for="program in programOptions" :key="program.value" :value="program.value">{{ program.label }}</option>
      </select>
      <label style="font-size:.75rem;font-weight:600;" for="prospective-students-min-progress">Min. progress</label>
      <input id="prospective-students-min-progress" v-model="minimumProgramProgressPercent" type="number" min="0" max="100" step="1" aria-label="Minimum high-school program progress percentage" style="width:5rem;font-size:.75rem;">
      <span class="btech-muted" style="font-size:.75rem;">%</span>
      <label style="font-size:.75rem;font-weight:600;" for="prospective-students-max-activity-years">Max. years since activity</label>
      <input id="prospective-students-max-activity-years" v-model="maximumYearsSinceActivity" type="number" min="0" step=".25" placeholder="Any" aria-label="Maximum years since last activity" style="width:5rem;font-size:.75rem;">
    </template>
  </report-table-shell>
  `
});
