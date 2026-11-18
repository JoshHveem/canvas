(async function () {
  Vue.component('reports-hs-student-grades', {
    mixins: [
      window.ReportMixins.anonymization,
      window.ReportMixins.requests,
      window.ReportMixins.formatting,
      window.ReportMixins.tables,
      window.ReportMixins.filters,
      window.ReportMixins.datasets,
      window.ReportMixins.canvasProfiles,
      window.ReportMixins.departmentScoped({
        optionsDataset: 'departments',
        hydrate_sis_user_id: true,
        emptySelectionMessage: 'Select a department to view HS student grades.',
        loadErrorMessage: 'Unable to load HS student grades.'
      })
    ],

    data() {
      const colors = window.ReportUtils.createColors();
      return { colors, table: window.ReportUtils.createTable('Last Name', colors), selectedHighSchool: '', activeTermsOnly: false };
    },

    created() {
      const textColumn = (label, description, width, value) => new window.ReportColumn(
        label, description, width, false, 'string',
        row => this.escapeHtml(value(row) || '-'),
        null,
        row => String(value(row) || '').toLowerCase()
      );
      const gradeColumn = (label, description, field) => new window.ReportColumn(
        label, description, '7rem', false, 'number',
        row => this.gradeText(row[field]),
        row => this.gradePillStyle(row[field]),
        row => this.numberValue(row[field]) ?? Number.POSITIVE_INFINITY
      );
      const nameColumn = (label, field, width) => new window.ReportColumn(
        label, 'Open the student user page and HS Grades report.', width, false, 'string',
        row => this.studentNameLinkHtml(row, field),
        null,
        row => String(this.anonymous ? 'STUDENT' : row[field] || '').toLowerCase()
      );
      this.table.setColumns([
        nameColumn('First Name', 'first_name', '8rem'),
        nameColumn('Last Name', 'last_name', '9rem'),
        textColumn('SIS ID', 'Student information system ID.', '6rem',
          row => this.anonymous ? 'STUDENT' : row.sis_user_id),
        textColumn('Campus', 'HS enrollment campus code.', '4rem', row => row.campus_code),
        this.withColumnWrap(textColumn('High Schools', 'High schools associated with the student.', '12rem',
          row => (row.high_schools || []).map(school => this.displayName(school, 'high_school_name', 'High School')).join(', '))),
        textColumn('Term', 'Enrollment start and end dates.', '12rem',
          row => `${this.termDate(row.entry_at)} to ${this.termDate(row.exit_at)}`),
        this.withColumnWrap(new window.ReportColumn(
          'Credits', 'Blue: credits earned. Red behind blue: credits required to date. Dark gray: remaining credits. The label shows earned credits / total credits required for the full term.', '10rem', false, 'number',
          row => this.creditProgressHtml(row),
          null,
          row => this.numberValue(row.credits_completed) ?? Number.POSITIVE_INFINITY
        )),
        gradeColumn('Grade to Date', 'Grade scaled by the credits required to date.', 'grade__to_date'),
        gradeColumn('Term Grade', 'Grade scaled by the credits required for the full term.', 'grade__term')
      ]);
    },

    computed: {
      highSchoolOptions() {
        return [...new Set(this.rows.flatMap(row => row.high_schools || []))]
          .sort((a, b) => a.localeCompare(b))
          .map(school => ({ value: school, label: school }));
      },

      filteredRows() {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        return this.rows.filter(row => {
          if (this.selectedHighSchool && !(row.high_schools || []).includes(this.selectedHighSchool)) return false;
          if (!this.activeTermsOnly) return true;
          const start = String(row.entry_at || '').slice(0, 10);
          const end = String(row.exit_at || '').slice(0, 10);
          return /^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end) &&
            start <= today && today <= end;
        });
      },

      visibleRows() {
        this.table.setRows(this.filteredRows);
        return this.table.getSortedRows();
      }
    },

    methods: {
      studentNameLinkHtml(row, field = 'first_name') {
        if (this.anonymous) return 'STUDENT';
        const text = this.escapeHtml(String(row?.[field] ?? '').trim() || '-');
        const userId = String(row?.canvas_user_id ?? '').trim();
        if (!userId) return text;

        const courseId = String(row?.canvas_course_id ?? '').trim();
        const path = courseId
          ? `/courses/${encodeURIComponent(courseId)}/users/${encodeURIComponent(userId)}`
          : `/users/${encodeURIComponent(userId)}`;
        return `<a href="${path}?open_btech_report=hs-grades" target="_blank" rel="noopener noreferrer">${text}</a>`;
      },

      async loadDepartmentOptions(forceReloadData = false) {
        return this.runReportRequest('options', {
          loadingKey: 'loadingDepartments',
          invalidate: ['data'],
          onError: error => {
            console.warn('Failed to load HS student grades department options', error);
            this.departmentOptions = [];
            if (!this.selectedDepartmentCode) this.loadError = 'Unable to load department list.';
          }
        }, async request => {
          const rows = await request.wait(this.fetchReportDataset({}, { dataset: this.getDepartmentOptionsDataset() }));

          const options = Array.from(new Map(
            (Array.isArray(rows) ? rows : [])
              .map(row => ({
                value: String(row?.department_code ?? row?.code ?? '').trim(),
                label: String(row?.department_name ?? row?.department ?? row?.name ?? '').trim()
              }))
              .filter(option => option.value && option.label)
              .map(option => [option.value, option])
          ).values()).sort((a, b) => a.label.localeCompare(b.label));

          this.departmentOptions = options;
          const nextDepartmentCode = this.resolveDeferredSelection({
            filterKey: 'department_code',
            options,
            currentValue: this.selectedDepartmentCode,
            routeValue: this.getDepartmentCode()
          });
          if (!this.filterValuesEqual(nextDepartmentCode, this.selectedDepartmentCode)) {
            this.selectedDepartmentCode = nextDepartmentCode;
            return;
          }

          const selectedOption = options.find(option => this.filterValuesEqual(option.value, nextDepartmentCode));
          if (selectedOption?.label) this.setSharedFilterValue('department_name', selectedOption.label);
          if (forceReloadData) this.loadData();
        });
      },

      numberValue(value) {
        if (value === null || value === undefined || String(value).trim() === '') return null;
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
      },

      gradeText(value) {
        const grade = this.numberValue(value);
        return grade === null ? '-' : `${grade.toFixed(1)}%`;
      },

      gradePillStyle(value) {
        const grade = this.numberValue(value);
        if (grade === null) return { backgroundColor: this.colors.gray, color: this.colors.black };
        return {
          backgroundColor: grade < 70 ? this.colors.red : grade < 80 ? this.colors.yellow : this.colors.green,
          color: grade >= 70 && grade < 80 ? this.colors.black : this.colors.white
        };
      },

      creditProgressHtml(row) {
        const completed = this.numberValue(row.credits_completed);
        const required = this.numberValue(row.credits_required);
        const label = `${this.creditText(completed)} / ${this.creditText(required)}`;
        if (completed === null || required === null || required <= 0) return label;

        const percent = Math.round(Math.max(0, Math.min(1, completed / required)) * 100);
        const requiredToDate = this.numberValue(row.credits_required__to_date);
        const requiredToDatePercent = requiredToDate === null ? null
          : Math.round(Math.max(0, Math.min(1, requiredToDate / required)) * 100);
        const blue = this.escapeHtml(window.bridgetools?.colors?.blue || this.colors.blue || '#005a9c');
        const red = this.escapeHtml(window.bridgetools?.colors?.red || this.colors.red);
        const description = `${label} credits${requiredToDate === null ? '' : `; ${this.creditText(requiredToDate)} required to date`}`;
        const requiredToDateHtml = requiredToDatePercent === null ? ''
          : `<span style="position:absolute; inset:0 auto 0 0; width:${requiredToDatePercent}%; background:${red};"></span>`;
        return `<span class="btech-progress" role="progressbar" aria-label="Credits earned" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percent}" aria-valuetext="${description}" title="${description}" style="display:block; position:relative; width:calc(100% - .5rem); max-width:100%; min-width:0; box-sizing:border-box; overflow:hidden; border-radius:999px; height:1.5rem; line-height:1.5rem; background:#374151;">${requiredToDateHtml}<span style="position:absolute; inset:0 auto 0 0; width:${percent}%; background:${blue};"></span><span style="position:absolute; inset:0; overflow:hidden; text-overflow:ellipsis; text-align:center; color:#fff; font-size:.75rem; white-space:nowrap;">${label}</span></span>`;
      },

      creditText(value) {
        const credits = this.numberValue(value);
        return credits === null ? '-' : credits.toFixed(2);
      },

      termDate(value) {
        const date = String(value ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
        return date ? `${date[2]}/${date[3]}/${date[1]}` : '-';
      },

      mapRows(rows) {
        return (Array.isArray(rows) ? rows : []).map(row => ({
          ...row,
          sis_user_id: String(row?.sis_user_id ?? '').trim(),
          canvas_user_id: String(row?.canvas_user_id ?? '').trim(),
          course_code: String(row?.course_code ?? '').trim(),
          campus_code: String(row?.campus_code ?? '').trim(),
          high_schools: [...new Set((Array.isArray(row?.high_schools) ? row.high_schools : [])
            .filter(school => typeof school === 'string')
            .map(school => school.trim())
            .filter(Boolean))]
        }));
      },

      async loadData() {
        return this.runReportRequest('data', {
          onError: error => {
            console.warn('Failed to load HS student grades', error);
            this.loadError = this.getLoadErrorMessage();
          }
        }, async request => {
          this.rows = [];
          if (!this.selectedDepartmentCode) {
            this.selectedHighSchool = '';
            this.loadError = this.getEmptySelectionMessage();
            return;
          }

          const rows = await request.wait(this.fetchReportDataset(this.getRequestFilters(), { dataset: this.getDataset() }));

          const hydratedRows = await request.wait(this.hydrateSisUserIds(this.mapRows(rows), { hydrate_sis_user_id: true }));

          this.rows = hydratedRows;
          if (this.selectedHighSchool && !this.highSchoolOptions.some(option => option.value === this.selectedHighSchool)) {
            this.selectedHighSchool = '';
          }
        });
      }
    },

    template: `
    <report-table-shell
      title-html="HS Student Grades"
      :table="table"
      :rows="visibleRows"
      :loading="loading || loadingDepartments"
      :load-error="loadError"
      loading-text="Loading HS student grades..."
      :row-key-fn="(row, index) => [row.sis_user_id, row.course_code, row.campus_code, row.entry_at, row.exit_at, index].join(':')"
    >
      <template #description>
        HS student term grades for the selected department and year. Term Grade shows the grade for the full term if no additional work is submitted.
      </template>
      <template #filters>
        <label style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto; font-size:.75rem;">
          <input type="checkbox" v-model="activeTermsOnly">
          Active
        </label>
        <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
          <label for="report-filter-academic_year" class="btech-muted" style="font-size:.75rem;">Year</label>
          <select v-model.number="year" v-bind="filterAttrs('academic_year')" style="font-size:.75rem; min-width:90px;">
            <option v-for="optionYear in Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i)" :key="optionYear" :value="optionYear">{{ optionYear }}</option>
          </select>
        </div>
        <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
          <label for="report-filter-department_code" class="btech-muted" style="font-size:.75rem;">Department</label>
          <select v-model="selectedDepartmentCode" v-bind="filterAttrs('department_code')" style="font-size:.75rem; min-width:220px; max-width:320px;">
            <option value="">Select a Department</option>
            <option v-for="option in departmentOptions" :key="option.value" :value="option.value">{{ displayFilterOption(option, 'department_name', 'Department') }}</option>
          </select>
        </div>
        <div style="display:flex; align-items:center; gap:.5rem; flex:0 0 auto;">
          <label for="report-filter-high_school" class="btech-muted" style="font-size:.75rem;">High School</label>
          <select v-model="selectedHighSchool" v-bind="filterAttrs('high_school')" :disabled="loading || !highSchoolOptions.length" style="font-size:.75rem; min-width:180px; max-width:280px;">
            <option value="">All High Schools</option>
            <option v-for="option in highSchoolOptions" :key="option.value" :value="option.value">{{ displayFilterOption(option, 'high_school_name', 'High School') }}</option>
          </select>
        </div>
      </template>
    </report-table-shell>
    `
  });
})();
