Vue.component('reports-hs-student-standing', {
  mixins: [
    window.ReportMixins.formatting
  ],

  data() {
    const colors = window.ReportUtils.createColors();
    const table = window.ReportUtils.createTable('Last Name', colors);
    return {
      colors,
      table,
      studentIdsText: '',
      submittedStudentIds: [],
      rows: [],
      loading: false,
      loadError: ''
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'First Name', 'Student first name pulled from Canvas.', '8rem', false, 'string',
        row => this.escapeHtml(this.studentFirstName(row)),
        null,
        row => this.studentFirstName(row).toLowerCase()
      ),
      new window.ReportColumn(
        'Last Name', 'Student last name pulled from Canvas.', '9rem', false, 'string',
        row => this.escapeHtml(this.studentLastName(row)),
        null,
        row => this.studentLastName(row).toLowerCase()
      ),
      new window.ReportColumn(
        'SIS ID', 'Student information system ID.', '6rem', false, 'string',
        row => this.escapeHtml(String(row?.sis_user_id ?? '').trim()),
        null,
        row => String(row?.sis_user_id ?? '').trim()
      ),
      new window.ReportColumn(
        'Course', 'Course with a grade below 80%.', '18rem', false, 'string',
        row => this.courseHtml(row),
        null,
        row => `${String(row?.course_code ?? '')} ${String(row?.course_name ?? '')}`.toLowerCase()
      ),
      new window.ReportColumn(
        'Current Score', 'Current Canvas score based on submitted work.', '7rem', false, 'number',
        row => this.gradeText(row?.current_score),
        row => this.gradePillStyle(row?.current_score),
        row => this.gradeSortValue(row?.current_score)
      )
    ]);
  },

  computed: {
    visibleRows() {
      this.table.setRows(this.rows);
      return this.table.getSortedRows();
    },

    titleText() {
      return `HS Student Standing${this.submittedStudentIds.length ? ` (${this.submittedStudentIds.length} students)` : ''}`;
    }
  },

  methods: {
    parseStudentIds() {
      return Array.from(new Set(
        String(this.studentIdsText ?? '')
          .trim()
          .split(/\s+/)
          .map(value => value.trim())
          .filter(Boolean)
      ));
    },

    studentFirstName(row) {
      return String(row?.first_name ?? '').trim() || '-';
    },

    studentLastName(row) {
      return String(row?.last_name ?? '').trim() || '-';
    },

    gradeValue(value) {
      const grade = Number(value);
      return Number.isFinite(grade) ? grade : null;
    },

    gradeText(value) {
      const grade = this.gradeValue(value);
      return grade === null ? '-' : `${grade.toFixed(1)}%`;
    },

    gradeSortValue(value) {
      const grade = this.gradeValue(value);
      return grade === null ? Number.POSITIVE_INFINITY : grade;
    },

    gradePillStyle(value) {
      const grade = this.gradeValue(value);
      if (grade === null) return { backgroundColor: this.colors.gray, color: this.colors.black };
      return {
        backgroundColor: grade < 60 ? this.colors.red : this.colors.yellow,
        color: grade < 60 ? this.colors.white : this.colors.black
      };
    },

    courseHtml(row) {
      const courseName = String(row?.course_name ?? '').trim();
      const courseCode = String(row?.course_code ?? '').trim();
      const label = this.escapeHtml([courseCode, courseName].filter(Boolean).join(' - ') || '(no course)');
      const courseId = String(row?.canvas_course_id ?? '').trim();
      const canvasUserId = String(row?.canvas_user_id ?? '').trim();
      if (!courseId || !canvasUserId) return label;

      const href = `/courses/${encodeURIComponent(courseId)}/users/${encodeURIComponent(canvasUserId)}`;
      return `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    },

    normalizeRows(rows, sisUserIdByCanvasId = new Map()) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        ...row,
        sis_user_id: String(
          row?.sis_user_id ?? sisUserIdByCanvasId.get(String(row?.canvas_user_id ?? '').trim()) ?? ''
        ).trim(),
        canvas_user_id: String(row?.canvas_user_id ?? '').trim(),
        course_code: String(row?.course_code ?? '').trim(),
        course_name: String(row?.course_name ?? '').trim(),
        canvas_course_id: String(row?.canvas_course_id ?? '').trim(),
        current_score: this.gradeValue(row?.current_score)
      })).filter(row => row.current_score !== null && row.current_score < 80);
    },

    async loadData() {
      const sisUserIds = this.parseStudentIds();
      this.submittedStudentIds = sisUserIds;
      this.rows = [];
      this.loadError = '';

      if (!sisUserIds.length) {
        this.loadError = 'Paste at least one SIS user ID.';
        return;
      }

      try {
        this.loading = true;
        const headers = await this.fetchReportDataset(
          { sis_user_id: sisUserIds },
          { dataset: 'student_header' }
        );
        const sisUserIdByCanvasId = new Map(
          (Array.isArray(headers) ? headers : [])
            .map(row => [
              String(row?.canvas_user_id ?? '').trim(),
              String(row?.sis_user_id ?? '').trim()
            ])
            .filter(([canvasUserId]) => Boolean(canvasUserId))
        );
        const canvasUserIds = Array.from(sisUserIdByCanvasId.keys());
        if (!canvasUserIds.length) {
          this.loadError = 'No students were found for the pasted SIS user IDs.';
          return;
        }

        const rows = await this.fetchReportDataset(
          { canvas_user_id: canvasUserIds },
          { dataset: 'student_courses' }
        );
        const normalizedRows = this.normalizeRows(rows, sisUserIdByCanvasId);
        this.rows = await this.hydrateSisUserIds(normalizedRows, { hydrate_sis_user_id: true });
      } catch (error) {
        console.warn('Failed to load HS student standing courses', error);
        this.rows = [];
        this.loadError = 'Unable to load student courses.';
      } finally {
        this.loading = false;
      }
    }
  },

  template: `
  <report-table-shell
    :title-html="titleText"
    :table="table"
    :rows="visibleRows"
    :loading="loading"
    :load-error="loadError"
    loading-text="Loading student courses..."
    :row-key-fn="(row, index) => [row.sis_user_id, row.canvas_course_id, index].join(':')"
  >
    <template #description>
      Paste SIS user IDs separated by spaces, tabs, or new lines. Only courses with a current score below 80% are shown.
    </template>
    <template #filters>
      <label for="hs-student-standing-ids" style="font-weight:600;">SIS User IDs</label>
      <textarea
        id="hs-student-standing-ids"
        v-model="studentIdsText"
        rows="2"
        placeholder="12345 67890 24680"
        style="min-width:24rem; max-width:36rem; padding:.4rem; font:inherit;"
        @keydown.ctrl.enter.prevent="loadData"
        @keydown.meta.enter.prevent="loadData"
      ></textarea>
      <button type="button" class="Button" @click="loadData">Find courses below 80%</button>
    </template>
  </report-table-shell>
  `
});
