Vue.component('reports-employment-skills', {
  mixins: [
    window.ReportMixins.formatting,
    window.ReportMixins.programScoped({
      optionsDataset: 'student_employment_skills_current',
      hydrate_sis_user_id: true,
      emptySelectionMessage: 'Select a program.',
      loadErrorMessage: 'Unable to load employment skills submissions.',
      optionsLoadErrorMessage: 'Unable to load program list.'
    })
  ],

  data() {
    const colors = window.ReportUtils.createColors();
    const table = window.ReportUtils.createTable('Student Name', colors);

    return {
      colors,
      table,
      filters: {
        enrollment_type: ''
      },
      gradeOutStateByKey: {},
      gradedOutByKey: {},
      majorProgressByStudentKey: {}
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'Student Name', 'Student name pulled from Canvas.', '10rem', false, 'string',
        row => this.studentNameLinkHtml(row),
        null,
        row => this.getStudentName(row).toLowerCase()
      ),
      new window.ReportColumn(
        'Program Name', 'Program name.', '8.5rem', false, 'string',
        row => this.escapeHtml(String(row?.program_name ?? '')),
        null,
        row => String(row?.program_name ?? '').toLowerCase()
      ),
      new window.ReportColumn(
        'Type', 'Enrollment Type', '5rem', false, 'string',
        row => this.escapeHtml(this.getEnrollmentTypeCode(row)),
        null,
        row => this.getEnrollmentTypeCode(row).toLowerCase()
      ),
      new window.ReportColumn(
        'Submission Location', 'Course name linked to the Canvas SpeedGrader submission when available.', '14rem', false, 'string',
        row => this.submissionLocationHtml(row),
        null,
        row => this.getSubmissionLocationLabel(row).toLowerCase()
      ),
      new window.ReportColumn(
        'Self Eval', 'Self evaluation submission date.', '8.5rem', false, 'string',
        row => this.escapeHtml(this.selfEvalText(row)),
        row => this.selfEvalPillStyle(row),
        row => this.selfEvalSortValue(row)
      ),
      new window.ReportColumn(
        'Days Ago', 'Days since the last available evaluation submission, preferring self eval then instructor eval.', '8rem', false, 'number',
        row => {
          const days = this.getDaysSinceLatestEval(row);
          return Number.isFinite(days) ? this.intText(days) : '-';
        },
        row => this.daysSinceStyle(this.getDaysSinceLatestEval(row)),
        row => {
          const days = this.getDaysSinceLatestEval(row);
          return Number.isFinite(days) ? days : -1;
        }
      ),
      new window.ReportColumn(
        'Instructor Eval', 'Instructor evaluation submission date or pending state.', '9.5rem', false, 'string',
        row => this.escapeHtml(this.instructorEvalText(row)),
        row => this.instructorEvalPillStyle(row),
        row => this.instructorEvalSortValue(row)
      ),
      new window.ReportColumn(
        'Grade Out', 'Available for CS students with an instructor evaluation who have earned more than 90% of major credits.', '8rem', false, 'string',
        row => this.gradeOutButtonHtml(row),
        null,
        row => this.gradeOutSortValue(row)
      ),
    ]);
  },

  computed: {
    filteredRows() {
      const selectedProgramCode = String(this.selectedProgramCode ?? '').trim();
      const selectedYear = Number(this.year);
      const selectedEnrollmentType = String(this.filters.enrollment_type ?? '').trim().toUpperCase();
      return (Array.isArray(this.rows) ? this.rows : []).filter(row => {
        const rowProgramCode = String(row?.program_code ?? '').trim();
        const rowYear = Number(row?.academic_year);
        const rowEnrollmentType = this.getEnrollmentTypeCode(row);
        if (rowProgramCode !== selectedProgramCode || rowYear !== selectedYear) return false;
        if (!selectedEnrollmentType) return true;
        return rowEnrollmentType === selectedEnrollmentType;
      });
    },

    visibleRows() {
      this.table.setRows(this.filteredRows);
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
    getGradeOutRowKey(row) {
      return [
        String(row?.canvas_user_id ?? '').trim() || 'x',
        String(row?.canvas_course_id ?? '').trim() || 'y',
        String(row?.canvas_assignment_id ?? '').trim() || 'z',
        String(row?.program_code ?? '').trim() || 'p',
        this.normalizeGradeOutSubmittedAt(row?.created_at__instructor_eval)
      ].join(':');
    },

    getGradeOutRecordKey(record) {
      return [
        String(record?.canvas_user_id ?? '').trim() || 'x',
        String(record?.canvas_course_id ?? '').trim() || 'y',
        String(record?.canvas_assignment_id ?? '').trim() || 'z',
        String(record?.program_code ?? '').trim() || 'p',
        this.normalizeGradeOutSubmittedAt(record?.submitted_at)
      ].join(':');
    },

    normalizeGradeOutSubmittedAt(value) {
      const raw = String(value ?? '').trim();
      const parsed = this.parseDateValue(raw);
      return parsed ? String(parsed.getTime()) : (raw || 't');
    },

    getGradeOutState(row) {
      return this.gradeOutStateByKey[this.getGradeOutRowKey(row)] || '';
    },

    setGradeOutState(row, state) {
      this.$set(this.gradeOutStateByKey, this.getGradeOutRowKey(row), String(state || ''));
    },

    isGradedOut(row) {
      return Boolean(this.gradedOutByKey[this.getGradeOutRowKey(row)]);
    },

    markGradedOut(row) {
      this.$set(this.gradedOutByKey, this.getGradeOutRowKey(row), true);
    },

    getStudentMajorKeys(row) {
      const canvasUserId = String(row?.canvas_user_id ?? '').trim();
      const sisUserId = String(row?.original_sis_user_id ?? row?.sis_user_id ?? '').trim();
      return [
        canvasUserId ? `canvas:${canvasUserId}` : '',
        sisUserId ? `sis:${sisUserId}` : ''
      ].filter(Boolean);
    },

    isGradeOutEligible(row) {
      if (this.getEnrollmentTypeCode(row) !== 'CS') return false;
      return this.getStudentMajorKeys(row).some(key => {
        return Number(this.majorProgressByStudentKey[key]) > 0.9;
      });
    },

    hasInstructorEval(row) {
      return Boolean(this.parseDateValue(row?.created_at__instructor_eval));
    },

    canGradeOut(row) {
      if (!this.hasInstructorEval(row)) return false;
      if (!this.isGradeOutEligible(row)) return false;
      if (this.isGradedOut(row)) return false;
      if (!row?.canvas_user_id || !row?.canvas_course_id || !row?.canvas_assignment_id) return false;
      if (!String(row?.sis_user_id ?? '').trim()) return false;
      const state = this.getGradeOutState(row);
      return state !== 'saving' && state !== 'saved';
    },

    gradeOutButtonHtml(row) {
      if (!this.isGradeOutEligible(row)) return '-';
      if (this.isGradedOut(row)) {
        return `<span style="display:inline-block;background:${this.colors.green};color:${this.colors.white};border-radius:999px;padding:.2rem .6rem;font-size:.72rem;font-weight:600;line-height:1.2;">Graded Out</span>`;
      }
      if (!this.hasInstructorEval(row)) return '-';

      const state = this.getGradeOutState(row);
      const disabled = !this.canGradeOut(row);
      const label = state === 'saving'
        ? 'Saving...'
        : 'Grade Out';
      const bg = '#1f2937';
      const opacity = disabled ? '0.65' : '1';
      const cursor = disabled ? 'default' : 'pointer';

      return `
        <button
          type="button"
          class="btech-grade-out-btn"
          data-grade-out-key="${this.escapeHtml(this.getGradeOutRowKey(row))}"
          ${disabled ? 'disabled aria-disabled="true"' : ''}
          style="background:${bg};color:#fff;border:none;border-radius:999px;padding:.2rem .6rem;font-size:.72rem;font-weight:600;line-height:1.2;opacity:${opacity};cursor:${cursor};"
        >${this.escapeHtml(label)}</button>
      `;
    },

    gradeOutSortValue(row) {
      if (!this.isGradeOutEligible(row)) return -2;
      if (!this.hasInstructorEval(row)) return -1;
      if (this.isGradedOut(row)) return 2;
      const state = this.getGradeOutState(row);
      if (state === 'saving') return 1;
      return 0;
    },

    getEnrollmentTypeCode(row) {
      return String(row?.enrollment_type_code ?? '').trim().toUpperCase();
    },

    getStudentName(row) {
      const studentName = String(row?.sis_user_id ?? '').trim();
      if (studentName) return studentName;

      const canvasUserId = String(row?.canvas_user_id ?? '').trim();
      return canvasUserId ? `Canvas User ${canvasUserId}` : '-';
    },

    getProgramLabel(row) {
      return String(row?.program_name ?? row?.program_code ?? '').trim();
    },

    getSubmissionLocationLabel(row) {
      const courseName = String(row?.course_name ?? '').trim();
      if (courseName) return courseName;

      const canvasCourseId = String(row?.canvas_course_id ?? '').trim();
      if (canvasCourseId) return `Course ${canvasCourseId}`;

      return '-';
    },

    parseDateValue(value) {
      const raw = String(value ?? '').trim();
      if (!raw) return null;

      const parsed = new Date(raw);
      return Number.isNaN(parsed.getTime()) ? null : parsed;
    },

    getDaysSinceLatestEval(row) {
      const submittedAt = this.parseDateValue(row?.created_at__self_eval)
        || this.parseDateValue(row?.created_at__instructor_eval);
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
      const days = this.getDaysSinceLatestEval(row);
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

    submissionLocationHtml(row) {
      const courseName = this.getSubmissionLocationLabel(row);
      const canvasCourseId = String(row?.canvas_course_id ?? '').trim();
      const canvasUserId = String(row?.canvas_user_id ?? '').trim();
      const assignmentId = String(row?.canvas_assignment_id ?? '').trim();
      const text = this.escapeHtml(courseName);

      if (!canvasCourseId || !canvasUserId || !assignmentId) return text;

      const url = `https://btech.instructure.com/courses/${encodeURIComponent(canvasCourseId)}/gradebook/speed_grader?assignment_id=${encodeURIComponent(assignmentId)}&student_id=${encodeURIComponent(canvasUserId)}`;
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    },

    studentNameLinkHtml(row) {
      const studentName = this.getStudentName(row);
      const canvasCourseId = String(row?.canvas_course_id ?? '').trim();
      const canvasUserId = String(row?.canvas_user_id ?? '').trim();
      const text = this.escapeHtml(studentName);

      if (!canvasCourseId || !canvasUserId) return text;

      const url = `/courses/${encodeURIComponent(canvasCourseId)}/users/${encodeURIComponent(canvasUserId)}?open_btech_report=employment-skills`;
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    },

    buildGradeOutPayload(row) {
      return {
        canvas_user_id: Number(row?.canvas_user_id) || null,
        sis_user_id: String(row?.original_sis_user_id ?? row?.sis_user_id ?? '').trim(),
        canvas_course_id: Number(row?.canvas_course_id) || null,
        canvas_assignment_id: Number(row?.canvas_assignment_id) || null,
        employment_skills_scores: row?.employment_skills_scores && typeof row.employment_skills_scores === 'object'
          ? row.employment_skills_scores
          : {},
        program_code: String(row?.program_code ?? '').trim(),
        submitted_at: String(row?.created_at__instructor_eval ?? '').trim()
      };
    },

    async pushEmploymentSkillsGradeOut(payload = {}) {
      const authCode = await bridgetools.getCanvasAuthCode();

      return new Promise((resolve, reject) => {
        $.ajax({
          url: 'https://reports.bridgetools.dev/api3/student_employment_skills__grade_out',
          method: 'POST',
          data: JSON.stringify(payload),
          contentType: 'application/json',
          processData: false,
          headers: {
            Authorization: `Bearer ${authCode}`,
            'X-Canvas-User-Id': String(ENV.current_user_id),
          },
        })
          .done(data => resolve(data))
          .fail((xhr, status, err) => reject({ xhr, status, err }));
      });
    },

    getGradeOutErrorMessage(err) {
      const responseJson = err?.xhr?.responseJSON;
      const responseText = err?.xhr?.responseText;
      const message =
        responseJson?.error ||
        responseJson?.message ||
        responseJson?.data?.message ||
        responseText ||
        err?.message ||
        'Failed to push employment skills grade out.';

      return String(message);
    },

    async onTableClick(event) {
      const button = event?.target?.closest?.('.btech-grade-out-btn');
      if (!button) return;

      event.preventDefault();
      event.stopPropagation();

      const rowKey = String(button.getAttribute('data-grade-out-key') || '').trim();
      const row = this.visibleRows.find(candidate => this.getGradeOutRowKey(candidate) === rowKey);
      if (!row || !this.canGradeOut(row)) return;

      this.setGradeOutState(row, 'saving');

      try {
        await this.pushEmploymentSkillsGradeOut(this.buildGradeOutPayload(row));
        this.markGradedOut(row);
        this.setGradeOutState(row, '');
      } catch (err) {
        console.error('Failed pushing employment skills grade out:', err);
        this.setGradeOutState(row, '');
        alert(this.getGradeOutErrorMessage(err));
      }
    },

    async loadData() {
      const programCode = String(this.selectedProgramCode || '').trim();
      if (!programCode) {
        this.rows = [];
        this.gradedOutByKey = {};
        this.majorProgressByStudentKey = {};
        this.loadedProgramName = '';
        this.loadError = this.getEmptySelectionMessage();
        return;
      }

      const requestId = ++this.loadRequestId;
      try {
        this.loading = true;
        this.loadError = '';
        this.gradeOutStateByKey = {};

        const [rows, gradeOutRows, majorRows] = await Promise.all([
          this.fetchReportDataset(
            this.getRequestFilters(),
            { dataset: this.getDataset() }
          ),
          this.fetchReportDataset(
            { program_code: programCode },
            { dataset: 'student_employment_skills__grade_out' }
          ).catch(error => {
            console.warn('Failed to load employment skills grade-out records', error);
            return [];
          }),
          this.fetchReportDataset(
            { major_code: programCode, is_active_degree: true },
            { dataset: 'student_majors' }
          ).catch(error => {
            console.warn('Failed to load student major progress for employment skills grade-out', error);
            return [];
          })
        ]);

        if (requestId !== this.loadRequestId) return;

        const normalizedRows = this.normalizeRows(rows);
        const hydratedRows = await this.hydrateSisUserIds(normalizedRows, { hydrate_sis_user_id: true });
        if (requestId !== this.loadRequestId) return;

        this.gradedOutByKey = (Array.isArray(gradeOutRows) ? gradeOutRows : []).reduce((recordsByKey, record) => {
          recordsByKey[this.getGradeOutRecordKey(record)] = true;
          return recordsByKey;
        }, {});
        this.majorProgressByStudentKey = (Array.isArray(majorRows) ? majorRows : []).reduce((progressByStudentKey, major) => {
          const progress = Number(major?.perc_credits_earned);
          if (!Number.isFinite(progress)) return progressByStudentKey;

          this.getStudentMajorKeys(major).forEach(key => {
            progressByStudentKey[key] = Math.max(Number(progressByStudentKey[key]) || 0, progress);
          });
          return progressByStudentKey;
        }, {});
        this.rows = hydratedRows;

        const first = this.rows[0] || {};
        this.loadedProgramName = String(
          first?.program_name ??
          this.programOptions.find(option => option.value === programCode)?.label ??
          this.getProgramName()
        ).trim();
      } catch (e) {
        console.warn('Failed to load employment skills detail dataset', e);
        this.rows = [];
        this.gradedOutByKey = {};
        this.majorProgressByStudentKey = {};
        this.loadedProgramName = this.programOptions.find(option => option.value === programCode)?.label || this.getProgramName();
        this.loadError = this.getLoadErrorMessage();
      } finally {
        if (requestId === this.loadRequestId) {
          this.loading = false;
        }
      }
    },

    mapRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        ...row,
        original_sis_user_id: String(row?.original_sis_user_id ?? row?.sis_user_id ?? '').trim(),
        sis_user_id: String(row?.sis_user_id ?? '').trim(),
        canvas_user_id: Number(row?.canvas_user_id) || null,
        canvas_course_id: Number(row?.canvas_course_id) || null,
        course_name: String(row?.course_name ?? '').trim(),
        canvas_assignment_id: Number(row?.canvas_assignment_id) || null,
        program_code: String(row?.program_code ?? '').trim(),
        program_name: String(row?.program_name ?? '').trim(),
        enrollment_type_code: String(row?.enrollment_type_code ?? '').trim(),
        academic_year: Number(row?.academic_year) || null,
        num_evals__employment_skills: Number(row?.num_evals__employment_skills) || 0,
        most_recent_employment_skills_created_at: String(row?.most_recent_employment_skills_created_at ?? '').trim(),
        is_pending_instructor_eval: Boolean(row?.is_pending_instructor_eval),
        employment_skills_scores__self: row?.employment_skills_scores__self && typeof row.employment_skills_scores__self === 'object'
          ? row.employment_skills_scores__self
          : {},
        employment_skills_scores: row?.employment_skills_scores && typeof row.employment_skills_scores === 'object'
          ? row.employment_skills_scores
          : {},
        employment_skills_goals: String(row?.employment_skills_goals ?? '').trim(),
        career_goal__current: String(row?.career_goal__current ?? '').trim(),
        bridgetools_updated_at: String(row?.bridgetools_updated_at ?? '').trim(),
        created_at__self_eval: String(row?.created_at__self_eval ?? '').trim(),
        created_at__instructor_eval: String(row?.created_at__instructor_eval ?? '').trim(),
        days_since_last_eval: this.getDaysSinceLatestEval(row)
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
      @click.native="onTableClick"
      :title-html="titleText"
      :table="table"
      :rows="visibleRows"
      :loading="loading || loadingPrograms"
      :load-error="loadError"
      loading-text="Loading employment skills submissions..."
      :row-key-fn="(row, index) => [row.canvas_user_id || row.sis_user_id || 'x', row.canvas_course_id || 'y', row.canvas_assignment_id || 'z', row.created_at__self_eval || row.created_at__instructor_eval || index].join(':')"
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

      <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
        <label class="btech-muted" style="font-size:.75rem;">Type</label>
        <select v-model="filters.enrollment_type" v-bind="filterAttrs('enrollment_type')" style="font-size:.75rem; min-width:90px;">
          <option value="">All</option>
          <option value="HS">HS</option>
          <option value="CS">CS</option>
        </select>
      </div>
    </template>
  </report-table-shell>
  `
});
