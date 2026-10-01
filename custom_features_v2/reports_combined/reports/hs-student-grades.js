(async function () {
  Vue.component('reports-hs-student-grades', {
    mixins: [
      window.ReportMixins.formatting,
      window.ReportMixins.departmentScoped({
        optionsDataset: 'departments',
        hydrate_sis_user_id: true,
        emptySelectionMessage: 'Select a department to view HS student grades.',
        loadErrorMessage: 'Unable to load HS student grades.'
      })
    ],

    data() {
      const colors = window.ReportUtils.createColors();
      return { table: window.ReportUtils.createTable('Last Name', colors) };
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
        null,
        row => this.numberValue(row[field]) ?? Number.POSITIVE_INFINITY
      );
      this.table.setColumns([
        textColumn('First Name', 'Student first name pulled from Canvas.', '8rem',
          row => this.anonymous ? 'STUDENT' : String(row.first_name || '').trim()),
        textColumn('Last Name', 'Student last name pulled from Canvas.', '9rem',
          row => this.anonymous ? 'STUDENT' : String(row.last_name || '').trim()),
        textColumn('SIS ID', 'Student information system ID.', '6rem',
          row => this.anonymous ? 'STUDENT' : row.sis_user_id),
        textColumn('Course', 'HS enrollment course code.', '8rem', row => row.course_code),
        textColumn('Campus', 'HS enrollment campus code.', '4rem', row => row.campus_code),
        textColumn('Term', 'Enrollment start and end dates.', '12rem',
          row => `${this.termDate(row.entry_at)} to ${this.termDate(row.exit_at)}`),
        new window.ReportColumn(
          'Credits', 'Credits completed / credits required for the full term.', '7rem', false, 'number',
          row => `${this.creditText(row.credits_completed)} / ${this.creditText(row.credits_required)}`,
          null,
          row => this.numberValue(row.credits_completed) ?? Number.POSITIVE_INFINITY
        ),
        gradeColumn('Grade to Date', 'Grade scaled by the credits required to date.', 'grade__to_date'),
        gradeColumn('Term Grade', 'Grade scaled by the credits required for the full term.', 'grade__term')
      ]);
    },

    computed: {
      visibleRows() {
        this.table.setRows(this.rows);
        return this.table.getSortedRows();
      }
    },

    methods: {
      async loadDepartmentOptions(forceReloadData = false) {
        const requestId = ++this.loadDepartmentsRequestId;
        try {
          this.loadingDepartments = true;
          const rows = await this.fetchReportDataset({}, { dataset: this.getDepartmentOptionsDataset() });
          if (requestId !== this.loadDepartmentsRequestId) return;

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
        } catch (error) {
          if (requestId !== this.loadDepartmentsRequestId) return;
          console.warn('Failed to load HS student grades department options', error);
          this.departmentOptions = [];
          if (!this.selectedDepartmentCode) this.loadError = 'Unable to load department list.';
        } finally {
          if (requestId === this.loadDepartmentsRequestId) this.loadingDepartments = false;
        }
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
          campus_code: String(row?.campus_code ?? '').trim()
        }));
      },

      async loadData() {
        // Invalidate previous requests even when the department selection is cleared.
        const requestId = ++this.loadRequestId;
        this.rows = [];
        this.loadError = '';
        this.loading = false;
        if (!this.selectedDepartmentCode) {
          this.loadError = this.getEmptySelectionMessage();
          return;
        }

        try {
          this.loading = true;
          const rows = await this.fetchReportDataset(this.getRequestFilters(), { dataset: this.getDataset() });
          if (requestId !== this.loadRequestId) return;
          const hydratedRows = await this.hydrateSisUserIds(this.mapRows(rows), { hydrate_sis_user_id: true });
          if (requestId !== this.loadRequestId) return;
          this.rows = hydratedRows;
        } catch (error) {
          if (requestId !== this.loadRequestId) return;
          console.warn('Failed to load HS student grades', error);
          this.loadError = this.getLoadErrorMessage();
        } finally {
          if (requestId === this.loadRequestId) this.loading = false;
        }
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
            <option v-for="option in departmentOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </div>
      </template>
    </report-table-shell>
    `
  });
})();
