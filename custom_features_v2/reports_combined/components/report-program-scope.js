export function programScoped(config) {
  return {
    props: {
      reportContext: { type: Object, default: () => ({}) },
      anonymous: { type: Boolean, default: false }
    },

    data() {
      return {
        loading: false,
        loadingPrograms: false,
        loadError: '',
        year: Number(this.reportContext?.sharedFilters?.academic_year ?? this.reportContext?.filters?.academic_year) || new Date().getFullYear(),
        rows: [],
        programOptions: [],
        selectedProgramCode: '',
        loadedProgramName: ''
      };
    },

    mounted() {
      this.syncFromReportContext();
      this.loadProgramOptions();
    },

    watch: {
      reportContext: {
        deep: true,
        async handler() {
          this.syncFromReportContext();
          await this.loadProgramOptions(true);
        }
      },
      async year() {
        if (config.includeAcademicYear === false) return;
        this.setSharedFilterValue('academic_year', Number(this.year));
        await this.loadProgramOptions(true);
      },
      selectedProgramCode() {
        this.setSharedFilterValue('program_code', this.selectedProgramCode);
        const selectedOption = this.programOptions.find(option => option.value === this.selectedProgramCode);
        const selectedLabel = String(selectedOption?.label ?? '').trim();
        if (selectedLabel) {
          this.loadedProgramName = selectedLabel;
          this.setSharedFilterValue('program_name', selectedLabel);
        }
        this.loadData();
      }
    },

    methods: {
      syncFromReportContext() {
        const nextYear = Number(this.getSharedFilterValue('academic_year', this.reportContext?.filters?.academic_year));
        if (Number.isFinite(nextYear) && nextYear !== this.year) {
          this.year = nextYear;
        }

        const nextProgramCode = String(
          this.getSharedFilterValue('program_code', this.getProgramCode()) ?? ''
        ).trim();
        if (nextProgramCode && nextProgramCode !== this.selectedProgramCode) {
          this.selectedProgramCode = nextProgramCode;
        }

        const nextProgramName = String(
          this.getSharedFilterValue('program_name', this.getProgramName()) ?? ''
        ).trim();
        if (nextProgramName) this.loadedProgramName = nextProgramName;
      },

      getDataset() {
        return String(this.reportContext?.dataset || '').trim();
      },

      getRequestFilters() {
        const filters = {
          program_code: this.selectedProgramCode
        };
        if (config.includeAcademicYear !== false) {
          filters.academic_year = Number(this.year);
        }
        return filters;
      },

      getProgramOptionsRequestFilters() {
        if (config.includeAcademicYear === false) return {};
        return { academic_year: Number(this.year) };
      },

      getProgramCode() {
        return String(
          this.reportContext?.routeFilters?.programCode ??
          this.reportContext?.filters?.program_code ??
          ''
        ).trim();
      },

      getProgramName() {
        return String(
          this.reportContext?.routeFilters?.programName ??
          this.reportContext?.filters?.program_name ??
          ''
        ).trim();
      },

      getProgramOptionsDataset() {
        return 'programs';
      },

      getProgramLabel(row) {
        return String(row?.program_name ?? row?.program_code ?? '').trim();
      },

      getEmptySelectionMessage() {
        return config.emptySelectionMessage || 'Select a program.';
      },

      getLoadErrorMessage() {
        return config.loadErrorMessage || 'Unable to load report details.';
      },

      getProgramOptionsLoadErrorMessage() {
        return config.optionsLoadErrorMessage || 'Unable to load program list.';
      },

      normalizeRows(rows) {
        return typeof this.mapRows === 'function' ? this.mapRows(rows) : (Array.isArray(rows) ? rows : []);
      },

      async loadProgramOptions(forceReloadData = false) {
        return this.runReportRequest('options', {
          loadingKey: 'loadingPrograms',
          invalidate: ['data'],
          onError: e => {
            console.warn('Failed to load program options', e);
            this.programOptions = [];
            if (!this.selectedProgramCode) {
              this.loadError = this.getProgramOptionsLoadErrorMessage();
            }
          }
        }, async request => {
          const rows = await request.wait(this.fetchReportDataset(
            this.getProgramOptionsRequestFilters(),
            { dataset: this.getProgramOptionsDataset() }
          ));

          const options = Array.from(
            new Map(
              (Array.isArray(rows) ? rows : [])
                .map(row => ({
                  value: String(row?.program_code ?? '').trim(),
                  label: this.getProgramLabel(row)
                }))
                .filter(option => option.value && option.label)
                .map(option => [option.value, option])
            ).values()
          ).sort((a, b) => a.label.localeCompare(b.label));

          this.programOptions = options;
          const nextProgramCode = this.resolveDeferredSelection({
            filterKey: 'program_code',
            options,
            currentValue: this.selectedProgramCode,
            routeValue: this.getProgramCode()
          });

          if (!this.filterValuesEqual(nextProgramCode, this.selectedProgramCode)) {
            this.selectedProgramCode = nextProgramCode;
            return;
          }

          const selectedOption = options.find(option => this.filterValuesEqual(option.value, nextProgramCode));
          if (selectedOption?.label) {
            this.loadedProgramName = selectedOption.label;
            this.setSharedFilterValue('program_name', selectedOption.label);
          }
          if (forceReloadData) this.loadData();
        });
      },

      async loadData() {
        const programCode = String(this.selectedProgramCode || '').trim();
        return this.runReportRequest('data', {
          onError: e => {
            console.warn('Failed to load program detail dataset', e);
            this.rows = [];
            this.loadedProgramName = this.programOptions.find(option => option.value === programCode)?.label || this.getProgramName();
            this.loadError = this.getLoadErrorMessage();
          }
        }, async request => {
          if (!programCode) {
            this.rows = [];
            this.loadedProgramName = '';
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
          this.loadedProgramName = String(
            first?.program_name ??
            this.programOptions.find(option => option.value === programCode)?.label ??
            this.getProgramName()
          ).trim();
        });
      }
    }
  };
}
