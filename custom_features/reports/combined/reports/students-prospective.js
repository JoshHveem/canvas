Vue.component('reports-students-prospective', {
  mixins: [window.ReportMixins.formatting],

  props: {
    reportContext: { type: Object, default: () => ({}) }
  },

  data() {
    const colors = window.ReportUtils.createColors();
    return {
      colors,
      table: window.ReportUtils.createTable('Outreach Priority', colors),
      rows: [],
      selectedProgramKey: '',
      loading: false,
      loadError: ''
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn('Outreach Priority', 'Outreach priority from the prospective-student dataset.', '8rem', false, 'number', row => this.priorityText(row.outreach_priority), null, row => this.sortNumber(row.outreach_priority)),
      new window.ReportColumn('Student', 'Prospective student name.', '14rem', false, 'string', row => this.escapeHtml(this.studentName(row)), null, row => this.studentName(row).toLowerCase()),
      new window.ReportColumn('Email', 'Student email address.', '17rem', false, 'string', row => this.emailHtml(row.email_address), null, row => String(row.email_address || '').toLowerCase()),
      new window.ReportColumn('Program', 'Prospective program.', '15rem', false, 'string', row => this.escapeHtml(row.program_name || row.program_code || '—'), null, row => String(row.program_name || row.program_code || '').toLowerCase()),
      new window.ReportColumn('Outreach Reason', 'Reason the student is included in the outreach list.', '16rem', false, 'string', row => this.escapeHtml(this.reasonText(row.outreach_reason)), null, row => this.reasonText(row.outreach_reason).toLowerCase()),
      new window.ReportColumn('Candidacy Stage', 'Most recent candidacy stage.', '12rem', false, 'string', row => this.escapeHtml(this.titleText(row.candidacy_stage_code) || '—'), null, row => String(row.candidacy_stage_code || '').toLowerCase()),
      new window.ReportColumn('HS Status', 'Relevant high-school status.', '13rem', false, 'string', row => this.escapeHtml(this.hsStatus(row)), null, row => this.hsStatus(row).toLowerCase()),
      new window.ReportColumn('HS Exit', 'Most recent high-school exit date.', '9rem', false, 'date', row => this.dateText(row.exit_at__hs_latest), null, row => this.dateSort(row.exit_at__hs_latest)),
      new window.ReportColumn('HS Program Progress', 'Program progress earned while in high school.', '11rem', false, 'number', row => this.percent(row.perc_program__completed__hs), null, row => this.sortNumber(row.perc_program__completed__hs)),
      new window.ReportColumn('HS Credits Remaining', 'Credits remaining in the program from the student’s high-school record.', '11rem', false, 'number', row => this.decimal(row.num_credits__program_remaining__hs), null, row => this.sortNumber(row.num_credits__program_remaining__hs))
    ]);
  },

  computed: {
    programOptions() {
      return Array.from(new Map(this.rows
        .filter(row => row.program_code || row.program_name)
        .map(row => [this.programKey(row), { key: this.programKey(row), label: row.program_name || row.program_code || 'Unknown program' }]))
        .values())
        .sort((a, b) => a.label.localeCompare(b.label));
    },

    filteredRows() {
      if (!this.selectedProgramKey) return this.rows;
      return this.rows.filter(row => this.programKey(row) === this.selectedProgramKey);
    },

    visibleRows() {
      this.table.setRows(this.filteredRows);
      return this.table.getSortedRows();
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

    programKey(row) {
      return [String(row?.program_code ?? '').trim(), String(row?.program_name ?? '').trim()].join('|');
    },

    priorityText(value) {
      const priority = this.numberValue(value);
      return priority === null ? '—' : String(Math.round(priority));
    },

    reasonText(value) {
      return this.titleText(value) || '—';
    },

    titleText(value) {
      return String(value ?? '').trim().replace(/[_-]+/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
    },

    hsStatus(row) {
      if (row.is_waitlisted) return 'Waitlisted';
      if (row.is_active_hs_student) return 'Active HS student';
      if (row.is_former_hs_student_never_enrolled) return 'Former HS student';
      return 'Prospective';
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
        is_former_hs_student_never_enrolled: this.booleanValue(row?.is_former_hs_student_never_enrolled)
      }));
    },

    async loadData() {
      try {
        this.loading = true;
        this.loadError = '';
        const rows = await this.fetchReportDataset(
          { academic_year: new Date().getFullYear() },
          { dataset: 'program_student_prospective' }
        );
        this.rows = this.normalizeRows(rows);
        if (!this.selectedProgramKey && this.programOptions.length) this.selectedProgramKey = this.programOptions[0].key;
        if (!this.rows.length) this.loadError = 'No prospective students are available for the current academic year.';
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

  template: `
  <report-table-shell
    title-html="Prospective Students"
    :table="table"
    :rows="visibleRows"
    :loading="loading"
    :load-error="loadError"
    loading-text="Loading prospective students..."
    :row-key-fn="(row, index) => row.canvas_user_id || row.sis_user_id || index"
  >
    <template #description>
      Current academic-year prospective students, ordered by outreach priority.
    </template>
    <template #filters>
      <label style="font-size:.75rem;font-weight:600;" for="prospective-students-program">Program</label>
      <select id="prospective-students-program" v-model="selectedProgramKey" aria-label="Filter prospective students by program" style="min-width:18rem;max-width:28rem;font-size:.75rem;">
        <option v-for="program in programOptions" :key="program.key" :value="program.key">{{ program.label }}</option>
      </select>
    </template>
  </report-table-shell>
  `
});
