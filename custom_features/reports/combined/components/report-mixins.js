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
      uniqueSorted(arr) { return window.ReportUtils.uniqueSorted(arr); }
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
          year: Number(this.reportContext?.filters?.academic_year) || new Date().getFullYear(),
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
          await this.loadDepartmentOptions(true);
        },
        selectedDepartmentCode() {
          this.loadData();
        }
      },

      methods: {
        syncFromReportContext() {
          const nextYear = Number(this.reportContext?.filters?.academic_year);
          if (Number.isFinite(nextYear) && nextYear !== this.year) {
            this.year = nextYear;
          }

          const nextDepartmentCode = this.getDepartmentCode();
          if (nextDepartmentCode && nextDepartmentCode !== this.selectedDepartmentCode) {
            this.selectedDepartmentCode = nextDepartmentCode;
          }
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

            if (this.selectedDepartmentCode && options.some(option => option.value === this.selectedDepartmentCode)) {
              if (forceReloadData) this.loadData();
              return;
            }

            const routedDepartmentCode = this.getDepartmentCode();
            if (routedDepartmentCode && options.some(option => option.value === routedDepartmentCode)) {
              this.selectedDepartmentCode = routedDepartmentCode;
              return;
            }

            this.selectedDepartmentCode = options[0]?.value || '';
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
          year: Number(this.reportContext?.filters?.academic_year) || new Date().getFullYear(),
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
            const nextYear = Number(this.reportContext?.filters?.academic_year);
            if (Number.isFinite(nextYear) && nextYear !== this.year) {
              this.year = nextYear;
              return;
            }
            this.loadData();
          }
        },
        year() {
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
