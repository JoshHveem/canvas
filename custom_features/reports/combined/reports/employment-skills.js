Vue.component('reports-employment-skills', {
  mixins: [
    window.ReportMixins.formatting,
    window.ReportMixins.programScoped({
      optionsDataset: 'student_employment_skills',
      emptySelectionMessage: 'Select a program.',
      loadErrorMessage: 'Unable to load employment skills submissions.',
      optionsLoadErrorMessage: 'Unable to load program list.'
    })
  ],

  data() {
    const colors = window.ReportUtils.createColors();
    const table = window.ReportUtils.createTable('SIS User ID', colors);

    return {
      colors,
      table
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'SIS User ID', 'Student SIS ID.', '6.5rem', false, 'string',
        row => this.escapeHtml(String(row?.sis_user_id ?? '')),
        null,
        row => String(row?.sis_user_id ?? '').toLowerCase()
      ),
      new window.ReportColumn(
        'Program', 'Program code.', '6.5rem', false, 'string',
        row => this.escapeHtml(String(row?.program_code ?? '')),
        null,
        row => String(row?.program_code ?? '').toLowerCase()
      ),
      new window.ReportColumn(
        'Course', 'Course name.', '12rem', false, 'string',
        row => this.escapeHtml(String(row?.course_name ?? '')),
        null,
        row => String(row?.course_name ?? '').toLowerCase()
      ),
      new window.ReportColumn(
        'Self Eval', 'Self evaluation submission date.', '8.5rem', false, 'string',
        row => this.escapeHtml(this.selfEvalText(row)),
        row => this.selfEvalPillStyle(row),
        row => this.selfEvalSortValue(row)
      ),
      new window.ReportColumn(
        'Instructor Eval', 'Instructor evaluation submission date or pending state.', '9.5rem', false, 'string',
        row => this.escapeHtml(this.instructorEvalText(row)),
        row => this.instructorEvalPillStyle(row),
        row => this.instructorEvalSortValue(row)
      ),
      new window.ReportColumn(
        'Submission', 'Link to the Canvas speed grader for the submission.', '11rem', false, 'string',
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
        'Days Since Self Eval', 'Days since the last self evaluation submission.', '8rem', false, 'number',
        row => {
          const days = this.getDaysSinceSelfEval(row);
          return Number.isFinite(days) ? this.intText(days) : '-';
        },
        row => this.daysSinceStyle(this.getDaysSinceSelfEval(row)),
        row => {
          const days = this.getDaysSinceSelfEval(row);
          return Number.isFinite(days) ? days : -1;
        }
      )
    ]);
  },

  computed: {
    visibleRows() {
      this.table.setRows(this.rows);
      return this.table.getSortedRows();
    },

    titleText() {
      const programName = String(
        this.loadedProgramName ||
        this.programOptions.find(option => option.value === this.selectedProgramCode)?.label ||
        this.reportContext?.routeFilters?.programName ||
        ''
      ).trim();
      const suffix = programName || 'Employment Skills Submissions';
      return `${this.escapeHtml(suffix)} - Employment Skills Submissions`;
    }
  },

  methods: {
    getProgramLabel(row) {
      return String(row?.program_name ?? row?.program_code ?? '').trim();
    },

    parseDateValue(value) {
      const raw = String(value ?? '').trim();
      if (!raw) return null;

      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    },

    getDaysSinceSelfEval(row) {
      const submittedAt = this.parseDateValue(row?.created_at__self_eval);
      if (!submittedAt) return null;
      const now = new Date();
      const msPerDay = 24 * 60 * 60 * 1000;
      const diffMs = now.getTime() - submittedAt.getTime();
      return diffMs >= 0 ? Math.floor(diffMs / msPerDay) : 0;
    },

    selfEvalText(row) {
      return String(row?.created_at__self_eval ?? '').trim() || '-';
    },

    selfEvalSortValue(row) {
      const submittedAt = this.parseDateValue(row?.created_at__self_eval);
      return submittedAt ? submittedAt.getTime() : -1;
    },

    selfEvalPillStyle(row) {
      const days = this.getDaysSinceSelfEval(row);
      if (!Number.isFinite(days)) {
        return { backgroundColor: this.colors.gray, color: this.colors.black };
      }
      if (days > 60) return { backgroundColor: this.colors.red, color: this.colors.white };
      if (days > 30) return { backgroundColor: this.colors.yellow, color: this.colors.black };
      return { backgroundColor: this.colors.green, color: this.colors.white };
    },

    instructorEvalText(row) {
      if (row?.is_pending_instructor_eval) return 'Pending';
      return String(row?.created_at__instructor_eval ?? '').trim() || '-';
    },

    instructorEvalSortValue(row) {
      if (row?.is_pending_instructor_eval) return -1;
      const submittedAt = this.parseDateValue(row?.created_at__instructor_eval);
      return submittedAt ? submittedAt.getTime() : 0;
    },

    instructorEvalPillStyle(row) {
      if (row?.is_pending_instructor_eval) {
        return { backgroundColor: this.colors.red, color: this.colors.white };
      }
      const hasDate = Boolean(this.parseDateValue(row?.created_at__instructor_eval));
      if (hasDate) {
        return { backgroundColor: this.colors.green, color: this.colors.white };
      }
      return { backgroundColor: this.colors.gray, color: this.colors.black };
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
        program_name: String(row?.program_name ?? '').trim(),
        academic_year: Number(row?.academic_year) || null,
        is_pending_instructor_eval: Boolean(row?.is_pending_instructor_eval),
        created_at__self_eval: String(row?.created_at__self_eval ?? '').trim(),
        created_at__instructor_eval: String(row?.created_at__instructor_eval ?? '').trim(),
        days_since_last_self_eval: this.getDaysSinceSelfEval(row)
      }));
    },

    daysSinceStyle(value) {
      const n = Number(value);
      if (!Number.isFinite(n)) {
        return { backgroundColor: this.colors.gray, color: this.colors.black };
      }
      if (n > 60) return { backgroundColor: this.colors.red, color: this.colors.white };
      if (n > 30) return { backgroundColor: this.colors.yellow, color: this.colors.black };
      return { backgroundColor: this.colors.green, color: this.colors.white };
    }
  },

  template: `
  <report-table-shell
    :title-html="titleText"
    :table="table"
    :rows="visibleRows"
    :loading="loading || loadingPrograms"
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
        <select v-model="selectedProgramCode" v-bind="filterAttrs('program_code')" style="font-size:.75rem; min-width:220px; max-width:320px;">
          <option value="">Select a Program</option>
          <option v-for="option in programOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
    </template>
  </report-table-shell>
  `
});
