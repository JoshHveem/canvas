Vue.component('reports-employment-skills', {
  mixins: [
    window.ReportMixins.formatting
  ],

  data() {
    const colors = window.ReportUtils.createColors();
    const table = window.ReportUtils.createTable('SIS User ID', colors);

    return {
      colors,
      table,
      loading: false,
      loadError: '',
      year: Number(this.reportContext?.sharedFilters?.academic_year ?? this.reportContext?.filters?.academic_year) || new Date().getFullYear(),
      rows: [],
      selectedProgramCode: String(this.reportContext?.sharedFilters?.program_code ?? this.reportContext?.routeFilters?.programCode ?? '')
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'SIS User ID', 'Student SIS ID.', '8rem', false, 'string',
        row => this.escapeHtml(String(row?.sis_user_id ?? '')),
        null,
        row => String(row?.sis_user_id ?? '').toLowerCase()
      ),
      new window.ReportColumn(
        'Program', 'Program code.', '8rem', false, 'string',
        row => this.escapeHtml(String(row?.program_code ?? '')),
        null,
        row => String(row?.program_code ?? '').toLowerCase()
      ),
      new window.ReportColumn(
        'Course', 'Course name.', '18rem', false, 'string',
        row => this.escapeHtml(String(row?.course_name ?? '')),
        null,
        row => String(row?.course_name ?? '').toLowerCase()
      ),
      new window.ReportColumn(
        'Self Eval', 'Self evaluation submission date.', '11rem', false, 'string',
        row => this.escapeHtml(String(row?.created_at__self_eval ?? '')),
        null,
        row => String(row?.created_at__self_eval ?? '').toLowerCase()
      ),
      new window.ReportColumn(
        'Instructor Eval', 'Instructor evaluation submission date or pending state.', '14rem', false, 'string',
        row => {
          if (row?.is_pending_instructor_eval) {
            return '<span title="Pending Instructor Eval">Pending Instructor Eval</span>';
          }
          return this.escapeHtml(String(row?.created_at__instructor_eval ?? '')) || '-';
        },
        null,
        row => {
          if (row?.is_pending_instructor_eval) return 'pending instructor eval';
          return String(row?.created_at__instructor_eval ?? '').toLowerCase();
        }
      ),
      new window.ReportColumn(
        'Submission', 'Link to the Canvas speed grader for the submission.', '20rem', false, 'string',
        row => {
          const canvasCourseId = String(row?.canvas_course_id ?? '').trim();
          const canvasUserId = String(row?.canvas_user_id ?? '').trim();
          const assignmentId = String(row?.canvas_assignment_id ?? '').trim();
          if (!canvasCourseId || !canvasUserId || !assignmentId) return '-';
          const url = `https://btech.instructure.com/courses/${encodeURIComponent(canvasCourseId)}/gradebook/speed_grader?assignment_id=${encodeURIComponent(assignmentId)}&student_id=${encodeURIComponent(canvasUserId)}`;
          return `<a href="${url}" target="_blank" rel="noopener noreferrer">Open SpeedGrader</a>`;
        },
        null,
        row => String(row?.canvas_course_id ?? '').toLowerCase()
      ),
      new window.ReportColumn(
        'Days Since Self Eval', 'Days since the last self evaluation submission.', '11rem', false, 'number',
        row => {
          const days = Number(row?.days_since_last_self_eval);
          return Number.isFinite(days) ? this.intText(days) : '-';
        },
        row => this.daysSinceStyle(row?.days_since_last_self_eval),
        row => Number(row?.days_since_last_self_eval ?? -1)
      )
    ]);
  },

  mounted() {
    this.syncFromReportContext();
    this.loadData();
  },

  watch: {
    reportContext: {
      deep: true,
      handler() {
        this.syncFromReportContext();
        this.loadData();
      }
    },
    year() {
      this.setSharedFilterValue('academic_year', Number(this.year));
      this.loadData();
    },
    selectedProgramCode() {
      this.setSharedFilterValue('program_code', this.selectedProgramCode);
      this.loadData();
    }
  },

  computed: {
    visibleRows() {
      this.table.setRows(this.rows);
      return this.table.getSortedRows();
    }
  },

  methods: {
    syncFromReportContext() {
      const nextYear = Number(this.getSharedFilterValue('academic_year', this.reportContext?.filters?.academic_year));
      if (Number.isFinite(nextYear) && nextYear !== this.year) {
        this.year = nextYear;
      }

      const routedProgramCode = String(this.getSharedFilterValue('program_code', this.reportContext?.routeFilters?.programCode) ?? '').trim();
      if (routedProgramCode !== this.selectedProgramCode) {
        this.selectedProgramCode = routedProgramCode;
      }
    },

    getDataset() {
      return String(this.reportContext?.dataset || 'student_employment_skills').trim();
    },

    async loadData() {
      const programCode = String(this.selectedProgramCode || '').trim();
      if (!programCode) {
        this.rows = [];
        this.loadError = 'Enter a program code.';
        return;
      }

      try {
        this.loading = true;
        this.loadError = '';

        const filters = {
          academic_year: Number(this.year),
          program_code: programCode
        };

        const rows = await bridgetools.req3(
          'reports',
          filters,
          { dataset: this.getDataset() }
        );

        this.rows = this.mapRows(rows);
      } catch (e) {
        console.warn('Failed to load employment skills submissions dataset', e);
        this.rows = [];
        this.loadError = 'Unable to load employment skills submissions.';
      } finally {
        this.loading = false;
      }
    },

    mapRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        ...row,
        sis_user_id: String(row?.sis_user_id ?? '').trim(),
        canvas_user_id: Number(row?.canvas_user_id) || null,
        canvas_course_id: Number(row?.canvas_course_id) || null,
        course_name: String(row?.course_name ?? '').trim(),
        canvas_assignment_id: Number(row?.canvas_assignment_id) || null,
        program_code: String(row?.program_code ?? '').trim(),
        academic_year: Number(row?.academic_year) || null,
        is_pending_instructor_eval: Boolean(row?.is_pending_instructor_eval),
        created_at__self_eval: String(row?.created_at__self_eval ?? '').trim(),
        created_at__instructor_eval: String(row?.created_at__instructor_eval ?? '').trim(),
        days_since_last_self_eval: Number(row?.days_since_last_self_eval) || null
      }));
    },

    daysSinceStyle(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) {
        return { color: '#111827' };
      }
      if (n <= 7) return { color: this.colors.green };
      if (n <= 14) return { color: this.colors.yellow };
      return { color: this.colors.red };
    }
  },

  template: `
  <report-table-shell
    title-html="Employment Skills Submissions"
    :table="table"
    :rows="visibleRows"
    :loading="loading"
    :load-error="loadError"
    loading-text="Loading employment skills submissions..."
    :row-key-fn="(row, index) => row.sis_user_id || row.canvas_user_id || index"
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

      <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
        <label class="btech-muted" style="font-size:.75rem;">Program</label>
        <input
          v-model="selectedProgramCode"
          v-bind="filterAttrs('program_code')"
          type="text"
          placeholder="Enter program code"
          style="font-size:.75rem; min-width:220px; max-width:320px; padding:.25rem .5rem;"
        />
      </div>
    </template>
  </report-table-shell>
  `
});
