window.ReportUtils = {
  createColors() {
    return window.bridgetools?.colors || {
      red: '#b20b0f',
      orange: '#f59e0b',
      yellow: '#eab308',
      green: '#16a34a',
      gray: '#e5e7eb',
      black: '#111827',
      white: '#fff'
    };
  },

  createTable(sortColumn, colors) {
    return new window.ReportTable({
      rows: [],
      columns: [],
      sort_column: sortColumn,
      sort_dir: 1,
      colors
    });
  },

  escapeHtml(str) {
    return String(str ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  },

  pctText(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return 'n/a';
    return (n * 100).toFixed(1) + '%';
  },

  pctPillStyle(colors, v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return { backgroundColor: colors.gray, color: colors.black };
    const pct = n * 100;
    return {
      backgroundColor: pct < 80 ? colors.red : (pct < 90 ? colors.yellow : colors.green),
      color: colors.white
    };
  },

  countPillStyle(colors, count) {
    const n = Number(count);
    if (!Number.isFinite(n)) return { backgroundColor: colors.gray, color: colors.black };
    return {
      backgroundColor: n <= 0 ? colors.green : (n <= 5 ? colors.yellow : colors.red),
      color: colors.white
    };
  },

  boolText(v) {
    if (v === undefined || v === null) return 'n/a';
    return v ? 'Yes' : 'No';
  },

  boolSort(v) {
    if (v === undefined || v === null) return -1;
    return v ? 1 : 0;
  },

  boolPillStyle(colors, v) {
    if (v === undefined || v === null) return { backgroundColor: colors.gray, color: colors.black };
    return v
      ? { backgroundColor: colors.green, color: colors.white }
      : { backgroundColor: colors.red, color: colors.white };
  },

  intText(v) {
    const n = Number(v);
    return Number.isFinite(n) ? Math.round(n).toLocaleString() : 'n/a';
  },

  numText(v, decimals = 2) {
    const n = Number(v);
    return Number.isFinite(n) ? n.toFixed(decimals) : 'n/a';
  },

  bandDaysToGrade(colors, v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return { backgroundColor: colors.gray, color: colors.black };
    return {
      backgroundColor: n < 2 ? colors.green : (n < 3 ? colors.yellow : colors.red),
      color: colors.white
    };
  },

  bandDaysToRespond(colors, v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return { backgroundColor: colors.gray, color: colors.black };
    return {
      backgroundColor: n <= 1 ? colors.green : (n <= 2 ? colors.yellow : colors.red),
      color: colors.white
    };
  },

  uniqueSorted(arr) {
    return Array.from(new Set(arr)).sort((a, b) => a.localeCompare(b));
  }
};

window.ReportMixins = {
  formatting: {
    methods: {
      escapeHtml(str) { return window.ReportUtils.escapeHtml(str); },
      pctText(v) { return window.ReportUtils.pctText(v); },
      pctPillStyle(v) { return window.ReportUtils.pctPillStyle(this.colors, v); },
      countPillStyle(v) { return window.ReportUtils.countPillStyle(this.colors, v); },
      boolText(v) { return window.ReportUtils.boolText(v); },
      boolSort(v) { return window.ReportUtils.boolSort(v); },
      boolPillStyle(v) { return window.ReportUtils.boolPillStyle(this.colors, v); },
      intText(v) { return window.ReportUtils.intText(v); },
      numText(v, decimals = 2) { return window.ReportUtils.numText(v, decimals); },
      bandDaysToGrade(v) { return window.ReportUtils.bandDaysToGrade(this.colors, v); },
      bandDaysToRespond(v) { return window.ReportUtils.bandDaysToRespond(this.colors, v); },
      uniqueSorted(arr) { return window.ReportUtils.uniqueSorted(arr); },

      cloneFilterValue(value) {
        if (Array.isArray(value)) return value.slice();
        if (value && typeof value === 'object') return Object.assign({}, value);
        return value;
      },

      filterValuesEqual(a, b) {
        if (Array.isArray(a) || Array.isArray(b)) {
          if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
          return a.every((value, index) => this.filterValuesEqual(value, b[index]));
        }
        return String(a ?? '') === String(b ?? '');
      },

      getSharedFilterValue(key, fallback) {
        const filterKey = String(key || '').trim();
        const filters = this.reportContext?.sharedFilters || {};
        if (filterKey && Object.prototype.hasOwnProperty.call(filters, filterKey)) {
          return this.cloneFilterValue(filters[filterKey]);
        }
        return fallback;
      },

      setSharedFilterValue(key, value) {
        const setter = this.reportContext?.setSharedFilter;
        if (typeof setter === 'function') {
          setter(String(key || '').trim(), this.cloneFilterValue(value));
        }
      },

      filterAttrs(key, kind = 'select') {
        const filterKey = String(key || '').trim();
        return {
          id: filterKey ? `report-filter-${filterKey.replace(/[^a-z0-9_-]+/gi, '-')}` : null,
          class: 'js-report-filter',
          'data-report-filter-key': filterKey,
          'data-report-filter-kind': String(kind || 'select').trim() || 'select'
        };
      },

      withColumnWrap(column, wrap = true) {
        if (column && typeof column === 'object') {
          column.wrap = !!wrap;
        }
        return column;
      },

      resolveDeferredSelection({ filterKey, options, currentValue, routeValue, allowBlank = false, fallbackValue = '' }) {
        const normalizedOptions = Array.isArray(options) ? options : [];
        if (!normalizedOptions.length) return currentValue;

        const optionValues = normalizedOptions.map(option =>
          option && typeof option === 'object' && Object.prototype.hasOwnProperty.call(option, 'value')
            ? option.value
            : option
        );

        const matchesOption = (value) => {
          if (allowBlank && String(value ?? '') === '') return true;
          return optionValues.some(optionValue => this.filterValuesEqual(optionValue, value));
        };

        const persistedValue = this.getSharedFilterValue(filterKey, undefined);
        const preferredValues = [persistedValue, routeValue, currentValue];
        const preferred = preferredValues.find(value => value !== undefined && matchesOption(value));
        if (preferred !== undefined) return preferred;

        if (allowBlank && String(fallbackValue ?? '') === '') return fallbackValue;
        return optionValues[0];
      }
    }
  },

  departmentScoped(config) {
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
          try {
            this.loadingDepartments = true;

            const rows = await bridgetools.req3(
              'reports',
              { academic_year: Number(this.year) },
              { dataset: this.getDepartmentOptionsDataset() }
            );

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
        } catch (e) {
            console.warn('Failed to load department options', e);
            this.departmentOptions = [];
            if (!this.selectedDepartmentCode) {
              this.loadError = 'Unable to load department list.';
            }
          } finally {
            this.loadingDepartments = false;
          }
        },

        async loadData() {
          const departmentCode = String(this.selectedDepartmentCode || '').trim();
          if (!departmentCode) {
            this.rows = [];
            this.loadedDepartmentName = '';
            this.loadError = this.getEmptySelectionMessage();
            return;
          }

          try {
            this.loading = true;
            this.loadError = '';

            const rows = await bridgetools.req3(
              'reports',
              this.getRequestFilters(),
              { dataset: this.getDataset() }
            );

            this.rows = this.normalizeRows(rows);

            const first = this.rows[0] || {};
            this.loadedDepartmentName = String(
              first?.department_name ??
              first?.dept_name ??
              this.departmentOptions.find(option => option.value === departmentCode)?.label ??
              this.getDepartmentName()
            ).trim();
          } catch (e) {
            console.warn('Failed to load department detail dataset', e);
            this.rows = [];
            this.loadedDepartmentName = this.departmentOptions.find(option => option.value === departmentCode)?.label || this.getDepartmentName();
            this.loadError = this.getLoadErrorMessage();
          } finally {
            this.loading = false;
          }
        }
      }
    };
  },


  programScoped(config) {
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
          return config.optionsDataset || this.getDataset();
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
          try {
            this.loadingPrograms = true;
            this.loadError = '';

            const rows = await bridgetools.req3(
              'reports',
              this.getProgramOptionsRequestFilters(),
              { dataset: this.getProgramOptionsDataset() }
            );

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
          } catch (e) {
            console.warn('Failed to load program options', e);
            this.programOptions = [];
            if (!this.selectedProgramCode) {
              this.loadError = this.getProgramOptionsLoadErrorMessage();
            }
          } finally {
            this.loadingPrograms = false;
          }
        },

        async loadData() {
          const programCode = String(this.selectedProgramCode || '').trim();
          if (!programCode) {
            this.rows = [];
            this.loadedProgramName = '';
            this.loadError = this.getEmptySelectionMessage();
            return;
          }

          try {
            this.loading = true;
            this.loadError = '';

            const rows = await bridgetools.req3(
              'reports',
              this.getRequestFilters(),
              { dataset: this.getDataset() }
            );

            this.rows = this.normalizeRows(rows);

            const first = this.rows[0] || {};
            this.loadedProgramName = String(
              first?.program_name ??
              this.programOptions.find(option => option.value === programCode)?.label ??
              this.getProgramName()
            ).trim();
          } catch (e) {
            console.warn('Failed to load program detail dataset', e);
            this.rows = [];
            this.loadedProgramName = this.programOptions.find(option => option.value === programCode)?.label || this.getProgramName();
            this.loadError = this.getLoadErrorMessage();
          } finally {
            this.loading = false;
          }
        }
      }
    };
  },

  yearSummary(config) {
    return {
      props: {
        reportContext: { type: Object, default: () => ({}) },
        anonymous: { type: Boolean, default: false }
      },

      data() {
        return {
          loading: false,
          loadError: '',
          year: Number(this.reportContext?.sharedFilters?.academic_year ?? this.reportContext?.filters?.academic_year) || new Date().getFullYear(),
          rows: []
        };
      },

      mounted() {
        this.loadData();
      },

      watch: {
        reportContext: {
          deep: true,
          handler() {
            const nextYear = Number(this.getSharedFilterValue('academic_year', this.reportContext?.filters?.academic_year));
            if (Number.isFinite(nextYear) && nextYear !== this.year) {
              this.year = nextYear;
              return;
            }
            this.loadData();
          }
        },
        year() {
          this.setSharedFilterValue('academic_year', Number(this.year));
          this.loadData();
        }
      },

      methods: {
        getDataset() {
          return String(this.reportContext?.dataset || '').trim();
        },

        normalizeRows(rows) {
          return typeof this.mapRows === 'function' ? this.mapRows(rows) : (Array.isArray(rows) ? rows : []);
        },

        getLoadErrorMessage() {
          return config.loadErrorMessage || 'Unable to load summary.';
        },

        async loadData() {
          try {
            this.loading = true;
            this.loadError = '';

            const rows = await bridgetools.req3(
              'reports',
              Object.assign({}, this.reportContext?.filters || {}, {
                academic_year: Number(this.year)
              }),
              { dataset: this.getDataset() }
            );

            this.rows = this.normalizeRows(rows);
          } catch (e) {
            console.warn('Failed to load summary dataset', e);
            this.rows = [];
            this.loadError = this.getLoadErrorMessage();
          } finally {
            this.loading = false;
          }
        }
      }
    };
  }
};
