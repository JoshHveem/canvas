Vue.component('reports-students-at-a-glance', {
  mixins: [
    window.ReportMixins.formatting
  ],

  props: {
    reportContext: { type: Object, default: () => ({}) },
    anonymous: { type: Boolean, default: false }
  },

  data() {
    const colors = window.ReportUtils.createColors();
    const table = window.ReportUtils.createTable('Student Name', colors);

    return {
      colors,
      table,
      loading: false,
      loadingDepartments: false,
      loadError: '',
      loadRequestId: 0,
      loadDepartmentsRequestId: 0,
      hasLoadedDepartmentOptions: false,
      rows: [],
      departmentOptions: [],
      selectedDepartmentCode: ''
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'Student Name', 'Student name pulled from Canvas after load.', '14rem', false, 'string',
        row => this.anonymous ? 'STUDENT' : this.studentNameLinkHtml(row),
        null,
        row => this.getStudentName(row).toLowerCase()
      ),
      new window.ReportColumn(
        'SIS ID', 'Student information system ID.', '9rem', false, 'string',
        row => this.anonymous ? 'STUDENT' : this.escapeHtml(this.getStudentSisId(row)),
        null,
        row => this.getStudentSisId(row).toLowerCase()
      ),
      new window.ReportColumn(
        'Next Course to Exit', 'Course with the nearest upcoming end date.', '14rem', false, 'string',
        row => this.escapeHtml(row?.upcoming_course_name || ''),
        null,
        row => String(row?.upcoming_course_name ?? '').toLowerCase()
      ),
      this.withColumnWrap(new window.ReportColumn(
        'Course Progress', 'Student progress in the course with the nearest upcoming end date.', '10rem', false, 'number',
        row => this.courseProgressHtml(row?.upcoming_course_progress),
        null,
        row => Number.isFinite(row?.upcoming_course_progress) ? row.upcoming_course_progress : -1
      )),
      new window.ReportColumn(
        'Days Until Exit', 'Red below 7 days; green at 7 days or more.', '10rem', false, 'number',
        row => this.dayCountText(row?.num_days_until_next_end_date),
        row => this.daysUntilExitPillStyle(row?.num_days_until_next_end_date, row?.upcoming_course_progress),
        row => this.dayCountSort(row?.num_days_until_next_end_date)
      ),
      new window.ReportColumn(
        'Days Since Last Submission', 'Alerted when the student has not submitted in at least 7 days.', '11rem', false, 'number',
        row => this.dayCountText(row?.num_days_since_last_activity),
        row => this.alertPillStyle(row?.is_gte_7_days_since_last_activity),
        row => this.dayCountSort(row?.num_days_since_last_activity)
      ),
      new window.ReportColumn(
        'On Probation', 'Alerted when the student is currently on academic standing.', '9rem', false, 'number',
        row => row?.is_on_probation ? this.escapeHtml(row?.academic_standing_code || '') : '',
        row => this.alertPillStyle(row?.is_on_probation),
        row => this.boolSort(row?.is_on_probation)
      ),
      new window.ReportColumn(
        'Pending Instructor Eval', 'Course code linked to the pending instructor evaluation in Canvas SpeedGrader.', '11rem', false, 'string',
        row => this.pendingInstructorEvalHtml(row),
        row => this.alertPillStyle(row?.is_pending_instructor_eval),
        row => this.pendingInstructorEvalSort(row)
      ),
      new window.ReportColumn(
        'Days Since Last Eval', 'Shows days since the last evaluation, or X when no employment skills evaluation record matches the student\'s active major.', '11rem', false, 'number',
        row => this.evaluationStatusText(row),
        row => this.alertPillStyle(row?.is_gte_30_days_since_last_eval || row?.is_no_es_eval_on_record),
        row => this.evaluationStatusSort(row)
      )
    ]);
  },

  mounted() {
    this.syncFromReportContext();
    this.loadDepartmentOptions();
  },

  watch: {
    reportContext: {
      deep: true,
      async handler() {
        this.syncFromReportContext();
        await this.loadDepartmentOptions();
      }
    },
    selectedDepartmentCode() {
      this.setSharedFilterValue('department_code', this.selectedDepartmentCode);
      const selectedOption = this.departmentOptions.find(option => option.value === this.selectedDepartmentCode);
      if (selectedOption?.label) this.setSharedFilterValue('department_name', selectedOption.label);
      if (!this.hasLoadedDepartmentOptions) return;
      this.loadData();
    }
  },

  computed: {
    visibleRows() {
      this.table.setRows(this.rows);
      return this.table.getSortedRows();
    },

    titleText() {
      const selectedOption = this.departmentOptions.find(option => option.value === this.selectedDepartmentCode);
      const departmentName = String(
        selectedOption?.label ??
        this.getSharedFilterValue('department_name', '') ??
        ''
      ).trim();
      const suffix = departmentName || 'Students';
      return `${this.escapeHtml(suffix)} - At a Glance`;
    }
  },

  methods: {
    syncFromReportContext() {
      const nextDepartmentCode = String(
        this.getSharedFilterValue(
          'department_code',
          this.reportContext?.routeFilters?.departmentCode ?? this.reportContext?.filters?.department_code ?? ''
        ) ?? ''
      ).trim();

      if (nextDepartmentCode && nextDepartmentCode !== this.selectedDepartmentCode) {
        this.selectedDepartmentCode = nextDepartmentCode;
      }
    },

    getStudentName(row) {
      const studentName = String(row?.sis_user_id ?? '').trim();
      if (studentName) return studentName;

      const canvasUserId = String(row?.canvas_user_id ?? '').trim();
      return canvasUserId ? `Canvas User ${canvasUserId}` : '-';
    },

    getStudentSisId(row) {
      return String(row?.original_sis_user_id || row?.sis_user_id || '').trim();
    },

    studentNameLinkHtml(row) {
      const studentName = this.getStudentName(row);
      const courseId = String(row?.upcoming_canvas_course_id ?? '').trim();
      const canvasUserId = String(row?.canvas_user_id ?? '').trim();
      const label = this.escapeHtml(studentName);
      if (!courseId || !canvasUserId) return label;

      const url = `/courses/${encodeURIComponent(courseId)}/users/${encodeURIComponent(canvasUserId)}`;
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    },

    alertText(value) {
      return value ? '!' : '';
    },

    alertPillStyle(value) {
      if (!value) return {};
      return {
        backgroundColor: this.colors.red,
        color: this.colors.white,
        display: 'inline-block',
        minWidth: '1.2rem',
        textAlign: 'center'
      };
    },

    dayCountText(value) {
      return Number.isFinite(value) ? String(value) : '';
    },

    dayCountSort(value) {
      return Number.isFinite(value) ? value : -1;
    },

    evaluationStatusText(row) {
      if (row?.is_no_es_eval_on_record) return 'X';
      return this.dayCountText(row?.num_days_since_last_eval);
    },

    evaluationStatusSort(row) {
      if (row?.is_no_es_eval_on_record) return -1;
      return this.dayCountSort(row?.num_days_since_last_eval);
    },

    isCourseComplete(value) {
      return Number.isFinite(value) && value >= 0.99;
    },

    daysUntilExitPillStyle(value, courseProgress) {
      if (!Number.isFinite(value)) return {};
      return {
        backgroundColor: value < 7 && !this.isCourseComplete(courseProgress) ? this.colors.red : this.colors.green,
        color: this.colors.white,
        display: 'inline-block',
        minWidth: '1.2rem',
        textAlign: 'center'
      };
    },

    courseProgressHtml(value) {
      if (!Number.isFinite(value)) return '';

      const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
      return `<div class="btech-progress" role="presentation"><div class="fill btech-fill-accent" style="width:${percent}%;" role="progressbar" aria-label="Course progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}"></div></div><span class="btech-muted">${percent}%</span>`;
    },

    normalizeSisUserId(value) {
      return String(value ?? '').trim();
    },

    normalizeCanvasUserId(value) {
      const normalized = String(value ?? '').trim();
      return normalized || '';
    },

    normalizeMajorYear(value) {
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    },

    createMajorYearKey(programCode, academicYear) {
      const normalizedProgramCode = String(programCode ?? '').trim().toUpperCase();
      const normalizedYear = this.normalizeMajorYear(academicYear);
      if (!normalizedProgramCode || !Number.isFinite(normalizedYear)) return '';
      return `${normalizedProgramCode}::${normalizedYear}`;
    },

    normalizeMajorRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        sis_user_id: this.normalizeSisUserId(row?.sis_user_id),
        canvas_user_id: this.normalizeCanvasUserId(row?.canvas_user_id),
        department_code: String(row?.department_code ?? '').trim(),
        major_code: String(row?.major_code ?? '').trim(),
        academic_year__major: this.normalizeMajorYear(row?.academic_year__major),
        is_active_degree: Boolean(row?.is_active_degree)
      })).filter(row => row.is_active_degree);
    },

    normalizeHeaderRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        sis_user_id: this.normalizeSisUserId(row?.sis_user_id),
        canvas_user_id: this.normalizeCanvasUserId(row?.canvas_user_id),
        academic_standing_code: String(row?.academic_standing_code ?? '').trim(),
        enrollment_type_code__current: String(row?.enrollment_type_code__current ?? '').trim().toUpperCase()
      }));
    },

    normalizeUpcomingEndDateRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        canvas_user_id: this.normalizeCanvasUserId(row?.canvas_user_id),
        sis_user_id: this.normalizeSisUserId(row?.sis_user_id),
        program_code: String(row?.program_code ?? '').trim(),
        canvas_course_id: String(row?.canvas_course_id ?? '').trim(),
        num_days_until_exit: Number(row?.num_days_until_exit),
        course_name: String(row?.course_name ?? '').trim(),
        course_progress: this.normalizeCourseProgress(row?.course_progress),
        course_exit_at__target: String(row?.course_exit_at__target ?? '').trim()
      }));
    },

    normalizeEmploymentSkillRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        sis_user_id: this.normalizeSisUserId(row?.sis_user_id),
        canvas_user_id: this.normalizeCanvasUserId(row?.canvas_user_id),
        program_code: String(row?.program_code ?? '').trim(),
        academic_year: this.normalizeMajorYear(row?.academic_year),
        canvas_course_id: String(row?.canvas_course_id ?? '').trim(),
        canvas_assignment_id: String(row?.canvas_assignment_id ?? '').trim(),
        course_code: String(row?.course_code ?? '').trim(),
        course_name: String(row?.course_name ?? '').trim(),
        is_pending_instructor_eval: Boolean(row?.is_pending_instructor_eval),
        num_days_since_last_eval: this.normalizeDayCount(row?.num_days_since_last_eval)
      }));
    },

    normalizeDayCount(value) {
      const raw = String(value ?? '').trim();
      if (!raw) return null;

      const days = Number(raw);
      return Number.isFinite(days) ? days : null;
    },

    normalizeCourseProgress(value) {
      const raw = String(value ?? '').trim();
      if (!raw) return null;

      const progress = Number(raw);
      return Number.isFinite(progress) ? progress : null;
    },

    pendingInstructorEvalHtml(row) {
      const courses = Array.isArray(row?.pending_instructor_eval_courses)
        ? row.pending_instructor_eval_courses
        : [];
      if (!courses.length) return row?.is_pending_instructor_eval ? '!' : '';

      return courses.map(course => {
        const label = 'Complete Now';
        const courseId = String(course?.canvas_course_id ?? '').trim();
        const assignmentId = String(course?.canvas_assignment_id ?? '').trim();
        const studentId = String(row?.canvas_user_id ?? '').trim();
        if (!courseId || !assignmentId || !studentId) return label;

        const url = `/courses/${encodeURIComponent(courseId)}/gradebook/speed_grader?assignment_id=${encodeURIComponent(assignmentId)}&student_id=${encodeURIComponent(studentId)}`;
        return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:inherit; text-decoration:underline;">${label}</a>`;
      }).join('<br>');
    },

    pendingInstructorEvalSort(row) {
      return (Array.isArray(row?.pending_instructor_eval_courses) ? row.pending_instructor_eval_courses : [])
        .map(course => String(course?.course_code ?? course?.course_name ?? '').trim())
        .join(' ')
        .toLowerCase();
    },

    normalizeCanvasActivityRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        sis_user_id: this.normalizeSisUserId(row?.sis_user_id),
        canvas_user_id: this.normalizeCanvasUserId(row?.canvas_user_id),
        num_days_since_last_submission: Number(row?.num_days_since_last_submission)
      }));
    },

    async loadDepartmentOptions() {
      const requestId = ++this.loadDepartmentsRequestId;

      try {
        this.loadingDepartments = true;
        this.hasLoadedDepartmentOptions = false;
        if (!this.loading) this.loadError = '';

        const departmentRows = await this.fetchReportDataset(
          {},
          { dataset: 'departments' }
        );
        if (requestId !== this.loadDepartmentsRequestId) return;

        const options = Array.from(
          new Map(
            (Array.isArray(departmentRows) ? departmentRows : [])
              .map(row => ({
                value: String(row?.department_code ?? row?.code ?? '').trim(),
                label: String(
                  row?.department_name ?? row?.department ?? row?.name ?? ''
                ).trim()
              }))
              .filter(option => option.value && option.label)
              .map(option => [option.value, option])
          ).values()
        ).sort((a, b) => a.label.localeCompare(b.label));

        this.departmentOptions = options;

        const nextDepartmentCode = this.resolveDeferredSelection({
          filterKey: 'department_code',
          options,
          currentValue: this.selectedDepartmentCode,
          routeValue: this.reportContext?.routeFilters?.departmentCode ?? this.reportContext?.filters?.department_code ?? ''
        });

        if (!this.filterValuesEqual(nextDepartmentCode, this.selectedDepartmentCode)) {
          this.selectedDepartmentCode = nextDepartmentCode;
          return;
        }

        const selectedOption = options.find(option => this.filterValuesEqual(option.value, nextDepartmentCode));
        if (selectedOption?.label) this.setSharedFilterValue('department_name', selectedOption.label);
      } catch (e) {
        console.warn('Failed to load student at-a-glance department options', e);
        this.departmentOptions = [];
        this.rows = [];
        this.loadError = 'Unable to load department list.';
      } finally {
        if (requestId === this.loadDepartmentsRequestId) {
          this.hasLoadedDepartmentOptions = true;
          this.loadingDepartments = false;
          if (!this.selectedDepartmentCode && !this.rows.length) {
            this.loadError = 'Select a department.';
          }
        }
      }
    },

    createStudentKey(sisUserId, canvasUserId) {
      const normalizedCanvasUserId = this.normalizeCanvasUserId(canvasUserId);
      if (normalizedCanvasUserId) return `canvas:${normalizedCanvasUserId}`;

      const normalizedSisUserId = this.normalizeSisUserId(sisUserId);
      if (normalizedSisUserId) return `sis:${normalizedSisUserId}`;

      return '';
    },

    ensureStudentRecord(studentMap, studentKey, row) {
      if (!studentKey) return null;

      if (!studentMap.has(studentKey)) {
        studentMap.set(studentKey, {
          student_key: studentKey,
          sis_user_id: this.normalizeSisUserId(row?.sis_user_id),
          canvas_user_id: this.normalizeCanvasUserId(row?.canvas_user_id),
          is_pending_instructor_eval: false,
          pending_instructor_eval_courses: [],
          is_gte_30_days_since_last_eval: false,
          is_no_es_eval_on_record: false,
          is_on_probation: false,
          is_lte_7_days_until_next_end_date: false,
          is_gte_7_days_since_last_activity: false,
          academic_standing_code: '',
          num_days_since_last_eval: null,
          num_days_until_next_end_date: null,
          upcoming_canvas_course_id: '',
          upcoming_course_name: '',
          upcoming_course_progress: null,
          num_days_since_last_activity: null
        });
      }

      const record = studentMap.get(studentKey);
      if (!record.sis_user_id) record.sis_user_id = this.normalizeSisUserId(row?.sis_user_id);
      if (!record.canvas_user_id) record.canvas_user_id = this.normalizeCanvasUserId(row?.canvas_user_id);
      return record;
    },

    buildMajorIndexes(selectedMajorRows) {
      const canvasToStudentKey = new Map();
      const sisToStudentKey = new Map();
      const majorKeysByStudent = new Map();

      (Array.isArray(selectedMajorRows) ? selectedMajorRows : []).forEach(row => {
        const studentKey = this.createStudentKey(row?.sis_user_id, row?.canvas_user_id);
        if (!studentKey) return;

        const canvasUserId = this.normalizeCanvasUserId(row?.canvas_user_id);
        const sisUserId = this.normalizeSisUserId(row?.sis_user_id);
        if (canvasUserId) canvasToStudentKey.set(canvasUserId, studentKey);
        if (sisUserId) sisToStudentKey.set(sisUserId, studentKey);

        if (!majorKeysByStudent.has(studentKey)) {
          majorKeysByStudent.set(studentKey, new Set());
        }

        const majorYearKey = this.createMajorYearKey(row?.major_code, row?.academic_year__major);
        if (majorYearKey) majorKeysByStudent.get(studentKey).add(majorYearKey);
      });

      return { canvasToStudentKey, sisToStudentKey, majorKeysByStudent };
    },

    resolveStudentKey(row, indexes) {
      const canvasUserId = this.normalizeCanvasUserId(row?.canvas_user_id);
      if (canvasUserId && indexes.canvasToStudentKey.has(canvasUserId)) {
        return indexes.canvasToStudentKey.get(canvasUserId);
      }

      const sisUserId = this.normalizeSisUserId(row?.sis_user_id);
      if (sisUserId && indexes.sisToStudentKey.has(sisUserId)) {
        return indexes.sisToStudentKey.get(sisUserId);
      }

      return '';
    },

    hasAnyAlert(row) {
      return Boolean(
        row?.is_pending_instructor_eval ||
        row?.is_gte_30_days_since_last_eval ||
        row?.is_no_es_eval_on_record ||
        row?.is_on_probation ||
        row?.is_lte_7_days_until_next_end_date ||
        row?.is_gte_7_days_since_last_activity
      );
    },

    mergeRows({ headerRows, endDateRows, employmentRows, activityRows, selectedMajorRows }) {
      const indexes = this.buildMajorIndexes(selectedMajorRows);
      const studentMap = new Map();
      const studentsWithEmploymentSkills = new Set();

      headerRows
        .filter(row => row.enrollment_type_code__current === 'CS')
        .filter(row => row.academic_standing_code)
        .forEach(row => {
          const studentKey = this.resolveStudentKey(row, indexes);
          if (!studentKey) return;

          const record = this.ensureStudentRecord(studentMap, studentKey, row);
          record.is_on_probation = record.is_on_probation || Boolean(row.academic_standing_code);
          if (row.academic_standing_code) record.academic_standing_code = row.academic_standing_code;
        });

      endDateRows
        .filter(row => Number.isFinite(row.num_days_until_exit))
        .forEach(row => {
          const studentKey = this.resolveStudentKey(row, indexes);
          if (!studentKey) return;

          const record = this.ensureStudentRecord(studentMap, studentKey, row);
          const isSoonerEndDate = !Number.isFinite(record.num_days_until_next_end_date)
            || row.num_days_until_exit < record.num_days_until_next_end_date;
          if (isSoonerEndDate) {
            record.num_days_until_next_end_date = row.num_days_until_exit;
            record.upcoming_canvas_course_id = row.canvas_course_id;
            record.upcoming_course_name = row.course_name;
            record.upcoming_course_progress = row.course_progress;
            record.is_lte_7_days_until_next_end_date = row.num_days_until_exit < 7
              && !this.isCourseComplete(row.course_progress);
          }
        });

      employmentRows.forEach(row => {
        const studentKey = this.resolveStudentKey(row, indexes);
        if (!studentKey) return;

        const rowMajorYearKey = this.createMajorYearKey(row?.program_code, row?.academic_year);
        if (!rowMajorYearKey) return;

        const validMajorYearKeys = indexes.majorKeysByStudent.get(studentKey);
        if (!validMajorYearKeys || !validMajorYearKeys.has(rowMajorYearKey)) return;

        studentsWithEmploymentSkills.add(studentKey);
        const record = this.ensureStudentRecord(studentMap, studentKey, row);
        if (row.is_pending_instructor_eval) {
          record.is_pending_instructor_eval = true;
          const course = {
            canvas_course_id: row.canvas_course_id,
            canvas_assignment_id: row.canvas_assignment_id,
            course_code: row.course_code,
            course_name: row.course_name
          };
          const courseKey = [course.canvas_course_id, course.canvas_assignment_id, course.course_code].join(':');
          if (!record.pending_instructor_eval_courses.some(item =>
            [item.canvas_course_id, item.canvas_assignment_id, item.course_code].join(':') === courseKey
          )) {
            record.pending_instructor_eval_courses.push(course);
          }
        }

        if (Number.isFinite(row.num_days_since_last_eval) && row.num_days_since_last_eval >= 30) {
          record.is_gte_30_days_since_last_eval = true;
          record.num_days_since_last_eval = Number.isFinite(record.num_days_since_last_eval)
            ? Math.max(record.num_days_since_last_eval, row.num_days_since_last_eval)
            : row.num_days_since_last_eval;
        }
      });

      selectedMajorRows.forEach(row => {
        const studentKey = this.createStudentKey(row?.sis_user_id, row?.canvas_user_id);
        if (!studentKey || studentsWithEmploymentSkills.has(studentKey)) return;

        const record = this.ensureStudentRecord(studentMap, studentKey, row);
        record.is_no_es_eval_on_record = true;
      });

      activityRows
        .filter(row => Number.isFinite(row.num_days_since_last_submission) && row.num_days_since_last_submission >= 7)
        .forEach(row => {
          const studentKey = this.resolveStudentKey(row, indexes);
          if (!studentKey) return;

          const record = this.ensureStudentRecord(studentMap, studentKey, row);
          record.is_gte_7_days_since_last_activity = true;
          record.num_days_since_last_activity = Number.isFinite(record.num_days_since_last_activity)
            ? Math.max(record.num_days_since_last_activity, row.num_days_since_last_submission)
            : row.num_days_since_last_submission;
        });

      return Array.from(studentMap.values()).filter(row => this.hasAnyAlert(row));
    },

    async loadData() {
      const departmentCode = String(this.selectedDepartmentCode ?? '').trim();
      if (!departmentCode) {
        this.rows = [];
        this.loadError = 'Select a department.';
        return;
      }

      const requestId = ++this.loadRequestId;

      try {
        this.loading = true;
        this.loadError = '';

        const selectedMajorRows = this.normalizeMajorRows(await this.fetchReportDataset(
          {
            department_code: departmentCode,
            is_active_degree: true
          },
          { dataset: 'student_majors' }
        ));

        if (!selectedMajorRows.length) {
          this.rows = [];
          this.loadError = 'No active students found for this department.';
          return;
        }

        const sisUserIds = Array.from(new Set(
          selectedMajorRows.map(row => this.normalizeSisUserId(row?.sis_user_id)).filter(Boolean)
        ));
        const canvasUserIds = Array.from(new Set(
          selectedMajorRows.map(row => this.normalizeCanvasUserId(row?.canvas_user_id)).filter(Boolean)
        ));

        const userFilters = {};
        if (sisUserIds.length) userFilters.sis_user_id = sisUserIds;
        if (canvasUserIds.length) userFilters.canvas_user_id = canvasUserIds;

        const [
          headerRows,
          endDateRows,
          employmentRows,
          activityRows
        ] = await Promise.all([
          this.fetchReportDataset(
            Object.assign({}, userFilters, {
              enrollment_type_code__current: 'CS'
            }),
            { dataset: 'student_header' }
          ),
          this.fetchReportDataset(
            userFilters,
            { dataset: 'student_upcoming_end_dates' }
          ),
          this.fetchReportDataset(
            userFilters,
            { dataset: 'student_employment_skills_current' }
          ),
          this.fetchReportDataset(userFilters, { dataset: 'student_canvas_activity' })
        ]);

        if (requestId !== this.loadRequestId) return;

        const mergedRows = this.mergeRows({
          headerRows: this.normalizeHeaderRows(headerRows),
          endDateRows: this.normalizeUpcomingEndDateRows(endDateRows),
          employmentRows: this.normalizeEmploymentSkillRows(employmentRows),
          activityRows: this.normalizeCanvasActivityRows(activityRows),
          selectedMajorRows
        });

        const hydratedRows = await this.hydrateSisUserIds(mergedRows, { hydrate_sis_user_id: true });
        if (requestId !== this.loadRequestId) return;

        this.rows = hydratedRows;
      } catch (e) {
        console.warn('Failed to load student at-a-glance report', e);
        this.rows = [];
        this.loadError = 'Unable to load student at-a-glance report.';
      } finally {
        if (requestId === this.loadRequestId) {
          this.loading = false;
        }
      }
    }
  },

  template: `
  <report-table-shell
    :title-html="titleText"
    :table="table"
    :rows="visibleRows"
    :loading="loading || loadingDepartments"
    :load-error="loadError"
    loading-text="Loading student at-a-glance report..."
    :row-key-fn="(row, index) => row.student_key || row.canvas_user_id || row.sis_user_id || index"
  >
    <template #filters>
      <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
        <label class="btech-muted" style="font-size:.75rem;">Department</label>
        <select v-model="selectedDepartmentCode" v-bind="filterAttrs('department_code')" style="font-size:.75rem; min-width:220px; max-width:320px;">
          <option value="">Select a Department</option>
          <option v-for="option in departmentOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>
    </template>
  </report-table-shell>
  `
});
