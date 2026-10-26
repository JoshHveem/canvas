export function departmentScoped(config) {
  return {
    props: {
      reportContext: { type: Object, default: () => ({}) },
      anonymous: { type: Boolean, default: false }
    },

    data() {
      return {
        loading: false,
        loadingDepartments: false,
        loadError: '',
        year: Number(this.reportContext?.sharedFilters?.academic_year ?? this.reportContext?.filters?.academic_year) || new Date().getFullYear(),
        rows: [],
        departmentOptions: [],
        selectedDepartmentCode: '',
        loadedDepartmentName: ''
      };
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

    methods: {
      syncFromReportContext() {
        const nextYear = Number(this.getSharedFilterValue('academic_year', this.reportContext?.filters?.academic_year));
        if (Number.isFinite(nextYear) && nextYear !== this.year) {
          this.year = nextYear;
        }

        const nextDepartmentCode = String(
          this.getSharedFilterValue('department_code', this.getDepartmentCode()) ?? ''
        ).trim();
        if (nextDepartmentCode && nextDepartmentCode !== this.selectedDepartmentCode) {
          this.selectedDepartmentCode = nextDepartmentCode;
        }

        const nextDepartmentName = String(
          this.getSharedFilterValue('department_name', this.getDepartmentName()) ?? ''
        ).trim();
        if (nextDepartmentName) this.loadedDepartmentName = nextDepartmentName;
      },

      getDataset() {
        return String(this.reportContext?.dataset || '').trim();
      },

      getRequestFilters() {
        return {
          academic_year: Number(this.year),
          department_code: this.selectedDepartmentCode
        };
      },

      getDepartmentCode() {
        return String(
          this.reportContext?.routeFilters?.departmentCode ??
          this.reportContext?.filters?.department_code ??
          ''
        ).trim();
      },

      getDepartmentName() {
        return String(
          this.reportContext?.routeFilters?.departmentName ??
          this.reportContext?.filters?.department_name ??
          ''
        ).trim();
      },

      getDepartmentOptionsDataset() {
        return config.optionsDataset;
      },

      getEmptySelectionMessage() {
        return config.emptySelectionMessage || 'Select a department.';
      },

      getLoadErrorMessage() {
        return config.loadErrorMessage || 'Unable to load report details.';
      },

      normalizeRows(rows) {
        return typeof this.mapRows === 'function' ? this.mapRows(rows) : (Array.isArray(rows) ? rows : []);
      },

      async loadDepartmentOptions(forceReloadData = false) {
        return this.runReportRequest('options', {
          loadingKey: 'loadingDepartments',
          invalidate: ['data'],
          onError: e => {
            console.warn('Failed to load department options', e);
            this.departmentOptions = [];
            if (!this.selectedDepartmentCode) {
              this.loadError = 'Unable to load department list.';
            }
          }
        }, async request => {
          const rows = await request.wait(this.fetchReportDataset(
            { academic_year: Number(this.year) },
            { dataset: this.getDepartmentOptionsDataset() }
          ));

          const options = Array.from(
            new Map(
              (Array.isArray(rows) ? rows : [])
                .map(row => ({
                  value: String(row?.department_code ?? '').trim(),
                  label: String(row?.department_name ?? '').trim()
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

      async loadData() {
        const departmentCode = String(this.selectedDepartmentCode || '').trim();
        return this.runReportRequest('data', {
          onError: e => {
            console.warn('Failed to load department detail dataset', e);
            this.rows = [];
            this.loadedDepartmentName = this.departmentOptions.find(option => option.value === departmentCode)?.label || this.getDepartmentName();
            this.loadError = this.getLoadErrorMessage();
          }
        }, async request => {
          if (!departmentCode) {
            this.rows = [];
            this.loadedDepartmentName = '';
            this.loadError = this.getEmptySelectionMessage();
            return;
          }

          const rows = await request.wait(this.fetchReportDataset(
            this.getRequestFilters(),
            { dataset: this.getDataset() }
          ));

          const normalizedRows = this.normalizeRows(rows);
          const hydratedRows = await request.wait(this.hydrateSisUserIds(normalizedRows, config));

          this.rows = hydratedRows;

          const first = this.rows[0] || {};
          this.loadedDepartmentName = String(
            first?.department_name ??
            first?.dept_name ??
            this.departmentOptions.find(option => option.value === departmentCode)?.label ??
            this.getDepartmentName()
          ).trim();
        });
      }
    }
  };
}
