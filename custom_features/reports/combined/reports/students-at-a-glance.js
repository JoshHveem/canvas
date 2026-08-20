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
      year: Number(this.reportContext?.sharedFilters?.academic_year ?? this.reportContext?.filters?.academic_year) || new Date().getFullYear(),
      rows: [],
      allMajors: [],
      departmentOptions: [],
      selectedDepartmentCode: ''
    };
  },

  created() {
    this.table.setColumns([
      new window.ReportColumn(
        'Student Name', 'Student name pulled from Canvas after load.', '14rem', false, 'string',
        row => this.anonymous ? 'STUDENT' : this.escapeHtml(this.getStudentName(row)),
        null,
        row => this.getStudentName(row).toLowerCase()
      ),
      new window.ReportColumn(
        'Pending Instructor Eval', 'Alerted when the student has an instructor evaluation pending.', '11rem', false, 'number',
        row => this.alertText(row?.is_pending_instructor_eval),
        row => this.alertPillStyle(row?.is_pending_instructor_eval),
        row => this.boolSort(row?.is_pending_instructor_eval)
      ),
      new window.ReportColumn(
        '30+ Days Since Last Eval', 'Alerted when the most recent evaluation is at least 30 days old.', '11rem', false, 'number',
        row => this.alertText(row?.is_gte_30_days_since_last_eval),
        row => this.alertPillStyle(row?.is_gte_30_days_since_last_eval),
        row => this.boolSort(row?.is_gte_30_days_since_last_eval)
      ),
      new window.ReportColumn(
        'On Probation', 'Alerted when the student is currently on academic standing.', '9rem', false, 'number',
        row => this.alertText(row?.is_on_probation),
        row => this.alertPillStyle(row?.is_on_probation),
        row => this.boolSort(row?.is_on_probation)
      ),
      new window.ReportColumn(
        'Recently Off Probation', 'Alerted when the student was newly removed from academic standing.', '11rem', false, 'number',
        row => this.alertText(row?.is_recently_off_probation),
        row => this.alertPillStyle(row?.is_recently_off_probation),
        row => this.boolSort(row?.is_recently_off_probation)
      ),
      new window.ReportColumn(
        '<= 7 Days Until Next End Date', 'Alerted when the student has an upcoming course end date within 7 days.', '11rem', false, 'number',
        row => this.alertText(row?.is_lte_7_days_until_next_end_date),
        row => this.alertPillStyle(row?.is_lte_7_days_until_next_end_date),
        row => this.boolSort(row?.is_lte_7_days_until_next_end_date)
      ),
      new window.ReportColumn(
        '7+ Days Since Last Activity', 'Alerted when the student has not submitted in at least 7 days.', '11rem', false, 'number',
        row => this.alertText(row?.is_gte_7_days_since_last_activity),
        row => this.alertPillStyle(row?.is_gte_7_days_since_last_activity),
        row => this.boolSort(row?.is_gte_7_days_since_last_activity)
      )
    ]);
  },

  mounted() {
    this.syncFromReportContext();
    this.loadDepartmentOptions(true);
  },

  watch: {
    reportContext: {
      deep: true,
      async handler() {
        this.syncFromReportContext();
        await this.loadDepartmentOptions(true);
      }
    },
    async year() {
      this.setSharedFilterValue('academic_year', Number(this.year));
      await this.loadDepartmentOptions(true);
    },
    selectedDepartmentCode() {
      this.setSharedFilterValue('department_code', this.selectedDepartmentCode);
      const selectedOption = this.departmentOptions.find(option => option.value === this.selectedDepartmentCode);
      if (selectedOption?.label) this.setSharedFilterValue('department_name', selectedOption.label);
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
      const nextYear = Number(this.getSharedFilterValue('academic_year', this.reportContext?.filters?.academic_year));
      if (Number.isFinite(nextYear) && nextYear !== this.year) {
        this.year = nextYear;
      }

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
        is_newly_removed__academic_standing: Boolean(row?.is_newly_removed__academic_standing),
        enrollment_type_code__current: String(row?.enrollment_type_code__current ?? '').trim().toUpperCase()
      }));
    },

    normalizeUpcomingEndDateRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        canvas_user_id: this.normalizeCanvasUserId(row?.canvas_user_id),
        sis_user_id: this.normalizeSisUserId(row?.sis_user_id),
        program_code: String(row?.program_code ?? '').trim(),
        num_days_until_exit: Number(row?.num_days_until_exit),
        course_name: String(row?.course_name ?? '').trim(),
        course_exit_at__target: String(row?.course_exit_at__target ?? '').trim()
      }));
    },

    normalizeEmploymentSkillRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        sis_user_id: this.normalizeSisUserId(row?.sis_user_id),
        canvas_user_id: this.normalizeCanvasUserId(row?.canvas_user_id),
        program_code: String(row?.program_code ?? '').trim(),
        academic_year: this.normalizeMajorYear(row?.academic_year),
        is_pending_instructor_eval: Boolean(row?.is_pending_instructor_eval),
        num_days_since_last_eval: Number(row?.num_days_since_last_eval)
      }));
    },

    normalizeCanvasActivityRows(rows) {
      return (Array.isArray(rows) ? rows : []).map(row => ({
        sis_user_id: this.normalizeSisUserId(row?.sis_user_id),
        canvas_user_id: this.normalizeCanvasUserId(row?.canvas_user_id),
        num_days_since_last_submission: Number(row?.num_days_since_last_submission)
      }));
    },

    async loadDepartmentOptions(forceReloadData = false) {
      const requestId = ++this.loadDepartmentsRequestId;

      try {
        this.loadingDepartments = true;
        this.loadError = '';

        const majorRows = await this.fetchReportDataset({}, { dataset: 'student_majors' });
        if (requestId !== this.loadDepartmentsRequestId) return;

        this.allMajors = this.normalizeMajorRows(majorRows);

        const yearScopedMajors = this.allMajors.filter(row => row.academic_year__major === Number(this.year));
        const options = Array.from(
          new Map(
            yearScopedMajors
              .map(row => ({
                value: String(row?.department_code ?? '').trim(),
                label: String(row?.department_code ?? '').trim()
              }))
              .filter(option => option.value)
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
        if (forceReloadData) this.loadData();
      } catch (e) {
        console.warn('Failed to load student at-a-glance department options', e);
        this.allMajors = [];
        this.departmentOptions = [];
        this.rows = [];
        this.loadError = 'Unable to load department list.';
      } finally {
        if (requestId === this.loadDepartmentsRequestId) {
          this.loadingDepartments = false;
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
          is_gte_30_days_since_last_eval: false,
          is_on_probation: false,
          is_recently_off_probation: false,
          is_lte_7_days_until_next_end_date: false,
          is_gte_7_days_since_last_activity: false
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
        row?.is_on_probation ||
        row?.is_recently_off_probation ||
        row?.is_lte_7_days_until_next_end_date ||
        row?.is_gte_7_days_since_last_activity
      );
    },

    mergeRows({ headerRows, endDateRows, employmentRows, activityRows, selectedMajorRows }) {
      const indexes = this.buildMajorIndexes(selectedMajorRows);
      const studentMap = new Map();

      headerRows
        .filter(row => row.enrollment_type_code__current === 'CS')
        .filter(row => row.is_newly_removed__academic_standing || row.academic_standing_code)
        .forEach(row => {
          const studentKey = this.resolveStudentKey(row, indexes);
          if (!studentKey) return;

          const record = this.ensureStudentRecord(studentMap, studentKey, row);
          record.is_on_probation = record.is_on_probation || Boolean(row.academic_standing_code);
          record.is_recently_off_probation = record.is_recently_off_probation || Boolean(row.is_newly_removed__academic_standing);
        });

      endDateRows
        .filter(row => Number.isFinite(row.num_days_until_exit) && row.num_days_until_exit <= 7)
        .forEach(row => {
          const studentKey = this.resolveStudentKey(row, indexes);
          if (!studentKey) return;

          const record = this.ensureStudentRecord(studentMap, studentKey, row);
          record.is_lte_7_days_until_next_end_date = true;
        });

      employmentRows.forEach(row => {
        const studentKey = this.resolveStudentKey(row, indexes);
        if (!studentKey) return;

        const rowMajorYearKey = this.createMajorYearKey(row?.program_code, row?.academic_year);
        if (!rowMajorYearKey) return;

        const validMajorYearKeys = indexes.majorKeysByStudent.get(studentKey);
        if (!validMajorYearKeys || !validMajorYearKeys.has(rowMajorYearKey)) return;

        const record = this.ensureStudentRecord(studentMap, studentKey, row);
        if (row.is_pending_instructor_eval) {
          record.is_pending_instructor_eval = true;
        }

        if (Number.isFinite(row.num_days_since_last_eval) && row.num_days_since_last_eval >= 30) {
          record.is_gte_30_days_since_last_eval = true;
        }
      });

      activityRows
        .filter(row => Number.isFinite(row.num_days_since_last_submission) && row.num_days_since_last_submission >= 7)
        .forEach(row => {
          const studentKey = this.resolveStudentKey(row, indexes);
          if (!studentKey) return;

          const record = this.ensureStudentRecord(studentMap, studentKey, row);
          record.is_gte_7_days_since_last_activity = true;
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

        const selectedMajorRows = this.allMajors.filter(row =>
          String(row?.department_code ?? '').trim() === departmentCode &&
          row.academic_year__major === Number(this.year)
        );

        if (!selectedMajorRows.length) {
          this.rows = [];
          this.loadError = 'No active students found for this department and year.';
          return;
        }

        const [
          headerRows,
          endDateRows,
          employmentRows,
          activityRows
        ] = await Promise.all([
          this.fetchReportDataset({}, { dataset: 'student_header' }),
          this.fetchReportDataset({}, { dataset: 'student_upcoming_end_dates' }),
          this.fetchReportDataset({}, { dataset: 'student_employment_skills_current' }),
          this.fetchReportDataset({}, { dataset: 'student_canvas_activity' })
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
